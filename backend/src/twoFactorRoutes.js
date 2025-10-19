const express = require('express');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { query } = require('./db');
const { validateJWT } = require('./middleware/auth');

const router = express.Router();

// Generate 2FA setup
router.post('/setup', validateJWT, async (req, res) => {
  try {
    const userId = req.userId;

    // Get user info
    const userResult = await query('SELECT role, email, name FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `BeautyCita Admin (${user.email})`,
      service: 'BeautyCita',
      length: 32
    });

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    // Store secret in database (not enabled yet)
    await query(
      'UPDATE users SET two_factor_secret = $1 WHERE id = $2',
      [secret.base32, userId]
    );

    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    });

  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup 2FA'
    });
  }
});

// Verify and enable 2FA
router.post('/verify', validateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'TOTP token required'
      });
    }

    // Get user's secret
    const userResult = await query(
      'SELECT two_factor_secret, role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const secret = userResult.rows[0].two_factor_secret;
    if (!secret) {
      return res.status(400).json({
        success: false,
        message: '2FA not set up. Run setup first.'
      });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (verified) {
      // Enable 2FA
      await query(
        'UPDATE users SET two_factor_enabled = TRUE WHERE id = $1',
        [userId]
      );

      res.json({
        success: true,
        message: '2FA enabled successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid TOTP token'
      });
    }

  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify 2FA'
    });
  }
});

// Verify 2FA token during login
router.post('/validate', async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({
        success: false,
        message: 'Email and token required'
      });
    }

    // Get user's 2FA secret
    const userResult = await query(
      'SELECT id, two_factor_secret, two_factor_enabled FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];
    if (!user.two_factor_enabled || !user.two_factor_secret) {
      return res.status(400).json({
        success: false,
        message: '2FA not enabled for this user'
      });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    res.json({
      success: verified,
      message: verified ? 'Token valid' : 'Invalid token'
    });

  } catch (error) {
    console.error('2FA validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate 2FA token'
    });
  }
});

// Disable 2FA
router.post('/disable', validateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { token } = req.body;

    // Get user's current 2FA status
    const userResult = await query(
      'SELECT two_factor_secret, two_factor_enabled, role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];
    if (!user.two_factor_enabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled'
      });
    }

    // Verify current token before disabling
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid TOTP token'
      });
    }

    // Disable 2FA
    await query(
      'UPDATE users SET two_factor_enabled = FALSE, two_factor_secret = NULL WHERE id = $1',
      [userId]
    );

    res.json({
      success: true,
      message: '2FA disabled successfully'
    });

  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable 2FA'
    });
  }
});

// Get 2FA status
router.get('/status', validateJWT, async (req, res) => {
  try {
    const userId = req.userId;

    const userResult = await query(
      'SELECT two_factor_enabled, role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      enabled: userResult.rows[0].two_factor_enabled || false
    });

  } catch (error) {
    console.error('2FA status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get 2FA status'
    });
  }
});

module.exports = router;