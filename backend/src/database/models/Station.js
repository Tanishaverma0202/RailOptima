import mongoose from 'mongoose';

const stationSchema = new mongoose.Schema({
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
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  location: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, default: 'India', trim: true }
  },
  capacity: {
    platforms: { type: Number, default: 1 },
    maxTrains: { type: Number, default: 10 },
    passengers: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'],
    default: 'ACTIVE'
  },
  facilities: [{
    type: String,
    enum: ['waiting_room', 'restrooms', 'food_court', 'parking', 'wifi', 'luggage', 'atm', 'medical']
  }],
  connectivity: {
    tracks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Track' }],
    connectedStations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Station' }]
  },
  traffic: {
    dailyTrains: { type: Number, default: 0 },
    peakHours: { type: [Number] }, // array of hours (0-23)
    averageDelay: { type: Number, default: 0 }
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

stationSchema.virtual('isAtCapacity').get(function() {
  return this.traffic.dailyTrains >= this.capacity.maxTrains;
});

stationSchema.virtual('utilization').get(function() {
  return this.capacity.maxTrains > 0 ? (this.traffic.dailyTrains / this.capacity.maxTrains) * 100 : 0;
});

stationSchema.index({ id: 1 });
stationSchema.index({ code: 1 });
stationSchema.index({ name: 1 });
stationSchema.index({ status: 1 });
stationSchema.index({ 'location.city': 1 });
stationSchema.index({ 'location.state': 1 });

const Station = mongoose.model('Station', stationSchema);

export default Station;
