const express = require('express');
const router = express.Router();
const { query } = require('../db');
const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: '/var/www/beautycita.com/backend/logs/messaging.log' }),
    new winston.transports.Console()
  ]
});

/**
 * Middleware to check rate limiting for messages
 * NOTE: Only applies to CLIENT users. Stylists, admins, and superadmins have no limits.
 */
const checkRateLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Skip rate limiting for stylists and admins
    if (userRole === 'STYLIST' || userRole === 'ADMIN' || userRole === 'SUPERADMIN') {
      logger.info('Rate limit skipped for privileged user', { userId, role: userRole });
      return next();
    }

    // Only apply rate limits to CLIENT users
    if (userRole !== 'CLIENT') {
      return next();
    }

    // Get or create rate limit record
    let rateLimitResult = await query(
      'SELECT * FROM message_rate_limits WHERE user_id = $1',
      [userId]
    );

    let rateLimit;
    if (rateLimitResult.rows.length === 0) {
      // Create new rate limit record
      const createResult = await query(
        `INSERT INTO message_rate_limits (user_id, messages_sent_today, daily_limit)
         VALUES ($1, 0, 50)
         RETURNING *`,
        [userId]
      );
      rateLimit = createResult.rows[0];
    } else {
      rateLimit = rateLimitResult.rows[0];
    }

    // Check if currently limited
    if (rateLimit.is_limited && rateLimit.limited_until) {
      const now = new Date();
      const limitedUntil = new Date(rateLimit.limited_until);

      if (now < limitedUntil) {
        return res.status(429).json({
          success: false,
          message: 'You have been temporarily limited from sending messages',
          reason: rateLimit.limit_reason,
          limited_until: rateLimit.limited_until
        });
      } else {
        // Limit expired, reset
        await query(
          `UPDATE message_rate_limits
           SET is_limited = false, limit_reason = NULL, limited_until = NULL
           WHERE user_id = $1`,
          [userId]
        );
        rateLimit.is_limited = false;
      }
    }

    // Check daily limit
    const lastMessageDate = new Date(rateLimit.last_message_at);
    const now = new Date();
    const isNewDay = lastMessageDate.toDateString() !== now.toDateString();

    if (isNewDay) {
      // Reset daily count
      await query(
        'UPDATE message_rate_limits SET messages_sent_today = 0 WHERE user_id = $1',
        [userId]
      );
      rateLimit.messages_sent_today = 0;
    }

    if (rateLimit.messages_sent_today >= rateLimit.daily_limit) {
      return res.status(429).json({
        success: false,
        message: `Daily message limit reached (${rateLimit.daily_limit} messages per day)`,
        limit: rateLimit.daily_limit,
        sent_today: rateLimit.messages_sent_today
      });
    }

    // Attach rate limit info to request
    req.rateLimit = rateLimit;
    next();
  } catch (error) {
    logger.error('Error checking rate limit:', error);
    // Don't block on rate limit errors, just log and continue
    next();
  }
};

/**
 * Middleware to increment message count after successful send
 */
const incrementMessageCount = async (userId) => {
  try {
    await query(
      `UPDATE message_rate_limits
       SET messages_sent_today = messages_sent_today + 1,
           last_message_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );
  } catch (error) {
    logger.error('Error incrementing message count:', error);
  }
};

/**
 * POST /api/messaging/check-content
 * Check message content for contact information before sending
 */
router.post('/check-content', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    // Use the database function to detect contact info
    const result = await query(
      'SELECT detect_contact_info($1) as contains_contact_info',
      [content]
    );

    const containsContactInfo = result.rows[0].contains_contact_info;

    res.json({
      success: true,
      contains_contact_info: containsContactInfo,
      warning: containsContactInfo ?
        'Your message appears to contain contact information (phone, email, or social media). We strongly recommend keeping all communication within BeautyCita. Any interactions outside our platform are not covered by our policies and protections.' :
        null
    });
  } catch (error) {
    logger.error('Error checking message content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check message content'
    });
  }
});

/**
 * GET /api/messaging/rate-limit-status
 * Get current rate limit status for user
 * Stylists have unlimited messages
 */
router.get('/rate-limit-status', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Stylists and admins have no limits
    if (userRole === 'STYLIST' || userRole === 'ADMIN' || userRole === 'SUPERADMIN') {
      return res.json({
        success: true,
        data: {
          daily_limit: null,
          messages_sent_today: 0,
          remaining: null,
          is_limited: false,
          unlimited: true,
          role: userRole
        }
      });
    }

    // Only clients have limits
    const result = await query(
      'SELECT * FROM message_rate_limits WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          daily_limit: 50,
          messages_sent_today: 0,
          remaining: 50,
          is_limited: false,
          unlimited: false
        }
      });
    }

    const rateLimit = result.rows[0];
    const remaining = Math.max(0, rateLimit.daily_limit - rateLimit.messages_sent_today);

    res.json({
      success: true,
      data: {
        daily_limit: rateLimit.daily_limit,
        messages_sent_today: rateLimit.messages_sent_today,
        remaining,
        is_limited: rateLimit.is_limited,
        limit_reason: rateLimit.limit_reason,
        limited_until: rateLimit.limited_until,
        unlimited: false
      }
    });
  } catch (error) {
    logger.error('Error fetching rate limit status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rate limit status'
    });
  }
});

/**
 * POST /api/messaging/flag-message
 * Flag a message for containing contact information or being inappropriate
 */
router.post('/flag-message/:messageId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required'
      });
    }

    const result = await query(
      `UPDATE messages
       SET is_flagged = true,
           flagged_reason = $1,
           flagged_at = NOW(),
           flagged_by = $2
       WHERE id = $3
       RETURNING *`,
      [reason, userId, messageId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: 'Message flagged successfully',
      data: result.rows[0]
    });

    logger.info('Message flagged', {
      messageId,
      flaggedBy: userId,
      reason
    });
  } catch (error) {
    logger.error('Error flagging message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to flag message'
    });
  }
});

/**
 * GET /api/messaging/warnings
 * Get messaging guidelines and warnings
 */
router.get('/warnings', async (req, res) => {
  const userRole = req.user?.role;

  res.json({
    success: true,
    data: {
      contact_sharing_warning: {
        title: 'Keep Communication on BeautyCita',
        message: 'We strongly recommend you do not share contact information outside of BeautyCita. Any communication or interaction not through our platform is not considered in any decision and is not covered by our policies and protections.',
        consequences: [
          'No dispute resolution support',
          'No payment protection',
          'No booking guarantees',
          'May violate platform terms of service'
        ]
      },
      rate_limits: {
        daily_message_limit: userRole === 'CLIENT' ? 50 : null,
        description: userRole === 'CLIENT'
          ? 'To ensure quality communication and prevent spam, clients are limited to 50 messages per day.'
          : 'Stylists have unlimited messaging to better serve their clients.',
        applies_to: userRole === 'CLIENT' ? 'clients_only' : 'not_applicable'
      },
      prohibited_content: [
        'Phone numbers',
        'Email addresses',
        'Social media handles (Instagram, WhatsApp, Facebook, etc.)',
        'External meeting links',
        'Personal contact information'
      ],
      best_practices: [
        'Use video consultations for complex discussions',
        'Book services through the platform',
        'Keep payment transactions on BeautyCita',
        'Report inappropriate messages',
        'Be respectful and professional'
      ]
    }
  });
});

// Export middleware for use in message routes
module.exports = {
  router,
  checkRateLimit,
  incrementMessageCount
};
