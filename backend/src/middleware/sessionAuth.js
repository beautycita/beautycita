const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'beautycita-session-auth' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: '/var/www/beautycita.com/backend/logs/session.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

/**
 * Session-based authentication middleware
 * Validates session and attaches user to req.user
 */
const validateSession = (req, res, next) => {
  // Check if user is authenticated via session
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Update last activity timestamp for sliding expiry
  req.session.lastActivity = new Date().toISOString();

  // Attach user data to request (already stored in session)
  req.user = {
    id: req.session.userId,
    email: req.session.userEmail,
    phone: req.session.userPhone,
    role: req.session.userRole,
    name: req.session.userName,
    firstName: req.session.userFirstName,
    lastName: req.session.userLastName,
    profileComplete: req.session.profileComplete
  };

  // Also set individual properties for backward compatibility
  req.userId = req.session.userId;
  req.userEmail = req.session.userEmail;
  req.userRole = req.session.userRole;

  logger.debug('Session validated', {
    userId: req.user.id,
    sessionId: req.sessionID,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  next();
};

/**
 * Dual authentication middleware (JWT or Session)
 * Supports both JWT tokens and session-based auth for backward compatibility
 */
const validateAuth = async (req, res, next) => {
  // Try session first
  if (req.session && req.session.userId) {
    req.session.lastActivity = new Date().toISOString();

    req.user = {
      id: req.session.userId,
      email: req.session.userEmail,
      phone: req.session.userPhone,
      role: req.session.userRole,
      name: req.session.userName,
      firstName: req.session.userFirstName,
      lastName: req.session.userLastName,
      profileComplete: req.session.profileComplete
    };

    req.userId = req.session.userId;
    req.userEmail = req.session.userEmail;
    req.userRole = req.session.userRole;

    logger.debug('Session auth succeeded', { userId: req.user.id, sessionId: req.sessionID });
    return next();
  }

  // Fall back to JWT validation
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const token = authHeader.substring(7);
  const jwt = require('jsonwebtoken');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'beautycita-secret');

    req.user = {
      id: decoded.id,
      email: decoded.email,
      phone: decoded.phone,
      role: decoded.role,
      name: decoded.name,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      profileComplete: decoded.profileComplete
    };

    req.userId = decoded.id;
    req.userEmail = decoded.email;
    req.userRole = decoded.role;

    logger.debug('JWT auth succeeded (legacy)', { userId: req.user.id });
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication'
    });
  }
};

/**
 * Create a new session for a user
 * Call this after successful authentication
 */
const createSession = (req, user) => {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) {
        logger.error('Session regeneration failed', { error: err.message });
        return reject(err);
      }

      // Store user data in session
      req.session.userId = user.id;
      req.session.userEmail = user.email;
      req.session.userPhone = user.phone;
      req.session.userRole = user.role;
      req.session.userName = user.name;
      req.session.userFirstName = user.first_name || user.firstName;
      req.session.userLastName = user.last_name || user.lastName;
      req.session.profileComplete = user.profile_complete !== false;
      req.session.createdAt = new Date().toISOString();
      req.session.lastActivity = new Date().toISOString();
      req.session.ip = req.ip;
      req.session.userAgent = req.get('User-Agent');

      req.session.save((err) => {
        if (err) {
          logger.error('Session save failed', { error: err.message });
          return reject(err);
        }

        logger.info('Session created', {
          userId: user.id,
          sessionId: req.sessionID,
          ip: req.ip
        });

        resolve(req.sessionID);
      });
    });
  });
};

/**
 * Destroy user session
 */
const destroySession = (req) => {
  return new Promise((resolve, reject) => {
    const sessionId = req.sessionID;
    const userId = req.session?.userId;

    req.session.destroy((err) => {
      if (err) {
        logger.error('Session destruction failed', { error: err.message, sessionId });
        return reject(err);
      }

      logger.info('Session destroyed', { userId, sessionId });
      resolve();
    });
  });
};

module.exports = {
  validateSession,
  validateAuth,
  createSession,
  destroySession
};
