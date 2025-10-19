const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query } = require('../db');
const emailService = require('../emailService');
const winston = require('winston');
const { validateJWT } = require('../middleware/auth');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: '/var/www/beautycita.com/backend/logs/email-verification.log' }),
    new winston.transports.Console()
  ]
});

/**
 * Generate a secure random token for email verification
 */
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * POST /api/auth/send-email-verification
 * Send verification email to authenticated user
 * Requires JWT authentication (req.user must exist)
 */
router.post('/send-email-verification', validateJWT, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    if (!user.email) {
      return res.status(400).json({
        success: false,
        message: 'No email address associated with this account'
      });
    }

    // Generate verification token
    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    logger.info('Generating email verification token', {
      userId: user.id,
      email: user.email
    });

    // Store token in database
    await query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET token = $2, expires_at = $3, used = false, created_at = NOW()`,
      [user.id, token, expiresAt]
    );

    // Send verification email
    const verificationUrl = `https://beautycita.com/verify-email/${token}`;
    const userName = user.name || user.first_name || user.email.split('@')[0];

    await emailService.sendEmailVerificationEmail(
      user.email,
      userName,
      verificationUrl
    );

    logger.info('Email verification sent successfully', {
      userId: user.id,
      email: user.email
    });

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    logger.error('Failed to send verification email', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to send verification email. Please try again later.'
    });
  }
});

/**
 * GET /api/auth/verify-email/:token
 * Verify email using token from verification link
 * Public endpoint (no auth required)
 */
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    logger.info('Email verification attempt', { token: token.substring(0, 8) + '...' });

    // Find valid, unexpired, unused token
    const tokenResult = await query(
      `SELECT user_id, expires_at, used
       FROM email_verification_tokens
       WHERE token = $1`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      logger.warn('Invalid verification token', { token: token.substring(0, 8) + '...' });
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    const tokenData = tokenResult.rows[0];

    // Check if token has already been used
    if (tokenData.used) {
      logger.warn('Token already used', { token: token.substring(0, 8) + '...' });
      return res.status(400).json({
        success: false,
        message: 'This verification link has already been used'
      });
    }

    // Check if token has expired
    if (new Date(tokenData.expires_at) < new Date()) {
      logger.warn('Expired verification token', { token: token.substring(0, 8) + '...' });
      return res.status(400).json({
        success: false,
        message: 'Verification link has expired. Please request a new one.'
      });
    }

    const userId = tokenData.user_id;

    // Update user's email_verified status
    await query(
      'UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $1',
      [userId]
    );

    // Mark token as used
    await query(
      'UPDATE email_verification_tokens SET used = true, used_at = NOW() WHERE token = $1',
      [token]
    );

    // Get user info for logging
    const userResult = await query(
      'SELECT email, name, first_name FROM users WHERE id = $1',
      [userId]
    );

    logger.info('Email verified successfully', {
      userId,
      email: userResult.rows[0]?.email
    });

    res.json({
      success: true,
      message: 'Email verified successfully! You can now close this window.'
    });

  } catch (error) {
    logger.error('Email verification failed', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Email verification failed. Please try again or contact support.'
    });
  }
});

/**
 * DELETE /api/auth/cleanup-expired-tokens
 * Cleanup expired verification tokens (admin only or cron job)
 * This can be called by a cron job to clean up old tokens
 */
router.delete('/cleanup-expired-tokens', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM email_verification_tokens WHERE expires_at < NOW()'
    );

    logger.info('Cleaned up expired verification tokens', {
      count: result.rowCount
    });

    res.json({
      success: true,
      message: `Cleaned up ${result.rowCount} expired tokens`
    });

  } catch (error) {
    logger.error('Failed to cleanup expired tokens', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to cleanup expired tokens'
    });
  }
});

module.exports = router;
