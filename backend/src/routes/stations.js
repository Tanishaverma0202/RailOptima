import express from 'express';
import Station from '../database/models/Station.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { protect, requirePermission } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Get all stations
// @route   GET /api/stations
// @access  Private
router.get('/', requirePermission('view_dashboard'), asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    city,
    state,
    sortBy = 'name',
    sortOrder = 'asc'
  } = req.query;

  // Build query
  const query = {};
  
  if (status) query.status = status;
  if (city) query['location.city'] = new RegExp(city, 'i');
  if (state) query['location.state'] = new RegExp(state, 'i');

  // Sort options
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const stations = await Station.find(query)
    .populate('connectivity.tracks', 'name type status')
    .populate('connectivity.connectedStations', 'name code')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Station.countDocuments(query);

  res.json({
    success: true,
    data: {
      stations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @desc    Get single station
// @route   GET /api/stations/:id
// @access  Private
router.get('/:id', requirePermission('view_dashboard'), asyncHandler(async (req, res) => {
  const station = await Station.findById(req.params.id)
    .populate('connectivity.tracks', 'name type specifications status')
    .populate('connectivity.connectedStations', 'name code location');

  if (!station) {
    return res.status(404).json({
      success: false,
      message: 'Station not found'
    });
  }

  res.json({
    success: true,
    data: { station }
  });
}));

// @desc    Create station
// @route   POST /api/stations
// @access  Private
router.post('/', requirePermission('manage_stations'), asyncHandler(async (req, res) => {
  const stationData = req.body;

  // Check if station code already exists
  const existingStation = await Station.findOne({
    $or: [{ id: stationData.id }, { code: stationData.code }]
  });

  if (existingStation) {
    return res.status(400).json({
      success: false,
      message: 'Station with this ID or code already exists'
    });
  }

  const station = await Station.create(stationData);

  logger.info(`Station created: ${station.name} (${station.code}) by ${req.user.username}`);

  res.status(201).json({
    success: true,
    message: 'Station created successfully',
    data: { station }
  });
}));

// @desc    Update station
// @route   PUT /api/stations/:id
// @access  Private
router.put('/:id', requirePermission('manage_stations'), asyncHandler(async (req, res) => {
  const station = await Station.findById(req.params.id);

  if (!station) {
    return res.status(404).json({
      success: false,
      message: 'Station not found'
    });
  }

  const updatedStation = await Station.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('connectivity.tracks connectivity.connectedStations');

  logger.info(`Station updated: ${updatedStation.name} (${updatedStation.code}) by ${req.user.username}`);

  res.json({
    success: true,
    message: 'Station updated successfully',
    data: { station: updatedStation }
  });
}));

// @desc    Update station traffic
// @route   PUT /api/stations/:id/traffic
// @access  Private
router.put('/:id/traffic', requirePermission('override_schedule'), asyncHandler(async (req, res) => {
  const { dailyTrains, peakHours, averageDelay } = req.body;

  const station = await Station.findById(req.params.id);

  if (!station) {
    return res.status(404).json({
      success: false,
      message: 'Station not found'
    });
  }

  station.traffic = {
    dailyTrains: dailyTrains !== undefined ? dailyTrains : station.traffic.dailyTrains,
    peakHours: peakHours || station.traffic.peakHours,
    averageDelay: averageDelay !== undefined ? averageDelay : station.traffic.averageDelay
  };

  await station.save();

  logger.info(`Station traffic updated: ${station.name} (${station.code}) by ${req.user.username}`);

  res.json({
    success: true,
    message: 'Station traffic updated successfully',
    data: { station }
  });
}));

// @desc    Delete station
// @route   DELETE /api/stations/:id
// @access  Private
router.delete('/:id', requirePermission('manage_stations'), asyncHandler(async (req, res) => {
  const station = await Station.findById(req.params.id);

  if (!station) {
    return res.status(404).json({
      success: false,
      message: 'Station not found'
    });
  }

  await station.deleteOne();

  logger.info(`Station deleted: ${station.name} (${station.code}) by ${req.user.username}`);

  res.json({
    success: true,
    message: 'Station deleted successfully'
  });
}));

// @desc    Get stations by coordinates (for map)
// @route   GET /api/stations/map
// @access  Private
router.get('/map/all', requirePermission('view_dashboard'), asyncHandler(async (req, res) => {
  const stations = await Station.find({ status: 'ACTIVE' })
    .select('id name code location status capacity')
    .lean();

  res.json({
    success: true,
    data: { stations }
  });
}));

// @desc    Get station statistics
// @route   GET /api/stations/stats
// @access  Private
router.get('/stats/summary', requirePermission('view_analytics'), asyncHandler(async (req, res) => {
  const stats = await Station.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] }
        },
        totalPlatforms: { $sum: '$capacity.platforms' },
        totalCapacity: { $sum: '$capacity.maxTrains' },
        avgDailyTrains: { $avg: '$traffic.dailyTrains' },
        avgDelay: { $avg: '$traffic.averageDelay' }
      }
    }
  ]);

  const stateBreakdown = await Station.aggregate([
    {
      $group: {
        _id: '$location.state',
        count: { $sum: 1 },
        avgDailyTrains: { $avg: '$traffic.dailyTrains' }
      }
    }
  ]);

  const utilizationStats = await Station.aggregate([
    {
      $addFields: {
        utilization: {
          $cond: [
            { $gt: ['$capacity.maxTrains', 0] },
            { $multiply: [{ $divide: ['$traffic.dailyTrains', '$capacity.maxTrains'] }, 100] },
            0
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        avgUtilization: { $avg: '$utilization' },
        maxUtilization: { $max: '$utilization' },
        minUtilization: { $min: '$utilization' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      summary: stats[0] || {},
      stateBreakdown,
      utilization: utilizationStats[0] || {}
    }
  });
}));

// @desc    Connect stations
// @route   POST /api/stations/:id/connect/:stationId
// @access  Private
router.post('/:id/connect/:stationId', requirePermission('manage_stations'), asyncHandler(async (req, res) => {
  const station = await Station.findById(req.params.id);
  const targetStation = await Station.findById(req.params.stationId);

  if (!station || !targetStation) {
    return res.status(404).json({
      success: false,
      message: 'One or both stations not found'
    });
  }

  // Add connection if not already exists
  if (!station.connectivity.connectedStations.includes(targetStation._id)) {
    station.connectivity.connectedStations.push(targetStation._id);
  }

  if (!targetStation.connectivity.connectedStations.includes(station._id)) {
    targetStation.connectivity.connectedStations.push(station._id);
  }

  await Promise.all([station.save(), targetStation.save()]);

  logger.info(`Stations connected: ${station.name} <-> ${targetStation.name} by ${req.user.username}`);

  res.json({
    success: true,
    message: 'Stations connected successfully'
  });
}));

export default router;
