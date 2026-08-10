import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  simulationId: {
    type: String,
    required: true,
    trim: true
  },
  train: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Train',
    required: true
  },
  track: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Track',
    required: true
  },
  route: [{
    station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
    arrivalTime: { type: Date },
    departureTime: { type: Date },
    dwellTime: { type: Number, default: 5 }, // minutes
    platform: { type: Number }
  }],
  timings: {
    scheduledStartTime: { type: Date, required: true },
    scheduledEndTime: { type: Date, required: true },
    actualStartTime: { type: Date },
    actualEndTime: { type: Date },
    estimatedArrival: { type: Date },
    estimatedDeparture: { type: Date }
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'IN_TRANSIT', 'ARRIVED', 'DEPARTED', 'DELAYED', 'CANCELLED'],
    default: 'SCHEDULED'
  },
  performance: {
    delay: { type: Number, default: 0 }, // minutes
    statusCode: {
      type: String,
      enum: ['ON_TIME', 'MINOR_DELAY', 'MAJOR_DELAY', 'REASSIGNABLE'],
      default: 'ON_TIME'
    },
    rewardContrib: { type: Number, default: 0 },
    punctuality: { type: Number, default: 100 } // percentage
  },
  position: {
    currentStation: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
    nextStation: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
    progress: { type: Number, default: 0 }, // 0-1 progress on current segment
    coordinates: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 }
    }
  },
  conflicts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conflict'
  }],
  priority: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM'
  },
  optimization: {
    originalTrack: { type: mongoose.Schema.Types.ObjectId, ref: 'Track' },
    reassignedTrack: { type: mongoose.Schema.Types.ObjectId, ref: 'Track' },
    reason: { type: String },
    timestamp: { type: Date, default: Date.now }
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

scheduleSchema.virtual('isActive').get(function() {
  return ['IN_TRANSIT', 'ARRIVED', 'DEPARTED'].includes(this.status);
});

scheduleSchema.virtual('isDelayed').get(function() {
  return this.performance.delay > 0;
});

scheduleSchema.virtual('estimatedDuration').get(function() {
  if (this.timings.scheduledStartTime && this.timings.scheduledEndTime) {
    return this.timings.scheduledEndTime - this.timings.scheduledStartTime;
  }
  return null;
});

scheduleSchema.virtual('actualDuration').get(function() {
  if (this.timings.actualStartTime && this.timings.actualEndTime) {
    return this.timings.actualEndTime - this.timings.actualStartTime;
  }
  return null;
});

scheduleSchema.index({ simulationId: 1 });
scheduleSchema.index({ train: 1 });
scheduleSchema.index({ track: 1 });
scheduleSchema.index({ status: 1 });
scheduleSchema.index({ 'performance.statusCode': 1 });
scheduleSchema.index({ priority: 1 });
scheduleSchema.index({ 'timings.scheduledStartTime': 1 });

const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;
