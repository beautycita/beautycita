/**
 * Security API Routes - BeautyCita
 * Authentication, 2FA, and security management endpoints
 */

const express = require('express');
const router = express.Router();
const {
  generateAccessToken,
  generateRefreshToken,
  refreshTokenHandler,
  revokeRefreshToken,
  enable2FA,
  confirm2FASetup,
  disable2FA,
  loginWith2FA,
  verifyBackupCode,
  generateBackupCodes,
} = require('./auth-security');

const {
  rateLimitPresets,
  honeypotProtection,
} = require('./security-middleware');

// ==================== AUTHENTICATION ENDPOINTS ====================

/**
 * POST /api/auth/login
 * Login with email, password, and optional 2FA
 */
router.post('/auth/login',
  rateLimitPresets.auth,
  honeypotProtection('website'),
  async (req, res) => {
    try {
      const { email, password, twoFAToken, backupCode } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
      }

      const db = req.app.locals.db;

      const result = await loginWith2FA(db, email, password, twoFAToken, backupCode);

      if (!result.success) {
        return res.status(401).json(result);
      }

      // Set HTTP-only cookie for refresh token
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Log security event
      await db.query(
        `INSERT INTO security_events (event_type, user_id, ip_address, user_agent, severity, details)
         VALUES ('LOGIN_SUCCESS', $1, $2, $3, 'INFO', $4)`,
        [
          result.user.id,
          req.ip,
          req.headers['user-agent'],
          JSON.stringify({ has2FA: result.user.has2FA }),
        ]
      );

      // Check if user has completed onboarding
      const onboardingResult = await db.query(
        'SELECT onboarding_completed FROM users WHERE id = $1',
        [result.user.id]
      );
      const hasCompletedOnboarding = onboardingResult.rows[0]?.onboarding_completed || false;

      res.json({
        success: true,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        user: {
          ...result.user,
          onboardingCompleted: hasCompletedOnboarding
        },
        requiresOnboarding: !hasCompletedOnboarding
      });
    } catch (error) {
      console.error('Login error:', error);

      // Log failed login
      const db = req.app.locals.db;
      await db.query(
        `INSERT INTO failed_login_attempts (email, ip_address, reason)
         VALUES ($1, $2, $3)`,
        [req.body.email, req.ip, error.message]
      );

      await db.query(
        `INSERT INTO security_events (event_type, ip_address, user_agent, severity, details)
         VALUES ('LOGIN_FAILED', $1, $2, 'WARNING', $3)`,
        [
          req.ip,
          req.headers['user-agent'],
          JSON.stringify({ email: req.body.email, reason: error.message }),
        ]
      );

      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/auth/refresh',
  rateLimitPresets.auth,
  async (req, res) => {
    const db = req.app.locals.db;
    const handler = await refreshTokenHandler(db);
    await handler(req, res);
  }
);

/**
 * POST /api/auth/logout
 * Logout and revoke refresh token
 */
router.post('/auth/logout',
  async (req, res) => {
    try {
      const { refreshToken } = req.body;
      const cookieToken = req.cookies?.refreshToken;

      const tokenToRevoke = refreshToken || cookieToken;

      if (tokenToRevoke) {
        const db = req.app.locals.db;
        await revokeRefreshToken(db, tokenToRevoke, 'User logout');
      }

      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed',
      });
    }
  }
);

/**
 * POST /api/auth/register
 * Register new user with honeypot protection
 */
router.post('/auth/register',
  rateLimitPresets.registration,
  honeypotProtection('website'),
  async (req, res) => {
    try {
      const { email, password, fullName, phone, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
      }

      const db = req.app.locals.db;

      // Check if user exists
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'User already exists',
        });
      }

      // Hash password
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user (always as CLIENT - no stylist signup)
      const userRole = 'CLIENT';
      const result = await db.query(
        `INSERT INTO users (email, password, full_name, phone, role, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id, email, role`,
        [email, hashedPassword, fullName, phone, userRole]
      );

      const user = result.rows[0];

      // Create client profile
      await db.query(
        `INSERT INTO clients (user_id, total_bookings, average_rating, created_at, updated_at)
         VALUES ($1, 0, 0.00, NOW(), NOW())`,
        [user.id]
      );

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Log security event
      await db.query(
        `INSERT INTO security_events (event_type, user_id, ip_address, user_agent, severity, details)
         VALUES ('USER_REGISTERED', $1, $2, $3, 'INFO', $4)`,
        [user.id, req.ip, req.headers['user-agent'], JSON.stringify({ email })]
      );

      // New users always need onboarding
      res.status(201).json({
        success: true,
        accessToken,
        refreshToken,
        expiresIn: 900,
        user: {
          ...user,
          onboardingCompleted: false
        },
        requiresOnboarding: true
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed',
      });
    }
  }
);

