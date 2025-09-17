/**
 * Error Handling Middleware - Centralized error processing with structured logging
 * Provides consistent error responses and proper logging for debugging
 */

/**
 * Custom error class for application-specific errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Log error with structured format
 * @param {Error} error - The error to log
 * @param {Object} req - Express request object
 * @param {string} level - Log level (error, warn, info)
 */
function logError(error, req, level = 'error') {
  const timestamp = new Date().toISOString();
  const requestId = req.headers['x-request-id'] || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';

  const logEntry = {
    timestamp,
    level,
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent,
    error: {
      name: error.name,
      message: error.message,
      code: error.code || null,
      statusCode: error.statusCode || 500,
      isOperational: error.isOperational || false,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  };

  // Log request body for debugging (sanitized)
  if (req.body && Object.keys(req.body).length > 0) {
    logEntry.requestBody = { ...req.body };
    // Remove sensitive data from logs
    if (logEntry.requestBody.password) logEntry.requestBody.password = '[REDACTED]';
    if (logEntry.requestBody.token) logEntry.requestBody.token = '[REDACTED]';
  }

  console.error(`[${level.toUpperCase()}]`, JSON.stringify(logEntry, null, 2));
}

/**
 * Determine appropriate HTTP status code based on error
 * @param {Error} error - The error object
 * @returns {number} HTTP status code
 */
function getStatusCode(error) {
  // If error has explicit status code
  if (error.statusCode) {
    return error.statusCode;
  }

  // Game-specific error patterns
  if (error.message.includes('not found')) {
    return 404;
  }

  if (error.message.includes('Not your turn') ||
      error.message.includes('Game is over') ||
      error.message.includes('already assigned') ||
      error.message.includes('unavailable') ||
      error.message.includes('completed') ||
      error.message.includes('Deck is empty') ||
      error.message.includes('hand is full')) {
    return 400;
  }

  // Validation errors
  if (error.name === 'ValidationError' ||
      error.name === 'ValidatorError' ||
      error.message.includes('required') ||
      error.message.includes('must be')) {
    return 400;
  }

  // MongoDB/Database errors
  if (error.name === 'MongoError' || error.name === 'CastError') {
    return 400;
  }

  // JSON parsing errors
  if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
    return 400;
  }

  // Default to 500 for unknown errors
  return 500;
}

/**
 * Get appropriate error code based on error message
 * @param {Error} error - The error object
 * @returns {string|null} Error code
 */
function getErrorCode(error) {
  if (error.code) {
    return error.code;
  }

  // Game-specific error codes
  if (error.message.includes("Not your turn")) return 'INVALID_TURN';
  if (error.message.includes('Game is over')) return 'GAME_OVER';
  if (error.message.includes('Deck is empty')) return 'EMPTY_DECK';
  if (error.message.includes('hand is full')) return 'HAND_FULL';
  if (error.message.includes('not found')) return 'NOT_FOUND';
  if (error.message.includes('already assigned')) return 'ALREADY_ASSIGNED';
  if (error.message.includes('unavailable')) return 'RESOURCE_UNAVAILABLE';
  if (error.message.includes('completed')) return 'FEATURE_COMPLETED';

  // Validation error codes
  if (error.name === 'ValidationError') return 'VALIDATION_ERROR';
  if (error.message.includes('required')) return 'MISSING_REQUIRED_FIELD';

  return null;
}

/**
 * Create standardized error response
 * @param {Error} error - The error object
 * @param {Object} req - Express request object
 * @returns {Object} Standardized error response
 */
function createErrorResponse(error, req) {
  const statusCode = getStatusCode(error);
  const errorCode = getErrorCode(error);

  const response = {
    error: getErrorName(statusCode),
    message: error.message,
    ...(errorCode && { code: errorCode }),
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && error.stack) {
    response.stack = error.stack;
  }

  // Add request ID if available
  const requestId = req.headers['x-request-id'];
  if (requestId) {
    response.requestId = requestId;
  }

  return response;
}

/**
 * Get standard error name for HTTP status code
 * @param {number} statusCode - HTTP status code
 * @returns {string} Error name
 */
function getErrorName(statusCode) {
  const errorNames = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable'
  };

  return errorNames[statusCode] || 'Error';
}

/**
 * Main error handling middleware
 * Must be placed after all routes and other middleware
 */
function errorHandler(error, req, res, next) {
  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  // Log the error
  logError(error, req);

  // Create standardized response
  const statusCode = getStatusCode(error);
  const errorResponse = createErrorResponse(error, req);

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Handle async route errors
 * Wrapper function to catch async errors and pass to error handler
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 handler for undefined routes
 * Should be placed after all defined routes but before error handler
 */
function notFoundHandler(req, res, next) {
  const error = new AppError(
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
}

/**
 * Handle uncaught exceptions and unhandled rejections
 */
function setupGlobalErrorHandlers() {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error('Error:', error);
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION! Shutting down...');
    console.error('Reason:', reason);
    console.error('Promise:', promise);
    process.exit(1);
  });

  // Graceful shutdown on SIGTERM
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
  });

  // Graceful shutdown on SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    process.exit(0);
  });
}

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  AppError,
  setupGlobalErrorHandlers
};