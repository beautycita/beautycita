import express from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import {
  authenticateUser,
  createUser,
  createStylistProfile,
  createClientProfile,
  generateEmailVerificationToken,
  verifyEmail
} from '../services/auth.js';
import { sendEmail } from '../services/email.js';
import { query } from '../services/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Registration validation
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('role')
    .isIn(['CLIENT', 'STYLIST'])
    .withMessage('Role must be either CLIENT or STYLIST')
];

// Login validation
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Register endpoint
router.post('/register', registerValidation, validateRequest, async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role, profileData } = req.body;

    // Create user
    const user = await createUser({
      email,
      password,
      firstName,
      lastName,
      role
    });

    // Create role-specific profile
    let profile = null;
    if (role === 'STYLIST') {
      profile = await createStylistProfile(user.id, profileData || {});
    } else if (role === 'CLIENT') {
      profile = await createClientProfile(user.id, profileData || {});
    }

    // Generate email verification token
    const verificationToken = generateEmailVerificationToken(email);

    // Send verification email
    try {
      await sendEmail({
        to: email,
        subject: '¡Bienvenido a BeautyCita! - Verifica tu email',
        template: 'email-verification',
        data: {
          firstName,
          verificationLink: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
        }
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      profile
    });

  } catch (error) {
    next(error);
  }
});

// Login endpoint
router.post('/login', loginValidation, validateRequest, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authenticateUser(email, password);

    res.json({
      message: 'Login successful',
      user: result.user,
      token: result.token
    });

  } catch (error) {
    // Convert auth errors to 401 status
    if (error.message.includes('Invalid credentials') ||
        error.message.includes('Please verify your email') ||
        error.message.includes('Please sign in with Google')) {
      return res.status(401).json({
        error: error.message,
        code: 'AUTH_FAILED'
      });
    }
    next(error);
  }
});

// Email verification endpoint
router.post('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Verification token is required',
        code: 'TOKEN_REQUIRED'
      });
    }

    await verifyEmail(token);

    res.json({
      message: 'Email verified successfully. You can now sign in.'
    });

  } catch (error) {
    return res.status(400).json({
      error: error.message,
      code: 'VERIFICATION_FAILED'
    });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        code: 'EMAIL_REQUIRED'
      });
    }

    // Generate new verification token
    const verificationToken = generateEmailVerificationToken(email);

    // Send verification email
    await sendEmail({
      to: email,
      subject: 'BeautyCita - Verificación de email',
      template: 'email-verification',
      data: {
        verificationLink: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
      }
    });

    res.json({
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    next(error);
  }
});

// Password reset request
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        code: 'EMAIL_REQUIRED'
      });
    }

    // Always return success to prevent email enumeration
    res.json({
      message: 'If an account with this email exists, you will receive password reset instructions.'
    });

    // TODO: Implement password reset logic

  } catch (error) {
    next(error);
  }
});

// Get current user profile (requires authentication)
router.get('/profile', authMiddleware, async (req, res, next) => {
  try {
    // This endpoint requires authMiddleware to be applied in server.js
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Fetch complete user profile including role-specific data
    const user = req.user;
    let profile = null;

    if (user.role === 'STYLIST') {
      // Get stylist profile
      profile = await query(`
        SELECT * FROM stylists WHERE user_id = $1
      `, [user.id]);
    } else if (user.role === 'CLIENT') {
      // Get client profile
      profile = await query(`
        SELECT * FROM clients WHERE user_id = $1
      `, [user.id]);
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      ...(user.role === 'STYLIST' && profile?.rows?.[0] ? { stylist: profile.rows[0] } : {}),
      ...(user.role === 'CLIENT' && profile?.rows?.[0] ? { client: profile.rows[0] } : {})
    });

  } catch (error) {
    next(error);
  }
});

// Health check for auth service
router.get('/health', (req, res) => {
  res.json({
    service: 'auth',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;