/**
 * Phone Verification Middleware
 * Ensures users have verified their phone numbers before performing certain actions
 */

const { query } = require('../db');

/**
 * Middleware to check if user has verified their phone number
 * Blocks booking-related operations for unverified users
 */
const requirePhoneVerification = async (req, res, next) => {
  try {
    // Skip verification for certain endpoints that don't require it
    const skipPaths = [
      '/api/auth/verify-phone',
      '/api/auth/send-verification',
      '/api/auth/resend-verification',
      '/api/auth/profile',
      '/api/users/profile'
    ];

    if (skipPaths.some(path => req.originalUrl.includes(path))) {
      return next();
    }

    // Get user ID from JWT (assumes JWT middleware ran first)
    const userId = req.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check user's phone verification status
    const userResult = await query(
      'SELECT phone_verified, phone FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];

    // If phone is not verified, block the request
    if (!user.phone_verified) {
      return res.status(403).json({
        success: false,
        message: 'Phone verification required to perform this action',
        code: 'PHONE_VERIFICATION_REQUIRED',
        data: {
          requiresPhoneVerification: true,
          hasPhone: !!user.phone,
          phone: user.phone ? user.phone.replace(/(\d{3})\d{3}(\d{4})/, '$1***$2') : null
        }
      });
    }

    // User is verified, proceed
    next();
  } catch (error) {
    console.error('Phone verification middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Optional phone verification middleware - warns but doesn't block
 * Useful for endpoints where verification is recommended but not required
 */
const suggestPhoneVerification = async (req, res, next) => {
  try {
    const userId = req.userId || req.user?.id;

    if (!userId) {
      return next(); // Skip if no user (let other middleware handle auth)
    }

    const userResult = await query(
      'SELECT phone_verified FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length > 0 && !userResult.rows[0].phone_verified) {
      // Add suggestion to response (will be picked up by response interceptor if implemented)
      req.phoneVerificationSuggested = true;
    }

    next();
  } catch (error) {
    console.error('Phone verification suggestion middleware error:', error);
    next(); // Don't block on error
  }
};

module.exports = {
  requirePhoneVerification,
  suggestPhoneVerification
};