import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Production configuration
export const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT) || 5000,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development',
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/railoptima',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
      bufferCommands: false,
    }
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  },

  // Security Configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || 'fallback_secret_change_in_production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    sessionSecret: process.env.SESSION_SECRET || 'fallback_session_secret',
    sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000,
  },

  // Rate Limiting Configuration
  rateLimit: {
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    blockDuration: 60000,
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: process.env.CORS_CREDENTIALS === 'true',
    optionsSuccessStatus: 200,
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs/',
    maxSize: '20m',
    maxFiles: '14d',
  },

  // Performance Configuration
  performance: {
    compression: {
      enabled: process.env.COMPRESSION_ENABLED !== 'false',
      level: parseInt(process.env.COMPRESSION_LEVEL) || 6,
    },
    cache: {
      ttl: parseInt(process.env.CACHE_TTL) || 3600,
    },
  },

  // Security Headers Configuration
  securityHeaders: {
    helmet: {
      enabled: process.env.HELMET_ENABLED !== 'false',
      csp: {
        enabled: process.env.HELMET_CSP_ENABLED !== 'false',
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
    },
  },

  // Application Configuration
  app: {
    name: process.env.APP_NAME || 'RailOptima',
    version: process.env.APP_VERSION || '1.0.0',
    description: process.env.APP_DESCRIPTION || 'Advanced Railway Optimization System',
  },

  // Feature Flags
  features: {
    analytics: process.env.ENABLE_ANALYTICS === 'true',
    realTimeUpdates: process.env.ENABLE_REAL_TIME_UPDATES === 'true',
    aiOptimization: process.env.ENABLE_AI_OPTIMIZATION === 'true',
    advancedFeatures: process.env.ENABLE_ADVANCED_FEATURES === 'true',
  },

  // API Configuration
  api: {
    version: process.env.API_VERSION || 'v1',
    prefix: process.env.API_PREFIX || '/api/v1',
  },

  // WebSocket Configuration
  websocket: {
    enabled: process.env.WS_ENABLED !== 'false',
    path: process.env.WS_PATH || '/socket.io',
  },

  // Monitoring Configuration
  monitoring: {
    enabled: process.env.ENABLE_METRICS === 'true',
    port: parseInt(process.env.METRICS_PORT) || 9090,
  },

  // SSL Configuration
  ssl: {
    certPath: process.env.SSL_CERT_PATH,
    keyPath: process.env.SSL_KEY_PATH,
    enabled: !!(process.env.SSL_CERT_PATH && process.env.SSL_KEY_PATH),
  },

  // Backup Configuration
  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
  },
};

// Validate critical configuration
export const validateConfig = () => {
  const errors = [];

  if (config.server.env === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters in production');
    }
    if (!process.env.MONGODB_URI) {
      errors.push('MONGODB_URI is required in production');
    }
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
      errors.push('SESSION_SECRET must be at least 32 characters in production');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
  }
};

export default config;
