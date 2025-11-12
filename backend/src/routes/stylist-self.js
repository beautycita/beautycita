const express = require('express');
const router = express.Router();
const { query } = require('../db');
const bcrypt = require('bcryptjs');

// Middleware to ensure only stylists can access these routes
const requireStylist = (req, res, next) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (user.role !== 'STYLIST') {
    return res.status(403).json({
      success: false,
      message: 'Stylist access required'
    });
  }

  next();
};

// Middleware to check if stylist is suspended and restrict to payout-only access
const checkSuspendedAccess = async (req, res, next) => {
  const { user } = req;

  try {
    const userResult = await query(
      'SELECT user_status FROM users WHERE id = $1',
      [user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userStatus = userResult.rows[0].user_status;

    if (userStatus === 'BLOCKED') {
      return res.status(403).json({
        success: false,
        message: 'Account is blocked. Contact support.'
      });
    }

    if (userStatus === 'SUSPENDED') {
      // Only allow payout-related endpoints for suspended users
      const allowedPaths = ['/payouts', '/payout-info'];
      const isPayoutPath = allowedPaths.some(path => req.path.startsWith(path));

      if (!isPayoutPath) {
        return res.status(403).json({
          success: false,
          message: 'Account is suspended. Only payout requests are allowed.',
          allowedActions: ['payouts']
        });
      }
    }

    req.userStatus = userStatus;
    next();
  } catch (error) {
    console.error('Error checking user status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Apply middleware to all routes
router.use(requireStylist);
router.use(checkSuspendedAccess);

/**
 * GET /api/stylist/profile
 * Get stylist's own profile information
 */
router.get('/profile', async (req, res) => {
  try {
    const { user } = req;

    const result = await query(`
      SELECT u.id, u.email, u.name, u.phone, u.user_status, u.created_at,
             s.business_name, s.bio, s.specialties, s.experience_years,
             s.location_address, s.location_city, s.location_state,
             s.pricing_tier, s.base_price_range, s.portfolio_images,
             s.social_media_links, s.certifications, s.working_hours,
             s.is_verified, s.rating_average, s.rating_count, s.total_bookings
      FROM users u
      JOIN stylists s ON u.id = s.user_id
      WHERE u.id = $1
    `, [user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stylist profile not found'
      });
    }

    return res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching stylist profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/stylist/profile
 * Update stylist's own profile (limited fields)
 */
router.put('/profile', async (req, res) => {
  try {
    const { user } = req;
    const {
      name, phone, bio, specialties, experience_years,
      location_address, location_city, location_state,
      base_price_range, social_media_links, working_hours,
      business_name
    } = req.body;

    // Update user table
    if (name || phone) {
      const userUpdateFields = [];
      const userUpdateParams = [];
      let userParamCounter = 1;

      if (name) {
        userUpdateFields.push(`name = $${userParamCounter}`);
        userUpdateParams.push(name);
        userParamCounter++;
      }

      if (phone) {
        userUpdateFields.push(`phone = $${userParamCounter}`);
        userUpdateParams.push(phone);
        userParamCounter++;
      }

      userUpdateFields.push('updated_at = NOW()');
      userUpdateParams.push(user.id);

      await query(`
        UPDATE users
        SET ${userUpdateFields.join(', ')}
        WHERE id = $${userParamCounter}
      `, userUpdateParams);
    }

    // Update stylist table
    const stylistUpdateFields = [];
    const stylistUpdateParams = [];
    let paramCounter = 1;

    const fieldsToUpdate = {
      business_name, bio, specialties, experience_years,
      location_address, location_city, location_state,
      base_price_range, social_media_links, working_hours
    };

    Object.entries(fieldsToUpdate).forEach(([key, value]) => {
      if (value !== undefined) {
        stylistUpdateFields.push(`${key} = $${paramCounter}`);
        stylistUpdateParams.push(value);
        paramCounter++;
      }
    });

    if (stylistUpdateFields.length > 0) {
      stylistUpdateFields.push('updated_at = NOW()');
      stylistUpdateParams.push(user.id);

      await query(`
        UPDATE stylists
        SET ${stylistUpdateFields.join(', ')}
        WHERE user_id = $${paramCounter}
      `, stylistUpdateParams);
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating stylist profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/stylist/password
 * Change stylist's password
 */
router.put('/password', async (req, res) => {
  try {
    const { user } = req;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Get current password hash
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedNewPassword, user.id]
    );

    return res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/stylist/payouts
 * Get stylist's payout requests
 */
router.get('/payouts', async (req, res) => {
  try {
    const { user } = req;

    const result = await query(`
      SELECT pr.id, pr.amount, pr.status, pr.payout_method, pr.bank_details,
             pr.requested_at, pr.processed_at, pr.completed_at, pr.notes, pr.admin_notes
      FROM payout_requests pr
      WHERE pr.user_id = $1
      ORDER BY pr.requested_at DESC
    `, [user.id]);

    return res.json({
      success: true,
      data: {
        payouts: result.rows
      }
    });

  } catch (error) {
    console.error('Error fetching stylist payouts:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/stylist/payouts
 * Create new payout request
 */
router.post('/payouts', async (req, res) => {
  try {
    const { user } = req;
    const { amount, payout_method, bank_details, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    // Get stylist ID
    const stylistResult = await query(
      'SELECT id FROM stylists WHERE user_id = $1',
      [user.id]
    );

    if (stylistResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stylist profile not found'
      });
    }

    const stylistId = stylistResult.rows[0].id;

    // Create payout request
    const result = await query(`
      INSERT INTO payout_requests (stylist_id, user_id, amount, payout_method, bank_details, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, amount, status, requested_at
    `, [stylistId, user.id, amount, payout_method || 'BANK_TRANSFER', bank_details, notes]);

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Payout request created successfully'
    });

  } catch (error) {
    console.error('Error creating payout request:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/stylist/payout-info
 * Update payout information (bank details, etc.)
 */
router.put('/payout-info', async (req, res) => {
  try {
    const { user } = req;
    const { payout_method, bank_details } = req.body;

    if (!payout_method || !bank_details) {
      return res.status(400).json({
        success: false,
        message: 'Payout method and bank details are required'
      });
    }

    // For now, we'll store this in the user's profile or create a separate payout_info table
    // Let's add it to the stylists table for simplicity
    const result = await query(`
      UPDATE stylists
      SET social_media_links = COALESCE(social_media_links, '{}'::json) ||
          json_build_object('payout_method', $1, 'bank_details', $2)::json,
          updated_at = NOW()
      WHERE user_id = $3
      RETURNING id
    `, [payout_method, bank_details, user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stylist profile not found'
      });
    }

    return res.json({
      success: true,
      message: 'Payout information updated successfully'
    });

  } catch (error) {
    console.error('Error updating payout info:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/stylist/status
 * Get current account status and restrictions
 */
router.get('/status', async (req, res) => {
  try {
    const { user, userStatus } = req;

    // Check for pending payouts
    const payoutResult = await query(
      'SELECT COUNT(*) FROM payout_requests WHERE user_id = $1 AND status IN (\'PENDING\', \'APPROVED\', \'PROCESSING\')',
      [user.id]
    );

    const pendingPayouts = parseInt(payoutResult.rows[0].count);

    return res.json({
      success: true,
      data: {
        status: userStatus || 'APPROVED',
        pendingPayouts: pendingPayouts,
        restrictions: userStatus === 'SUSPENDED' ? ['profile_edit', 'booking_management', 'portfolio_update'] : [],
        allowedActions: userStatus === 'SUSPENDED' ? ['payouts', 'payout_info'] : ['all']
      }
    });

  } catch (error) {
    console.error('Error fetching stylist status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/stylist/complete-onboarding
 * Complete stylist onboarding wizard - saves all data
 */
router.post('/complete-onboarding', requireStylist, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      businessName,
      bio,
      specialties,
      experienceYears,
      certifications,
      locations,
      services,
      portfolioImages,
      workingHours,
      pricingStrategy,
      acceptsDeposits,
      depositAmount,
      cancellationPolicy
    } = req.body;

    // Start transaction
    await query('BEGIN');

    // 1. Update stylist profile
    await query(`
      UPDATE stylists
      SET
        business_name = $1,
        bio = $2,
        specialties = $3,
        experience_years = $4,
        certifications = $5,
        pricing_strategy = $6,
        accepts_deposits = $7,
        deposit_amount = $8,
        cancellation_policy = $9,
        working_hours = $10,
        updated_at = NOW()
      WHERE user_id = $11
    `, [
      businessName,
      bio,
      specialties,
      experienceYears,
      certifications || [],
      pricingStrategy,
      acceptsDeposits,
      depositAmount,
      cancellationPolicy,
      JSON.stringify(workingHours),
      userId
    ]);

    // Get stylist_id for foreign keys
    const stylistResult = await query(
      'SELECT id FROM stylists WHERE user_id = $1',
      [userId]
    );

    if (stylistResult.rows.length === 0) {
      throw new Error('Stylist profile not found');
    }

    const stylistId = stylistResult.rows[0].id;

    // 2. Add locations
    for (const location of locations) {
      await query(`
        INSERT INTO stylist_locations (
          stylist_id, location_name, location_type, address, city, state, zip,
          country, latitude, longitude, is_primary, is_active, accepts_walkins,
          parking_available, wheelchair_accessible, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'Mexico', $8, $9, $10, true, $11, $12, $13, NOW(), NOW())
      `, [
        stylistId,
        location.name,
        location.type,
        location.address,
        location.city,
        location.state,
        location.zip,
        location.latitude,
        location.longitude,
        location.isPrimary,
        location.acceptsWalkins,
        location.parkingAvailable,
        location.wheelchairAccessible
      ]);
    }

    // 3. Add services
    for (const service of services) {
      await query(`
        INSERT INTO services (
          stylist_id, name, description, category, custom_category_name,
          duration_minutes, price, price_type, is_active, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
      `, [
        stylistId,
        service.name,
        service.description,
        service.category,
        service.customCategoryName || null,
        service.durationMinutes,
        service.price,
        service.priceType
      ]);
    }

    // 4. Mark user as onboarding complete
    await query(`
      UPDATE users
      SET
        onboarding_completed = true,
        onboarding_completed_at = NOW(),
        user_status = 'APPROVED',
        updated_at = NOW()
      WHERE id = $1
    `, [userId]);

    // Commit transaction
    await query('COMMIT');

    return res.json({
      success: true,
      message: 'Onboarding completed successfully! Your profile is now live.',
      data: {
        stylistId,
        locationsCreated: locations.length,
        servicesCreated: services.length
      }
    });

  } catch (error) {
    // Rollback on error
    await query('ROLLBACK');
    console.error('Error completing stylist onboarding:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete onboarding',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;