import helmet from 'helmet';
import { config } from '../config/production.js';

// Security middleware configuration
export const securityMiddleware = helmet({
  // Content Security Policy
  contentSecurityPolicy: config.securityHeaders.helmet.csp.enabled ? {
    directives: {
      ...config.securityHeaders.helmet.csp.directives,
      'upgrade-insecure-requests': [],
    },
  } : false,

  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: false,

  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: { policy: "same-origin" },

  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: { policy: "cross-origin" },

  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },

  // Expect-CT
  expectCt: {
    maxAge: 86400,
    enforce: false,
  },

  // Feature Policy
  permittedCrossDomainPolicies: false,

  // HSTS
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },

  // IE Compatibility
  ieNoOpen: true,

  // Frame Protection
  frameguard: { action: 'deny' },

  // Hide Powered By Header
  hidePoweredBy: true,

  // HTTP Public Key Pinning
  hpkp: false,

  // No Sniff
  noSniff: true,

  // Origin Agent Cluster
  originAgentCluster: true,

  // Permissions Policy
  permissionsPolicy: {
    features: {
      camera: ["'none'"],
      microphone: ["'none'"],
      geolocation: ["'none'"],
      payment: ["'none'"],
      usb: ["'none'"],
      magnetometer: ["'none'"],
      gyroscope: ["'none'"],
      accelerometer: ["'none'"],
      ambientLightSensor: ["'none'"],
    },
  },

  // Referrer Policy
  referrerPolicy: { policy: "no-referrer" },

  // X-Content-Type-Options
  xContentTypeOptions: true,

  // X-DNS-Prefetch-Control
  xDnsPrefetchControl: false,

  // X-Download-Options
  xDownloadOptions: false,

  // X-Frame-Options
  xFrameOptions: 'DENY',

  // X-Permitted-Cross-Domain-Policies
  xPermittedCrossDomainPolicies: false,

  // X-XSS-Protection
  xXssProtection: '1; mode=block',
});

// Additional security headers
export const additionalSecurityHeaders = (req, res, next) => {
  // Remove server information
  res.removeHeader('Server');
  res.removeHeader('X-Powered-By');

  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Cache control for API responses
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }

  next();
};

// Request validation middleware
export const requestValidator = (req, res, next) => {
  // Check for dangerous characters
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];

  const checkString = (str) => {
    if (typeof str !== 'string') return false;
    return dangerousPatterns.some(pattern => pattern.test(str));
  };

  // Check request body
  if (req.body) {
    const bodyStr = JSON.stringify(req.body);
    if (checkString(bodyStr)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request content detected',
      });
    }
  }

  // Check query parameters
  for (const [key, value] of Object.entries(req.query)) {
    if (checkString(value)) {
      return res.status(400).json({
        success: false,
        message: `Invalid query parameter: ${key}`,
      });
    }
  }

  next();
};

// IP whitelist middleware (optional)
export const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next(); // No whitelist configured
    }

    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied from this IP address',
      });
    }

    next();
  };
};

export default {
  securityMiddleware,
  additionalSecurityHeaders,
  requestValidator,
  ipWhitelist,
};
