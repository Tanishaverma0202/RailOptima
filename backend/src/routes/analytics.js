import express from 'express';
import Simulation from '../database/models/Simulation.js';
import Schedule from '../database/models/Schedule.js';
import Conflict from '../database/models/Conflict.js';
import Train from '../database/models/Train.js';
import Track from '../database/models/Track.js';
import Station from '../database/models/Station.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { protect, requirePermission } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private
router.get('/dashboard', requirePermission('view_analytics'), asyncHandler(async (req, res) => {
  const { timeframe = '24h', simulationId } = req.query;

  // Calculate time range
  const now = new Date();
  let startTime;
  
  switch (timeframe) {
    case '1h':
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '24h':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  // Build query
  const timeQuery = simulationId ? { simulationId } : { createdAt: { $gte: startTime } };

  // Get key metrics
  const [
    simulationStats,
    scheduleStats,
    conflictStats,
    trainStats,
    trackStats
  ] = await Promise.all([
    // Simulation metrics
    Simulation.aggregate([
      { $match: simulationId ? { _id: simulationId } : { createdAt: { $gte: startTime } } },
      {
        $group: {
          _id: null,
          totalSimulations: { $sum: 1 },
          completedSimulations: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
          avgRewardScore: { $avg: '$metrics.kpis.rewardScore' },
          avgThroughput: { $avg: '$metrics.kpis.maxThroughput' },
          totalConflicts: { $sum: '$metrics.kpis.totalConflicts' },
          bestScore: { $max: '$metrics.kpis.rewardScore' }
        }
      }
    ]),
    
    // Schedule metrics
    Schedule.aggregate([
      { $match: timeQuery },
      {
        $group: {
          _id: null,
          totalSchedules: { $sum: 1 },
          activeSchedules: { $sum: { $cond: [{ $in: ['$status', ['SCHEDULED', 'IN_TRANSIT']] }, 1, 0] } },
          completedSchedules: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
          avgDelay: { $avg: '$performance.delay' },
          onTimePerformance: { $avg: '$performance.punctuality' },
          totalReward: { $sum: '$performance.rewardContrib' }
        }
      }
    ]),
    
    // Conflict metrics
    Conflict.aggregate([
      { $match: timeQuery },
      {
        $group: {
          _id: null,
          totalConflicts: { $sum: 1 },
          activeConflicts: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
          resolvedConflicts: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
          criticalConflicts: { $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] } },
          avgResolutionTime: { $avg: { $subtract: ['$timeline.resolutionTime', '$timeline.detectedAt'] } }
        }
      }
    ]),
    
    // Train metrics
    Train.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $group: {
          _id: null,
          totalTrains: { $sum: 1 },
          delayedTrains: { $sum: { $cond: [{ $gt: ['$performance.delay', 0] }, 1, 0] } },
          avgDelay: { $avg: '$performance.delay' },
          highPriorityTrains: { $sum: { $cond: [{ $eq: ['$priority', 'HIGH'] }, 1, 0] } }
        }
      }
    ]),
    
    // Track metrics
    Track.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $group: {
          _id: null,
          totalTracks: { $sum: 1 },
          occupiedTracks: { $sum: { $cond: [{ $gt: [{ $size: '$occupancy.currentTrains' }, 0] }, 1, 0] } },
          avgUtilization: { $avg: '$occupancy.utilization' },
          totalLength: { $sum: '$specifications.length' }
        }
      }
    ])
  ]);

  // Get recent activity
  const recentActivity = await Simulation.find(
    simulationId ? { _id: simulationId } : { createdAt: { $gte: startTime } }
  )
  .populate('createdBy', 'username')
  .sort({ createdAt: -1 })
  .limit(10)
  .select('id name status metrics.kpis.createdAt createdBy');

  res.json({
    success: true,
    data: {
      summary: {
        simulations: simulationStats[0] || {},
        schedules: scheduleStats[0] || {},
        conflicts: conflictStats[0] || {},
        trains: trainStats[0] || {},
        tracks: trackStats[0] || {}
      },
      recentActivity,
      timeframe
    }
  });
}));