// ==================== 2FA ENDPOINTS ====================

/**
 * POST /api/auth/2fa/setup
 * Initialize 2FA setup
 */
router.post('/auth/2fa/setup',
  rateLimitPresets.api,
  async (req, res) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const db = req.app.locals.db;
      const result = await enable2FA(db, req.user.userId);

      res.json({
        success: true,
        secret: result.secret,
        qrCode: result.qrCode,
        message: 'Scan the QR code with your authenticator app',
      });
    } catch (error) {
      console.error('2FA setup error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to setup 2FA',
      });
    }
  }
);

/**
 * POST /api/auth/2fa/verify
 * Verify and confirm 2FA setup
 */
router.post('/auth/2fa/verify',
  rateLimitPresets.api,
  async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: '2FA token is required',
        });
      }

      if (!req.user?.userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const db = req.app.locals.db;
      const result = await confirm2FASetup(db, req.user.userId, token);

      // Log security event
      await db.query(
        `INSERT INTO security_events (event_type, user_id, ip_address, severity)
         VALUES ('2FA_VERIFIED', $1, $2, 'INFO')`,
        [req.user.userId, req.ip]
      );

      res.json({
        success: true,
        backupCodes: result.backupCodes,
        message: '2FA enabled successfully. Save your backup codes in a safe place.',
      });
    } catch (error) {
      console.error('2FA verification error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * POST /api/auth/2fa/disable
 * Disable 2FA
 */
router.post('/auth/2fa/disable',
  rateLimitPresets.api,
  async (req, res) => {
    try {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          error: 'Password is required to disable 2FA',
        });
      }

      if (!req.user?.userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const db = req.app.locals.db;

      // Verify password
      const userResult = await db.query(
        'SELECT password FROM users WHERE id = $1',
        [req.user.userId]
      );

      const bcrypt = require('bcrypt');
      const isValid = await bcrypt.compare(password, userResult.rows[0].password);

      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid password',
        });
      }

      await disable2FA(db, req.user.userId, password);

      // Log security event
      await db.query(
        `INSERT INTO security_events (event_type, user_id, ip_address, severity)
         VALUES ('2FA_DISABLED', $1, $2, 'WARNING')`,
        [req.user.userId, req.ip]
      );

      res.json({
        success: true,
        message: '2FA disabled successfully',
      });
    } catch (error) {
      console.error('2FA disable error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to disable 2FA',
      });
    }
  }
);

/**
 * POST /api/auth/2fa/regenerate-backup-codes
 * Regenerate backup codes
 */
router.post('/auth/2fa/regenerate-backup-codes',
  rateLimitPresets.api,
  async (req, res) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const db = req.app.locals.db;

      // Delete old backup codes
      await db.query(
        'DELETE FROM user_2fa_backup_codes WHERE user_id = $1',
        [req.user.userId]
      );

      // Generate new backup codes
      const backupCodes = generateBackupCodes(8);
      const crypto = require('crypto');

      for (const code of backupCodes) {
        const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
        await db.query(
          'INSERT INTO user_2fa_backup_codes (user_id, code_hash, created_at) VALUES ($1, $2, NOW())',
          [req.user.userId, hashedCode]
        );
      }

      res.json({
        success: true,
        backupCodes,
        message: 'New backup codes generated',
      });
    } catch (error) {
      console.error('Backup code regeneration error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to regenerate backup codes',
      });
    }
  }
);

// ==================== ADMIN SECURITY ENDPOINTS ====================

/**
 * GET /api/admin/audit-logs
 * Get audit logs (ADMIN/SUPERADMIN only)
 */
router.get('/admin/audit-logs',
  rateLimitPresets.api,
  async (req, res) => {
    try {
      if (!req.user || !['ADMIN', 'SUPERADMIN'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
      }

      const db = req.app.locals.db;
      const { limit = 100, offset = 0, userId, action, resourceType } = req.query;

      let query = 'SELECT * FROM audit_logs WHERE 1=1';
      const params = [];

      if (userId) {
        params.push(userId);
        query += ` AND user_id = $${params.length}`;
      }

      if (action) {
        params.push(action);
        query += ` AND action = $${params.length}`;
      }

      if (resourceType) {
        params.push(resourceType);
        query += ` AND resource_type = $${params.length}`;
      }

      params.push(limit, offset);
      query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

      const result = await db.query(query, params);

      res.json({
        success: true,
        logs: result.rows,
        count: result.rows.length,
      });
    } catch (error) {
      console.error('Audit logs error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch audit logs',
      });
    }
  }
);

/**
 * GET /api/admin/security-events
 * Get security events (SUPERADMIN only)
 */
