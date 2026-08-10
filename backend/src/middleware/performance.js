import compression from 'compression';
import { config } from '../config/production.js';

// Compression middleware
export const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: config.performance.compression.level,
  threshold: 1024,
  chunkSize: 16 * 1024,
  windowBits: 15,
  memLevel: 8,
  strategy: compression.constants.Z_DEFAULT_STRATEGY,
});

// Response time middleware
export const responseTimeMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = duration > 1000 ? 'warn' : 'info';
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
};

// Cache middleware
export const cacheMiddleware = (duration = config.performance.cache.ttl) => {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;
    
    // Set cache headers
    res.setHeader('Cache-Control', `public, max-age=${duration}`);
    
    next();
  };
};

// Request size limiter
export const requestSizeLimiter = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength) {
      const size = parseInt(contentLength);
      const maxSizeBytes = maxSize.includes('mb') 
        ? parseInt(maxSize) * 1024 * 1024 
        : parseInt(maxSize);
      
      if (size > maxSizeBytes) {
        return res.status(413).json({
          success: false,
          message: 'Request entity too large',
          maxSize,
        });
      }
    }
    
    next();
  };
};

// Memory usage monitor
export const memoryMonitor = (req, res, next) => {
  const memUsage = process.memoryUsage();
  
  // Log memory usage if it's high
  if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
    console.warn('High memory usage detected:', {
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    });
  }
  
  next();
};

// Health check middleware
export const healthCheck = (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.env,
    version: config.app.version,
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  };
  
  res.status(200).json(health);
};

// Metrics collection
export const metricsCollector = (() => {
  const metrics = {
    requests: {
      total: 0,
      get: 0,
      post: 0,
      put: 0,
      delete: 0,
    },
    responseTime: {
      total: 0,
      average: 0,
      min: Infinity,
      max: 0,
    },
    errors: {
      total: 0,
      byStatus: {},
    },
    timestamp: Date.now(),
  };
  
  return (req, res, next) => {
    const start = Date.now();
    
    // Increment request counter
    metrics.requests.total++;
    metrics.requests[req.method.toLowerCase()] = (metrics.requests[req.method.toLowerCase()] || 0) + 1;
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      // Update response time metrics
      metrics.responseTime.total += duration;
      metrics.responseTime.average = metrics.responseTime.total / metrics.requests.total;
      metrics.responseTime.min = Math.min(metrics.responseTime.min, duration);
      metrics.responseTime.max = Math.max(metrics.responseTime.max, duration);
      
      // Update error metrics
      if (res.statusCode >= 400) {
        metrics.errors.total++;
        metrics.errors.byStatus[res.statusCode] = (metrics.errors.byStatus[res.statusCode] || 0) + 1;
      }
    });
    
    next();
  };
})();

// Get metrics endpoint
export const getMetrics = (req, res) => {
  res.json(metricsCollector.metrics);
};

// Connection limiter
export const connectionLimiter = (maxConnections = 100) => {
  const connections = new Set();
  
  return (req, res, next) => {
    if (connections.size >= maxConnections) {
      return res.status(503).json({
        success: false,
        message: 'Server too busy, please try again later',
      });
    }
    
    connections.add(res);
    
    res.on('finish', () => {
      connections.delete(res);
    });
    
    next();
  };
};

export default {
  compressionMiddleware,
  responseTimeMiddleware,
  cacheMiddleware,
  requestSizeLimiter,
  memoryMonitor,
  healthCheck,
  metricsCollector,
  getMetrics,
  connectionLimiter,
};
