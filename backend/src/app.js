const express = require('express');
const gamesRouter = require('./routes/games');
const gameActionsRouter = require('./routes/gameActions');

// Import middleware
const corsMiddleware = require('./middleware/cors');
const validationMiddleware = require('./middleware/validation');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Trust proxy for production environments
app.set('trust proxy', 1);

// CORS middleware (configured for frontend connection)
app.use(corsMiddleware);

// Body parsing middleware
app.use(express.json({
  limit: '10mb',
  strict: true,
  type: ['application/json']
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const userAgent = req.get('User-Agent') || 'unknown';
  console.log(`${timestamp} ${req.method} ${req.path} - ${req.ip} - ${userAgent}`);

  // Log request body for POST/PUT requests (sanitized)
  if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
    const sanitizedBody = { ...req.body };
    // Remove sensitive data from logs if any
    console.log(`  Body: ${JSON.stringify(sanitizedBody)}`);
  }

  next();
});

// Request validation middleware (using OpenAPI schema)
app.use('/api/v1', validationMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/v1/games', gamesRouter);
app.use('/api/v1/games', gameActionsRouter);

// 404 handler for undefined routes
app.use('*', notFoundHandler);

// Global error handler (must be last middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

// Only start server if this file is run directly (not during testing)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Silosoft Game Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API base: http://localhost:${PORT}/api/v1`);
  });
}

module.exports = app;