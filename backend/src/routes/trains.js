import express from 'express';
import Train from '../database/models/Train.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { protect, requirePermission } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Get all trains
// @route   GET /api/trains
// @access  Private
router.get('/', requirePermission('view_dashboard'), asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    priority,
    type,
    origin,
    destination,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query
  const query = {};
  
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (type) query.type = type;
  if (origin) query.origin = new RegExp(origin, 'i');
  if (destination) query.destination = new RegExp(destination, 'i');

  // Sort options
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const trains = await Train.find(query)
    .populate('currentPosition.stationId', 'name code')
    .populate('currentPosition.trackId', 'name')
    .populate('conflicts')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Train.countDocuments(query);

  res.json({
    success: true,
    data: {
      trains,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @desc    Get single train
// @route   GET /api/trains/:id
// @access  Private
router.get('/:id', requirePermission('view_dashboard'), asyncHandler(async (req, res) => {
  const train = await Train.findById(req.params.id)
    .populate('currentPosition.stationId', 'name code location')
    .populate('currentPosition.trackId', 'name specifications')
    .populate('conflicts');

  if (!train) {
    return res.status(404).json({
      success: false,
      message: 'Train not found'
    });
  }

  res.json({
    success: true,
    data: { train }
  });
}));

// @desc    Create train
// @route   POST /api/trains
// @access  Private
router.post('/', requirePermission('manage_trains'), asyncHandler(async (req, res) => {
  const trainData = req.body;

  // Check if train number already exists
  const existingTrain = await Train.findOne({
    $or: [{ id: trainData.id }, { number: trainData.number }]
  });

  if (existingTrain) {
    return res.status(400).json({
      success: false,
      message: 'Train with this ID or number already exists'
    });
  }

  const train = await Train.create(trainData);

  logger.info(`Train created: ${train.name} (${train.id}) by ${req.user.username}`);

  res.status(201).json({
    success: true,
    message: 'Train created successfully',
    data: { train }
  });
}));

// @desc    Update train
// @route   PUT /api/trains/:id
// @access  Private
router.put('/:id', requirePermission('manage_trains'), asyncHandler(async (req, res) => {
  const train = await Train.findById(req.params.id);

  if (!train) {
    return res.status(404).json({
      success: false,
      message: 'Train not found'
    });
  }

  const updatedTrain = await Train.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('currentPosition.stationId currentPosition.trackId');

  logger.info(`Train updated: ${updatedTrain.name} (${updatedTrain.id}) by ${req.user.username}`);

  res.json({
    success: true,
    message: 'Train updated successfully',
    data: { train: updatedTrain }
  });
}));

// @desc    Update train position
// @route   PUT /api/trains/:id/position
// @access  Private
router.put('/:id/position', requirePermission('override_schedule'), asyncHandler(async (req, res) => {
  const { x, y, stationId, trackId, progress } = req.body;

  const train = await Train.findById(req.params.id);

  if (!train) {
    return res.status(404).json({
      success: false,
      message: 'Train not found'
    });
  }

  train.currentPosition = {
    x: x || train.currentPosition.x,
    y: y || train.currentPosition.y,
    stationId: stationId || train.currentPosition.stationId,
    trackId: trackId || train.currentPosition.trackId,
    progress: progress !== undefined ? progress : train.currentPosition.progress
  };

  await train.save();

  logger.info(`Train position updated: ${train.name} (${train.id}) by ${req.user.username}`);

  res.json({
    success: true,
    message: 'Train position updated successfully',
    data: { train }
  });
}));

// @desc    Update train performance
// @route   PUT /api/trains/:id/performance
// @access  Private
router.put('/:id/performance', requirePermission('override_schedule'), asyncHandler(async (req, res) => {
  const { delay, statusCode, rewardContrib, onTimePerformance } = req.body;

  const train = await Train.findById(req.params.id);

  if (!train) {
    return res.status(404).json({
      success: false,
      message: 'Train not found'
    });
  }

  train.performance = {
    delay: delay !== undefined ? delay : train.performance.delay,
    statusCode: statusCode || train.performance.statusCode,
    rewardContrib: rewardContrib !== undefined ? rewardContrib : train.performance.rewardContrib,
    onTimePerformance: onTimePerformance !== undefined ? onTimePerformance : train.performance.onTimePerformance
  };

  await train.save();

  logger.info(`Train performance updated: ${train.name} (${train.id}) by ${req.user.username}`);

  res.json({
    success: true,
    message: 'Train performance updated successfully',
    data: { train }
  });
}));

// @desc    Delete train
// @route   DELETE /api/trains/:id
// @access  Private
router.delete('/:id', requirePermission('manage_trains'), asyncHandler(async (req, res) => {
  const train = await Train.findById(req.params.id);

  if (!train) {
    return res.status(404).json({
      success: false,
      message: 'Train not found'
    });
  }

  await train.deleteOne();

  logger.info(`Train deleted: ${train.name} (${train.id}) by ${req.user.username}`);

  res.json({
    success: true,
    message: 'Train deleted successfully'
  });
}));

// @desc    Get train statistics
// @route   GET /api/trains/stats
// @access  Private
router.get('/stats/summary', requirePermission('view_analytics'), asyncHandler(async (req, res) => {
  const stats = await Train.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] }
        },
        delayed: {
          $sum: { $cond: [{ $gt: ['$performance.delay', 0] }, 1, 0] }
        },
        avgDelay: { $avg: '$performance.delay' },
        highPriority: {
          $sum: { $cond: [{ $eq: ['$priority', 'HIGH'] }, 1, 0] }
        },
        mediumPriority: {
          $sum: { $cond: [{ $eq: ['$priority', 'MEDIUM'] }, 1, 0] }
        },
        lowPriority: {
          $sum: { $cond: [{ $eq: ['$priority', 'LOW'] }, 1, 0] }
        }
      }
    }
  ]);

  const statusBreakdown = await Train.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const typeBreakdown = await Train.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      summary: stats[0] || {},
      statusBreakdown,
      typeBreakdown
    }
  });
}));

export default router;
