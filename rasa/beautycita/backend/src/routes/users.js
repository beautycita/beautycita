import express from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import { requireRole } from '../middleware/auth.js';
import { query } from '../services/database.js';
import { hashPassword } from '../services/auth.js';

const router = express.Router();

// Get current user profile
router.get('/profile', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        u.id, u.email, u.first_name, u.last_name, u.role,
        u.phone, u.profile_picture_url, u.language_preference,
        u.email_verified, u.created_at,
        CASE
          WHEN u.role = 'CLIENT' THEN json_build_object(
            'id', c.id,
            'dateOfBirth', c.date_of_birth,
            'gender', c.gender,
            'skinType', c.skin_type,
            'hairType', c.hair_type,
            'preferredStyles', c.preferred_styles,
            'budgetRange', c.budget_range,
            'locationCity', c.location_city,
            'locationState', c.location_state,
            'notificationPreferences', c.notification_preferences
          )
          WHEN u.role = 'STYLIST' THEN json_build_object(
            'id', s.id,
            'businessName', s.business_name,
            'bio', s.bio,
            'specialties', s.specialties,
            'experienceYears', s.experience_years,
            'locationAddress', s.location_address,
            'locationCity', s.location_city,
            'locationState', s.location_state,
            'locationZip', s.location_zip,
            'pricingTier', s.pricing_tier,
            'portfolioImages', s.portfolio_images,
            'socialMediaLinks', s.social_media_links,
            'workingHours', s.working_hours,
            'isVerified', s.is_verified,
            'ratingAverage', s.rating_average,
            'ratingCount', s.rating_count,
            'totalBookings', s.total_bookings,
            'isAcceptingBookings', s.is_accepting_bookings
          )
        END as profile_data
      FROM users u
      LEFT JOIN clients c ON u.id = c.user_id AND u.role = 'CLIENT'
      LEFT JOIN stylists s ON u.id = s.user_id AND u.role = 'STYLIST'
      WHERE u.id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    next(error);
  }
});

// Update user profile
router.patch('/profile',
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }),
  body('phone').optional().isMobilePhone(),
  body('languagePreference').optional().isIn(['en-US', 'es-MX']),
  validateRequest,
  async (req, res, next) => {
    try {
      const { firstName, lastName, phone, languagePreference } = req.body;

      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (firstName !== undefined) {
        updates.push(`first_name = $${paramIndex++}`);
        values.push(firstName);
      }
      if (lastName !== undefined) {
        updates.push(`last_name = $${paramIndex++}`);
        values.push(lastName);
      }
      if (phone !== undefined) {
        updates.push(`phone = $${paramIndex++}`);
        values.push(phone);
      }
      if (languagePreference !== undefined) {
        updates.push(`language_preference = $${paramIndex++}`);
        values.push(languagePreference);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update',
          code: 'NO_UPDATES'
        });
      }

      values.push(req.user.id);

      const result = await query(`
        UPDATE users
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramIndex}
        RETURNING id, email, first_name, last_name, phone, language_preference
      `, values);

      res.json({
        message: 'Profile updated successfully',
        user: result.rows[0]
      });

    } catch (error) {
      next(error);
    }
  }
);

// Update client profile
router.patch('/profile/client',
  requireRole('CLIENT'),
  body('dateOfBirth').optional().isISO8601().toDate(),
  body('gender').optional().isIn(['male', 'female', 'non-binary', 'prefer-not-to-say']),
  body('skinType').optional().isIn(['oily', 'dry', 'combination', 'sensitive', 'normal']),
  body('hairType').optional().isIn(['straight', 'wavy', 'curly', 'coily']),
  body('preferredStyles').optional().isArray(),
  body('budgetRange').optional().isIn(['BUDGET', 'MID_RANGE', 'PREMIUM', 'LUXURY']),
  body('locationCity').optional().trim().isLength({ min: 2, max: 100 }),
  body('locationState').optional().trim().isLength({ min: 2, max: 50 }),
  body('notificationPreferences').optional().isObject(),
  validateRequest,
  async (req, res, next) => {
    try {
      const {
        dateOfBirth, gender, skinType, hairType, preferredStyles,
        budgetRange, locationCity, locationState, notificationPreferences
      } = req.body;

      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (dateOfBirth !== undefined) {
        updates.push(`date_of_birth = $${paramIndex++}`);
        values.push(dateOfBirth);
      }
      if (gender !== undefined) {
        updates.push(`gender = $${paramIndex++}`);
        values.push(gender);
      }
      if (skinType !== undefined) {
        updates.push(`skin_type = $${paramIndex++}`);
        values.push(skinType);
      }
      if (hairType !== undefined) {
        updates.push(`hair_type = $${paramIndex++}`);
        values.push(hairType);
      }
      if (preferredStyles !== undefined) {
        updates.push(`preferred_styles = $${paramIndex++}`);
        values.push(preferredStyles);
      }
      if (budgetRange !== undefined) {
        updates.push(`budget_range = $${paramIndex++}`);
        values.push(budgetRange);
      }
      if (locationCity !== undefined) {
        updates.push(`location_city = $${paramIndex++}`);
        values.push(locationCity);
      }
      if (locationState !== undefined) {
        updates.push(`location_state = $${paramIndex++}`);
        values.push(locationState);
      }
      if (notificationPreferences !== undefined) {
        updates.push(`notification_preferences = $${paramIndex++}`);
        values.push(JSON.stringify(notificationPreferences));
      }

      if (updates.length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update',
          code: 'NO_UPDATES'
        });
      }

      values.push(req.user.id);

      const result = await query(`
        UPDATE clients
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $${paramIndex}
        RETURNING *
      `, values);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Client profile not found',
          code: 'CLIENT_NOT_FOUND'
        });
      }

      res.json({
        message: 'Client profile updated successfully',
        profile: result.rows[0]
      });

    } catch (error) {
      next(error);
    }
  }
);

