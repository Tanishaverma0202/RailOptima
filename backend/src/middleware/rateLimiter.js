import { RateLimiterMemory } from 'rate-limiter-flexible';
import { logger } from '../utils/logger.js';

// Create rate limiters for different endpoints
export const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Number of requests
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900, // Per 15 minutes (900 seconds)
  blockDuration: 60, // Block for 1 minute
});

// Strict rate limiter for sensitive endpoints
export const strictRateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 5, // Number of requests
  duration: 900, // Per 15 minutes
  blockDuration: 300, // Block for 5 minutes
});

// Rate limiter middleware
export const rateLimitMiddleware = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
      retryAfter: secs
    });
  }
};

// Strict rate limiter middleware for sensitive endpoints
export const strictRateLimitMiddleware = async (req, res, next) => {
  try {
    await strictRateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    
    logger.warn(`Strict rate limit exceeded for IP: ${req.ip}`);
    
    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded for this endpoint. Please try again later.',
      retryAfter: secs
    });
  }
};

export { rateLimiter as default };
