import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'operator', 'viewer', 'analyst'],
    default: 'operator'
  },
  profile: {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    department: { type: String, trim: true },
    phone: { type: String, trim: true },
    avatar: { type: String }
  },
  permissions: [{
    type: String,
    enum: [
      'view_dashboard', 'manage_trains', 'manage_stations', 'manage_tracks',
      'run_simulation', 'view_analytics', 'manage_conflicts', 'admin_access',
      'export_data', 'import_data', 'override_schedule', 'manage_users'
    ]
  }],
  preferences: {
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    language: { type: String, default: 'en' },
    notifications: {
      email: { type: Boolean, default: true },
      browser: { type: Boolean, default: true },
      conflicts: { type: Boolean, default: true },
      schedules: { type: Boolean, default: false }
    },
    dashboard: {
      defaultView: { type: String, enum: ['map', 'schedule', 'analytics'], default: 'map' },
      refreshInterval: { type: Number, default: 30 } // seconds
    }
  },
  activity: {
    lastLogin: { type: Date },
    loginCount: { type: Number, default: 0 },
    sessions: [{
      startTime: { type: Date, default: Date.now },
      endTime: { type: Date },
      ipAddress: { type: String },
      userAgent: { type: String }
    }],
    actions: [{
      action: { type: String },
      resource: { type: String },
      timestamp: { type: Date, default: Date.now },
      details: { type: mongoose.Schema.Types.Mixed }
    }]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
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

userSchema.virtual('fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.username;
});

userSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

userSchema.methods.updateActivity = function(action, resource, details = {}) {
  this.activity.actions.push({
    action,
    resource,
    details,
    timestamp: new Date()
  });
  return this.save();
};

userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'activity.lastLogin': 1 });

const User = mongoose.model('User', userSchema);

export default User;
