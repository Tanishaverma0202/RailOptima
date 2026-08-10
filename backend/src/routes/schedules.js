import express from 'express';
import Schedule from '../database/models/Schedule.js';
import Train from '../database/models/Train.js';
import Track from '../database/models/Track.js';
import Station from '../database/models/Station.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { protect, requirePermission } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Get all schedules
// @route   GET /api/schedules
// @access  Private
router.get('/', requirePermission('view_dashboard'), asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    simulationId,
    status,
    priority,
    trainId,
    trackId,
    sortBy = 'timings.scheduledStartTime',
    sortOrder = 'asc'
  } = req.query;

  // Build query
  const query = {};
  
  if (simulationId) query.simulationId = simulationId;
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (trainId) query.train = trainId;
  if (trackId) query.track = trackId;

  // Sort options
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const schedules = await Schedule.find(query)
    .populate('train', 'id name number priority type')
    .populate('track', 'id name type specifications')
    .populate('route.station', 'name code location')
    .populate('conflicts')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Schedule.countDocuments(query);

  res.json({
    success: true,
    data: {
      schedules,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @desc    Get single schedule
// @route   GET /api/schedules/:id
// @access  Private
router.get('/:id', requirePermission('view_dashboard'), asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id)
    .populate('train', 'id name number priority type capacity speed')
    .populate('track', 'id name type specifications endpoints')
    .populate('route.station', 'name code location capacity')
    .populate('conflicts')
    .populate('position.currentStation')
    .populate('position.nextStation');

  if (!schedule) {
    return res.status(404).json({
      success: false,
      message: 'Schedule not found'
    });
  }

  res.json({
    success: true,
    data: { schedule }
  });
}));

// @desc    Create schedule
// @route   POST /api/schedules
// @access  Private
router.post('/', requirePermission('override_schedule'), asyncHandler(async (req, res) => {
  const scheduleData = req.body;

  // Validate train and track exist
  const train = await Train.findById(scheduleData.train);
  const track = await Track.findById(scheduleData.track);

  if (!train || !track) {
    return res.status(400).json({
      success: false,
      message: 'Train or track not found'
    });
  }

  // Check for conflicts
  const existingSchedules = await Schedule.find({
    track: scheduleData.track,
    status: { $in: ['SCHEDULED', 'IN_TRANSIT'] },
    $or: [
      {
        'timings.scheduledStartTime': { $lte: scheduleData.timings.scheduledEndTime },
        'timings.scheduledEndTime': { $gte: scheduleData.timings.scheduledStartTime }
      }
    ]
  });

  if (existingSchedules.length >= track.specifications.capacity) {
    return res.status(400).json({
      success: false,
      message: 'Track is at capacity during this time period'
    });
  }

  const schedule = await Schedule.create(scheduleData);
  
  // Populate references for response
  await schedule.populate(['train', 'track', 'route.station']);

  logger.info(`Schedule created: ${train.name} on ${track.name} by ${req.user.username}`);

  res.status(201).json({
    success: true,
    message: 'Schedule created successfully',
    data: { schedule }
  });
}));

// @desc    Update schedule
// @route   PUT /api/schedules/:id
// @access  Private
router.put('/:id', requirePermission('override_schedule'), asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id);

  if (!schedule) {
    return res.status(404).json({
      success: false,
      message: 'Schedule not found'
    });
  }

  const updatedSchedule = await Schedule.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate(['train', 'track', 'route.station', 'conflicts']);

  logger.info(`Schedule updated: ${updatedSchedule.train.name} by ${req.user.username}`);

  res.json({
    success: true,
    message: 'Schedule updated successfully',
    data: { schedule: updatedSchedule }
  });
}));

// @desc    Update schedule position
// @route   PUT /api/schedules/:id/position
// @access  Private
router.put('/:id/position', requirePermission('override_schedule'), asyncHandler(async (req, res) => {
  const { currentStation, nextStation, progress, coordinates } = req.body;

  const schedule = await Schedule.findById(req.params.id);

  if (!schedule) {
    return res.status(404).json({
      success: false,
      message: 'Schedule not found'
    });
  }

  schedule.position = {
    currentStation: currentStation || schedule.position.currentStation,
    nextStation: nextStation || schedule.position.nextStation,
    progress: progress !== undefined ? progress : schedule.position.progress,
    coordinates: coordinates || schedule.position.coordinates
  };

  await schedule.save();

  logger.info(`Schedule position updated: ${schedule.train.name} by ${req.user.username}`);

  res.json({
    success: true,
    message: 'Schedule position updated successfully',
    data: { schedule }
  });
}));

