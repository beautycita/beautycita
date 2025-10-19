const { doubleCsrf } = require('csrf-csrf');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'beautycita-csrf' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Configure CSRF protection
const {
  invalidCsrfTokenError, // This is just for convenience if you plan on making your own middleware.
  generateCsrfToken, // Use this in your routes to generate, store, and get a CSRF token.
  validateRequest, // Use this to validate a CSRF token in your routes.
  doubleCsrfProtection, // This is the default CSRF protection middleware.
} = doubleCsrf({
  getSecret: () => process.env.SESSION_SECRET || 'beautycita-csrf-secret',
  cookieName: 'beautycita.csrf',
  cookieOptions: {
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => {
    // Check header first, then body
    return req.headers['x-csrf-token'] || req.body?._csrf;
  },
  getSessionIdentifier: (req) => {
    // Use session ID if available, otherwise fall back to a generic identifier
    return req.sessionID || req.ip || 'default-session';
  },
});

/**
 * CSRF protection middleware for session-based routes
 * Validates CSRF tokens for state-changing operations (POST, PUT, DELETE, PATCH)
 */
const csrfProtection = (req, res, next) => {
  // Skip CSRF for certain routes (like webhooks)
  const skipPaths = [
    '/api/webhooks',
    '/api/btcpay/webhook',
    '/api/stripe/webhook',
    '/health',
    '/metrics'
  ];

  if (skipPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for JWT-authenticated requests (backward compatibility)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    logger.debug('Skipping CSRF for JWT-authenticated request', {
      method: req.method,
      path: req.path
    });
    return next();
  }

  // Validate CSRF token for session-based requests
  try {
    validateRequest(req);
    logger.debug('CSRF token validated', {
      method: req.method,
      path: req.path,
      ip: req.ip
    });
    next();
  } catch (err) {
    logger.warn('CSRF validation failed', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      error: err.message
    });

    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token',
      code: 'CSRF_VALIDATION_FAILED'
    });
  }
};

/**
 * Endpoint to generate CSRF token
 * Frontend calls this to get a token before making state-changing requests
 */
const getCsrfToken = (req, res) => {
  const token = generateCsrfToken(req, res);

  logger.debug('CSRF token generated', {
    sessionId: req.sessionID,
    ip: req.ip
  });

  res.json({
    success: true,
    csrfToken: token
  });
};

module.exports = {
  csrfProtection,
  getCsrfToken,
  doubleCsrfProtection
};
