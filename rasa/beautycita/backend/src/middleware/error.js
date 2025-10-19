import winston from 'winston';

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log' }),
  ]
});

export function errorHandler(err, req, res, next) {
  // Log error
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let error = {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error = {
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.message
    };
    return res.status(400).json(error);
  }

  if (err.name === 'UnauthorizedError') {
    error = {
      error: 'Access denied',
      code: 'UNAUTHORIZED'
    };
    return res.status(401).json(error);
  }

  if (err.code === '23505') { // PostgreSQL unique constraint violation
    error = {
      error: 'Resource already exists',
      code: 'DUPLICATE_RESOURCE'
    };
    return res.status(409).json(error);
  }

  if (err.code === '23503') { // PostgreSQL foreign key violation
    error = {
      error: 'Referenced resource not found',
      code: 'FOREIGN_KEY_VIOLATION'
    };
    return res.status(400).json(error);
  }

  // Database connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    error = {
      error: 'Service temporarily unavailable',
      code: 'SERVICE_UNAVAILABLE'
    };
    return res.status(503).json(error);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = {
      error: 'Invalid or expired token',
      code: 'TOKEN_ERROR'
    };
    return res.status(401).json(error);
  }

  // Stripe errors
  if (err.type && err.type.startsWith('Stripe')) {
    error = {
      error: 'Payment processing error',
      code: 'PAYMENT_ERROR',
      details: err.message
    };
    return res.status(400).json(error);
  }

  // Development mode - include stack trace
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
    error.details = err.message;
  }

  res.status(500).json(error);
}