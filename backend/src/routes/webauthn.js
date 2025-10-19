const express = require('express');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const { query } = require('../db');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const { validateAuth } = require('../middleware/sessionAuth');
const { createSession } = require('../middleware/sessionAuth');

const router = express.Router();

// Initialize logger
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'beautycita-webauthn' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: '/var/www/beautycita.com/backend/logs/webauthn.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Relying Party configuration
const rpName = 'BeautyCita';
const rpID = process.env.WEBAUTHN_RP_ID || 'beautycita.com';
const origin = process.env.WEBAUTHN_ORIGIN || 'https://beautycita.com';

logger.info('WebAuthn configuration', { rpName, rpID, origin });

/**
 * Helper: Generate unique challenge
 */
function generateChallenge() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Helper: Generate unique business name
 * If businessName is provided and unique, use it
 * If businessName is empty, use firstName
 * If duplicate, append number like firstName2, firstName3, etc.
 */
async function generateUniqueBusinessName(businessName, firstName) {
  // Use businessName if provided, otherwise use firstName
  let baseName = businessName && businessName.trim() ? businessName.trim() : firstName.trim();

  // Check if base name is available
  const existing = await query('SELECT business_name FROM stylists WHERE LOWER(business_name) = LOWER($1)', [baseName]);

  if (existing.rows.length === 0) {
    return baseName;
  }

  // Name is taken, find next available number
  let counter = 2;
  let uniqueName = `${baseName}${counter}`;

  while (true) {
    const check = await query('SELECT business_name FROM stylists WHERE LOWER(business_name) = LOWER($1)', [uniqueName]);

    if (check.rows.length === 0) {
      return uniqueName;
    }

    counter++;
    uniqueName = `${baseName}${counter}`;

    // Safety limit
    if (counter > 1000) {
      return `${baseName}${Date.now()}`;
    }
  }
}

/**
 * Helper: Generate username from email
 */
async function generateUsernameFromEmail(email) {
  const baseUsername = email.split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');

  const existingUser = await query('SELECT id FROM users WHERE username = $1', [baseUsername]);

  if (existingUser.rows.length === 0) {
    return baseUsername;
  }

  let counter = 1;
  let username = `${baseUsername}${counter}`;

  while (counter < 1000) {
    const check = await query('SELECT id FROM users WHERE username = $1', [username]);
    if (check.rows.length === 0) {
      return username;
    }
    counter++;
    username = `${baseUsername}${counter}`;
  }

  const randomSuffix = Math.floor(Math.random() * 10000);
  return `${baseUsername}_${randomSuffix}`;
}

/**
 * Helper: Generate username from phone
 */
async function generateUsernameFromPhone(phone) {
  const phoneDigits = phone.replace(/\D/g, '');
  const last4 = phoneDigits.slice(-4);
  let autoUsername = `user_${last4}`;

  const usernameCheck = await query('SELECT id FROM users WHERE username = $1', [autoUsername]);
  if (usernameCheck.rows.length === 0) {
    return autoUsername;
  }

  const randomSuffix = Math.floor(Math.random() * 1000);
  return `user_${last4}_${randomSuffix}`;
}

/**
 * Helper: Store challenge in database
 */
