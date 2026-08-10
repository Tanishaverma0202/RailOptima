import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../database/models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { strictRateLimitMiddleware } from '../middleware/rateLimiter.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', strictRateLimitMiddleware, asyncHandler(async (req, res) => {
  const { username, email, password, role = 'operator', profile } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email or username'
    });
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password,
    role,
    profile
  });

  // Generate token
  const token = generateToken(user._id);

  logger.info(`New user registered: ${user.username} (${user.email})`);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        permissions: user.permissions,
        status: user.status
      },
      token
    }
  });
}));

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', strictRateLimitMiddleware, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if password matches
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if user is active
  if (user.status !== 'active') {
    return res.status(401).json({
      success: false,
      message: 'Account is not active'
    });
  }

  // Update login activity
  user.activity.lastLogin = new Date();
  user.activity.loginCount += 1;
  user.activity.sessions.push({
    startTime: new Date(),
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  logger.info(`User logged in: ${user.username} (${user.email})`);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        permissions: user.permissions,
        preferences: user.preferences,
        status: user.status
      },
      token
    }
  });
}));

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        permissions: user.permissions,
        preferences: user.preferences,
        activity: user.activity,
        status: user.status
      }
    }
  });
}));

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', asyncHandler(async (req, res) => {
  const { profile, preferences } = req.body;

  const user = await User.findById(req.user.id);

  if (profile) {
    user.profile = { ...user.profile, ...profile };
  }

  if (preferences) {
    user.preferences = { ...user.preferences, ...preferences };
  }

  await user.save();

  logger.info(`User profile updated: ${user.username}`);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        preferences: user.preferences
      }
    }
  });
}));

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
router.put('/password', strictRateLimitMiddleware, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide current password and new password'
    });
  }

  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  logger.info(`Password changed for user: ${user.username}`);

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  // Update session
  const currentSession = user.activity.sessions.find(session => !session.endTime);
  if (currentSession) {
    currentSession.endTime = new Date();
  }
  
  await user.save();

  logger.info(`User logged out: ${user.username}`);

  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

export default router;
