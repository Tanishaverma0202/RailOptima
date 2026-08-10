import express from 'express';
import Track from '../database/models/Track.js';
import Station from '../database/models/Station.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { protect, requirePermission } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Get all tracks
// @route   GET /api/tracks
// @access  Private
router.get('/', requirePermission('view_dashboard'), asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    type,
    gauge,
    sortBy = 'name',
    sortOrder = 'asc'
  } = req.query;

  // Build query
  const query = {};
  
  if (status) query.status = status;
  if (type) query.type = type;
  if (gauge) query['specifications.gauge'] = gauge;

  // Sort options
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const tracks = await Track.find(query)
    .populate('endpoints.stationId', 'name code location')
    .populate('occupancy.currentTrains', 'id name number')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Track.countDocuments(query);

  res.json({
    success: true,
    data: {
      tracks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @desc    Get single track
// @route   GET /api/tracks/:id
// @access  Private
router.get('/:id', requirePermission('view_dashboard'), asyncHandler(async (req, res) => {
  const track = await Track.findById(req.params.id)
    .populate('endpoints.stationId', 'name code location')
    .populate('occupancy.currentTrains', 'id name number priority status');

  if (!track) {
    return res.status(404).json({
      success: false,
      message: 'Track not found'
    });
  }

  res.json({
    success: true,
    data: { track }
  });
}));

// @desc    Create track
// @route   POST /api/tracks
// @access  Private
router.post('/', requirePermission('manage_tracks'), asyncHandler(async (req, res) => {
  const trackData = req.body;

  // Check if track ID already exists
  const existingTrack = await Track.findOne({ id: trackData.id });

  if (existingTrack) {
    return res.status(400).json({
      success: false,
      message: 'Track with this ID already exists'
    });
  }

  // Validate endpoints
  if (trackData.endpoints && trackData.endpoints.length >= 2) {
    const stationIds = trackData.endpoints.map(ep => ep.stationId);
    const stations = await Station.find({ '_id': { $in: stationIds } });
    
    if (stations.length !== stationIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more endpoint stations not found'
      });
    }
  }

  const track = await Track.create(trackData);

  logger.info(`Track created: ${track.name} (${track.id}) by ${req.user.username}`);

  res.status(201).json({
    success: true,
    message: 'Track created successfully',
    data: { track }
  });
}));

// @desc    Update track
// @route   PUT /api/tracks/:id
// @access  Private
router.put('/:id', requirePermission('manage_tracks'), asyncHandler(async (req, res) => {
  const track = await Track.findById(req.params.id);

  if (!track) {
    return res.status(404).json({
      success: false,
      message: 'Track not found'
    });
  }

  const updatedTrack = await Track.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('endpoints.stationId occupancy.currentTrains');

  logger.info(`Track updated: ${updatedTrack.name} (${updatedTrack.id}) by ${req.user.username}`);

  res.json({
    success: true,
    message: 'Track updated successfully',
    data: { track: updatedTrack }
  });
}));

// @desc    Update track occupancy
// @route   PUT /api/tracks/:id/occupancy
// @access  Private
router.put('/:id/occupancy', requirePermission('override_schedule'), asyncHandler(async (req, res) => {
  const { currentTrains, utilization } = req.body;

  const track = await Track.findById(req.params.id);

  if (!track) {
    return res.status(404).json({
      success: false,
      message: 'Track not found'
    });
  }

  track.occupancy = {
    currentTrains: currentTrains || track.occupancy.currentTrains,
    utilization: utilization !== undefined ? utilization : track.occupancy.utilization,
    lastUpdated: new Date()
  };

  await track.save();

  logger.info(`Track occupancy updated: ${track.name} (${track.id}) by ${req.user.username}`);

  res.json({
    success: true,
    message: 'Track occupancy updated successfully',
    data: { track }
  });
}));

// @desc    Add train to track
// @route   POST /api/tracks/:id/trains/:trainId
// @access  Private
router.post('/:id/trains/:trainId', requirePermission('override_schedule'), asyncHandler(async (req, res) => {
  const track = await Track.findById(req.params.id);

  if (!track) {
    return res.status(404).json({
      success: false,
      message: 'Track not found'
    });
  }

  // Check if track is at capacity
  if (track.occupancy.currentTrains.length >= track.specifications.capacity) {
    return res.status(400).json({
      success: false,
      message: 'Track is at maximum capacity'
    });
  }

  // Add train if not already present
  if (!track.occupancy.currentTrains.includes(req.params.trainId)) {
    track.occupancy.currentTrains.push(req.params.trainId);
    track.occupancy.utilization = (track.occupancy.currentTrains.length / track.specifications.capacity) * 100;
    track.occupancy.lastUpdated = new Date();
    
    await track.save();
  }

  logger.info(`Train added to track: ${req.params.trainId} -> ${track.name} (${track.id}) by ${req.user.username}`);

  res.json({
    success: true,
    message: 'Train added to track successfully',
    data: { track }
  });
}));

// @desc    Remove train from track
// @route   DELETE /api/tracks/:id/trains/:trainId
// @access  Private
router.delete('/:id/trains/:trainId', requirePermission('override_schedule'), asyncHandler(async (req, res) => {
  const track = await Track.findById(req.params.id);

  if (!track) {
    return res.status(404).json({
      success: false,
      message: 'Track not found'
    });
  }

  // Remove train if present
  const trainIndex = track.occupancy.currentTrains.indexOf(req.params.trainId);
  if (trainIndex > -1) {
    track.occupancy.currentTrains.splice(trainIndex, 1);
    track.occupancy.utilization = (track.occupancy.currentTrains.length / track.specifications.capacity) * 100;
    track.occupancy.lastUpdated = new Date();
    
    await track.save();
  }

  logger.info(`Train removed from track: ${req.params.trainId} <- ${track.name} (${track.id}) by ${req.user.username}`);

  res.json({
    success: true,
    message: 'Train removed from track successfully',
    data: { track }
  });
}));

// @desc    Delete track
// @route   DELETE /api/tracks/:id
// @access  Private
router.delete('/:id', requirePermission('manage_tracks'), asyncHandler(async (req, res) => {
  const track = await Track.findById(req.params.id);

  if (!track) {
    return res.status(404).json({
      success: false,
      message: 'Track not found'
    });
  }

  // Check if track has trains
  if (track.occupancy.currentTrains.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete track with active trains'
    });
  }

  await track.deleteOne();

  logger.info(`Track deleted: ${track.name} (${track.id}) by ${req.user.username}`);

  res.json({
    success: true,
    message: 'Track deleted successfully'
  });
}));