// @desc    Get performance trends
// @route   GET /api/analytics/trends
// @access  Private
router.get('/trends', requirePermission('view_analytics'), asyncHandler(async (req, res) => {
  const { metric = 'rewardScore', period = '7d', simulationId } = req.query;

  // Calculate time intervals based on period
  const now = new Date();
  let startTime, intervalSize;
  
  switch (period) {
    case '24h':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      intervalSize = 60 * 60 * 1000; // 1 hour
      break;
    case '7d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      intervalSize = 24 * 60 * 60 * 1000; // 1 day
      break;
    case '30d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      intervalSize = 24 * 60 * 60 * 1000; // 1 day
      break;
    default:
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      intervalSize = 24 * 60 * 60 * 1000;
  }

  // Build query
  const matchQuery = simulationId ? 
    { _id: simulationId } : 
    { createdAt: { $gte: startTime } };

  // Generate time series data
  const trends = await Simulation.aggregate([
    { $match: matchQuery },
    { $unwind: '$metrics.timeline' },
    { $match: { 'metrics.timeline.timestamp': { $gte: startTime } } },
    {
      $group: {
        _id: {
          $toDate: {
            $subtract: [
              '$metrics.timeline.timestamp',
              { $mod: [{ $toLong: '$metrics.timeline.timestamp' }, intervalSize] }
            ]
          }
        },
        avgRewardScore: { $avg: '$metrics.kpis.rewardScore' },
        avgThroughput: { $avg: '$metrics.kpis.maxThroughput' },
        avgDelay: { $avg: '$metrics.kpis.avgDelay' },
        totalConflicts: { $sum: '$metrics.kpis.totalConflicts' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Format data for charts
  const formattedTrends = trends.map(trend => ({
    timestamp: trend._id,
    rewardScore: trend.avgRewardScore || 0,
    throughput: trend.avgThroughput || 0,
    delay: trend.avgDelay || 0,
    conflicts: trend.totalConflicts || 0,
    count: trend.count || 0
  }));

  res.json({
    success: true,
    data: {
      trends: formattedTrends,
      period,
      metric
    }
  });
}));

// @desc    Get conflict analytics
// @route   GET /api/analytics/conflicts
// @access  Private
router.get('/conflicts', requirePermission('view_analytics'), asyncHandler(async (req, res) => {
  const { timeframe = '24h', simulationId } = req.query;

  // Calculate time range
  const now = new Date();
  let startTime;
  
  switch (timeframe) {
    case '1h':
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '24h':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  // Build query
  const timeQuery = simulationId ? 
    { simulationId } : 
    { 'timeline.detectedAt': { $gte: startTime } };

  // Get conflict analytics
  const [
    conflictTrends,
    typeBreakdown,
    severityBreakdown,
    resolutionEffectiveness,
    topConflictedTracks
  ] = await Promise.all([
    // Conflict trends over time
    Conflict.aggregate([
      { $match: timeQuery },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d-%H',
              date: '$timeline.detectedAt'
            }
          },
          detected: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
          critical: { $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    
    // Conflict type breakdown
    Conflict.aggregate([
      { $match: timeQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgResolutionTime: { $avg: { $subtract: ['$timeline.resolutionTime', '$timeline.detectedAt'] } },
          avgDelayReduction: { $avg: '$resolution.impact.delayReduction' }
        }
      }
    ]),
    
    // Severity breakdown
    Conflict.aggregate([
      { $match: timeQuery },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } }
        }
      }
    ]),
    
    // Resolution effectiveness
    Conflict.aggregate([
      { $match: { ...timeQuery, 'resolution.type': { $exists: true } } },
      {
        $group: {
          _id: '$resolution.type',
          count: { $sum: 1 },
          avgDelayReduction: { $avg: '$resolution.impact.delayReduction' },
          avgThroughputGain: { $avg: '$resolution.impact.throughputGain' },
          avgCostImpact: { $avg: '$resolution.impact.costImpact' }
        }
      }
    ]),
    
    // Top conflicted tracks
    Conflict.aggregate([
      { $match: { ...timeQuery, track: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$track',
          conflictCount: { $sum: 1 },
          avgSeverity: { $avg: { $switch: {
            branches: [
              { case: { $eq: ['$severity', 'CRITICAL'] }, then: 4 },
              { case: { $eq: ['$severity', 'HIGH'] }, then: 3 },
              { case: { $eq: ['$severity', 'MEDIUM'] }, then: 2 },
              { case: { $eq: ['$severity', 'LOW'] }, then: 1 }
            ],
            default: 1
          }}}
        }
      },
      { $sort: { conflictCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'tracks',
          localField: '_id',
          foreignField: '_id',
          as: 'trackInfo'
        }
      },
      { $unwind: '$trackInfo' },
      {
        $project: {
          trackName: '$trackInfo.name',
          trackId: '$trackInfo.id',
          conflictCount: 1,
          avgSeverity: 1
        }
      }
    ])
  ]);

  res.json({
    success: true,
    data: {
      trends: conflictTrends,
      typeBreakdown,
      severityBreakdown,
      resolutionEffectiveness,
      topConflictedTracks,
      timeframe
    }
  });
}));

// @desc    Get train performance analytics
// @route   GET /api/analytics/trains
// @access  Private
router.get('/trains', requirePermission('view_analytics'), asyncHandler(async (req, res) => {
  const { timeframe = '24h', simulationId } = req.query;

  // Get train performance analytics
  const [
    trainPerformance,
    priorityAnalysis,
    typeAnalysis,
    topPerformers,
    worstPerformers
  ] = await Promise.all([
    // Overall performance metrics
    Train.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $group: {
          _id: null,
          totalTrains: { $sum: 1 },
          avgDelay: { $avg: '$performance.delay' },
          avgPunctuality: { $avg: '$performance.onTimePerformance' },
          totalReward: { $sum: '$performance.rewardContrib' },
          onTimeTrains: { $sum: { $cond: [{ $eq: ['$performance.delay', 0] }, 1, 0] } }
        }
      }
    ]),
    
    // Priority-based analysis
    Train.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
          avgDelay: { $avg: '$performance.delay' },
          avgPunctuality: { $avg: '$performance.onTimePerformance' },
          totalReward: { $sum: '$performance.rewardContrib' }
        }
      }
    ]),
    
    // Type-based analysis
    Train.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgDelay: { $avg: '$performance.delay' },
          avgPunctuality: { $avg: '$performance.onTimePerformance' },
          avgSpeed: { $avg: '$speed.average' }
        }
      }
    ]),
    
    // Top performing trains
    Train.find({ status: 'ACTIVE' })
      .sort({ 'performance.rewardContrib': -1 })
      .limit(10)
      .select('id name number type priority performance.delay performance.rewardContrib performance.onTimePerformance'),
    
    // Worst performing trains
    Train.find({ status: 'ACTIVE' })
      .sort({ 'performance.delay': -1 })
      .limit(10)
      .select('id name number type priority performance.delay performance.rewardContrib performance.onTimePerformance')
  ]);

  res.json({
    success: true,
    data: {
      performance: trainPerformance[0] || {},
      priorityAnalysis,
      typeAnalysis,
      topPerformers,
      worstPerformers
    }
  });
}));

