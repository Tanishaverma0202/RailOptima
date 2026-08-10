import mongoose from 'mongoose';

const trainSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  number: {
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
  origin: {
    type: String,
    required: true,
    trim: true
  },
  destination: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM'
  },
  type: {
    type: String,
    enum: ['Rajdhani', 'Shatabdi', 'Express', 'Mail', 'Passenger', 'Freight'],
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'],
    default: 'ACTIVE'
  },
  capacity: {
    passengers: { type: Number, default: 0 },
    freight: { type: Number, default: 0 }
  },
  speed: {
    max: { type: Number, default: 120 }, // km/h
    average: { type: Number, default: 80 }
  },
  currentPosition: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
    trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track' },
    progress: { type: Number, default: 0 } // 0-1 progress on current track
  },
  schedule: {
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    arrivalTime: { type: Date },
    departureTime: { type: Date }
  },
  performance: {
    delay: { type: Number, default: 0 }, // minutes
    statusCode: {
      type: String,
      enum: ['ON_TIME', 'MINOR_DELAY', 'MAJOR_DELAY', 'REASSIGNABLE'],
      default: 'ON_TIME'
    },
    rewardContrib: { type: Number, default: 0 },
    onTimePerformance: { type: Number, default: 100 } // percentage
  },
  conflicts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conflict'
  }],
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

trainSchema.virtual('isDelayed').get(function() {
  return this.performance.delay > 0;
});

trainSchema.virtual('delaySeverity').get(function() {
  if (this.performance.delay === 0) return 'NONE';
  if (this.performance.delay < 15) return 'MINOR';
  if (this.performance.delay < 30) return 'MAJOR';
  return 'CRITICAL';
});

trainSchema.index({ id: 1 });
trainSchema.index({ number: 1 });
trainSchema.index({ origin: 1 });
trainSchema.index({ destination: 1 });
trainSchema.index({ priority: 1 });
trainSchema.index({ status: 1 });
trainSchema.index({ 'performance.statusCode': 1 });

const Train = mongoose.model('Train', trainSchema);

export default Train;
