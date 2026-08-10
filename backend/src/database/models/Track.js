import mongoose from 'mongoose';

const trackSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['MAIN', 'SIDING', 'YARD', 'PLATFORM', 'JUNCTION'],
    default: 'MAIN'
  },
  endpoints: [{
    stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
    coordinates: {
      x: { type: Number, required: true },
      y: { type: Number, required: true }
    }
  }],
  specifications: {
    length: { type: Number, required: true }, // km
    gauge: {
      type: String,
      enum: ['BROAD', 'METER', 'NARROW'],
      default: 'BROAD'
    },
    electrified: { type: Boolean, default: true },
    maxSpeed: { type: Number, default: 120 }, // km/h
    capacity: { type: Number, default: 1 } // max trains simultaneously
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'CONSTRUCTION'],
    default: 'ACTIVE'
  },
  signaling: {
    system: {
      type: String,
      enum: ['AUTOMATIC', 'SEMI_AUTOMATIC', 'MANUAL'],
      default: 'AUTOMATIC'
    },
    blocks: [{ type: String }], // signal block identifiers
    interlocking: { type: Boolean, default: true }
  },
  occupancy: {
    currentTrains: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Train' }],
    utilization: { type: Number, default: 0 }, // percentage
    lastUpdated: { type: Date, default: Date.now }
  },
  maintenance: {
    lastInspection: { type: Date },
    nextInspection: { type: Date },
    condition: {
      type: String,
      enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'],
      default: 'GOOD'
    },
    restrictions: [{ type: String }]
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

trackSchema.virtual('isOccupied').get(function() {
  return this.occupancy.currentTrains.length > 0;
});

trackSchema.virtual('isAtCapacity').get(function() {
  return this.occupancy.currentTrains.length >= this.specifications.capacity;
});

trackSchema.virtual('conflictRisk').get(function() {
  return this.occupancy.currentTrains.length > 1 ? 'HIGH' : 
         this.occupancy.currentTrains.length === 1 ? 'MEDIUM' : 'LOW';
});

trackSchema.virtual('pathCoordinates').get(function() {
  if (this.endpoints.length >= 2) {
    return {
      start: this.endpoints[0].coordinates,
      end: this.endpoints[1].coordinates
    };
  }
  return null;
});

trackSchema.index({ id: 1 });
trackSchema.index({ name: 1 });
trackSchema.index({ status: 1 });
trackSchema.index({ type: 1 });
trackSchema.index({ 'endpoints.stationId': 1 });

const Track = mongoose.model('Track', trackSchema);

export default Track;