// @desc    Get network utilization analytics
// @route   GET /api/analytics/network
// @access  Private
router.get('/network', requirePermission('view_analytics'), asyncHandler(async (req, res) => {
  const { timeframe = '24h' } = req.query;

  // Get network analytics
  const [
    trackUtilization,
    stationUtilization,
    networkEfficiency,
    bottleneckAnalysis
  ] = await Promise.all([
    // Track utilization
    Track.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgUtilization: { $avg: '$occupancy.utilization' },
          totalLength: { $sum: '$specifications.length' },
          occupiedTracks: { $sum: { $cond: [{ $gt: [{ $size: '$occupancy.currentTrains' }, 0] }, 1, 0] } }
        }
      }
    ]),
    
    // Station utilization
    Station.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $group: {
          _id: null,
          totalStations: { $sum: 1 },
          avgDailyTrains: { $avg: '$traffic.dailyTrains' },
          avgUtilization: { $avg: { $cond: [{ $gt: ['$capacity.maxTrains', 0] }, { $multiply: [{ $divide: ['$traffic.dailyTrains', '$capacity.maxTrains'] }, 100] }, 0] } },
          totalPlatforms: { $sum: '$capacity.platforms' }
        }
      }
    ]),
    
    // Network efficiency metrics
    Promise.all([
      Track.find({ status: 'ACTIVE' }).select('specifications.length occupancy.utilization'),
      Station.find({ status: 'ACTIVE' }).select('traffic.dailyTrains capacity.maxTrains'),
      Train.find({ status: 'ACTIVE' }).select('speed.average performance.delay')
    ]).then(([tracks, stations, trains]) => {
      const totalTrackLength = tracks.reduce((sum, track) => sum + track.specifications.length, 0);
      const avgTrackUtilization = tracks.reduce((sum, track) => sum + track.occupancy.utilization, 0) / tracks.length;
      const totalDailyTrains = stations.reduce((sum, station) => sum + station.traffic.dailyTrains, 0);
      const totalStationCapacity = stations.reduce((sum, station) => sum + station.capacity.maxTrains, 0);
      const avgTrainSpeed = trains.reduce((sum, train) => sum + train.speed.average, 0) / trains.length;
      const avgTrainDelay = trains.reduce((sum, train) => sum + train.performance.delay, 0) / trains.length;

      return {
        totalTrackLength,
        avgTrackUtilization,
        stationUtilization: totalStationCapacity > 0 ? (totalDailyTrains / totalStationCapacity) * 100 : 0,
        avgTrainSpeed,
        avgTrainDelay,
        networkDensity: totalTrackLength > 0 ? totalDailyTrains / totalTrackLength : 0
      };
    }),
    
    // Bottleneck analysis
    Track.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $addFields: { utilizationScore: { $add: ['$occupancy.utilization', { $multiply: [{ $size: '$occupancy.currentTrains' }, 20] }] } } },
      { $sort: { utilizationScore: -1 } },
      { $limit: 10 },
      {
        $project: {
          id: 1,
          name: 1,
          type: 1,
          utilization: '$occupancy.utilization',
          currentTrains: { $size: '$occupancy.currentTrains' },
          capacity: '$specifications.capacity',
          utilizationScore: 1
        }
      }
    ])
  ]);

  res.json({
    success: true,
    data: {
      trackUtilization,
      stationUtilization: stationUtilization[0] || {},
      networkEfficiency,
      bottlenecks: bottleneckAnalysis
    }
  });
}));