// @desc    Update schedule status
// @route   PUT /api/schedules/:id/status
// @access  Private
router.put('/:id/status', requirePermission('override_schedule'), asyncHandler(async (req, res) => {
  const { status, actualStartTime, actualEndTime, estimatedArrival, estimatedDeparture } = req.body;

  const schedule = await Schedule.findById(req.params.id);

  if (!schedule) {
    return res.status(404).json({
      success: false,
      message: 'Schedule not found'
    });
  }

  schedule.status = status || schedule.status;
  
  if (actualStartTime) schedule.timings.actualStartTime = actualStartTime;
  if (actualEndTime) schedule.timings.actualEndTime = actualEndTime;
  if (estimatedArrival) schedule.timings.estimatedArrival = estimatedArrival;
  if (estimatedDeparture) schedule.timings.estimatedDeparture = estimatedDeparture;

  await schedule.save();

  logger.info(`Schedule status updated: ${schedule.train.name} -> ${status} by ${req.user.username}`);

  res.json({
    success: true,
    message: 'Schedule status updated successfully',
    data: { schedule }
  });
}));

// @desc    Reassign schedule to different track
// @route   PUT /api/schedules/:id/reassign
// @access  Private
router.put('/:id/reassign', requirePermission('override_schedule'), asyncHandler(async (req, res) => {
  const { newTrackId, reason } = req.body;

  const schedule = await Schedule.findById(req.params.id);

  if (!schedule) {
    return res.status(404).json({
      success: false,
      message: 'Schedule not found'
    });
  }

  const newTrack = await Track.findById(newTrackId);

  if (!newTrack) {
    return res.status(404).json({
      success: false,
      message: 'New track not found'
    });
  }

  // Check capacity on new track
  const conflictingSchedules = await Schedule.find({
    track: newTrackId,
    status: { $in: ['SCHEDULED', 'IN_TRANSIT'] },
    _id: { $ne: schedule._id },
    $or: [
      {
        'timings.scheduledStartTime': { $lte: schedule.timings.scheduledEndTime },
        'timings.scheduledEndTime': { $gte: schedule.timings.scheduledStartTime }
      }
    ]
  });

  if (conflictingSchedules.length >= newTrack.specifications.capacity) {
    return res.status(400).json({
      success: false,
      message: 'New track is at capacity during this time period'
    });
  }

  // Store original track for optimization tracking
  schedule.optimization.originalTrack = schedule.track;
  schedule.optimization.reassignedTrack = newTrackId;
  schedule.optimization.reason = reason || 'Manual reassignment';
  schedule.optimization.timestamp = new Date();
  
  schedule.track = newTrackId;
  await schedule.save();

  await schedule.populate(['train', 'track', 'optimization.originalTrack', 'optimization.reassignedTrack']);

  logger.info(`Schedule reassigned: ${schedule.train.name} to ${newTrack.name} by ${req.user.username}`);

  res.json({
    success: true,
    message: 'Schedule reassigned successfully',
    data: { schedule }
  });
}));

// @desc    Delete schedule
// @route   DELETE /api/schedules/:id
// @access  Private
router.delete('/:id', requirePermission('override_schedule'), asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id);

  if (!schedule) {
    return res.status(404).json({
      success: false,
      message: 'Schedule not found'
    });
  }

  await schedule.deleteOne();

  logger.info(`Schedule deleted: ${schedule.train.name} by ${req.user.username}`);

  res.json({
    success: true,
    message: 'Schedule deleted successfully'
  });
}));

// @desc    Get schedules by simulation
// @route   GET /api/schedules/simulation/:simulationId
// @access  Private
router.get('/simulation/:simulationId', requirePermission('view_dashboard'), asyncHandler(async (req, res) => {
  const schedules = await Schedule.find({ simulationId: req.params.simulationId })
    .populate('train', 'id name number priority type')
    .populate('track', 'id name type')
    .populate('conflicts')
    .sort({ 'timings.scheduledStartTime': 1 });

  res.json({
    success: true,
    data: { schedules }
  });
}));

// @desc    Get schedule statistics
// @route   GET /api/schedules/stats
// @access  Private
router.get('/stats/summary', requirePermission('view_analytics'), asyncHandler(async (req, res) => {
  const { simulationId } = req.query;

  const matchQuery = simulationId ? { simulationId } : {};

  const stats = await Schedule.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        scheduled: {
          $sum: { $cond: [{ $eq: ['$status', 'SCHEDULED'] }, 1, 0] }
        },
        inTransit: {
          $sum: { $cond: [{ $eq: ['$status', 'IN_TRANSIT'] }, 1, 0] }
        },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
        },
        delayed: {
          $sum: { $cond: [{ $gt: ['$performance.delay', 0] }, 1, 0] }
        },
        avgDelay: { $avg: '$performance.delay' },
        avgPunctuality: { $avg: '$performance.punctuality' },
        totalReward: { $sum: '$performance.rewardContrib' }
      }
    }
  ]);

  const statusBreakdown = await Schedule.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const priorityBreakdown = await Schedule.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 },
        avgDelay: { $avg: '$performance.delay' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      summary: stats[0] || {},
      statusBreakdown,
      priorityBreakdown
    }
  });
}));

export default router;
