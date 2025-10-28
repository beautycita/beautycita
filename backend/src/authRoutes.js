const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { query } = require('./db');
const SMSService = require('./smsService');
const emailService = require('./emailService');
const { validatePhone } = require('./utils/phoneValidation');
const { upload, processPortfolioImages } = require('./utils/imageUpload');
const { getCountryFromIP, countryToPhoneCode, getClientIP } = require('./utils/ipGeolocation');
const { getAreaCodePrediction } = require('./utils/aphroditePatterns');
const { createSession } = require('./middleware/sessionAuth');

const { validateJWT } = require('./middleware/auth');
const router = express.Router();
const smsService = new SMSService();

// Strict rate limiting for password reset endpoints (prevent abuse)
const passwordResetLimiter = rateLimit({
  skip: () => process.env.NODE_ENV === 'test',
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: 'Too many password reset attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  skip: () => process.env.NODE_ENV === 'test',
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for testing)
  message: 'Too many authentication attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

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

// Phone number normalization utility
function normalizePhoneNumber(phone) {
  console.log('normalizePhoneNumber called with:', phone);

  if (!phone) {
    console.log('normalizePhoneNumber: phone is null/undefined');
    return null;
  }

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  console.log('normalizePhoneNumber: digitsOnly =', digitsOnly);

  // If it starts with 1 and has 11 digits (US/Canada format)
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    const result = `+${digitsOnly}`;
    console.log('normalizePhoneNumber: 11 digits with 1 ->', result);
    return result;
  }

  // If it starts with 52 and has 12 digits (Mexico format)
  if (digitsOnly.length === 12 && digitsOnly.startsWith('52')) {
    const result = `+${digitsOnly}`;
    console.log('normalizePhoneNumber: 12 digits with 52 ->', result);
    return result;
  }

  // If it has 10 digits, detect US vs Mexico by area code
  if (digitsOnly.length === 10) {
    // Common Mexico area codes: 55 (Mexico City), 81 (Monterrey), 33 (Guadalajara),
    // 442 (Querétaro), 222 (Puebla), 656 (Juárez), 664 (Tijuana), etc.
    const mexicoAreaCodes = ['55', '81', '33', '222', '442', '656', '664', '998', '984', '477', '312'];
    const first2 = digitsOnly.substring(0, 2);
    const first3 = digitsOnly.substring(0, 3);

    const isMexico = mexicoAreaCodes.includes(first2) || mexicoAreaCodes.includes(first3);
    const countryCode = isMexico ? '+52' : '+1';
    const result = `${countryCode}${digitsOnly}`;
    console.log(`normalizePhoneNumber: 10 digits detected as ${isMexico ? 'Mexico' : 'US/Canada'} ->`, result);
    return result;
  }

  // If it starts with + already, return as-is if valid length
  if (phone.startsWith('+') && digitsOnly.length >= 10 && digitsOnly.length <= 15) {
    console.log('normalizePhoneNumber: already has + prefix ->', phone);
    return phone;
  }

  // For international numbers without +, add it if valid length
  if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
    const result = `+${digitsOnly}`;
    console.log('normalizePhoneNumber: international ->', result);
    return result;
  }

  // Return original if we can't normalize it
  console.log('normalizePhoneNumber: cannot normalize, returning original ->', phone);
  return phone;
}