async function storeChallenge(userId, phone, challenge, type) {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  const result = await query(`
    INSERT INTO webauthn_challenges (user_id, phone, challenge, type, expires_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [userId, phone, challenge, type, expiresAt]);

  return result.rows[0];
}

/**
 * Helper: Verify and consume challenge
 */
async function verifyAndConsumeChallenge(challenge, type) {
  const result = await query(`
    DELETE FROM webauthn_challenges
    WHERE challenge = $1
      AND type = $2
      AND expires_at > NOW()
    RETURNING *
  `, [challenge, type]);

  if (result.rows.length === 0) {
    throw new Error('Challenge expired or invalid');
  }

  return result.rows[0];
}

/**
 * Helper: Verify and consume challenge by phone
 */
async function verifyAndConsumeChallengeByPhone(phone, type) {
  const result = await query(`
    DELETE FROM webauthn_challenges
    WHERE id = (
      SELECT id
      FROM webauthn_challenges
      WHERE phone = $1
        AND type = $2
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    )
    RETURNING *
  `, [phone, type]);

  if (result.rows.length === 0) {
    throw new Error('Challenge expired or invalid');
  }

  return result.rows[0];
}

/**
 * Helper: Verify and consume most recent discoverable authentication challenge
 */
async function verifyAndConsumeDiscoverableChallenge() {
  const result = await query(`
    DELETE FROM webauthn_challenges
    WHERE id = (
      SELECT id
      FROM webauthn_challenges
      WHERE phone = 'discoverable'
        AND type = 'authentication'
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    )
    RETURNING *
  `);

  if (result.rows.length === 0) {
    throw new Error('Challenge expired or invalid');
  }

  return result.rows[0];
}

/**
 * POST /api/webauthn/register/options
 * Generate registration options for creating a new passkey
 * No JWT required - this is for NEW user registration
 */
router.post('/register/options', async (req, res) => {
  try {
    const { phone, role } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    logger.info('Registration options requested', { phone, role });

    // Check if user already exists with this phone
    let user = await query('SELECT * FROM users WHERE phone = $1', [phone]);

    // If user exists, get their existing credentials
    let existingCredentials = [];
    if (user.rows.length > 0) {
      const userId = user.rows[0].id;
      const credentials = await query(
        'SELECT credential_id FROM webauthn_credentials WHERE user_id = $1',
        [userId]
      );
      existingCredentials = credentials.rows.map(c => ({
        id: c.credential_id,
        type: 'public-key'
      }));
    }

    // Generate registration options
    // Convert phone to Uint8Array for userID (required by SimpleWebAuthn v10+)
    const userIDBuffer = Buffer.from(phone, 'utf-8');

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: userIDBuffer,
      userName: phone,
      userDisplayName: user.rows.length > 0 ? user.rows[0].name : phone,
      // Don't require attestation in production (better UX)
      attestationType: 'none',
      // Exclude already registered credentials
      excludeCredentials: existingCredentials,
      authenticatorSelection: {
        // REQUIRE platform authenticators (Face ID, Touch ID, Windows Hello)
        // This forces device-specific biometric, not synced passkeys
        authenticatorAttachment: 'platform',
        // REQUIRE user verification (biometric/PIN) - not optional
        userVerification: 'required',
        // Require discoverable credential (forces device-specific)
        residentKey: 'required',
        // Prevent cross-device credentials
        requireResidentKey: true,
      },
    });

    // Store challenge for verification
    const userId = user.rows.length > 0 ? user.rows[0].id : null;
    await storeChallenge(userId, phone, options.challenge, 'registration');

    logger.info('Registration options generated', {
      phone,
      challenge: options.challenge.substring(0, 10) + '...'
    });

    res.json({
      success: true,
      options
    });

  } catch (error) {
    logger.error('Registration options error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to generate registration options',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/webauthn/register/verify
 * Verify registration response and create user account + credential
 */
router.post('/register/verify', async (req, res) => {
  try {
    const {
      phone,
      credential,
      deviceName,
      role = 'CLIENT',
      firstName,
      lastName,
      email,
      businessName,
      verificationCode
    } = req.body;

    if (!phone || !credential) {
      return res.status(400).json({
        success: false,
        message: 'Phone and credential are required'
      });
    }

    if (!firstName) {
      return res.status(400).json({
        success: false,
        message: 'First name is required'
      });
    }

    // Last name only required for clients
    if (role === 'CLIENT' && !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Last name is required for clients'
      });
    }

    logger.info('Registration verification started', { phone, deviceName, role, email });

    // Verify the challenge by phone (most recent challenge for this phone)
    const challengeRecord = await verifyAndConsumeChallengeByPhone(
      phone,
      'registration'
    );

    logger.info('Challenge verified', { phone });

    // Verify the registration response
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified) {
      logger.warn('Registration verification failed', { phone });
      return res.status(400).json({
        success: false,
        message: 'Passkey verification failed'
      });
    }

    logger.info('Passkey verified successfully', { phone });

    const { registrationInfo } = verification;

    // Begin transaction
    await query('BEGIN');

    try {
      // Create or get user
      let user;
      const existingUser = await query('SELECT * FROM users WHERE phone = $1', [phone]);

      if (existingUser.rows.length > 0) {
        // User exists - just add the credential
        user = existingUser.rows[0];
        logger.info('Adding passkey to existing user', { userId: user.id, phone });
      } else {
        // Create new user with webauthn provider
        logger.info('Creating new user with webauthn', { phone, role, email });

        // Check if email already exists
        if (email) {
          const emailCheck = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
          if (emailCheck.rows.length > 0) {
            await query('ROLLBACK');
            return res.status(400).json({
              success: false,
              message: 'Email already registered'
            });
          }
        }

        // For stylists: lastName is optional, use firstName as fullName if not provided
        // For clients: lastName is required (validated earlier)
        const fullName = role === 'STYLIST' && !lastName ? firstName : `${firstName} ${lastName || ''}`.trim();

        // Generate username from email or phone
        const autoUsername = email
          ? await generateUsernameFromEmail(email)
          : await generateUsernameFromPhone(phone);

        const newUser = await query(`
          INSERT INTO users (
            phone, name, first_name, last_name, email, username, role, provider, provider_id,
            email_verified, phone_verified, is_active, user_status, tos_accepted,
            created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'webauthn', $8, $9, true, true, $10, true, NOW(), NOW())
          RETURNING *
        `, [
          phone,
          fullName,
          firstName,
          lastName || null,
          email ? email.toLowerCase().trim() : null,
          autoUsername,
          role,
          phone,
          email ? false : null,  // email_verified - false if email provided, null otherwise
          role === 'STYLIST' ? 'PENDING_ONBOARDING' : null
        ]);

        user = newUser.rows[0];

        // Create role-specific profile
        if (role === 'CLIENT') {
          await query(`
            INSERT INTO clients (user_id, total_bookings, average_rating, created_at, updated_at)
            VALUES ($1, 0, 0.00, NOW(), NOW())
          `, [user.id]);

          logger.info('Client profile created', { userId: user.id });
        } else if (role === 'STYLIST') {
          // Generate unique business name
          const uniqueBusinessName = await generateUniqueBusinessName(businessName, firstName);

          await query(`
            INSERT INTO stylists (
              user_id, business_name, bio, specialties, experience_years,
              location_address, location_city, location_state, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, 0, 'Address to be updated', 'City to be updated', '', NOW(), NOW())
          `, [user.id, uniqueBusinessName, '', []]);

          logger.info('Stylist profile created', { userId: user.id, businessName: uniqueBusinessName });
        }

        // Create SMS preferences
        await query(`
          INSERT INTO sms_preferences (user_id, created_at, updated_at)
          VALUES ($1, NOW(), NOW())
        `, [user.id]);

        // Create user credits
        await query(`
          INSERT INTO user_credits (user_id, balance_cents, updated_at)
          VALUES ($1, 0, NOW())
        `, [user.id]);

        logger.info('New user created with webauthn', { userId: user.id, phone, role });
      }

      // Store the credential (SimpleWebAuthn v13 structure)
      const { credential: credentialData } = registrationInfo;

      await query(`
        INSERT INTO webauthn_credentials (
          user_id, credential_id, public_key, counter,
          aaguid, device_name, transports,
          attestation_format, attested_credential_data,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      `, [
        user.id,
        credentialData.id, // Already base64url string in v13
        Buffer.from(credentialData.publicKey).toString('base64url'),
        credentialData.counter,
        registrationInfo.aaguid ? Buffer.from(registrationInfo.aaguid).toString('hex') : null,
        deviceName || 'Unnamed Device',
        credentialData.transports || [],
        registrationInfo.attestationFormat || 'none',
        null // attestation object not needed for storage
      ]);

      await query('COMMIT');

      logger.info('Passkey registered successfully', {
        userId: user.id,
        phone,
        deviceName
      });

      // Create session for the user
      await createSession(req, user);

      // Also generate JWT for backward compatibility (mobile apps, etc.)
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          name: user.name,
          firstName: user.first_name,
          lastName: user.last_name
        },
        process.env.JWT_SECRET || 'beautycita-secret',
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Passkey registered successfully',
        token, // Legacy support
        sessionId: req.sessionID,
        user: {
          id: user.id,
          name: user.name,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          provider: 'webauthn',
          profilePictureUrl: user.profile_picture_url
        }
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    logger.error('Registration verification error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to verify registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/webauthn/register/verify-minimal
 * Minimal registration - only phone + biometric, profile completed later
 */
router.post('/register/verify-minimal', async (req, res) => {
  try {
    const {
      phone,
      credential,
      deviceName,
      role = 'CLIENT',
      verificationCode
    } = req.body;

    if (!phone || !credential) {
      return res.status(400).json({
        success: false,
        message: 'Phone and credential are required'
      });
    }

    logger.info('Minimal registration verification started', { phone, deviceName, role });

    // Verify the challenge by phone (most recent challenge for this phone)
    const challengeRecord = await verifyAndConsumeChallengeByPhone(
      phone,
      'registration'
    );

    logger.info('Challenge verified for minimal registration', { phone });

    // Verify the registration response
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });

    if (!verification.verified) {
      return res.status(400).json({
        success: false,
        message: 'Passkey verification failed'
      });
    }

    const { registrationInfo } = verification;
    logger.info('Passkey verified for minimal registration', { phone });

    // Start database transaction
    try {
      await query('BEGIN');

      let user;
      const existingUser = await query('SELECT * FROM users WHERE phone = $1', [phone]);

      if (existingUser.rows.length > 0) {
        // User already exists - just add the biometric credential
        user = existingUser.rows[0];
        logger.info('Adding biometric to existing user', { userId: user.id, phone });
      } else {
        // Create minimal user - profile to be completed later
        // Generate auto-username from phone
        const autoUsername = await generateUsernameFromPhone(phone);

        const result = await query(`
          INSERT INTO users (
            name, first_name, last_name, email, phone, username, role,
            email_verified, phone_verified, provider, profile_complete,
            created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, false, true, 'webauthn', false, NOW(), NOW())
          RETURNING *
        `, [
          `User ${phone}`, // Temporary name
          'User', // Temporary first name
          phone.slice(-4), // Temporary last name (last 4 digits of phone)
          `temp_${phone}@beautycita.temp`, // Temporary email
          phone,
          autoUsername,
          role
        ]);

        user = result.rows[0];

        // Create role-specific profile
        if (role === 'CLIENT') {
          await query(`
            INSERT INTO clients (user_id, total_bookings, average_rating, created_at, updated_at)
            VALUES ($1, 0, 0.00, NOW(), NOW())
          `, [user.id]);

          logger.info('Client profile created (minimal)', { userId: user.id });
        } else if (role === 'STYLIST') {
          const tempBusinessName = `Stylist${phone.slice(-4)}`;

          await query(`
            INSERT INTO stylists (
              user_id, business_name, bio, specialties, experience_years,
              location_address, location_city, location_state, created_at, updated_at
            )
            VALUES ($1, $2, '', $3, 0, 'To be updated', 'To be updated', '', NOW(), NOW())
          `, [user.id, tempBusinessName, []]);

          logger.info('Stylist profile created (minimal)', { userId: user.id, businessName: tempBusinessName });
        }

        // Create SMS preferences (NEW USERS ONLY)
        await query(`
          INSERT INTO sms_preferences (user_id, created_at, updated_at)
          VALUES ($1, NOW(), NOW())
        `, [user.id]);

        // Create user credits (NEW USERS ONLY)
        await query(`
          INSERT INTO user_credits (user_id, balance_cents, updated_at)
          VALUES ($1, 0, NOW())
        `, [user.id]);
      }

      // Store the credential (SimpleWebAuthn v13 structure)
      const { credential: credentialData } = registrationInfo;

      await query(`
        INSERT INTO webauthn_credentials (
          user_id, credential_id, public_key, counter,
          aaguid, device_name, transports,
          attestation_format, attested_credential_data,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      `, [
        user.id,
        credentialData.id, // Already base64url string in v13
        Buffer.from(credentialData.publicKey).toString('base64url'),
        credentialData.counter,
        registrationInfo.aaguid ? Buffer.from(registrationInfo.aaguid).toString('hex') : null,
        deviceName || 'Unnamed Device',
        credentialData.transports || [],
        registrationInfo.attestationFormat || 'none',
        null // attestation object not needed for storage
      ]);

      await query('COMMIT');

      logger.info('Passkey registered successfully (minimal)', {
        userId: user.id,
        phone,
        deviceName
      });

      // Create session for the user
      await createSession(req, user);

      // Also generate JWT for backward compatibility
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          name: user.name,
          firstName: user.first_name,
          lastName: user.last_name,
          profileComplete: false
        },
        process.env.JWT_SECRET || 'beautycita-secret',
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Minimal registration successful - complete your profile',
        token, // Legacy support
        sessionId: req.sessionID,
        user: {
          id: user.id,
          name: user.name,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          provider: 'webauthn',
          profileComplete: false
        }
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    logger.error('Minimal registration verification error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to verify minimal registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/webauthn/login/options
 * Generate authentication options for logging in with passkey
 * Supports discoverable credentials (no phone required)
 */
router.post('/login/options', async (req, res) => {
  try {
    const { phone, role } = req.body;

    logger.info('Authentication options requested', { phone: phone || 'discoverable', role });

    // Generate authentication options for discoverable credentials
    // Empty allowCredentials allows any registered credential on this device
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: [], // Empty = allow discoverable credentials
      userVerification: 'required', // Require biometric verification
    });

    // Store challenge without user_id (will be retrieved from credential)
    await query(`
      INSERT INTO webauthn_challenges (user_id, phone, challenge, type, expires_at)
      VALUES (NULL, $1, $2, 'authentication', $3)
      RETURNING id
    `, [
      phone || 'discoverable',
      options.challenge,
      new Date(Date.now() + 5 * 60 * 1000)
    ]);

    logger.info('Authentication options generated (discoverable)', {
      challenge: options.challenge.substring(0, 10) + '...'
    });

    res.json({
      success: true,
      options
    });

  } catch (error) {
    logger.error('Authentication options error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to generate authentication options',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/webauthn/login/verify
 * Verify authentication response and log user in
 * Supports discoverable credentials (no phone required)
 */
router.post('/login/verify', async (req, res) => {
  try {
    const { assertion, role } = req.body;

    if (!assertion) {
      return res.status(400).json({
        success: false,
        message: 'Credential assertion is required'
      });
    }

    logger.info('Authentication verification started (discoverable)', { role });
    logger.debug('Assertion received:', JSON.stringify(assertion, null, 2));
    logger.debug('Assertion.id:', assertion.id);
    logger.debug('Assertion.rawId:', assertion.rawId);

    // Extract credential ID from assertion
    // In SimpleWebAuthn v13, both .id and .rawId are already base64url strings
    const credentialID = assertion.id || assertion.rawId;
    logger.debug('Extracted credentialID:', credentialID);

    // Look up credential (and user) by credential ID
    const storedCredential = await query(
      'SELECT wc.*, u.* FROM webauthn_credentials wc JOIN users u ON wc.user_id = u.id WHERE wc.credential_id = $1',
      [credentialID]
    );

    if (storedCredential.rows.length === 0) {
      logger.warn('Credential not found', { credentialID });
      return res.status(400).json({
        success: false,
        message: 'Passkey not found. Please register first.'
      });
    }

    const dbCredential = storedCredential.rows[0];
    const user = {
      id: dbCredential.user_id,
      name: dbCredential.name,
      first_name: dbCredential.first_name,
      last_name: dbCredential.last_name,
      email: dbCredential.email,
      phone: dbCredential.phone,
      role: dbCredential.role,
      provider: dbCredential.provider
    };

    // Verify challenge (use discoverable challenge lookup)
    const challengeRecord = await verifyAndConsumeDiscoverableChallenge();

    // Verify authentication response (SimpleWebAuthn v13 API)
    const verification = await verifyAuthenticationResponse({
      response: assertion,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: dbCredential.credential_id, // Already base64url string in v13
        publicKey: Buffer.from(dbCredential.public_key, 'base64url'),
        counter: parseInt(dbCredential.counter),
        transports: dbCredential.transports || []
      }
    });

    if (!verification.verified) {
      logger.warn('Authentication verification failed', { userId: user.id });
      return res.status(400).json({
        success: false,
        message: 'Passkey verification failed'
      });
    }

    const { authenticationInfo } = verification;

    // Update credential counter and last used timestamp
    await query(
      'UPDATE webauthn_credentials SET counter = $1, last_used_at = NOW() WHERE credential_id = $2',
      [authenticationInfo.newCounter, credentialID]
    );

    // Update user last login
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    // Track login history
    const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    await query(`
      INSERT INTO login_history (user_id, login_method, ip_address, user_agent, device_info, success, created_at)
      VALUES ($1, $2, $3, $4, $5, true, NOW())
    `, [user.id, 'WEBAUTHN', ipAddress, userAgent, dbCredential.device_name || 'Biometric Device']);

    logger.info('Authentication successful', { userId: user.id, phone: user.phone });

    // Create session for the user
    await createSession(req, user);

    // Also generate JWT for backward compatibility
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        name: user.name,
        firstName: user.first_name,
        lastName: user.last_name
      },
      process.env.JWT_SECRET || 'beautycita-secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token, // Legacy support
      sessionId: req.sessionID,
      user: {
        id: user.id,
        name: user.name,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        provider: user.provider
      }
    });

  } catch (error) {
    logger.error('Authentication verification error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to verify authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/webauthn/credentials
 * Get user's registered passkeys (requires authentication)
 */
router.get('/credentials', validateAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const credentials = await query(`
      SELECT
        id, device_name, transports, last_used_at, created_at,
        LEFT(credential_id, 10) || '...' as credential_preview
      FROM webauthn_credentials
      WHERE user_id = $1
      ORDER BY last_used_at DESC NULLS LAST, created_at DESC
    `, [userId]);

    res.json({
      success: true,
      credentials: credentials.rows
    });

  } catch (error) {
    logger.error('Get credentials error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get credentials'
    });
  }
});

/**
 * DELETE /api/webauthn/credentials/:id
 * Remove a passkey (requires authentication)
 */
router.delete('/credentials/:id', validateAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const credentialId = req.params.id;

    // Check if this is the user's last credential
    const count = await query(
      'SELECT COUNT(*) FROM webauthn_credentials WHERE user_id = $1',
      [userId]
    );

    if (parseInt(count.rows[0].count) <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove your last passkey. Add another one first.',
        code: 'LAST_CREDENTIAL'
      });
    }

    // Delete the credential
    const result = await query(
      'DELETE FROM webauthn_credentials WHERE id = $1 AND user_id = $2 RETURNING device_name',
      [credentialId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Passkey not found'
      });
    }

    logger.info('Credential removed', { userId, credentialId, deviceName: result.rows[0].device_name });

    res.json({
      success: true,
      message: 'Passkey removed successfully'
    });

  } catch (error) {
    logger.error('Delete credential error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to remove passkey'
    });
  }
});

/**
 * PUT /api/webauthn/credentials/:id
 * Rename a passkey (requires authentication)
 */
router.put('/credentials/:id', validateAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const credentialId = req.params.id;
    const { deviceName } = req.body;

    if (!deviceName) {
      return res.status(400).json({
        success: false,
        message: 'Device name is required'
      });
    }

    const result = await query(
      'UPDATE webauthn_credentials SET device_name = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [deviceName, credentialId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Passkey not found'
      });
    }

    logger.info('Credential renamed', { userId, credentialId, deviceName });

    res.json({
      success: true,
      message: 'Passkey renamed successfully',
      credential: {
        id: result.rows[0].id,
        device_name: result.rows[0].device_name
      }
    });

  } catch (error) {
    logger.error('Rename credential error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to rename passkey'
    });
  }
});

/**
 * POST /api/webauthn/cleanup-challenges
 * Cleanup expired challenges (can be called via cron)
 */
router.post('/cleanup-challenges', async (req, res) => {
  try {
    const result = await query('SELECT cleanup_expired_webauthn_challenges()');

    logger.info('Challenges cleaned up');

    res.json({
      success: true,
      message: 'Expired challenges cleaned up'
    });

  } catch (error) {
    logger.error('Cleanup challenges error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup challenges'
    });
  }
});

/**
 * GET /credentials - List user's biometric credentials (duplicate route)
 */
router.get('/credentials-list', validateAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT
        credential_id as id,
        device_name,
        transports,
        created_at,
        last_used_at
      FROM webauthn_credentials
      WHERE user_id = $1
      ORDER BY created_at DESC`,
      [userId]
    );

    logger.info('Listed biometric credentials', { userId, count: result.rows.length });

    res.json({
      success: true,
      credentials: result.rows
    });
  } catch (error) {
    logger.error('List credentials error', { error: error.message, userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: 'Failed to list credentials'
    });
  }
});

