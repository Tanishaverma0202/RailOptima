import mongoose from 'mongoose';

const simulationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['INITIALIZING', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'INITIALIZING'
  },
  configuration: {
    algorithm: {
      type: String,
      enum: ['genetic', 'greedy', 'a_star', 'dijkstra', 'custom'],
      default: 'genetic'
    },
    parameters: {
      populationSize: { type: Number, default: 100 },
      generations: { type: Number, default: 50 },
      mutationRate: { type: Number, default: 0.1 },
      crossoverRate: { type: Number, default: 0.8 },
      elitismRate: { type: Number, default: 0.1 }
    },
    constraints: {
      maxDelay: { type: Number, default: 45 }, // minutes
      maxConflictsPerTrack: { type: Number, default: 3 },
      minThroughput: { type: Number, default: 80 }, // percentage
      priorityWeights: {
        high: { type: Number, default: 3 },
        medium: { type: Number, default: 2 },
        low: { type: Number, default: 1 }
      }
    },
    optimization: {
      objectives: [{
        type: String,
        enum: ['minimize_delay', 'maximize_throughput', 'minimize_conflicts', 'minimize_energy', 'maximize_punctuality']
      }],
      weights: {
        delay: { type: Number, default: 0.4 },
        throughput: { type: Number, default: 0.3 },
        conflicts: { type: Number, default: 0.2 },
        energy: { type: Number, default: 0.1 }
      }
    }
  },
  metrics: {
    kpis: {
      rewardScore: { type: Number, default: 0 },
      avgDelay: { type: Number, default: 0 },
      maxThroughput: { type: Number, default: 0 },
      totalConflicts: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 },
      onTime: { type: Number, default: 0 },
      delayed: { type: Number, default: 0 }
    },
    performance: {
      totalTrains: { type: Number, default: 0 },
      scheduledTrains: { type: Number, default: 0 },
      completedTrains: { type: Number, default: 0 },
      averageSpeed: { type: Number, default: 0 },
      totalDistance: { type: Number, default: 0 },
      energyConsumption: { type: Number, default: 0 }
    },
    timeline: [{
      timestamp: { type: Date, default: Date.now },
      generation: { type: Number },
      bestFitness: { type: Number },
      averageFitness: { type: Number },
      conflicts: { type: Number },
      throughput: { type: Number }
    }]
  },
  results: {
    isBest: { type: Boolean, default: false },
    schedules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' }],
    conflicts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Conflict' }],
    bestSolution: {
      fitness: { type: Number },
      parameters: { type: mongoose.Schema.Types.Mixed },
      timestamp: { type: Date }
    },
    comparisons: [{
      simulationId: { type: String },
      score: { type: Number },
      improvement: { type: Number },
      timestamp: { type: Date }
    }]
  },
  execution: {
    startTime: { type: Date },
    endTime: { type: Date },
    duration: { type: Number }, // milliseconds
    iterations: { type: Number, default: 0 },
    convergenceGeneration: { type: Number },
    error: { type: String }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

simulationSchema.virtual('isRunning').get(function() {
  return ['RUNNING', 'PAUSED'].includes(this.status);
});

simulationSchema.virtual('isCompleted').get(function() {
  return this.status === 'COMPLETED';
});

simulationSchema.virtual('efficiency').get(function() {
  if (this.execution.duration && this.metrics.performance.totalTrains > 0) {
    return this.metrics.kpis.rewardScore / (this.execution.duration / 1000);
  }
  return 0;
});

simulationSchema.virtual('progress').get(function() {
  if (this.configuration.parameters.generations > 0) {
    return (this.execution.iterations / this.configuration.parameters.generations) * 100;
  }
  return 0;
});

simulationSchema.index({ id: 1 });
simulationSchema.index({ status: 1 });
simulationSchema.index({ createdBy: 1 });
simulationSchema.index({ createdAt: 1 });
simulationSchema.index({ 'metrics.kpis.rewardScore': -1 });

const Simulation = mongoose.model('Simulation', simulationSchema);

export default Simulation;
