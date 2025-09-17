const cors = require('cors');

/**
 * CORS Configuration Middleware
 * Configured for frontend connection with proper security settings
 */

/**
 * Get allowed origins based on environment
 * @returns {Array<string>} Array of allowed origin URLs
 */
function getAllowedOrigins() {
  const origins = [];

  // Development origins
  if (process.env.NODE_ENV !== 'production') {
    origins.push(
      'http://localhost:3000',    // React development server
      'http://localhost:3001',    // Backend server (for testing)
      'http://127.0.0.1:3000',    // Alternative localhost
      'http://127.0.0.1:3001'     // Alternative backend
    );
  }

  // Production origins
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }

  // Additional allowed origins from environment
  if (process.env.ALLOWED_ORIGINS) {
    const additionalOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
    origins.push(...additionalOrigins);
  }

  // Fallback for development if no origins specified
  if (origins.length === 0) {
    origins.push('http://localhost:3000');
  }

  return origins;
}

/**
 * CORS options configuration
 */
const corsOptions = {
  // Origin validation
  origin: function (origin, callback) {
    const allowedOrigins = getAllowedOrigins();

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked request from origin: ${origin}`);
      console.warn(`CORS: Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS policy'), false);
    }
  },

  // HTTP methods allowed
  methods: [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'OPTIONS',
    'HEAD'
  ],

  // Headers allowed in requests
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name',
    'X-Request-ID'
  ],

  // Headers exposed to the client
  exposedHeaders: [
    'X-Total-Count',
    'X-Request-ID',
    'Content-Range',
    'Cache-Control'
  ],

  // Allow credentials (cookies, authorization headers)
  credentials: true,

  // Preflight cache time (in seconds)
  maxAge: 86400, // 24 hours

  // Include CORS headers on successful OPTIONS requests
  optionsSuccessStatus: 200, // For legacy browser support

  // Handle preflight requests
  preflightContinue: false
};

/**
 * Development CORS options (more permissive)
 */
const devCorsOptions = {
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: '*',
  credentials: true,
  maxAge: 3600 // 1 hour cache for development
};

/**
 * Create CORS middleware based on environment
 * @returns {Function} CORS middleware function
 */
function createCorsMiddleware() {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const options = isDevelopment ? devCorsOptions : corsOptions;

  // Log CORS configuration on startup (development only)
  if (isDevelopment && process.env.NODE_ENV === 'development') {
    console.log('CORS: Development mode - allowing all origins');
  } else if (!isDevelopment && process.env.NODE_ENV !== 'test') {
    console.log('CORS: Production mode - restricted origins:', getAllowedOrigins());
  }

  return cors(options);
}

/**
 * Additional security headers middleware
 * Applied after CORS to add security headers
 */
function securityHeaders(req, res, next) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy (basic)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "font-src 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "child-src 'none'"
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);

  // HSTS (HTTPS Strict Transport Security) - only in production with HTTPS
  if (process.env.NODE_ENV === 'production' && req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
}

/**
 * Log CORS requests for debugging
 */
function corsLogger(req, res, next) {
  if (process.env.NODE_ENV === 'development' && req.headers.origin) {
    console.log(`CORS: ${req.method} ${req.path} from ${req.headers.origin}`);
  }
  next();
}

/**
 * Combined CORS middleware with logging and security headers
 */
function corsMiddleware(req, res, next) {
  // Apply CORS logging
  corsLogger(req, res, () => {
    // Apply CORS policy
    const corsHandler = createCorsMiddleware();
    corsHandler(req, res, () => {
      // Apply security headers
      securityHeaders(req, res, next);
    });
  });
}

// Export the main middleware and individual components
module.exports = corsMiddleware;
module.exports.createCorsMiddleware = createCorsMiddleware;
module.exports.securityHeaders = securityHeaders;
module.exports.corsLogger = corsLogger;
module.exports.getAllowedOrigins = getAllowedOrigins;