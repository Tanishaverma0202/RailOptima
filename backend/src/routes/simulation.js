import express from 'express';
import Simulation from '../database/models/Simulation.js';
import Schedule from '../database/models/Schedule.js';
import Conflict from '../database/models/Conflict.js';
import Train from '../database/models/Train.js';
import Track from '../database/models/Track.js';
import Station from '../database/models/Station.js';
import GeneticAlgorithm from '../algorithms/geneticAlgorithm.js';
import ConflictDetectionEngine from '../algorithms/conflictDetection.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { protect, requirePermission } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Create new simulation
// @route   POST /api/simulation
// @access  Private
router.post('/', requirePermission('run_simulation'), asyncHandler(async (req, res) => {
  const { name, description, configuration } = req.body;

  // Generate unique simulation ID
  const simulationId = `SIM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  const simulation = await Simulation.create({
    id: simulationId,
    name,
    description,
    configuration: {
      algorithm: 'genetic',
      parameters: {
        populationSize: 100,
        generations: 50,
        mutationRate: 0.1,
        crossoverRate: 0.8,
        elitismRate: 0.1
      },
      constraints: {
        maxDelay: 45,
        maxConflictsPerTrack: 3,
        minThroughput: 80
      },
      optimization: {
        objectives: ['minimize_delay', 'maximize_throughput', 'minimize_conflicts'],
        weights: {
          delay: 0.4,
          throughput: 0.3,
          conflicts: 0.2,
          energy: 0.1
        }
      },
      ...configuration
    },
    createdBy: req.user._id,
    status: 'INITIALIZING'
  });

  logger.info(`Simulation created: ${simulation.name} (${simulation.id}) by ${req.user.username}`);

  res.status(201).json({
    success: true,
    message: 'Simulation created successfully',
    data: { simulation }
  });
}));

// @desc    Run simulation
// @route   POST /api/simulation/:id/run
// @access  Private
router.post('/:id/run', requirePermission('run_simulation'), asyncHandler(async (req, res) => {
  const simulation = await Simulation.findById(req.params.id);

  if (!simulation) {
    return res.status(404).json({
      success: false,
      message: 'Simulation not found'
    });
  }

  if (simulation.status !== 'INITIALIZING' && simulation.status !== 'CANCELLED') {
    return res.status(400).json({
      success: false,
      message: 'Simulation has already been run'
    });
  }

  // Update status to running
  simulation.status = 'RUNNING';
  simulation.execution.startTime = new Date();
  await simulation.save();

  // Start simulation in background
  runSimulationAsync(simulation);

  res.json({
    success: true,
    message: 'Simulation started',
    data: { simulation }
  });
}));

// @desc    Get all simulations
// @route   GET /api/simulation
// @access  Private
router.get('/', requirePermission('view_dashboard'), asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    createdBy,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query
  const query = {};
  
  if (status) query.status = status;
  if (createdBy) query.createdBy = createdBy;

  // Sort options
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const simulations = await Simulation.find(query)
    .populate('createdBy', 'username email')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Simulation.countDocuments(query);

  res.json({
    success: true,
    data: {
      simulations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @desc    Get single simulation
// @route   GET /api/simulation/:id
// @access  Private
router.get('/:id', requirePermission('view_dashboard'), asyncHandler(async (req, res) => {
  const simulation = await Simulation.findById(req.params.id)
    .populate('createdBy', 'username email')
    .populate('results.schedules', 'train track timings status performance')
    .populate('results.conflicts', 'type severity status resolution');

  if (!simulation) {
    return res.status(404).json({
      success: false,
      message: 'Simulation not found'
    });
  }

  res.json({
    success: true,
    data: { simulation }
  });
}));

// @desc    Get simulation results
// @route   GET /api/simulation/:id/results
// @access  Private
router.get('/:id/results', requirePermission('view_analytics'), asyncHandler(async (req, res) => {
  const simulation = await Simulation.findById(req.params.id)
    .populate({
      path: 'results.schedules',
      populate: [
        { path: 'train', select: 'id name number priority type' },
        { path: 'track', select: 'id name type' },
        { path: 'conflicts' }
      ]
    })
    .populate('results.conflicts', 'type severity status aiSuggestion');

  if (!simulation) {
    return res.status(404).json({
      success: false,
      message: 'Simulation not found'
    });
  }

  if (simulation.status !== 'COMPLETED') {
    return res.status(400).json({
      success: false,
      message: 'Simulation has not completed yet'
    });
  }

  res.json({
    success: true,
    data: {
      simulation: {
        id: simulation.id,
        name: simulation.name,
        status: simulation.status,
        metrics: simulation.metrics,
        results: simulation.results
      }
    }
  });
}));

// @desc    Cancel simulation
// @route   POST /api/simulation/:id/cancel
// @access  Private
router.post('/:id/cancel', requirePermission('run_simulation'), asyncHandler(async (req, res) => {
  const simulation = await Simulation.findById(req.params.id);

  if (!simulation) {
    return res.status(404).json({
      success: false,
      message: 'Simulation not found'
    });
  }

  if (simulation.status === 'COMPLETED') {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel completed simulation'
    });
  }

  simulation.status = 'CANCELLED';
  simulation.execution.endTime = new Date();
  await simulation.save();

  logger.info(`Simulation cancelled: ${simulation.name} (${simulation.id}) by ${req.user.username}`);

  res.json({
    success: true,
    message: 'Simulation cancelled successfully',
    data: { simulation }
  });
}));

// @desc    Get simulation statistics
// @route   GET /api/simulation/stats
// @access  Private
router.get('/stats/summary', requirePermission('view_analytics'), asyncHandler(async (req, res) => {
  const stats = await Simulation.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
        },
        running: {
          $sum: { $cond: [{ $eq: ['$status', 'RUNNING'] }, 1, 0] }
        },
        failed: {
          $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] }
        },
        avgRewardScore: { $avg: '$metrics.kpis.rewardScore' },
        avgDuration: { $avg: '$execution.duration' },
        bestScore: { $max: '$metrics.kpis.rewardScore' }
      }
    }
  ]);

  const statusBreakdown = await Simulation.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgScore: { $avg: '$metrics.kpis.rewardScore' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      summary: stats[0] || {},
      statusBreakdown
    }
  });
}));

// Async simulation runner
async function runSimulationAsync(simulation) {
  try {
    logger.info(`Starting simulation: ${simulation.name} (${simulation.id})`);

    // Get data
    const trains = await Train.find({ status: 'ACTIVE' });
    const tracks = await Track.find({ status: 'ACTIVE' });
    const stations = await Station.find({ status: 'ACTIVE' });

    if (trains.length === 0 || tracks.length === 0) {
      throw new Error('No active trains or tracks available for simulation');
    }

    // Initialize genetic algorithm
    const ga = new GeneticAlgorithm({
      populationSize: simulation.configuration.parameters.populationSize,
      generations: simulation.configuration.parameters.generations,
      mutationRate: simulation.configuration.parameters.mutationRate,
      crossoverRate: simulation.configuration.parameters.crossoverRate,
      elitismRate: simulation.configuration.parameters.elitismRate,
      constraints: simulation.configuration.constraints,
      weights: simulation.configuration.optimization.weights
    });

    // Run evolution
    const result = await ga.evolve(
      trains,
      tracks,
      stations,
      async (generationData) => {
        // Update simulation progress
        simulation.execution.iterations = generationData.generation + 1;
        simulation.metrics.timeline.push({
          timestamp: new Date(),
          generation: generationData.generation,
          bestFitness: generationData.bestIndividual.fitness,
          averageFitness: generationData.population.reduce((sum, ind) => sum + ind.fitness, 0) / generationData.population.length,
          conflicts: generationData.bestIndividual.metrics?.conflicts || 0,
          throughput: generationData.bestIndividual.metrics?.throughput || 0
        });
        
        if (generationData.generation % 10 === 0) {
          await simulation.save();
        }
      }
    );

    // Create schedules from best solution
    const schedules = [];
    for (const assignment of result.bestSolution.assignments) {
      const schedule = await Schedule.create({
        simulationId: simulation.id,
        train: assignment.trainId,
        track: assignment.trackId,
        timings: {
          scheduledStartTime: assignment.startTime,
          scheduledEndTime: assignment.endTime
        },
        status: 'SCHEDULED',
        performance: {
          delay: assignment.estimatedDelay,
          statusCode: assignment.estimatedDelay === 0 ? 'ON_TIME' : 
                     assignment.estimatedDelay < 15 ? 'MINOR_DELAY' : 'MAJOR_DELAY',
          rewardContrib: Math.max(0, 10 - assignment.estimatedDelay * 0.1)
        },
        priority: assignment.priority
      });
      
      schedules.push(schedule._id);
    }

    // Detect conflicts
    const conflictEngine = new ConflictDetectionEngine();
    const populatedSchedules = await Schedule.find({ _id: { $in: schedules } })
      .populate('train track');
    
    const conflicts = await conflictEngine.detectConflicts(simulation.id, populatedSchedules);
    const conflictIds = conflicts.map(c => c._id);

    // Update simulation with results
    simulation.status = 'COMPLETED';
    simulation.execution.endTime = new Date();
    simulation.execution.duration = simulation.execution.endTime - simulation.execution.startTime;
    simulation.execution.iterations = result.evolutionHistory.length;
    simulation.execution.convergenceGeneration = result.evolutionHistory.findIndex(
      h => h.bestFitness >= 80
    );

    simulation.metrics.kpis = {
      rewardScore: result.bestSolution.fitness,
      avgDelay: result.bestSolution.metrics?.totalDelay || 0,
      maxThroughput: result.bestSolution.metrics?.punctuality || 0,
      totalConflicts: result.bestSolution.metrics?.conflicts || 0,
      completionRate: (schedules.length / trains.length) * 100,
      onTime: schedules.filter(s => s.performance.delay === 0).length,
      delayed: schedules.filter(s => s.performance.delay > 0).length
    };

    simulation.metrics.performance = {
      totalTrains: trains.length,
      scheduledTrains: schedules.length,
      completedTrains: 0, // Will be updated as trains complete
      averageSpeed: trains.reduce((sum, t) => sum + t.speed.average, 0) / trains.length,
      totalDistance: tracks.reduce((sum, t) => sum + t.specifications.length, 0)
    };

    simulation.results = {
      isBest: true, // Could be compared with previous simulations
      schedules: schedules,
      conflicts: conflictIds,
      bestSolution: {
        fitness: result.bestSolution.fitness,
        parameters: result.bestSolution.assignments,
        timestamp: new Date()
      },
      comparisons: [] // Could be populated with historical comparisons
    };

    await simulation.save();

    logger.info(`Simulation completed: ${simulation.name} (${simulation.id}) - Score: ${result.bestSolution.fitness.toFixed(2)}`);

  } catch (error) {
    logger.error(`Simulation failed: ${simulation.name} (${simulation.id}) - ${error.message}`);
    
    simulation.status = 'FAILED';
    simulation.execution.endTime = new Date();
    simulation.execution.error = error.message;
    await simulation.save();
  }
}

export default router;