// Update stylist profile
router.patch('/profile/stylist',
  requireRole('STYLIST'),
  body('businessName').optional().trim().isLength({ min: 2, max: 255 }),
  body('bio').optional().trim().isLength({ max: 1000 }),
  body('specialties').optional().isArray(),
  body('experienceYears').optional().isInt({ min: 0, max: 50 }),
  body('locationAddress').optional().trim().isLength({ max: 500 }),
  body('locationCity').optional().trim().isLength({ min: 2, max: 100 }),
  body('locationState').optional().trim().isLength({ min: 2, max: 50 }),
  body('locationZip').optional().trim().isLength({ min: 5, max: 10 }),
  body('pricingTier').optional().isIn(['BUDGET', 'MID_RANGE', 'PREMIUM', 'LUXURY']),
  body('portfolioImages').optional().isArray(),
  body('socialMediaLinks').optional().isObject(),
  body('workingHours').optional().isObject(),
  body('isAcceptingBookings').optional().isBoolean(),
  validateRequest,
  async (req, res, next) => {
    try {
      const {
        businessName, bio, specialties, experienceYears,
        locationAddress, locationCity, locationState, locationZip,
        pricingTier, portfolioImages, socialMediaLinks, workingHours,
        isAcceptingBookings
      } = req.body;

      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (businessName !== undefined) {
        updates.push(`business_name = $${paramIndex++}`);
        values.push(businessName);
      }
      if (bio !== undefined) {
        updates.push(`bio = $${paramIndex++}`);
        values.push(bio);
      }
      if (specialties !== undefined) {
        updates.push(`specialties = $${paramIndex++}`);
        values.push(specialties);
      }
      if (experienceYears !== undefined) {
        updates.push(`experience_years = $${paramIndex++}`);
        values.push(experienceYears);
      }
      if (locationAddress !== undefined) {
        updates.push(`location_address = $${paramIndex++}`);
        values.push(locationAddress);
      }
      if (locationCity !== undefined) {
        updates.push(`location_city = $${paramIndex++}`);
        values.push(locationCity);
      }
      if (locationState !== undefined) {
        updates.push(`location_state = $${paramIndex++}`);
        values.push(locationState);
      }
      if (locationZip !== undefined) {
        updates.push(`location_zip = $${paramIndex++}`);
        values.push(locationZip);
      }
      if (pricingTier !== undefined) {
        updates.push(`pricing_tier = $${paramIndex++}`);
        values.push(pricingTier);
      }
      if (portfolioImages !== undefined) {
        updates.push(`portfolio_images = $${paramIndex++}`);
        values.push(portfolioImages);
      }
      if (socialMediaLinks !== undefined) {
        updates.push(`social_media_links = $${paramIndex++}`);
        values.push(JSON.stringify(socialMediaLinks));
      }
      if (workingHours !== undefined) {
        updates.push(`working_hours = $${paramIndex++}`);
        values.push(JSON.stringify(workingHours));
      }
      if (isAcceptingBookings !== undefined) {
        updates.push(`is_accepting_bookings = $${paramIndex++}`);
        values.push(isAcceptingBookings);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update',
          code: 'NO_UPDATES'
        });
      }

      values.push(req.user.id);

      const result = await query(`
        UPDATE stylists
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $${paramIndex}
        RETURNING *
      `, values);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Stylist profile not found',
          code: 'STYLIST_NOT_FOUND'
        });
      }

      res.json({
        message: 'Stylist profile updated successfully',
        profile: result.rows[0]
      });

    } catch (error) {
      next(error);
    }
  }
);

// Change password
router.patch('/password',
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  validateRequest,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;

      // Get current password hash
      const userResult = await query(`
        SELECT password_hash FROM users WHERE id = $1
      `, [req.user.id]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Verify current password
      const { comparePassword } = await import('../services/auth.js');
      const isValidPassword = await comparePassword(currentPassword, userResult.rows[0].password_hash);

      if (!isValidPassword) {
        return res.status(400).json({
          error: 'Current password is incorrect',
          code: 'INVALID_PASSWORD'
        });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update password
      await query(`
        UPDATE users
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [newPasswordHash, req.user.id]);

      res.json({
        message: 'Password updated successfully'
      });

    } catch (error) {
      next(error);
    }
  }
);

// Deactivate account
router.delete('/account',
  body('password').notEmpty().withMessage('Password confirmation is required'),
  validateRequest,
  async (req, res, next) => {
    try {
      const { password } = req.body;

      // Get current password hash
      const userResult = await query(`
        SELECT password_hash FROM users WHERE id = $1
      `, [req.user.id]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Verify password
      const { comparePassword } = await import('../services/auth.js');
      const isValidPassword = await comparePassword(password, userResult.rows[0].password_hash);

      if (!isValidPassword) {
        return res.status(400).json({
          error: 'Password confirmation is incorrect',
          code: 'INVALID_PASSWORD'
        });
      }

      // Deactivate account
      await query(`
        UPDATE users
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [req.user.id]);

      res.json({
        message: 'Account deactivated successfully'
      });

    } catch (error) {
      next(error);
    }
  }
);

export default router;