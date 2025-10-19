const express = require('express');
const { query } = require('../db');
const { validateAuth, destroySession } = require('../middleware/sessionAuth');
const { getCsrfToken } = require('../middleware/csrfProtection');
const winston = require('winston');

const router = express.Router();

// Initialize logger
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'beautycita-sessions' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: '/var/www/beautycita.com/backend/logs/sessions.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

/**
 * GET /api/sessions/csrf
 * Get CSRF token for session-based requests
 */
router.get('/csrf', getCsrfToken);

/**
 * GET /api/sessions/current
 * Get current session info
 */
router.get('/current', validateAuth, (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.json({
      success: true,
      authenticated: false
    });
  }

  res.json({
    success: true,
    authenticated: true,
    session: {
      id: req.sessionID,
      userId: req.session.userId,
      createdAt: req.session.createdAt,
      lastActivity: req.session.lastActivity,
      ip: req.session.ip,
      userAgent: req.session.userAgent
    }
  });
});

/**
 * GET /api/sessions/list
 * List all active sessions for current user
 * Retrieves session data from Redis
 */
router.get('/list', validateAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get Redis client from app
    const redisClient = req.app.get('redisClient');
    if (!redisClient) {
      throw new Error('Redis client not available');
    }

    // Scan for all sessions with our prefix
    const prefix = 'beautycita:sess:';
    const sessions = [];
    let cursor = '0';

    do {
      const result = await redisClient.scan(cursor, {
        MATCH: `${prefix}*`,
        COUNT: 100
      });

      cursor = result.cursor;
      const keys = result.keys;

      // Get session data for each key
      for (const key of keys) {
        try {
          const sessionData = await redisClient.get(key);
          if (sessionData) {
            const parsed = JSON.parse(sessionData);

            // Only include sessions for this user
            if (parsed.userId === userId) {
              const sessionId = key.replace(prefix, '');
              sessions.push({
                id: sessionId,
                createdAt: parsed.createdAt,
                lastActivity: parsed.lastActivity,
                ip: parsed.ip,
                userAgent: parsed.userAgent,
                isCurrent: sessionId === req.sessionID
              });
            }
          }
        } catch (err) {
          logger.warn('Failed to parse session', { key, error: err.message });
        }
      }
    } while (cursor !== '0');

    // Sort by last activity (most recent first)
    sessions.sort((a, b) => {
      return new Date(b.lastActivity) - new Date(a.lastActivity);
    });

    logger.info('Listed active sessions', { userId, count: sessions.length });

    res.json({
      success: true,
      sessions
    });

  } catch (error) {
    logger.error('Failed to list sessions', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve sessions'
    });
  }
});

/**
 * DELETE /api/sessions/:sessionId
 * Revoke a specific session
 */
router.delete('/:sessionId', validateAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Get Redis client
    const redisClient = req.app.get('redisClient');
    if (!redisClient) {
      throw new Error('Redis client not available');
    }

    const key = `beautycita:sess:${sessionId}`;

    // Verify session belongs to current user before deleting
    const sessionData = await redisClient.get(key);
    if (!sessionData) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const parsed = JSON.parse(sessionData);
    if (parsed.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot revoke another user\'s session'
      });
    }

    // Delete the session
    await redisClient.del(key);

    logger.info('Session revoked', { userId, sessionId });

    res.json({
      success: true,
      message: 'Session revoked successfully'
    });

  } catch (error) {
    logger.error('Failed to revoke session', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to revoke session'
    });
  }
});

/**
 * POST /api/sessions/revoke-all
 * Revoke all sessions except current
 */
router.post('/revoke-all', validateAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const currentSessionId = req.sessionID;

    // Get Redis client
    const redisClient = req.app.get('redisClient');
    if (!redisClient) {
      throw new Error('Redis client not available');
    }

    const prefix = 'beautycita:sess:';
    let revokedCount = 0;
    let cursor = '0';

    do {
      const result = await redisClient.scan(cursor, {
        MATCH: `${prefix}*`,
        COUNT: 100
      });

      cursor = result.cursor;
      const keys = result.keys;

      for (const key of keys) {
        try {
          const sessionData = await redisClient.get(key);
          if (sessionData) {
            const parsed = JSON.parse(sessionData);
            const sessionId = key.replace(prefix, '');

            // Delete if it belongs to this user AND is not the current session
            if (parsed.userId === userId && sessionId !== currentSessionId) {
              await redisClient.del(key);
              revokedCount++;
            }
          }
        } catch (err) {
          logger.warn('Failed to revoke session', { key, error: err.message });
        }
      }
    } while (cursor !== '0');

    logger.info('Revoked all sessions', { userId, revokedCount });

    res.json({
      success: true,
      message: `Revoked ${revokedCount} session(s)`,
      revokedCount
    });

  } catch (error) {
    logger.error('Failed to revoke all sessions', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to revoke sessions'
    });
  }
});

/**
 * POST /api/sessions/logout
 * Destroy current session
 */
router.post('/logout', validateAuth, async (req, res) => {
  try {
    await destroySession(req);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to logout'
    });
  }
});

module.exports = router;