/**
 * DELETE /credentials/:credentialId - Remove a biometric credential (specific)
 */
router.delete('/credentials-remove/:credentialId', validateAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { credentialId } = req.params;

    // Check if credential belongs to user
    const checkResult = await query(
      'SELECT user_id FROM webauthn_credentials WHERE credential_id = $1',
      [credentialId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found'
      });
    }

    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this credential'
      });
    }

    // Check if this is the only credential (don't allow deleting last one)
    const countResult = await query(
      'SELECT COUNT(*) FROM webauthn_credentials WHERE user_id = $1',
      [userId]
    );

    const credentialCount = parseInt(countResult.rows[0].count);

    // Check if user has a password set
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    const hasPassword = userResult.rows[0]?.password_hash;

    if (credentialCount === 1 && !hasPassword) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your only login method. Please set a password first or add another biometric device.'
      });
    }

    // Delete the credential
    await query(
      'DELETE FROM webauthn_credentials WHERE credential_id = $1',
      [credentialId]
    );

    logger.info('Deleted biometric credential', { userId, credentialId });

    res.json({
      success: true,
      message: 'Credential deleted successfully'
    });
  } catch (error) {
    logger.error('Delete credential error', { error: error.message, userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: 'Failed to delete credential'
    });
  }
});

/**
 * POST /api/webauthn/add-passkey/options
 * Generate registration options for adding a NEW passkey to an existing logged-in user
 * Requires authentication (user must be logged in)
 */
