const express = require('express');
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const winston = require('winston');
const { createSession } = require('../middleware/sessionAuth');

// Username generation from email
async function generateUsernameFromEmail(email) {
  // Extract part before @ and clean it
  const baseUsername = email.split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_') // Replace non-alphanumeric with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

  // Check if username is available
  const existingUser = await query('SELECT id FROM users WHERE username = $1', [baseUsername]);

  if (existingUser.rows.length === 0) {
    return baseUsername;
  }

  // If taken, append numbers until we find available one
  let counter = 1;
  let username = `${baseUsername}${counter}`;

  while (counter < 1000) { // Safety limit
    const check = await query('SELECT id FROM users WHERE username = $1', [username]);
    if (check.rows.length === 0) {
      return username;
    }
    counter++;
    username = `${baseUsername}${counter}`;
  }

  // Fallback to random suffix
  const randomSuffix = Math.floor(Math.random() * 10000);
  return `${baseUsername}_${randomSuffix}`;
}

const router = express.Router();

// Initialize logger
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'beautycita-google-auth' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: '/var/www/beautycita.com/backend/logs/auth.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// OAuth2 client configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

// Scopes for Google OAuth
const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

/**
 * Google One Tap Sign-In (JWT verification)
 * POST /api/auth/google/one-tap
 * Body: { credential: 'JWT_TOKEN', role: 'client|stylist' }
 */
router.post('/google/one-tap', async (req, res) => {
  const { OAuth2Client } = require('google-auth-library');
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  try {
    const { credential, role = 'client' } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Missing credential' });
    }

    // Verify the Google JWT token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const userRole = role.toUpperCase() === 'STYLIST' ? 'STYLIST' : 'CLIENT';

    logger.info('Google One Tap credential verified', {
      email: payload.email,
      role: userRole,
      sub: payload.sub
    });

    // Check if user exists
    let user;
    const existingUser = await query(
      'SELECT * FROM users WHERE provider_id = $1 AND provider = $2',
      [payload.sub, 'google']
    );

    if (existingUser.rows.length > 0) {
      user = existingUser.rows[0];
      logger.info('Existing Google One Tap user found', {
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // Update last login
      await query(
        'UPDATE users SET last_login_at = NOW() WHERE id = $1',
        [user.id]
      );
    } else {
      // Create new user
      logger.info('Creating new Google One Tap user', {
        email: payload.email,
        name: payload.name,
        role: userRole
      });

      const autoUsername = await generateUsernameFromEmail(payload.email);

      const newUserResult = await query(`
        INSERT INTO users (
          email, name, first_name, last_name, profile_picture_url, username,
          role, provider, provider_id, email_verified, is_active, user_status,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *
      `, [
        payload.email,
        payload.name || payload.email.split('@')[0],
        payload.given_name || '',
        payload.family_name || '',
        payload.picture || null,
        autoUsername,
        userRole,
        'google',
        payload.sub,
        payload.email_verified || true,
        true,
        userRole === 'STYLIST' ? 'PENDING_ONBOARDING' : null
      ]);

      user = newUserResult.rows[0];

      // Create role-specific profile
      if (userRole === 'CLIENT') {
        await query(`
          INSERT INTO clients (user_id, total_bookings, average_rating, created_at, updated_at)
          VALUES ($1, 0, 0.00, NOW(), NOW())
        `, [user.id]);
      } else if (userRole === 'STYLIST') {
        await query(`
          INSERT INTO stylists (
            user_id, business_name, bio, specialties, experience_years,
            location_address, location_city, location_state, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        `, [
          user.id,
          payload.name || 'My Business',
          '',
          [],
          0,
          'Address to be updated',
          'City to be updated',
          ''
        ]);
      }
    }

    // Track successful login
    const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    await query(`
      INSERT INTO login_history (user_id, login_method, ip_address, user_agent, success, created_at)
      VALUES ($1, $2, $3, $4, true, NOW())
    `, [user.id, 'GOOGLE_ONE_TAP', ipAddress, userAgent]);

    // Create session
    await createSession(req, user);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET || 'beautycita-secret',
      { expiresIn: '7d' }
    );

    logger.info('Google One Tap authentication successful', {
      userId: user.id,
      sessionId: req.sessionID
    });

    // Check if user has completed onboarding
    const hasCompletedOnboarding = user.onboarding_completed || false;

    // Return success with token and user data
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phoneVerified: user.phone_verified,
        profilePicture: user.profile_picture_url,
        onboardingCompleted: hasCompletedOnboarding
      },
      requiresOnboarding: !hasCompletedOnboarding
    });

  } catch (error) {
    logger.error('Google One Tap verification error', {
      error: error.message,
      stack: error.stack
    });
    res.status(401).json({ error: 'Invalid credential' });
  }
});