router.get('/admin/security-events',
  rateLimitPresets.api,
  async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'SUPERADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Superadmin access required',
        });
      }

      const db = req.app.locals.db;
      const { severity, eventType, limit = 100 } = req.query;

      let query = 'SELECT * FROM recent_security_events WHERE 1=1';
      const params = [];

      if (severity) {
        params.push(severity);
        query += ` AND severity = $${params.length}`;
      }

      if (eventType) {
        params.push(eventType);
        query += ` AND event_type = $${params.length}`;
      }

      params.push(limit);
      query += ` LIMIT $${params.length}`;

      const result = await db.query(query, params);

      res.json({
        success: true,
        events: result.rows,
      });
    } catch (error) {
      console.error('Security events error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch security events',
      });
    }
  }
);
// ==================== PHONE VERIFICATION ENDPOINTS ====================

/**
 * POST /api/auth/send-phone-verification
 * Send SMS verification code for phone number verification
 */
router.post('/auth/send-phone-verification',
  rateLimitPresets.api,
  async (req, res) => {
    try {
      const { phone, email } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
      }

      console.log('[PHONE_VERIFICATION] Send code request:', { phone, email });

      // Validate E.164 format
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      if (!e164Regex.test(phone)) {
        console.log('[PHONE_VERIFICATION] Invalid phone format:', phone);
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format. Use E.164 format: +1234567890'
        });
      }

      // Generate 6-digit code
      const crypto = require('crypto');
      const verificationCode = crypto.randomInt(100000, 999999).toString();

      // Store in database with 10-minute expiration
      const { query } = require('../db');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await query(`
        INSERT INTO verification_codes (phone, code, expires_at, created_at, email)
        VALUES ($1, $2, $3, NOW(), $4)
        ON CONFLICT (phone)
        DO UPDATE SET code = $2, expires_at = $3, created_at = NOW(), email = $4
      `, [phone, verificationCode, expiresAt, email]);

      // Send SMS with Web OTP format for auto-fill
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

      // Web OTP format: @domain #code
      const message = `Your BeautyCita verification code is: ${verificationCode}\n\n@beautycita.com #${verificationCode}`;


      // Use Messaging Service SID for better reliability (automatically selects from pool)
      const messageParams = {
        body: message,
        to: phone
      };

      // Use Messaging Service SID if available, otherwise use from number
      if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
        messageParams.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
      } else {
        messageParams.from = process.env.TWILIO_PHONE_NUMBER;
      }

      await client.messages.create(messageParams);

      res.json({
        success: true,
        message: 'Verification code sent via SMS'
      });

    } catch (error) {
      console.error('[PHONE_VERIFICATION] Send SMS error:', error);

      if (error.code === 21211) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number'
        });
      }

      if (error.code === 21614) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please wait before requesting another code.'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to send verification code',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * POST /api/auth/verify-phone
 * Verify phone number with SMS code
 */
router.post('/auth/verify-phone',
  rateLimitPresets.api,
  async (req, res) => {
    try {
      const { phone, code, email } = req.body;

      if (!phone || !code) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and verification code are required'
        });
      }

      // Validate code format (6 digits)
      if (!/^\d{6}$/.test(code)) {
        return res.status(400).json({
          success: false,
          message: 'Verification code must be 6 digits'
        });
      }

      console.log('[PHONE_VERIFICATION] Verify code request:', { phone, email });

      // Check code against database
      const { query } = require('../db');
      const result = await query(`
        SELECT code, expires_at
        FROM verification_codes
        WHERE phone = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [phone]);

      if (result.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No verification code found for this number'
        });
      }

      const storedCode = result.rows[0].code;
      const expiresAt = new Date(result.rows[0].expires_at);

      // Check if code has expired
      if (new Date() > expiresAt) {
        return res.status(400).json({
          success: false,
          message: 'Verification code has expired'
        });
      }

      // Check if code matches
      if (code !== storedCode) {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification code'
        });
      }

      // Code is valid - delete it so it can't be reused
      await query('DELETE FROM verification_codes WHERE phone = $1', [phone]);

      // Update user's phone and phone_verified status if email is provided
      if (email) {
        await query(`
          UPDATE users
          SET phone = $1, phone_verified = true, updated_at = NOW()
          WHERE email = $2
        `, [phone, email]);

        console.log('[PHONE_VERIFICATION] User phone verified:', { email, phone });
      }

      // Log security event
      const db = req.app.locals.db;
      if (email && db) {
        const userResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userResult.rows.length > 0) {
          await db.query(
            `INSERT INTO security_events (event_type, user_id, ip_address, user_agent, severity, details)
             VALUES ('PHONE_VERIFIED', $1, $2, $3, 'INFO', $4)`,
            [userResult.rows[0].id, req.ip, req.headers['user-agent'], JSON.stringify({ phone })]
          );
        }
      }

      res.json({
        success: true,
        message: 'Phone number verified successfully'
      });

    } catch (error) {
      console.error('[PHONE_VERIFICATION] Verify code error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify code',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router;
