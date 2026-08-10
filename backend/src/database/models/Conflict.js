import mongoose from 'mongoose';

const conflictSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  simulationId: {
    type: String,
    required: true,
    trim: true
  },
  track: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Track',
    required: true
  },
  trains: [{
    train: { type: mongoose.Schema.Types.ObjectId, ref: 'Train', required: true },
    schedule: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' },
    position: {
      x: { type: Number },
      y: { type: Number }
    },
    estimatedArrival: { type: Date },
    priority: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'] }
  }],
  type: {
    type: String,
    enum: ['HEAD_ON', 'FOLLOWING', 'OVERTAKING', 'CROSSING', 'STATION_CONFLICT'],
    required: true
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'RESOLVED', 'IGNORED', 'ESCALATED'],
    default: 'ACTIVE'
  },
  timeline: {
    detectedAt: { type: Date, default: Date.now },
    estimatedConflictTime: { type: Date, required: true },
    resolutionTime: { type: Date },
    resolvedBy: { type: String } // system, user, automatic
  },
  resolution: {
    type: {
      type: String,
      enum: ['REASSIGNMENT', 'DELAY', 'REROUTE', 'PRIORITY_OVERRIDE', 'SPEED_ADJUSTMENT'],
    },
    details: {
      reassignedTrack: { type: mongoose.Schema.Types.ObjectId, ref: 'Track' },
      delayMinutes: { type: Number },
      newSpeed: { type: Number },
      reason: { type: String }
    },
    impact: {
      delayReduction: { type: Number, default: 0 }, // minutes
      throughputGain: { type: Number, default: 0 }, // percentage
      costImpact: { type: Number, default: 0 }
    }
  },
  aiSuggestion: {
    action: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 1, default: 0.8 },
    reasoning: { type: String },
    alternatives: [{
      action: { type: String },
      confidence: { type: Number },
      impact: {
        delayReduction: { type: Number },
        throughputGain: { type: Number }
      }
    }]
  },
  metadata: {
    weatherConditions: { type: String },
    trafficDensity: { type: String },
    specialCircumstances: { type: String }
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

conflictSchema.virtual('isResolved').get(function() {
  return this.status === 'RESOLVED';
});

conflictSchema.virtual('timeToResolution').get(function() {
  if (this.timeline.resolutionTime && this.timeline.detectedAt) {
    return this.timeline.resolutionTime - this.timeline.detectedAt;
  }
  return null;
});

conflictSchema.virtual('urgency').get(function() {
  const now = new Date();
  const timeToConflict = this.timeline.estimatedConflictTime - now;
  
  if (timeToConflict < 5 * 60 * 1000) return 'IMMEDIATE'; // < 5 minutes
  if (timeToConflict < 30 * 60 * 1000) return 'HIGH'; // < 30 minutes
  if (timeToConflict < 60 * 60 * 1000) return 'MEDIUM'; // < 1 hour
  return 'LOW'; // > 1 hour
});

conflictSchema.index({ id: 1 });
conflictSchema.index({ simulationId: 1 });
conflictSchema.index({ track: 1 });
conflictSchema.index({ status: 1 });
conflictSchema.index({ severity: 1 });
conflictSchema.index({ type: 1 });
conflictSchema.index({ 'timeline.detectedAt': 1 });

const Conflict = mongoose.model('Conflict', conflictSchema);

export default Conflict;