/**
 * Initiate Google OAuth flow
 * GET /api/auth/google?role=client|stylist
 */
router.get('/google', (req, res) => {
  try {
    const role = req.query.role || 'client';

    logger.info('Google OAuth initiated', {
      role: role.toUpperCase(),
      ip: req.ip
    });

    // Generate auth URL with state parameter containing role
    const state = Buffer.from(JSON.stringify({
      role: role.toUpperCase() === 'STYLIST' ? 'STYLIST' : 'CLIENT',
      timestamp: Date.now()
    })).toString('base64');

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state: state,
      prompt: 'consent'
    });

    res.redirect(authUrl);
  } catch (error) {
    logger.error('Google OAuth initiation error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_init_failed`);
  }
});

/**
 * Handle Google OAuth callback
 * GET /api/auth/google/callback
 */
router.get('/google/callback', async (req, res) => {
  const callbackStartTime = Date.now();

  try {
    const { code, state, error } = req.query;

    // Handle OAuth errors
    if (error) {
      logger.error('Google OAuth callback error', { error });
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=access_denied`);
    }

    if (!code) {
      logger.error('Google OAuth callback - no code provided');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
    }

    // Decode state parameter to get role
    let userRole = 'CLIENT';
    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        userRole = stateData.role || 'CLIENT';
      } catch (e) {
        logger.warn('Failed to decode state parameter', { error: e.message });
      }
    }

    logger.info('Google OAuth callback received', {
      hasCode: !!code,
      role: userRole
    });

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    logger.info('Google tokens received', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token
    });

    // Get user info from Google
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    });

    const userInfo = await oauth2.userinfo.get();
    const profile = userInfo.data;

    logger.info('Google profile fetched', {
      email: profile.email,
      verified: profile.verified_email,
      hasId: !!profile.id
    });

    // Validate profile data
    if (!profile.email) {
      logger.error('No email in Google profile');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_email`);
    }

    if (!profile.id) {
      logger.error('No ID in Google profile');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_id`);
    }

    // Check if user exists
    let user;
    const existingUser = await query(
      'SELECT * FROM users WHERE provider_id = $1 AND provider = $2',
      [profile.id, 'google']
    );

    if (existingUser.rows.length > 0) {
      user = existingUser.rows[0];
      logger.info('Existing Google user found', {
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // Update last login
      await query(
        'UPDATE users SET last_login_at = NOW() WHERE id = $1',
        [user.id]
      );
    } else {
      // Create new user
      logger.info('Creating new Google user', {
        email: profile.email,
        name: profile.name,
        role: userRole
      });

      // Generate unique username from email
      const autoUsername = await generateUsernameFromEmail(profile.email);
      logger.info('Generated username for Google user', { username: autoUsername });

      const newUserResult = await query(`
        INSERT INTO users (
          email, name, first_name, last_name, profile_picture_url, username,
          role, provider, provider_id, email_verified, is_active, user_status,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *
      `, [
        profile.email,
        profile.name || profile.email.split('@')[0],
        profile.given_name || '',
        profile.family_name || '',
        profile.picture || null,
        autoUsername,
        userRole,
        'google',
        profile.id,
        profile.verified_email || true,
        true,
        userRole === 'STYLIST' ? 'PENDING_ONBOARDING' : null
      ]);

      user = newUserResult.rows[0];

      // Create role-specific profile
      if (userRole === 'CLIENT') {
        await query(`
          INSERT INTO clients (user_id, total_bookings, average_rating, created_at, updated_at)
          VALUES ($1, 0, 0.00, NOW(), NOW())
        `, [user.id]);

        logger.info('Client profile created', { userId: user.id });
      } else if (userRole === 'STYLIST') {
        await query(`
          INSERT INTO stylists (
            user_id, business_name, bio, specialties, experience_years,
            location_address, location_city, location_state, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        `, [
          user.id,
          profile.name || 'My Business',
          '',
          [],
          0,
          'Address to be updated',
          'City to be updated',
          ''
        ]);

        logger.info('Stylist profile created', { userId: user.id });
      }

      logger.info('New Google user created', {
        userId: user.id,
        email: user.email,
        role: user.role,
        executionTime: Date.now() - callbackStartTime
      });
    }

    // Track successful login in login history
    const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    await query(`
      INSERT INTO login_history (user_id, login_method, ip_address, user_agent, success, created_at)
      VALUES ($1, $2, $3, $4, true, NOW())
    `, [user.id, 'GOOGLE_OAUTH', ipAddress, userAgent]);

    // Create session for the user
    await createSession(req, user);

    // Generate JWT token for legacy/mobile support
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET || 'beautycita-secret',
      { expiresIn: '7d' }
    );

    logger.info('Session and JWT token generated for Google user', {
      userId: user.id,
      sessionId: req.sessionID,
      executionTime: Date.now() - callbackStartTime
    });

    // Check if user has completed onboarding
    const hasCompletedOnboarding = user.onboarding_completed || false;

    if (!hasCompletedOnboarding) {
      // Redirect to client onboarding
      return res.redirect(
        `${process.env.FRONTEND_URL}/onboarding/client?token=${token}`
      );
    }

    // Redirect to panel (session cookie will be sent automatically)
    // Include token for backward compatibility
    res.redirect(
      `${process.env.FRONTEND_URL}/panel?token=${token}`
    );

  } catch (error) {
    logger.error('Google OAuth callback error', {
      error: error.message,
      stack: error.stack,
      executionTime: Date.now() - callbackStartTime
    });
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
});

/**
 * Mobile Google Sign-In - Verify ID token
 * POST /api/auth/google/mobile
 * Body: { idToken: string, role?: 'CLIENT' | 'STYLIST' }
 */
router.post('/google/mobile', async (req, res) => {
  try {
    const { idToken, role } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'ID token is required'
      });
    }

    logger.info('Mobile Google Sign-In initiated', { role });

    // Verify the ID token
    const ticket = await oauth2Client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, email_verified, name, picture, sub: googleId } = payload;

    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email not verified by Google'
      });
    }

    logger.info('Google ID token verified', { email });

    // Check if user exists
    const existingUser = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    let user;
    let isNewUser = false;

    if (existingUser.rows.length > 0) {
      // Existing user - update Google ID if not set
      user = existingUser.rows[0];

      if (!user.google_id) {
        await query(
          'UPDATE users SET google_id = $1, google_picture = $2 WHERE id = $3',
          [googleId, picture, user.id]
        );
      }

      logger.info('Existing Google user logged in', { userId: user.id });
    } else {
      // New user - create account
      isNewUser = true;
      const userRole = (role && role.toUpperCase() === 'STYLIST') ? 'STYLIST' : 'CLIENT';

      // Split name
      const nameParts = (name || email.split('@')[0]).split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Generate username
      const username = await generateUsernameFromEmail(email);

      const result = await query(
        `INSERT INTO users
        (email, first_name, last_name, username, role, google_id, google_picture, email_verified, email_verified_at, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), true)
        RETURNING *`,
        [email, firstName, lastName, username, userRole, googleId, picture]
      );

      user = result.rows[0];
      logger.info('New Google user created', { userId: user.id, role: userRole });

      // Create stylist record if role is STYLIST
      if (userRole === 'STYLIST') {
        await query(
          'INSERT INTO stylists (user_id) VALUES ($1)',
          [user.id]
        );
        logger.info('Stylist record created', { userId: user.id });
      } else {
        // Create client record
        await query(
          'INSERT INTO clients (user_id) VALUES ($1)',
          [user.id]
        );
        logger.info('Client record created', { userId: user.id });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create session
    await createSession(user.id, req);

    logger.info('JWT token generated for Google mobile user', {
      userId: user.id,
      isNewUser
    });

    // Return success with token and user data
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        phoneVerified: user.phone_verified,
        picture: user.google_picture
      },
      isNewUser,
      requiresPhoneVerification: !user.phone_verified
    });

  } catch (error) {
    logger.error('Mobile Google Sign-In error', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Google Sign-In failed',
      error: error.message
    });
  }
});

module.exports = router;