// @desc    Get tracks for map visualization
// @route   GET /api/tracks/map
// @access  Private
router.get('/map/all', requirePermission('view_dashboard'), asyncHandler(async (req, res) => {
  const tracks = await Track.find({ status: 'ACTIVE' })
    .populate('endpoints.stationId', 'name code location')
    .select('id name type status endpoints specifications')
    .lean();

  res.json({
    success: true,
    data: { tracks }
  });
}));

// @desc    Get track statistics
// @route   GET /api/tracks/stats
// @access  Private
router.get('/stats/summary', requirePermission('view_analytics'), asyncHandler(async (req, res) => {
  const stats = await Track.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] }
        },
        occupied: {
          $sum: { $cond: [{ $gt: [{ $size: '$occupancy.currentTrains' }, 0] }, 1, 0] }
        },
        totalLength: { $sum: '$specifications.length' },
        avgUtilization: { $avg: '$occupancy.utilization' },
        totalCapacity: { $sum: '$specifications.capacity' }
      }
    }
  ]);

  const typeBreakdown = await Track.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        avgUtilization: { $avg: '$occupancy.utilization' }
      }
    }
  ]);

  const conflictRisk = await Track.aggregate([
    {
      $addFields: {
        conflictRisk: {
          $cond: [
            { $gt: [{ $size: '$occupancy.currentTrains' }, 1] },
            'HIGH',
            { $cond: [
              { $eq: [{ $size: '$occupancy.currentTrains' }, 1] },
              'MEDIUM',
              'LOW'
            ]}
          ]
        }
      }
    },
    {
      $group: {
        _id: '$conflictRisk',
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      summary: stats[0] || {},
      typeBreakdown,
      conflictRisk
    }
  });
}));

export default router;