router.post('/add-passkey/options', validateAuth, async (req, res) => {
  try {
    const user = req.user;

    logger.info('Add passkey options requested', { userId: user.id, email: user.email });

    // Get user's existing credentials to exclude them
    const credentials = await query(
      'SELECT credential_id FROM webauthn_credentials WHERE user_id = $1',
      [user.id]
    );
    const excludeCredentials = credentials.rows.map(c => ({
      id: c.credential_id,
      type: 'public-key'
    }));

    // Generate registration options
    const userIDBuffer = Buffer.from(user.id.toString(), 'utf-8');

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: userIDBuffer,
      userName: user.email || user.phone,
      userDisplayName: user.name || `${user.first_name} ${user.last_name}`.trim(),
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'required',
        requireResidentKey: true,
      },
    });

    // Store challenge
    await storeChallenge(user.id, user.phone || user.email, options.challenge, 'add-passkey');

    logger.info('Add passkey options generated', {
      userId: user.id,
      challenge: options.challenge.substring(0, 10) + '...'
    });

    res.json({
      success: true,
      options
    });

  } catch (error) {
    logger.error('Add passkey options error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to generate passkey options',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/webauthn/add-passkey/verify
 * Verify and save a NEW passkey for an existing logged-in user
 * Requires authentication (user must be logged in)
 */
router.post('/add-passkey/verify', validateAuth, async (req, res) => {
  try {
    const user = req.user;
    const { credential, deviceName } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Credential is required'
      });
    }

    logger.info('Add passkey verification started', { userId: user.id, deviceName });

    // Verify challenge
    const challengeRecord = await verifyAndConsumeChallengeByPhone(
      user.phone || user.email,
      'add-passkey'
    );

    logger.info('Challenge verified for add passkey', { userId: user.id });

    // Verify the registration response
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified) {
      logger.warn('Add passkey verification failed', { userId: user.id });
      return res.status(400).json({
        success: false,
        message: 'Passkey verification failed'
      });
    }

    logger.info('Passkey verified successfully', { userId: user.id });

    const { registrationInfo } = verification;
    const { credential: credentialData } = registrationInfo;

    // Store the new credential
    await query(`
      INSERT INTO webauthn_credentials (
        user_id, credential_id, public_key, counter,
        aaguid, device_name, transports,
        attestation_format, attested_credential_data,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    `, [
      user.id,
      credentialData.id,
      Buffer.from(credentialData.publicKey).toString('base64url'),
      credentialData.counter,
      registrationInfo.aaguid ? Buffer.from(registrationInfo.aaguid).toString('hex') : null,
      deviceName || 'Unnamed Device',
      credentialData.transports || [],
      registrationInfo.attestationFormat || 'none',
      null
    ]);

    logger.info('Passkey added successfully', {
      userId: user.id,
      deviceName
    });

    res.json({
      success: true,
      message: 'Passkey added successfully'
    });

  } catch (error) {
    logger.error('Add passkey verification error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to add passkey',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