// Initialize logger
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'beautycita-auth' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: '/var/www/beautycita.com/backend/logs/auth.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Also log to the main combined log
    new winston.transports.File({
      filename: '/var/www/beautycita.com/backend/logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Log that auth routes are being loaded
logger.info('Auth routes module loaded', {
  timestamp: new Date().toISOString(),
  module: 'authRoutes'
});

// Middleware to log all requests to auth routes
router.use((req, res, next) => {
  logger.info('Auth API request', {
    method: req.method,
    url: req.url,
    path: req.path,
    body: req.method === 'POST' && req.body ? { ...req.body, password: req.body.password ? '[REDACTED]' : undefined } : undefined,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    logger.info('Login attempt', { email, ip: req.ip });

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const userResult = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      logger.warn('Login failed - user not found', { email });

      // Track failed login attempt (non-blocking)
      const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      try {
        await query(`
          INSERT INTO login_history (login_method, ip_address, user_agent, success, failure_reason, created_at)
          VALUES ($1, $2, $3, false, $4, NOW())
        `, ['PASSWORD', ipAddress, userAgent, 'User not found']);
      } catch (logError) {
        logger.error('Failed to log login attempt', { error: logError.message });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = userResult.rows[0];

    // Check if password hash exists
    if (!user.password_hash) {
      logger.warn('Login failed - no password set', { email, userId: user.id });
      return res.status(401).json({
        success: false,
        message: 'This account uses social login. Please sign in with Google.'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      logger.warn('Login failed - incorrect password', { email, userId: user.id });

      // Track failed login attempt
      const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      await query(`
        INSERT INTO login_history (user_id, login_method, ip_address, user_agent, success, failure_reason, created_at)
        VALUES ($1, $2, $3, $4, false, $5, NOW())
      `, [user.id, 'PASSWORD', ipAddress, userAgent, 'Incorrect password']);

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      logger.warn('Login failed - inactive account', { email, userId: user.id });

      // Track failed login attempt
      const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      await query(`
        INSERT INTO login_history (user_id, login_method, ip_address, user_agent, success, failure_reason, created_at)
        VALUES ($1, $2, $3, $4, false, $5, NOW())
      `, [user.id, 'PASSWORD', ipAddress, userAgent, 'Account deactivated']);

      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Generate JWT token
    const jwt = require('jsonwebtoken');
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

    logger.info('Login successful', {
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Track successful login in login history
    const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    await query(`
      INSERT INTO login_history (user_id, login_method, ip_address, user_agent, success, created_at)
      VALUES ($1, $2, $3, $4, true, NOW())
    `, [user.id, 'PASSWORD', ipAddress, userAgent]);

    // Create session for the user
    await createSession(req, user);

    // Fetch client or stylist data
    let client = null;
    let stylist = null;

    if (user.role === 'CLIENT') {
      const clientResult = await query('SELECT * FROM clients WHERE user_id = $1', [user.id]);
      if (clientResult.rows.length > 0) {
        client = clientResult.rows[0];
      }
    } else if (user.role === 'STYLIST' || user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
      const stylistResult = await query('SELECT * FROM stylists WHERE user_id = $1', [user.id]);
      if (stylistResult.rows.length > 0) {
        stylist = stylistResult.rows[0];
      }
    }

    // Return user data and token (token for legacy support)
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          profileImage: user.profile_picture_url,
          first_name: user.first_name,
          lastName: user.last_name,
          firstName: user.first_name,
          profilePictureUrl: user.profile_picture_url,
          phone_verified: user.phone_verified,
          email_verified: user.email_verified,
          isActive: user.is_active,
          profile_complete: user.profile_complete,
          onboarding_completed: user.onboarding_completed,
          onboarding_completed_at: user.onboarding_completed_at
        },
        client,
        stylist,
        token, // Legacy support
        sessionId: req.sessionID
      }
    });
  } catch (error) {
    logger.error('Login error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'An error occurred during login'
    });
  }
});

// Enhanced registration with full field validation
router.post('/register', async (req, res) => {
  logger.info('Registration attempt started', {
    body: { ...req.body, password: '[REDACTED]' },
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  try {
    const {
      // Required for all users
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      password,
      acceptTerms, // Frontend sends acceptTerms, not agreeToTerms
      agreeToTerms, // Keep backward compatibility
      role,

      // Stylist-specific fields
      services = [],
      workLocation = {},
      salonPhone,
      workingHours = {},
      pricing = {},
      serviceDescription,

      // Client-specific preferences
      favoriteServices = [],
      priceRangeMin = 0,
      priceRangeMax = 1000,
      preferredDistance = 20,
      locationAddress,
      locationCity,
      locationState,
      locationZip,
      emailNotifications = true,
      smsNotifications = true,
      appointmentReminders = true,
      promotionalEmails = false,

      // Profile picture will be handled separately via upload endpoint
    } = req.body;

    // Set default values for optional fields
    const finalDateOfBirth = dateOfBirth || null;
    const finalRole = role || 'client';

    // Validate required fields for all users
    const errors = {};

    if (!firstName?.trim()) errors.firstName = 'First name is required';
    if (!lastName?.trim()) errors.lastName = 'Last name is required';
    if (!email?.trim()) errors.email = 'Email is required';
    if (!email?.includes('@')) errors.email = 'Valid email is required';
    if (!password) errors.password = 'Password is required';

    // Validate phone number using centralized utility (phone is optional for password registration)
    let normalizedPhone = null;
    let phoneValidation = null;
    if (phone && phone.trim()) {
      phoneValidation = await validatePhone(phone);
      if (!phoneValidation.isValid) {
        errors.phone = phoneValidation.error;
      }
      normalizedPhone = phoneValidation.normalized;
    }

    logger.debug('Phone validation result:', {
      original: phone,
      normalized: normalizedPhone,
      isValid: phoneValidation?.isValid
    });

    // Validate password strength
    if (password) {
      if (password.length < 8) {
        errors.password = 'Password must be at least 8 characters long';
      } else {
        // Check for password complexity
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);

        if (!hasUpperCase || !hasLowerCase || !hasNumber) {
          errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        }
      }
    }

    // Handle both field names for terms acceptance
    const termsAccepted = acceptTerms || agreeToTerms;
    if (!termsAccepted) errors.acceptTerms = 'You must agree to the Terms of Service';

    // Validate stylist-specific fields (only if provided - not required for initial registration)
    // Pricing and duration are optional - stylists can add them later in their profile

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your information and try again',
        data: { errors }
      });
    }

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists',
        message: 'User with this email already exists',
        data: { field: 'email' }
      });
    }

    // Phone validation and availability already checked above in validatePhone utility

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate username from email
    const username = await generateUsernameFromEmail(email);

    // Insert user into database
    const userRole = finalRole.toLowerCase() === 'stylist' ? 'STYLIST' : 'CLIENT';
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const newUser = await query(`
      INSERT INTO users (
        name, first_name, last_name, email, phone, password_hash, role, username,
        profile_picture_url, email_verified, phone_verified, is_active,
        date_of_birth, tos_accepted, tos_accepted_at, username_last_changed,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING id, first_name, last_name, name, email, phone, role, username, created_at
    `, [
      fullName,
      firstName.trim(),
      lastName.trim(),
      email.toLowerCase().trim(),
      normalizedPhone,
      hashedPassword,
      userRole,
      username,
      null, // profile_picture_url
      false, // email_verified
      false, // phone_verified
      true, // is_active
      finalDateOfBirth,
      true, // tos_accepted (since agreeToTerms was validated)
      new Date(), // tos_accepted_at
      new Date(), // username_last_changed
      new Date(),
      new Date()
    ]);

    const user = newUser.rows[0];

    // Create SMS preferences for the user
    await query(`
      INSERT INTO sms_preferences (user_id, created_at, updated_at)
      VALUES ($1, $2, $3)
    `, [user.id, new Date(), new Date()]);

    // Create user credits record
    await query(`
      INSERT INTO user_credits (user_id, balance_cents, updated_at)
      VALUES ($1, $2, $3)
    `, [user.id, 0, new Date()]);

    // Create role-specific profile
    if (userRole === 'STYLIST') {
      // Ensure required location fields are not empty (database constraints)
      const locationAddress = workLocation?.address?.trim() || 'Address to be updated';
      const locationCity = workLocation?.city?.trim() || 'City to be updated';
      const locationState = workLocation?.state?.trim() || '';

      // Convert services array to specialties text array for database
      const specialtiesArray = Array.isArray(services) ? services : [];

      console.log('Creating stylist profile:', {
        userId: user.id,
        businessName: `${firstName} ${lastName}`,
        specialties: specialtiesArray,
        locationAddress,
        locationCity,
        locationState
      });

      let stylistProfile;
      try {
        stylistProfile = await query(`
          INSERT INTO stylists (
            user_id, business_name, bio, specialties, experience_years,
            location_address, location_city, location_state, salon_phone, service_description,
            created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id
        `, [
          user.id,
          `${firstName} ${lastName}`, // business_name default
          serviceDescription || '', // bio
          specialtiesArray, // specialties as text array
          0, // experience_years default
          locationAddress, // guaranteed not empty
          locationCity, // guaranteed not empty
          locationState,
          salonPhone || null,
          serviceDescription || '',
          new Date(),
          new Date()
        ]);
        console.log('Stylist profile created successfully:', stylistProfile.rows[0]);
      } catch (stylistError) {
        console.error('STYLIST PROFILE CREATION ERROR:', {
          message: stylistError.message,
          code: stylistError.code,
          detail: stylistError.detail,
          stack: stylistError.stack
        });
        throw stylistError;
      }

      const stylistId = stylistProfile.rows[0].id;

      // Create services for the stylist
      if (specialtiesArray.length > 0 && pricing && typeof pricing === 'object') {
        console.log('Creating services for stylist:', { specialtiesArray, pricing });

        for (const service of specialtiesArray) {
          if (pricing[service] && pricing[service].price && pricing[service].duration) {
            const servicePrice = parseFloat(pricing[service].price) || 0;
            const serviceDuration = parseInt(pricing[service].duration) || 60;

            console.log(`Creating service: ${service}`, {
              price: servicePrice,
              duration: serviceDuration,
              pricecents: Math.round(servicePrice * 100)
            });

            try {
              await query(`
                INSERT INTO services (
                  stylist_id, name, description, category, duration_minutes, price, price_cents,
                  is_active, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              `, [
                stylistId,
                service,
                serviceDescription || `${service} service`,
                service.toUpperCase().replace('-', '_'), // category (handle kebab-case)
                serviceDuration,
                servicePrice, // price as decimal
                Math.round(servicePrice * 100), // price_cents
                true,
                new Date(),
                new Date()
              ]);
            } catch (serviceError) {
              console.error(`Error creating service ${service}:`, serviceError);
              // Continue with other services instead of failing completely
            }
          } else {
            console.warn(`Skipping service ${service} - missing or invalid pricing:`, pricing[service]);
          }
        }
      } else {
        console.warn('No services or pricing provided for stylist');
      }
    } else if (userRole === 'CLIENT') {
      // Create client profile
      console.log('Creating client profile for user:', user.id);

      try {
        // Build client preferences object
        const clientPreferences = {
          favoriteServices,
          priceRange: {
            min: priceRangeMin,
            max: priceRangeMax
          },
          preferredDistance,
          location: {
            address: locationAddress,
            city: locationCity,
            state: locationState,
            zip: locationZip
          },
          notifications: {
            email: emailNotifications,
            sms: smsNotifications,
            appointmentReminders,
            promotional: promotionalEmails
          }
        };

        const clientProfile = await query(`
          INSERT INTO clients (user_id, preferences, total_bookings, average_rating, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `, [
          user.id,
          JSON.stringify(clientPreferences),
          0,  // total_bookings
          0.00, // average_rating
          new Date(),
          new Date()
        ]);

        console.log('Client profile created successfully:', clientProfile.rows[0]);
      } catch (clientError) {
        console.error('CLIENT PROFILE CREATION ERROR:', {
          message: clientError.message,
          code: clientError.code,
          detail: clientError.detail,
          stack: clientError.stack
        });
        throw clientError;
      }
    }

    // Send welcome email
    try {
      const userName = user.first_name || user.name?.split(' ')[0] || user.email.split('@')[0];
      const userType = userRole === 'STYLIST' ? 'stylist' : 'client';
      await emailService.sendWelcomeEmail(user.email, userName, userType);
      logger.info('Welcome email sent successfully', { userId: user.id, email: user.email });
    } catch (emailError) {
      logger.error('Failed to send welcome email', {
        error: emailError.message,
        userId: user.id,
        email: user.email
      });
      // Don't fail registration if welcome email fails
    }

    // Send email verification
    try {
      const crypto = require('crypto');
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store verification token
      await query(`
        INSERT INTO email_verification_tokens (user_id, token, expires_at, created_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET token = $2, expires_at = $3, used = false, created_at = NOW()
      `, [user.id, verificationToken, expiresAt]);

      // Send verification email
      const verificationUrl = `${process.env.FRONTEND_URL || 'https://beautycita.com'}/verify-email/${verificationToken}`;
      const userName = user.first_name || user.name?.split(' ')[0] || user.email.split('@')[0];
      await emailService.sendEmailVerificationEmail(user.email, userName, verificationUrl);

      logger.info('Email verification sent successfully', { userId: user.id, email: user.email });
    } catch (emailError) {
      logger.error('Failed to send verification email', {
        error: emailError.message,
        userId: user.id,
        email: user.email
      });
      // Don't fail registration if verification email fails
    }

    // Send phone verification SMS
    const verificationCode = smsService.generateVerificationCode();
    const verificationResult = await smsService.sendSMS(
      user.id,
      normalizedPhone,
      `Your BeautyCita verification code is: ${verificationCode}. This code expires in 10 minutes.`,
      'PHONE_VERIFICATION'
    );

    if (verificationResult.success) {
      // Store verification code
      await query(`
        INSERT INTO user_phone_verification (
          user_id, phone_number, verification_code, created_at, expires_at
        )
        VALUES ($1, $2, $3, $4, $5)
      `, [
        user.id,
        normalizedPhone,
        verificationCode,
        new Date(),
        new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
      ]);

      res.status(201).json({
        success: true,
        message: 'Registration successful! Please verify your phone number.',
        user: {
          id: user.id,
          firstName: user.first_name || user.name?.split(' ')[0],
          lastName: user.last_name || user.name?.split(' ').slice(1).join(' '),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        requiresPhoneVerification: true
      });
    } else {
      // If SMS failed, still create user but mark as needing verification
      res.status(201).json({
        success: true,
        message: 'Registration successful! SMS verification failed - please try again.',
        user: {
          id: user.id,
          firstName: user.first_name || user.name?.split(' ')[0],
          lastName: user.last_name || user.name?.split(' ').slice(1).join(' '),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        requiresPhoneVerification: true,
        smsError: 'Could not send verification SMS'
      });
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Verify phone number
router.post('/verify-phone', async (req, res) => {
  try {
    const { phone, code, email } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and verification code are required'
      });
    }

    const cleanedPhone = phone.trim();

    // Get verification record by phone number (for registration flow)
    const verification = await query(`
      SELECT * FROM user_phone_verification
      WHERE phone_number = $1 AND verification_code = $2
      AND expires_at > NOW() AND is_verified = false
      ORDER BY created_at DESC
      LIMIT 1
    `, [cleanedPhone, code]);

    if (verification.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    // Mark verification as complete
    await query(`
      UPDATE user_phone_verification
      SET is_verified = true, verified_at = NOW()
      WHERE id = $1
    `, [verification.rows[0].id]);

    // If there's a user_id associated, update the user record too
    if (verification.rows[0].user_id) {
      await query(`
        UPDATE users
        SET phone_verified = true, phone_verified_at = NOW(), phone = $2
        WHERE id = $1
      `, [verification.rows[0].user_id, cleanedPhone]);
    } else if (email) {
      // OAuth flow: find user by email and update their phone
      const userResult = await query(`
        UPDATE users
        SET phone_verified = true, phone_verified_at = NOW(), phone = $2
        WHERE email = $1
        RETURNING id
      `, [email, cleanedPhone]);

      if (userResult.rows.length > 0) {
        // Link the verification record to the user
        await query(`
          UPDATE user_phone_verification
          SET user_id = $1
          WHERE id = $2
        `, [userResult.rows[0].id, verification.rows[0].id]);
      }
    }

    res.json({
      success: true,
      message: 'Phone number verified successfully!'
    });

  } catch (error) {
    console.error('Phone verification error:', error);
    logger.error('Phone verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Resend verification code
router.post('/resend-verification', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Get user
    const user = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = user.rows[0];

    // Check if already verified
    if (userData.phone_verified) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is already verified'
      });
    }

    // Generate new verification code
    const verificationCode = smsService.generateVerificationCode();
    const verificationResult = await smsService.sendSMS(
      userData.id,
      userData.phone,
      `Your BeautyCita verification code is: ${verificationCode}. This code expires in 10 minutes.`,
      'PHONE_VERIFICATION'
    );

    if (verificationResult.success) {
      // Store new verification code
      await query(`
        INSERT INTO user_phone_verification (
          user_id, phone_number, verification_code, created_at, expires_at
        )
        VALUES ($1, $2, $3, $4, $5)
      `, [
        userData.id,
        userData.phone,
        verificationCode,
        new Date(),
        new Date(Date.now() + 10 * 60 * 1000)
      ]);

      res.json({
        success: true,
        message: 'Verification code sent successfully!'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send verification code'
      });
    }

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification code',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Send verification code (supports both phone-only and email+phone+role for Google OAuth)
router.post('/send-verification', async (req, res) => {
  try {
    const { phone, email, role } = req.body;

    console.log('AuthRoutes - Phone verification request:', {
      email: email || '[NOT PROVIDED]',
      phone: phone ? '[PROVIDED]' : '[MISSING]',
      role: role || '[NOT PROVIDED]'
    });

    let user;
    let userId;

    // Handle two cases:
    // 1. Google OAuth flow: email+phone+role provided (find by email)
    // 2. Regular flow: only phone provided (find by phone)
    if (email) {
      console.log('AuthRoutes - Google OAuth flow: Looking up user by email');
      // Google OAuth flow - find user by email
      const userResult = await query('SELECT * FROM users WHERE email = $1', [email]);

      if (userResult.rows.length > 0) {
        user = userResult.rows[0];
        userId = user.id;
        console.log('AuthRoutes - Found existing Google OAuth user:', {
          userId: user.id,
          email: user.email,
          provider: user.provider,
          role: user.role
        });

        // Update role if provided and user doesn't have one set
        if (role && (!user.role || user.role === '')) {
          await query('UPDATE users SET role = $1 WHERE id = $2', [role.toUpperCase(), user.id]);
          user.role = role.toUpperCase();
          console.log('AuthRoutes - Updated user role to:', role.toUpperCase());
        }
      } else {
        // Create temporary user record for Google OAuth edge case
        console.log('AuthRoutes - Creating new temporary user for Google OAuth');
        const newUser = await query(`
          INSERT INTO users (name, email, role, is_active, phone_verified, created_at, updated_at)
          VALUES ($1, $2, $3, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING *
        `, ['Temporary User', email, role?.toUpperCase() || 'CLIENT']);
        user = newUser.rows[0];
        userId = user.id;
        console.log('AuthRoutes - Created new user:', { userId: user.id, email: user.email, role: user.role });
      }
    } else {
      console.log('AuthRoutes - Regular flow: Looking up user by phone');
      // Regular flow - find user by phone number
      const userResult = await query('SELECT id FROM users WHERE phone = $1', [phone]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found with this phone number'
        });
      }

      userId = userResult.rows[0].id;
      console.log('AuthRoutes - Found user by phone:', { userId });
    }

    // Validate userId before proceeding
    if (!userId || isNaN(userId)) {
      console.error('AuthRoutes - Invalid userId:', userId);
      return res.status(500).json({
        success: false,
        message: 'Invalid user ID. Please try again.'
      });
    }

    // Normalize phone number
    let normalizedPhone = phone.replace(/\D/g, '');
    if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+' + normalizedPhone;
    }

    // Generate verification code
    const verificationCode = smsService.generateVerificationCode();
    console.log('AuthRoutes - Sending verification code to user:', { userId, phone: phone ? '[PROVIDED]' : '[MISSING]' });

    const verificationResult = await smsService.sendSMS(
      userId,
      normalizedPhone,
      `Your BeautyCita verification code is: ${verificationCode}. This code expires in 10 minutes.`,
      'PHONE_VERIFICATION'
    );

    if (verificationResult.success) {
      // Store verification code
      await query(`
        INSERT INTO user_phone_verification (
          user_id, phone_number, verification_code, created_at, expires_at
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id)
        DO UPDATE SET
          verification_code = EXCLUDED.verification_code,
          created_at = EXCLUDED.created_at,
          expires_at = EXCLUDED.expires_at
      `, [
        userId,
        normalizedPhone,
        verificationCode,
        new Date(),
        new Date(Date.now() + 10 * 60 * 1000)
      ]);

      console.log('AuthRoutes - Verification code sent successfully to user:', userId);
      res.json({
        success: true,
        message: 'Verification code sent successfully!'
      });
    } else {
      console.error('AuthRoutes - Failed to send verification code:', verificationResult.error);
      res.status(500).json({
        success: false,
        message: 'Failed to send verification code'
      });
    }
  } catch (error) {
    console.error('AuthRoutes - Send verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification code',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Google OAuth routes removed - now handled by /routes/googleAuth.js with pure JWT implementation

// Role-specific registration routes for frontend compatibility
router.post('/register/client', async (req, res) => {
  // Ensure role is set to client
  req.body.role = 'client';

  // Use the same registration logic as the main /register route
  try {
    const {
      // Required for all users
      firstName,
      lastName,
      email,
      normalizedPhone,
      dateOfBirth,
      password,
      agreeToTerms,
      role,

      // Stylist-specific fields
      services = [],
      workLocation = {},
      salonPhone,
      workingHours = {},
      pricing = {},
      serviceDescription,

      // Profile picture will be handled separately via upload endpoint
    } = req.body;

    // Validate required fields for all users
    const errors = {};

    if (!firstName?.trim()) errors.firstName = 'First name is required';
    if (!lastName?.trim()) errors.lastName = 'Last name is required';
    if (!email?.trim()) errors.email = 'Email is required';
    if (!email?.includes('@')) errors.email = 'Valid email is required';
    if (!phone?.trim()) errors.phone = 'Phone number is required';
    if (!password) errors.password = 'Password is required';
    if (password && password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (!agreeToTerms) errors.agreeToTerms = 'You must agree to the Terms of Service';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your information and try again',
        data: { errors }
      });
    }

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists',
        message: 'User with this email already exists',
        data: { field: 'email' }
      });
    }

    // Phone validation and availability already checked above in validatePhone utility

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user into database
    const userRole = 'CLIENT';
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const newUser = await query(`
      INSERT INTO users (
        first_name, last_name, name, email, password_hash, phone, role,
        date_of_birth, provider, email_verified, is_active, tos_accepted, tos_accepted_at, tos_version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, email, first_name, last_name, name, role, created_at
    `, [
      firstName.trim(),
      lastName.trim(),
      fullName,
      email.toLowerCase().trim(),
      hashedPassword,
      normalizedPhone,
      userRole,
      dateOfBirth,
      'local',
      false, // email_verified
      true,  // is_active
      true,  // tos_accepted
      new Date(), // tos_accepted_at
      '1.0'  // tos_version
    ]);

    logger.info('Client registered successfully', {
      userId: newUser.rows[0].id,
      email: newUser.rows[0].email
    });

    // Auto-login the user
    req.login(newUser.rows[0], (err) => {
      if (err) {
        logger.error('Auto-login after registration failed:', err);
        return res.status(500).json({ message: 'Registration successful but login failed' });
      }

      res.status(201).json({
        message: 'Registration successful',
        user: newUser.rows[0]
      });
    });

  } catch (error) {
    logger.error('Client registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Enhanced stylist registration with file upload support
router.post('/register/stylist', upload.array('portfolioImages', 6), async (req, res) => {
  logger.info('Stylist registration attempt started', {
    body: { ...req.body, password: '[REDACTED]' },
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    hasFiles: req.files ? Object.keys(req.files).length : 0
  });

  try {
    // Extract form data (handles both JSON and FormData)
    let formData = { ...req.body };

    // Handle FormData parsing for arrays/objects
    if (typeof formData.specialties === 'string') {
      try {
        formData.specialties = JSON.parse(formData.specialties);
      } catch (e) {
        formData.specialties = [formData.specialties];
      }
    }

    // Parse experience as number
    if (formData.experience) {
      formData.experience = parseInt(formData.experience, 10);
    }

    // Parse coordinates as numbers
    if (formData.latitude) {
      formData.latitude = parseFloat(formData.latitude);
    }
    if (formData.longitude) {
      formData.longitude = parseFloat(formData.longitude);
    }

    const {
      // Required for all users
      firstName,
      lastName,
      email,
      phone,
      password,
      acceptTerms,
      agreeToTerms,

      // Stylist-specific fields
      specialties = [],
      services = [],
      pricing = {},
      businessName,
      bio,
      experience,
      locationAddress,
      locationCity,
      locationState,
      serviceDescription,
      instagramUrl,
      dateOfBirth,
    } = formData;

    // Validate required fields for all users
    const errors = {};

    if (!firstName?.trim()) errors.firstName = 'First name is required';
    if (!lastName?.trim()) errors.lastName = 'Last name is required';
    if (!email?.trim()) errors.email = 'Email is required';
    if (!email?.includes('@')) errors.email = 'Valid email is required';
    if (!password) errors.password = 'Password is required';
    if (password && password.length < 6) errors.password = 'Password must be at least 6 characters';

    // Handle both field names for terms acceptance (acceptTerms vs agreeToTerms)
    const termsAccepted = req.body.acceptTerms || agreeToTerms;
    if (!termsAccepted) errors.acceptTerms = 'You must agree to the Terms of Service';

    // Validate phone number using centralized utility (required for stylists)
    const phoneValidation = await validatePhone(phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error;
    }
    const normalizedPhone = phoneValidation.normalized;

    // Validate stylist-specific fields
    if (!specialties || specialties.length === 0) errors.specialties = 'Select at least one specialty';
    if (!businessName?.trim()) errors.businessName = 'Business name is required';
    if (!locationAddress?.trim()) errors.locationAddress = 'Location address is required';
    if (!locationCity?.trim()) errors.locationCity = 'City is required';
    if (!locationState?.trim()) errors.locationState = 'State is required';
    if (typeof experience !== 'number' || experience < 0) errors.experience = 'Valid experience is required';

    // Coordinates are optional but if provided, must be valid
    if (formData.latitude !== undefined && (typeof formData.latitude !== 'number' || isNaN(formData.latitude))) {
      errors.latitude = 'Valid latitude is required';
    }
    if (formData.longitude !== undefined && (typeof formData.longitude !== 'number' || isNaN(formData.longitude))) {
      errors.longitude = 'Valid longitude is required';
    }

    // Pricing and duration are optional - stylists can add them later in their profile

    if (Object.keys(errors).length > 0) {
      console.log('🚨 STYLIST REGISTRATION VALIDATION ERRORS:', {
        errors,
        formDataKeys: Object.keys(formData),
        experienceType: typeof experience,
        experienceValue: experience,
        specialtiesLength: specialties?.length,
        servicesLength: services?.length
      });
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your information and try again',
        data: { errors }
      });
    }

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists',
        message: 'User with this email already exists',
        data: { field: 'email' }
      });
    }

    // Phone validation and availability already checked above in validatePhone utility

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user into database
    const userRole = 'STYLIST';
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const newUser = await query(`
      INSERT INTO users (
        first_name, last_name, name, email, password_hash, phone, role,
        date_of_birth, provider, email_verified, is_active, tos_accepted, tos_accepted_at, tos_version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, email, first_name, last_name, name, role, created_at
    `, [
      firstName.trim(),
      lastName.trim(),
      fullName,
      email.toLowerCase().trim(),
      hashedPassword,
      normalizedPhone,
      userRole,
      dateOfBirth,
      'local',
      false, // email_verified
      true,  // is_active
      true,  // tos_accepted
      new Date(), // tos_accepted_at
      '1.0'  // tos_version
    ]);

    const user = newUser.rows[0];

    logger.info('Stylist registered successfully', {
      userId: user.id,
      email: user.email
    });

    // Create user credits record
    await query(`
      INSERT INTO user_credits (user_id, balance_cents, updated_at)
      VALUES ($1, $2, $3)
    `, [user.id, 0, new Date()]);

    // Create stylist profile
    // Use provided location data
    const finalLocationAddress = locationAddress?.trim() || 'Address to be updated';
    const finalLocationCity = locationCity?.trim() || 'Mexico City';
    const finalLocationState = locationState?.trim() || 'CDMX';
    const finalLatitude = formData.latitude || null;
    const finalLongitude = formData.longitude || null;

    // Convert specialties array to text array for database
    const specialtiesArray = Array.isArray(specialties) ? specialties : [];

    console.log('Creating stylist profile:', {
      userId: user.id,
      businessName: businessName || `${firstName} ${lastName}`,
      specialties: specialtiesArray,
      locationAddress: finalLocationAddress,
      latitude: finalLatitude,
      longitude: finalLongitude,
      instagramUrl
    });

    const stylistProfile = await query(`
      INSERT INTO stylists (
        user_id, business_name, bio, specialties, experience_years,
        location_address, location_city, location_state, location_coordinates, social_media_links,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `, [
      user.id,
      businessName || `${firstName} ${lastName}`, // business_name
      bio || '', // bio description
      specialtiesArray, // specialties as text array
      experience || 0, // experience_years
      finalLocationAddress, // location_address
      finalLocationCity, // location_city from form
      finalLocationState, // location_state from form
      finalLatitude && finalLongitude ? `(${finalLatitude},${finalLongitude})` : null, // location_coordinates as point
      instagramUrl ? { instagram: instagramUrl } : null, // social_media_links as JSON
      new Date(), // created_at
      new Date() // updated_at
    ]);

    const stylistId = stylistProfile.rows[0].id;

    // Process portfolio images if provided
    let portfolioImagePaths = [];
    if (req.files && req.files.length > 0) {
      try {
        const imageProcessingResult = await processPortfolioImages(req.files, user.id);
        if (imageProcessingResult.success) {
          portfolioImagePaths = imageProcessingResult.images.map(img => img.path);

          // Update stylist profile with portfolio image paths
          await query(`
            UPDATE stylists
            SET portfolio_images = $1, updated_at = $2
            WHERE id = $3
          `, [
            portfolioImagePaths,
            new Date(),
            stylistId
          ]);

          logger.info('Portfolio images processed successfully', {
            userId: user.id,
            stylistId,
            imageCount: portfolioImagePaths.length,
            imagePaths: portfolioImagePaths
          });
        } else {
          logger.error('Portfolio image processing failed', {
            userId: user.id,
            error: imageProcessingResult.error,
            details: imageProcessingResult.details
          });
          // Continue with registration but note the image processing failure
        }
      } catch (imageError) {
        logger.error('Portfolio image processing error', {
          userId: user.id,
          error: imageError.message
        });
        // Continue with registration but note the image processing failure
      }
    }

    // Create services for the stylist
    if (specialtiesArray.length > 0 && pricing && typeof pricing === 'object') {
      console.log('Creating services for stylist:', { specialtiesArray, pricing });

      for (const service of specialtiesArray) {
        if (pricing[service] && pricing[service].price && pricing[service].duration) {
          const servicePrice = parseFloat(pricing[service].price) || 0;
          const serviceDuration = parseInt(pricing[service].duration) || 60;

          console.log(`Creating service: ${service}`, {
            price: servicePrice,
            duration: serviceDuration,
            pricecents: Math.round(servicePrice * 100)
          });

          try {
            await query(`
              INSERT INTO services (
                stylist_id, name, description, category, duration_minutes, price, price_cents,
                is_active, created_at, updated_at
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
              stylistId,
              service,
              serviceDescription || `${service} service`,
              service.toUpperCase().replace('-', '_'), // category (handle kebab-case)
              serviceDuration,
              servicePrice, // price as decimal
              Math.round(servicePrice * 100), // price_cents
              true,
              new Date(),
              new Date()
            ]);
          } catch (serviceError) {
            console.error(`Error creating service ${service}:`, serviceError);
            // Continue with other services instead of failing completely
          }
        } else {
          console.warn(`Skipping service ${service} - missing or invalid pricing:`, pricing[service]);
        }
      }
    } else {
      console.warn('No services or pricing provided for stylist');
    }

    // Auto-login the user
    req.login(user, (err) => {
      if (err) {
        logger.error('Auto-login after registration failed:', err);
        return res.status(500).json({ message: 'Registration successful but login failed' });
      }

      res.status(201).json({
        message: 'Registration successful',
        user: user
      });
    });

  } catch (error) {
    console.error('DETAILED Stylist registration error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
    logger.error('Stylist registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Send phone verification code
// Send phone verification code
router.post('/send-phone-verification', async (req, res) => {
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
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await query(`
      INSERT INTO verification_codes (phone, code, expires_at, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (phone)
      DO UPDATE SET code = $2, expires_at = $3, created_at = NOW()
    `, [phone, verificationCode, expiresAt]);

    // Update user_phone_verification table if email is provided (for backward compatibility)
    if (email) {
      await query(`
        INSERT INTO user_phone_verification (user_id, phone_number, verification_code, expires_at, created_at)
        SELECT id, $1, $2, $3, NOW()
        FROM users WHERE email = $4
        ON CONFLICT (phone_number)
        DO UPDATE SET
          verification_code = $2,
          is_verified = false,
          attempts = 0,
          created_at = NOW(),
          expires_at = $3
      `, [phone, verificationCode, expiresAt, email]);
    }

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
    } else if (process.env.TWILIO_PHONE_NUMBER) {
      messageParams.from = process.env.TWILIO_PHONE_NUMBER;
    }

    await client.messages.create(messageParams);

    console.log('[PHONE_VERIFICATION] SMS sent successfully to:', phone);

    res.json({
      success: true,
      message: 'Verification code sent via SMS',
      expiresIn: 600 // 10 minutes in seconds
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
});

// Resend phone verification code
router.post('/resend-phone-verification', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const cleanedPhone = phone.trim();

    // Check if there's an existing verification record and rate limit
    const existingVerification = await query(`
      SELECT created_at FROM user_phone_verification
      WHERE phone_number = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [cleanedPhone]);

    if (existingVerification.rows.length > 0) {
      const lastSent = new Date(existingVerification.rows[0].created_at);
      const now = new Date();
      const timeDifference = (now - lastSent) / 1000; // seconds

      // Rate limit: allow resend only after 60 seconds
      if (timeDifference < 60) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(60 - timeDifference)} seconds before requesting another code`
        });
      }
    }

    // Generate new verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Update verification record
    const verificationQuery = `
      INSERT INTO user_phone_verification (user_id, phone_number, verification_code, expires_at, created_at)
      VALUES (NULL, $1, $2, CURRENT_TIMESTAMP + INTERVAL '10 minutes', CURRENT_TIMESTAMP)
      ON CONFLICT (phone_number)
      DO UPDATE SET
        verification_code = $2,
        is_verified = false,
        attempts = 0,
        created_at = CURRENT_TIMESTAMP,
        expires_at = CURRENT_TIMESTAMP + INTERVAL '10 minutes'
      RETURNING id
    `;

    await query(verificationQuery, [cleanedPhone, code]);

    // Send SMS
    const smsResult = await smsService.sendSMS(
      null, // no userId for registration flow
      cleanedPhone,
      `Your BeautyCita verification code is: ${code}. This code expires in 10 minutes.`,
      'PHONE_VERIFICATION'
    );

    if (smsResult.success) {
      return res.status(200).json({
        success: true,
        message: 'Verification code resent successfully',
        expiresIn: 600 // 10 minutes in seconds
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to resend verification code'
      });
    }

  } catch (error) {
    console.error('Resend phone verification error:', error);
    logger.error('Resend phone verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user profile - requires JWT authentication
router.get('/profile', async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7);
    const jwt = require('jsonwebtoken');

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'beautycita-secret');
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    const userId = decoded.id;

    // Get user data
    const userResult = await query(
      'SELECT id, first_name, last_name, name, email, phone, role, profile_picture_url, phone_verified, email_verified, is_active, profile_complete, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];
    const profileData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        profileImage: user.profile_picture_url,
        first_name: user.first_name,
        lastName: user.last_name,
        firstName: user.first_name,
        profilePictureUrl: user.profile_picture_url,
        phone_verified: user.phone_verified,
        email_verified: user.email_verified,
        isActive: user.is_active,
        emailVerified: user.email_verified,
        profileComplete: user.profile_complete,
        profile_complete: user.profile_complete
      }
    };

    // Get client or stylist data
    if (user.role === 'CLIENT') {
      const clientResult = await query('SELECT * FROM clients WHERE user_id = $1', [userId]);
      if (clientResult.rows.length > 0) {
        profileData.client = clientResult.rows[0];
      }
    } else if (user.role === 'STYLIST' || user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
      const stylistResult = await query('SELECT * FROM stylists WHERE user_id = $1', [userId]);
      if (stylistResult.rows.length > 0) {
        profileData.stylist = stylistResult.rows[0];
      }
    }

    res.json({
      success: true,
      data: profileData
    });

    logger.info('Profile data fetched successfully', { userId });
  } catch (error) {
    logger.error('Error fetching profile data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile data' });
  }
});

// Update user profile - requires JWT authentication
// Update user role (STYLIST or CLIENT)
router.patch('/update-role', async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7);
    const jwt = require('jsonwebtoken');

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'beautycita-secret');
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    const userId = decoded.id;
    const { role } = req.body;

    // Validate role
    if (!role || !['STYLIST', 'CLIENT'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be STYLIST or CLIENT'
      });
    }

    console.log(`🎯 Updating user ${userId} role to ${role}`);

    // Get user details
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user role
    await query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2',
      [role, userId]
    );

    // If role is STYLIST, create stylist profile if it doesn't exist
    if (role === 'STYLIST') {
      const stylistCheck = await query('SELECT id FROM stylists WHERE user_id = $1', [userId]);

      if (stylistCheck.rows.length === 0) {
        console.log(`📝 Creating stylist profile for user ${userId}`);

        const businessName = user.name || user.first_name + ' ' + user.last_name || 'New Stylist';

        await query(`
          INSERT INTO stylists (
            user_id, business_name, bio, specialties, experience_years,
            location_address, location_city, location_state, created_at, updated_at
          )
          VALUES ($1, $2, '', $3, 0, '', '', '', NOW(), NOW())
        `, [userId, businessName, []]);

        console.log(`✅ Stylist profile created for user ${userId}`);
      } else {
        console.log(`ℹ️ Stylist profile already exists for user ${userId}`);
      }
    }

    console.log(`✅ User ${userId} role updated to ${role}`);

    res.json({
      success: true,
      message: 'Role updated successfully',
      role
    });
  } catch (error) {
    console.error('❌ Error updating role:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Upgrade CLIENT to STYLIST (pending approval)
router.post('/upgrade-to-stylist', async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7);
    const jwt = require('jsonwebtoken');

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'beautycita-secret');
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    const userId = decoded.id;

    // Get user details
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already a STYLIST
    if (user.role === 'STYLIST') {
      return res.status(400).json({
        success: false,
        message: 'You are already a stylist'
      });
    }

    // Check if user is CLIENT
    if (user.role !== 'CLIENT') {
      return res.status(400).json({
        success: false,
        message: 'Only clients can upgrade to stylist'
      });
    }

    // Check if user already has pending application
    if (user.user_status === 'PENDING_STYLIST_APPROVAL') {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending stylist application'
      });
    }

    // Check if stylist profile exists
    const stylistCheck = await query('SELECT * FROM stylists WHERE user_id = $1', [userId]);

    if (stylistCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your stylist profile first',
        requiresProfileCompletion: true
      });
    }

    const stylist = stylistCheck.rows[0];

    // Validate required fields
    const validationErrors = [];

    if (!stylist.location_address || stylist.location_address.trim() === '') {
      validationErrors.push('Business address is required');
    }

    if (!stylist.location_city || stylist.location_city.trim() === '') {
      validationErrors.push('Business city is required');
    }

    if (!stylist.business_name || stylist.business_name.trim() === '') {
      validationErrors.push('Business name is required');
    }

    if (!stylist.bio || stylist.bio.trim() === '') {
      validationErrors.push('Bio is required');
    }

    if (!stylist.specialties || stylist.specialties.length === 0) {
      validationErrors.push('At least one specialty is required');
    }

    if (!stylist.portfolio_images || stylist.portfolio_images.length === 0) {
      validationErrors.push('At least one portfolio image is required');
    }

    // Check Stripe onboarding
    if (!stylist.stripe_onboarding_complete) {
      validationErrors.push('Stripe onboarding must be completed');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Profile incomplete',
        validationErrors,
        requiresProfileCompletion: true
      });
    }

    console.log(`🎯 Processing stylist upgrade for user ${userId}`);

    // Update user status to pending approval
    await query(
      'UPDATE users SET user_status = $1, updated_at = NOW() WHERE id = $2',
      ['PENDING_STYLIST_APPROVAL', userId]
    );

    console.log(`✅ User ${userId} status updated to PENDING_STYLIST_APPROVAL`);

    // TODO: Send notification to admins about new stylist application
    // This could be implemented via email or in-app notification system

    res.json({
      success: true,
      message: 'Your stylist application has been submitted for review. We will notify you once approved.',
      status: 'PENDING_STYLIST_APPROVAL'
    });
  } catch (error) {
    console.error('❌ Error upgrading to stylist:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.patch('/profile', async (req, res) => {
  try {
    // DEBUG: Log incoming request
    console.log('🔍 [PROFILE_UPDATE] Request received:', {
      body: req.body,
      headers: {
        authorization: req.headers.authorization ? 'Bearer [TOKEN]' : 'MISSING',
        contentType: req.headers['content-type']
      },
      timestamp: new Date().toISOString()
    });

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [PROFILE_UPDATE] No auth token provided');
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7);
    const jwt = require('jsonwebtoken');

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'beautycita-secret');
      console.log('✅ [PROFILE_UPDATE] Token verified for user:', decoded.id);
    } catch (error) {
      console.log('❌ [PROFILE_UPDATE] Invalid token:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    const userId = decoded.id;
    const { firstName, lastName, phone, profilePictureUrl, email, profile_complete, username } = req.body;

    console.log('📝 [PROFILE_UPDATE] Fields to update:', {
      userId,
      firstName: firstName !== undefined ? firstName : '[NOT PROVIDED]',
      lastName: lastName !== undefined ? lastName : '[NOT PROVIDED]',
      phone: phone !== undefined ? phone : '[NOT PROVIDED]',
      profilePictureUrl: profilePictureUrl !== undefined ? profilePictureUrl : '[NOT PROVIDED]',
      email: email !== undefined ? email : '[NOT PROVIDED]',
      profile_complete: profile_complete !== undefined ? profile_complete : '[NOT PROVIDED]',
      username: username !== undefined ? username : '[NOT PROVIDED]'
    });

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (firstName !== undefined) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(lastName);
    }
    if (firstName !== undefined || lastName !== undefined) {
      const name = `${firstName || ''} ${lastName || ''}`.trim();
      updates.push(`name = $${paramCount++}`);
      values.push(name);
      console.log('📝 [PROFILE_UPDATE] Computed full name:', name);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (profilePictureUrl !== undefined) {
      updates.push(`profile_picture_url = $${paramCount++}`);
      values.push(profilePictureUrl);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (profile_complete !== undefined) {
      updates.push(`profile_complete = $${paramCount++}`);
      values.push(profile_complete);
      console.log('📝 [PROFILE_UPDATE] Setting profile_complete to:', profile_complete);
    }
    if (username !== undefined) {
      // Validate username format
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        console.log('❌ [PROFILE_UPDATE] Invalid username format:', username);
        return res.status(400).json({
          success: false,
          message: 'Username must be 3-20 characters (letters, numbers, underscores only)'
        });
      }

      // Check if username is already taken by another user
      const existingUsername = await query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username.toLowerCase(), userId]
      );

      if (existingUsername.rows.length > 0) {
        console.log('❌ [PROFILE_UPDATE] Username already taken:', username);
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }

      updates.push(`username = $${paramCount++}`);
      values.push(username.toLowerCase());
      updates.push(`username_last_changed = $${paramCount++}`);
      values.push(new Date());
    }

    if (updates.length === 0) {
      console.log('⚠️ [PROFILE_UPDATE] No fields to update');
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updates.push(`updated_at = $${paramCount++}`);
    values.push(new Date());
    values.push(userId);

    const updateQuery = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, first_name, last_name, name, email, phone, role, profile_picture_url, phone_verified, email_verified, is_active, profile_complete, username
    `;

    console.log('🗄️ [PROFILE_UPDATE] Executing query:', {
      updates: updates,
      valuesCount: values.length,
      userId: userId
    });

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      console.log('❌ [PROFILE_UPDATE] User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updatedUser = result.rows[0];

    console.log('✅ [PROFILE_UPDATE] Successfully updated user:', {
      userId: updatedUser.id,
      name: updatedUser.name,
      profile_complete: updatedUser.profile_complete,
      updated_at: updatedUser.updated_at
    });

    const responseData = {
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone,
        profileImage: updatedUser.profile_picture_url,
        first_name: updatedUser.first_name,
        lastName: updatedUser.last_name,
        firstName: updatedUser.first_name,
        profilePictureUrl: updatedUser.profile_picture_url,
        phone_verified: updatedUser.phone_verified,
        email_verified: updatedUser.email_verified,
        isActive: updatedUser.is_active,
        emailVerified: updatedUser.email_verified,
        profile_complete: updatedUser.profile_complete,
        username: updatedUser.username
      }
    };

    console.log('📤 [PROFILE_UPDATE] Sending response:', {
      success: true,
      userId: updatedUser.id,
      dataKeys: Object.keys(responseData.data)
    });

    res.json(responseData);

    logger.info('Profile updated successfully', { userId });
  } catch (error) {
    console.error('💥 [PROFILE_UPDATE] Error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    logger.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// Check Username Availability
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`🔍 [DEBUG] Checking username availability: "${username}"`);

    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      console.log(`❌ [DEBUG] Username format invalid: "${username}"`);
      return res.json({
        available: false,
        message: 'Username must be 3-20 characters (letters, numbers, underscores only)'
      });
    }

    // Check if username exists
    const result = await query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1)',
      [username]
    );

    const available = result.rows.length === 0;
    console.log(`${available ? '✅' : '❌'} [DEBUG] Username "${username}" - Available: ${available}`);

    res.json({
      available,
      message: available ? 'Username available' : 'Username already taken'
    });

    logger.info('Username availability checked', { username, available });
  } catch (error) {
    console.error(`❌ [DEBUG] Error checking username "${username}":`, error.message);
    logger.error('Error checking username:', error);
    res.status(500).json({ available: false, message: 'Failed to check username availability' });
  }
});

// Password Reset Request
router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const userResult = await query(
      'SELECT id, email, first_name FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    // Always return success to prevent email enumeration
    if (userResult.rows.length === 0) {
      logger.info('Password reset requested for non-existent email', { email });
      return res.json({
        success: true,
        message: 'If an account exists with that email, you will receive a password reset link.'
      });
    }

    const user = userResult.rows[0];

    // Generate secure random token
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token
    await query(
      `INSERT INTO password_resets (user_id, email, token, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, user.email, token, expiresAt, req.ip, req.get('User-Agent')]
    );

    // Send password reset email
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    try {
      await emailService.sendPasswordResetEmail(user.email, resetLink, user.first_name);
      logger.info('Password reset email sent successfully', {
        userId: user.id,
        email: user.email,
        expiresAt
      });
    } catch (emailError) {
      logger.error('Failed to send password reset email', {
        userId: user.id,
        email: user.email,
        error: emailError.message
      });
      // Don't fail the request if email fails - user can try again
    }

    // In development, return the link in response (remove in production)
    if (process.env.NODE_ENV === 'development') {
      return res.json({
        success: true,
        message: 'Password reset link generated',
        resetLink // Only for development
      });
    }

    res.json({
      success: true,
      message: 'If an account exists with that email, you will receive a password reset link.'
    });

  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify Reset Token
router.get('/reset-password/:token', passwordResetLimiter, async (req, res) => {
  try {
    const { token } = req.params;

    const result = await query(
      `SELECT pr.*, u.email, u.first_name
       FROM password_resets pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.token = $1 AND pr.used = false AND pr.expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.json({
      success: true,
      data: {
        email: result.rows[0].email,
        firstName: result.rows[0].first_name
      }
    });

  } catch (error) {
    logger.error('Verify reset token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reset Password
router.post('/reset-password', passwordResetLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check for password complexity (uppercase, lowercase, and number)
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      });
    }

    // Find valid reset token
    const resetResult = await query(
      `SELECT pr.*, u.id as user_id
       FROM password_resets pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.token = $1 AND pr.used = false AND pr.expires_at > NOW()`,
      [token]
    );

    if (resetResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    const resetRecord = resetResult.rows[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and mark token as used
    await query('BEGIN');

    try {
      await query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [hashedPassword, resetRecord.user_id]
      );

      await query(
        'UPDATE password_resets SET used = true, used_at = NOW() WHERE id = $1',
        [resetRecord.id]
      );

      await query('COMMIT');

      logger.info('Password reset successful', {
        userId: resetRecord.user_id,
        email: resetRecord.email
      });

      // Send password change notification email
      try {
        // Get user details for notification
        const userDetails = await query(
          'SELECT first_name FROM users WHERE id = $1',
          [resetRecord.user_id]
        );

        await emailService.sendPasswordChangeNotification(
          resetRecord.email,
          userDetails.rows[0]?.first_name,
          req.ip,
          req.get('User-Agent')
        );

        logger.info('Password change notification sent', {
          userId: resetRecord.user_id,
          email: resetRecord.email
        });
      } catch (emailError) {
        logger.error('Failed to send password change notification', {
          userId: resetRecord.user_id,
          email: resetRecord.email,
          error: emailError.message
        });
        // Don't fail the request if email notification fails
      }

      res.json({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Simple SMS verification for unified auth with smart routing
router.post('/send-verification-code', authLimiter, async (req, res) => {
  try {
    const { phone, forceCountryCode } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Extract just the digits (10-digit number)
    const phoneDigits = phone.replace(/\D/g, '');

    if (phoneDigits.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit phone number'
      });
    }

    const areaCode = phoneDigits.substring(0, 3);
    const ipAddress = getClientIP(req);

    let countryCode;
    let decisionReason;

    // Priority 1: User override (from retry)
    if (forceCountryCode) {
      countryCode = forceCountryCode;
      decisionReason = 'user_override';
      console.log(`📱 Using user override: ${countryCode}`);
    }
    // Priority 2: AI prediction (only if confidence >= 95% AND >= 20 samples)
    else {
      const aiPrediction = getAreaCodePrediction(areaCode);

      if (aiPrediction.shouldUseAI) {
        countryCode = aiPrediction.predictedCountryCode;
        decisionReason = `ai_${(aiPrediction.confidence * 100).toFixed(1)}%`;
        console.log(`✨ AI Prediction: ${aiPrediction.reasoning}`);
      }
      // Priority 3: IP geolocation
      else {
        console.log(`⚠️  AI skipped: ${aiPrediction.reason}`);
        const ipCountry = await getCountryFromIP(ipAddress);
        countryCode = countryToPhoneCode(ipCountry);
        decisionReason = `ip_${ipCountry}`;
        console.log(`🌍 Using IP geolocation: ${ipAddress} → ${ipCountry} → ${countryCode}`);
      }
    }

    const fullPhone = `${countryCode}${phoneDigits}`;

    // Generate 6-digit verification code
    const verificationCode = smsService.generateVerificationCode();

    // Store code in database with 10-minute expiration
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await query(`
      INSERT INTO verification_codes (phone, code, expires_at, created_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (phone)
      DO UPDATE SET code = $2, expires_at = $3, created_at = $4
    `, [fullPhone, verificationCode, expiresAt, new Date()]);

    // Send SMS with Web OTP format for browser autofill
    let smsSent = false;
    let twilioErrorMessage = null;

    try {
      // Format message with Web OTP format for browser autofill
      // Format: "Your message\n\n@domain #code"
      const smsMessage = `Your BeautyCita verification code is: ${verificationCode}

@beautycita.com #${verificationCode}`;

      // Use manual SMS sending with Web OTP format
      const smsResult = await smsService.sendSMS(
        null, // no userId for registration flow
        fullPhone,
        smsMessage,
        'PHONE_VERIFICATION'
      );

      if (smsResult.success) {
        console.log(`✅ Verification code sent with Web OTP format to ${fullPhone}`);
        smsSent = true;
      } else {
        twilioErrorMessage = smsResult.error || 'SMS delivery failed';
        console.error(`❌ Failed to send SMS to ${fullPhone}:`, twilioErrorMessage);
        console.log(`📱 DEVELOPMENT: Verification code for ${fullPhone}: ${verificationCode}`);
      }
    } catch (smsError) {
      twilioErrorMessage = smsError.message || 'Unknown error';
      console.error(`❌ Failed to send SMS to ${fullPhone}:`, twilioErrorMessage);
      console.log(`📱 DEVELOPMENT: Verification code for ${fullPhone}: ${verificationCode}`);
    }

    // Log the attempt to database for learning
    await query(`
      INSERT INTO verification_attempts
        (phone_digits, area_code, attempted_country_code, ip_address, ip_country, success, twilio_error, decision_reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      phoneDigits,
      areaCode,
      countryCode,
      ipAddress,
      null, // Will be filled by background job if needed
      smsSent,
      twilioErrorMessage,
      decisionReason
    ]);

    // If SMS failed, suggest retry with opposite country code
    if (!smsSent) {
      const oppositeCode = countryCode === '+1' ? '+52' : '+1';

      return res.json({
        success: false,
        triedCountryCode: countryCode,
        suggestedRetry: oppositeCode,
        canRetry: true,
        errorMessage: 'SMS delivery failed'
      });
    }

    // Success
    res.json({
      success: true,
      message: 'Verification code sent successfully'
    });

  } catch (error) {
    logger.error('Send verification code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification code'
    });
  }
});

router.post('/verify-code', async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and code are required'
      });
    }

    const phoneDigits = phone.replace(/\D/g, '');
    let verifiedPhone = null;

    // Try Twilio Verify API first (production)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID) {
      try {
        const twilio = require('twilio');
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

        // Find the full phone number from database to verify
        const phoneQuery = await query(`
          SELECT phone FROM verification_codes
          WHERE phone LIKE '%' || $1
          ORDER BY created_at DESC LIMIT 1
        `, [phoneDigits]);

        if (phoneQuery.rows.length > 0) {
          verifiedPhone = phoneQuery.rows[0].phone;

          // Verify with Twilio Verify API
          const verificationCheck = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verificationChecks
            .create({
              to: verifiedPhone,
              code: code
            });

          if (verificationCheck.status === 'approved') {
            console.log(`✅ Twilio Verify: Code verified for ${verifiedPhone}`);

            // Delete from database after successful verification
            await query('DELETE FROM verification_codes WHERE phone = $1', [verifiedPhone]);

            return res.json({
              success: true,
              message: 'Phone number verified successfully',
              phone: verifiedPhone
            });
          }
        }
      } catch (twilioError) {
        console.warn('⚠️ Twilio Verify check failed, falling back to database:', twilioError.message);
      }
    }

    // Fallback: Check database (for development or if Twilio Verify fails)
    const result = await query(`
      SELECT * FROM verification_codes
      WHERE phone LIKE '%' || $1 AND code = $2 AND expires_at > NOW()
    `, [phoneDigits, code]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    verifiedPhone = result.rows[0].phone;
    console.log(`✅ Database: Code verified for ${verifiedPhone}`);

    res.json({
      success: true,
      message: 'Phone number verified successfully',
      phone: verifiedPhone
    });

  } catch (error) {
    logger.error('Verify code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify code'
    });
  }
});

// Retry verification with alternate country code
router.post('/retry-verification', authLimiter, async (req, res) => {
  try {
    const { phone, previousCountryCode } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Toggle country code
    const oppositeCode = previousCountryCode === '+1' ? '+52' : '+1';

    // Forward to send-verification-code with forceCountryCode
    req.body.forceCountryCode = oppositeCode;

    // Reuse the send-verification-code logic (just make the request internally)
    const phoneDigits = phone.replace(/\D/g, '');
    const fullPhone = `${oppositeCode}${phoneDigits}`;
    const areaCode = phoneDigits.substring(0, 3);
    const ipAddress = getClientIP(req);

    // Generate new code
    const verificationCode = smsService.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await query(`
      INSERT INTO verification_codes (phone, code, expires_at, created_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (phone)
      DO UPDATE SET code = $2, expires_at = $3, created_at = $4
    `, [fullPhone, verificationCode, expiresAt, new Date()]);

    let smsSent = false;
    let twilioErrorMessage = null;

    try {
      // Format message with Web OTP format for browser autofill
      const smsMessage = `Your BeautyCita verification code is: ${verificationCode}

@beautycita.com #${verificationCode}`;

      // Use manual SMS sending with Web OTP format for retry
      const smsResult = await smsService.sendSMS(
        null, // no userId for registration flow
        fullPhone,
        smsMessage,
        'PHONE_VERIFICATION'
      );

      if (smsResult.success) {
        console.log(`✅ Retry verification sent with Web OTP format to ${fullPhone}`);
        smsSent = true;
      } else {
        twilioErrorMessage = smsResult.error || 'SMS delivery failed';
        console.error(`❌ Failed to send retry SMS to ${fullPhone}:`, twilioErrorMessage);
      }
    } catch (smsError) {
      twilioErrorMessage = smsError.message || 'Unknown error';
      console.error(`❌ Failed to send retry SMS to ${fullPhone}:`, twilioErrorMessage);
    }

    // Log retry attempt
    await query(`
      INSERT INTO verification_attempts
        (phone_digits, area_code, attempted_country_code, ip_address, success, twilio_error, decision_reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [phoneDigits, areaCode, oppositeCode, ipAddress, smsSent, twilioErrorMessage, 'user_retry']);

    if (!smsSent) {
      return res.json({
        success: false,
        triedCountryCode: oppositeCode,
        errorMessage: 'SMS delivery failed on retry',
        // Only show code in development/testing
        ...(process.env.NODE_ENV !== 'production' && { verificationCode, expiresIn: 600 })
      });
    }

    res.json({
      success: true,
      message: `Verification code sent to ${oppositeCode}${phoneDigits}`
    });

  } catch (error) {
    logger.error('Retry verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry verification'
    });
  }
});

/**
 * POST /api/auth/register-simple
 * Simple phone-only registration - verify code and create account
 */
router.post('/register-simple', async (req, res) => {
  const ipAddress = getClientIP(req);
  const startTime = Date.now();

  try {
    const { phoneNumber, verificationCode, role = 'CLIENT' } = req.body;

    console.log('📝 SIMPLE REGISTRATION REQUEST:', {
      phoneNumber,
      role,
      ip: ipAddress,
      timestamp: new Date().toISOString()
    });

    if (!phoneNumber || !verificationCode) {
      console.log('❌ Registration failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Phone number and verification code are required'
      });
    }

    // Verify the code from database
    const codeCheck = await query(
      'SELECT * FROM verification_codes WHERE phone = $1 AND code = $2 AND expires_at > NOW() LIMIT 1',
      [phoneNumber, verificationCode]
    );

    if (codeCheck.rows.length === 0) {
      console.log('❌ Verification failed for:', phoneNumber);

      // Log failed verification attempt for AI monitoring
      const phoneDigits = phoneNumber.replace(/\D/g, '');
      const areaCode = phoneDigits.substring(0, 3);
      await query(`
        INSERT INTO verification_attempts
          (phone_digits, area_code, attempted_country_code, ip_address, success, decision_reason)
        VALUES ($1, $2, $3, $4, false, 'verification_failed')
      `, [
        phoneDigits,
        areaCode,
        phoneNumber.substring(0, 3),
        ipAddress
      ]).catch(err => console.error('Failed to log verification attempt:', err));

      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    // Delete used verification code
    await query('DELETE FROM verification_codes WHERE phone = $1', [phoneNumber]);

    console.log('✅ Code verified successfully for:', phoneNumber);

    // Check if user exists
    const existingUser = await query('SELECT * FROM users WHERE phone = $1', [phoneNumber]);

    if (existingUser.rows.length > 0) {
      console.log('❌ Registration failed: Phone already exists:', phoneNumber);
      return res.status(400).json({
        success: false,
        message: 'An account with this phone number already exists'
      });
    }

    // Generate auto-username from phone (last 4 digits)
    const phoneDigits = phoneNumber.replace(/\D/g, '');
    const last4 = phoneDigits.slice(-4);
    let autoUsername = `user_${last4}`;

    // Check if username is taken, append random suffix if needed
    const usernameCheck = await query('SELECT id FROM users WHERE username = $1', [autoUsername]);
    if (usernameCheck.rows.length > 0) {
      const randomSuffix = Math.floor(Math.random() * 1000);
      autoUsername = `user_${last4}_${randomSuffix}`;
    }

    // Create user
    const result = await query(`
      INSERT INTO users (
        name, first_name, last_name, email, phone, username, role,
        email_verified, phone_verified, provider, profile_complete,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, false, true, 'local', false, NOW(), NOW())
      RETURNING *
    `, [
      `User ${phoneNumber.slice(-4)}`, // Temporary name
      'User',
      phoneNumber.slice(-4),
      `temp_${phoneNumber}@beautycita.temp`,
      phoneNumber,
      autoUsername,
      role
    ]);

    const user = result.rows[0];

    // Create role-specific profile
    if (role === 'CLIENT') {
      await query(`
        INSERT INTO clients (user_id, total_bookings, average_rating, created_at, updated_at)
        VALUES ($1, 0, 0.00, NOW(), NOW())
      `, [user.id]);
    } else if (role === 'STYLIST') {
      const tempBusinessName = `Stylist${phoneNumber.slice(-4)}`;
      await query(`
        INSERT INTO stylists (
          user_id, business_name, bio, specialties, experience_years,
          location_address, location_city, location_state, created_at, updated_at
        )
        VALUES ($1, $2, '', $3, 0, 'To be updated', 'To be updated', '', NOW(), NOW())
      `, [user.id, tempBusinessName, []]);
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

    // Generate JWT token
    const jwt = require('jsonwebtoken');
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

    // Log successful registration for AI monitoring
    const processingTime = Date.now() - startTime;
    console.log('✅ REGISTRATION SUCCESS:', {
      userId: user.id,
      phoneNumber,
      role,
      ip: ipAddress,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString()
    });

    // Log successful verification attempt for AI monitoring
    const phoneDigitsSuccess = phoneNumber.replace(/\D/g, '');
    const areaCodeSuccess = phoneDigitsSuccess.substring(0, 3);
    await query(`
      INSERT INTO verification_attempts
        (phone_digits, area_code, attempted_country_code, ip_address, success, decision_reason)
      VALUES ($1, $2, $3, $4, true, 'registration_success')
    `, [
      phoneDigitsSuccess,
      areaCodeSuccess,
      phoneNumber.substring(0, 3),
      ipAddress
    ]).catch(err => console.error('Failed to log verification success:', err));

    res.json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileComplete: false
      }
    });

  } catch (error) {
    console.error('Simple registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/complete-profile
 * Complete minimal user profile after biometric registration
 */
router.post('/complete-profile', async (req, res) => {
  try {
    const { firstName, lastName, businessName, email } = req.body;

    // Get user from token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided'
      });
    }

    const token = authHeader.substring(7);
    const jwt = require('jsonwebtoken');
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'beautycita-secret');
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    const userId = decoded.id;

    if (!firstName || !email) {
      return res.status(400).json({
        success: false,
        message: 'First name and email are required'
      });
    }

    // Get user's current role
    const userResult = await query('SELECT role FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const role = userResult.rows[0].role;

    // Validate last name is required for clients
    if (role === 'CLIENT' && !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Last name is required for clients'
      });
    }

    // Build full name
    let fullName;
    if (role === 'STYLIST') {
      fullName = businessName && businessName.trim() ? businessName.trim() : firstName.trim();
    } else {
      fullName = `${firstName.trim()} ${lastName?.trim() || ''}`.trim();
    }

    // Update user profile
    await query(`
      UPDATE users
      SET first_name = $1,
          last_name = $2,
          name = $3,
          email = $4,
          profile_complete = true,
          updated_at = NOW()
      WHERE id = $5
    `, [
      firstName.trim(),
      lastName?.trim() || '',
      fullName,
      email.trim(),
      userId
    ]);

    // Update stylist business name if provided
    if (role === 'STYLIST' && businessName && businessName.trim()) {
      await query(`
        UPDATE stylists
        SET business_name = $1,
            updated_at = NOW()
        WHERE user_id = $2
      `, [businessName.trim(), userId]);
    }

    // Get updated user
    const updatedUserResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    const updatedUser = updatedUserResult.rows[0];

    res.json({
      success: true,
      message: 'Profile completed successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        profileComplete: true
      }
    });

  } catch (error) {
    console.error('Profile completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'beautycita-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.userId = user.id;
    next();
  });
};

/**
 * POST /api/auth/set-password
 * Set password for user account (for desktop users without biometric auth)
 */
router.post('/set-password', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.userId; // from JWT token

    // Validate password
    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Validate password strength
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain uppercase, lowercase, and numbers'
      });
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user record
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );

    console.log(`✅ Password set successfully for user ${userId}`);

    res.json({
      success: true,
      message: 'Password set successfully'
    });
  } catch (error) {
    console.error('Set password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== DEVICE LINKING ====================
// Add these routes to authRoutes.js

router.post('/webauthn/generate-link', validateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const crypto = require('crypto');
    
    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    // Store token in database
    await query(
      `INSERT INTO device_link_tokens (user_id, token, expires_at, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET token = $2, expires_at = $3, used = FALSE, created_at = NOW()`,
      [userId, token, expiresAt]
    );
    
    const linkUrl = process.env.FRONTEND_URL + '/link-device/' + token;
    
    res.json({
      success: true,
      token,
      url: linkUrl,
      expiresAt
    });
  } catch (error) {
    console.error('Device link generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate device link'
    });
  }
});

router.get('/webauthn/credentials', validateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    
    const result = await query(
      `SELECT id, credential_id, public_key, counter, device_type, created_at, last_used
       FROM webauthn_credentials
       WHERE user_id = $1
       ORDER BY last_used DESC`,
      [userId]
    );
    
    res.json({
      success: true,
      credentials: result.rows.map(row => ({
        id: row.id,
        name: row.device_type || 'Biometric Device',
        credentialId: row.credential_id,
        createdAt: row.created_at,
        lastUsed: row.last_used
      }))
    });
  } catch (error) {
    console.error('Failed to fetch credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch credentials'
    });
  }
});

router.delete('/webauthn/credentials/:id', validateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const credentialId = req.params.id;
    
    const result = await query(
      'DELETE FROM webauthn_credentials WHERE id = $1 AND user_id = $2 RETURNING id',
      [credentialId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Device removed successfully'
    });
  } catch (error) {
    console.error('Failed to remove credential:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove device'
    });
  }
});

// ==================== LOGIN HISTORY TRACKING ====================
// Add this helper function to track logins

async function trackLoginHistory(userId, req) {
  try {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';
    
    // Parse user agent
    const device = getDeviceFromUserAgent(userAgent);
    const location = 'Unknown'; // You can integrate IP geolocation service here
    
    await query(
      `INSERT INTO login_history (user_id, device, location, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId, device, location, ip, userAgent]
    );
    
    // Keep only last 50 login records per user
    await query(
      `DELETE FROM login_history 
       WHERE user_id = $1 
       AND id NOT IN (
         SELECT id FROM login_history 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 50
       )`,
      [userId]
    );
  } catch (error) {
    console.error('Failed to track login history:', error);
    // Don't fail login if history tracking fails
  }
}

function getDeviceFromUserAgent(userAgent) {
  if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS Device';
  if (/Android/.test(userAgent)) return 'Android Device';
  if (/Windows/.test(userAgent)) return 'Windows PC';
  if (/Mac/.test(userAgent)) return 'Mac';
  if (/Linux/.test(userAgent)) return 'Linux';
  return 'Unknown Device';
}

router.get('/login-history', validateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const sessionId = req.sessionID || req.headers['x-session-id'];
    
    const result = await query(
      `SELECT id, device, location, ip_address, created_at
       FROM login_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );
    
    res.json({
      success: true,
      history: result.rows.map((row, index) => ({
        id: row.id,
        device: row.device,
        location: row.location,
        ip: row.ip_address,
        timestamp: row.created_at,
        current: index === 0 // Most recent is current session
      }))
    });
  } catch (error) {
    console.error('Failed to fetch login history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch login history'
    });
  }
});

// ==================== 2FA STATUS ====================
// Add to twoFactorRoutes.js

router.get('/status', validateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    
    const result = await query(
      'SELECT two_factor_enabled FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      enabled: result.rows[0].two_factor_enabled || false
    });
  } catch (error) {
    console.error('Failed to get 2FA status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get 2FA status'
    });
  }
});


module.exports = router;