// @desc    Export analytics data
// @route   GET /api/analytics/export
// @access  Private
router.get('/export', requirePermission('export_data'), asyncHandler(async (req, res) => {
  const { format = 'json', type = 'summary', simulationId } = req.query;

  let data;

  switch (type) {
    case 'summary':
      data = await getSummaryAnalytics(simulationId);
      break;
    case 'detailed':
      data = await getDetailedAnalytics(simulationId);
      break;
    case 'conflicts':
      data = await getConflictAnalytics(simulationId);
      break;
    default:
      data = await getSummaryAnalytics(simulationId);
  }

  // Set appropriate headers
  const filename = `railoptima-analytics-${type}-${new Date().toISOString().split('T')[0]}`;
  
  switch (format) {
    case 'csv':
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      // Convert to CSV (simplified)
      res.send(convertToCSV(data));
      break;
    case 'xlsx':
      // Would need a library like xlsx for this
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      res.json({ message: 'XLSX export not implemented yet', data });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.json(data);
  }
}));

// Helper functions for analytics
async function getSummaryAnalytics(simulationId) {
  const [simulations, schedules, conflicts, trains, tracks] = await Promise.all([
    Simulation.find(simulationId ? { _id: simulationId } : {}),
    Schedule.find(simulationId ? { simulationId } : {}),
    Conflict.find(simulationId ? { simulationId } : {}),
    Train.find({ status: 'ACTIVE' }),
    Track.find({ status: 'ACTIVE' })
  ]);

  return {
    summary: {
      totalSimulations: simulations.length,
      totalSchedules: schedules.length,
      totalConflicts: conflicts.length,
      totalTrains: trains.length,
      totalTracks: tracks.length
    },
    simulations,
    schedules,
    conflicts,
    trains,
    tracks
  };
}

async function getDetailedAnalytics(simulationId) {
  // More detailed analytics would go here
  return await getSummaryAnalytics(simulationId);
}

async function getConflictAnalytics(simulationId) {
  const conflicts = await Conflict.find(simulationId ? { simulationId } : {})
    .populate('trains.train', 'name number')
    .populate('track', 'name');

  return { conflicts };
}

function convertToCSV(data) {
  // Simplified CSV conversion
  if (Array.isArray(data)) {
    const headers = Object.keys(data[0] || {});
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header] || '').join(','))
    ];
    return csvRows.join('\n');
  }
  return JSON.stringify(data);
}

export default router;
