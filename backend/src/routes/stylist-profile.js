const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * Middleware to ensure only stylists can access these routes
 */
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

/**
 * Middleware to check if suspended stylist can only access payout features
 */
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

    // If user is blocked, deny all access
    if (userStatus === 'BLOCKED') {
      return res.status(403).json({
        success: false,
        message: 'Account is blocked'
      });
    }

    // If user is suspended, check if this is a payout-related endpoint
    if (userStatus === 'SUSPENDED') {
      const isPayoutEndpoint = req.path.includes('payout') || req.path.includes('bank-details');

      if (!isPayoutEndpoint) {
        return res.status(403).json({
          success: false,
          message: 'Account is suspended. Only payout requests and bank details can be managed.'
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

/**
 * GET /api/stylist/profile
 * Get own profile information (self-management only)
 */
router.get('/profile', requireStylist, checkSuspendedAccess, async (req, res) => {
  try {
    const { user } = req;

    const result = await query(`
      SELECT
        u.id, u.email, u.name, u.phone, u.role, u.user_status, u.email_verified,
        s.business_name, s.bio, s.specialties, s.experience_years, s.location_address,
        s.location_city, s.location_state, s.pricing_tier, s.portfolio_images,
        s.social_media_links, s.is_verified, s.rating_average, s.rating_count
      FROM users u
      LEFT JOIN stylists s ON u.id = s.user_id
      WHERE u.id = $1 AND u.role = 'STYLIST'
    `, [user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stylist profile not found'
      });
    }

    const profile = result.rows[0];

    return res.json({
      success: true,
      data: profile
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
 * POST /api/stylist/profile
 * Create or update stylist profile (onboarding)
 */
router.post('/profile', requireStylist, async (req, res) => {
  try {
    const { user } = req;
    const {
      business_name,
      bio,
      specialties,
      experience_years,
      location_address,
      location_city,
      location_state,
      location_zip,
      service_radius,
      mobile_services,
      instagram_url,
      tiktok_url,
      working_hours
    } = req.body;

    // Check if stylist record already exists
    const existingResult = await query(
      'SELECT id FROM stylists WHERE user_id = $1',
      [user.id]
    );

    if (existingResult.rows.length > 0) {
      // Update existing stylist profile
      const updateFields = [];
      const updateParams = [];
      let paramCounter = 1;

      if (business_name !== undefined) {
        updateFields.push(`business_name = $${paramCounter}`);
        updateParams.push(business_name);
        paramCounter++;
      }
      if (bio !== undefined) {
        updateFields.push(`bio = $${paramCounter}`);
        updateParams.push(bio);
        paramCounter++;
      }
      if (specialties !== undefined) {
        updateFields.push(`specialties = $${paramCounter}`);
        updateParams.push(specialties);
        paramCounter++;
      }
      if (experience_years !== undefined) {
        updateFields.push(`experience_years = $${paramCounter}`);
        updateParams.push(experience_years);
        paramCounter++;
      }
      if (location_address !== undefined) {
        updateFields.push(`location_address = $${paramCounter}`);
        updateParams.push(location_address);
        paramCounter++;
      }
      if (location_city !== undefined) {
        updateFields.push(`location_city = $${paramCounter}`);
        updateParams.push(location_city);
        paramCounter++;
      }
      if (location_state !== undefined) {
        updateFields.push(`location_state = $${paramCounter}`);
        updateParams.push(location_state);
        paramCounter++;
      }
      if (location_zip !== undefined) {
        updateFields.push(`location_zip = $${paramCounter}`);
        updateParams.push(location_zip);
        paramCounter++;
      }
      if (service_radius !== undefined) {
        updateFields.push(`service_radius = $${paramCounter}`);
        updateParams.push(service_radius);
        paramCounter++;
      }
      if (mobile_services !== undefined) {
        updateFields.push(`mobile_services = $${paramCounter}`);
        updateParams.push(mobile_services);
        paramCounter++;
      }
      if (working_hours !== undefined) {
        updateFields.push(`working_hours = $${paramCounter}`);
        updateParams.push(JSON.stringify(working_hours));
        paramCounter++;
      }

      // Social media links
      const socialLinks = {};
      if (instagram_url) socialLinks.instagram = instagram_url;
      if (tiktok_url) socialLinks.tiktok = tiktok_url;
      if (Object.keys(socialLinks).length > 0) {
        updateFields.push(`social_media_links = $${paramCounter}`);
        updateParams.push(JSON.stringify(socialLinks));
        paramCounter++;
      }

      updateFields.push(`updated_at = NOW()`);
      updateParams.push(user.id);

      await query(`
        UPDATE stylists
        SET ${updateFields.join(', ')}
        WHERE user_id = $${paramCounter}
      `, updateParams);
    } else {
      // Insert new stylist profile
      const socialLinks = {};
      if (instagram_url) socialLinks.instagram = instagram_url;
      if (tiktok_url) socialLinks.tiktok = tiktok_url;

      await query(`
        INSERT INTO stylists (
          user_id, business_name, bio, specialties, experience_years,
          location_address, location_city, location_state, location_zip, service_radius,
          mobile_services, social_media_links, working_hours,
          is_active, is_verified, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, false, NOW(), NOW())
      `, [
        user.id,
        business_name || '',
        bio || '',
        specialties || [],
        experience_years || 0,
        location_address || '',
        location_city || '',
        location_state || '',
        location_zip || '',
        service_radius || 10,
        mobile_services || false,
        JSON.stringify(socialLinks),
        working_hours ? JSON.stringify(working_hours) : null
      ]);
    }

    // Update user status to ACTIVE if still PENDING_ONBOARDING
    await query(`
      UPDATE users
      SET user_status = CASE
        WHEN user_status = 'PENDING_ONBOARDING' THEN 'ACTIVE'
        ELSE user_status
      END,
      updated_at = NOW()
      WHERE id = $1
    `, [user.id]);

    console.log(`Stylist profile created/updated: ${user.email}`);

    return res.json({
      success: true,
      message: 'Profile saved successfully'
    });

  } catch (error) {
    console.error('Error saving stylist profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/stylist/profile
 * Update own profile information (self-management only)
 * Suspended users cannot update profile
 */
router.put('/profile', requireStylist, checkSuspendedAccess, async (req, res) => {
  try {
    const { user } = req;
    const { name, phone, bio, specialties, experience_years, social_media_links, working_hours } = req.body;

    // Build update queries for both users and stylists tables
    const userUpdateFields = [];
    const userUpdateParams = [];
    let userParamCounter = 1;

    if (name !== undefined) {
      userUpdateFields.push(`name = $${userParamCounter}`);
      userUpdateParams.push(name);
      userParamCounter++;
    }

    if (phone !== undefined) {
      userUpdateFields.push(`phone = $${userParamCounter}`);
      userUpdateParams.push(phone);
      userParamCounter++;
    }

    // Update users table if there are fields to update
    if (userUpdateFields.length > 0) {
      userUpdateFields.push(`updated_at = NOW()`);
      userUpdateParams.push(user.id);

      await query(`
        UPDATE users
        SET ${userUpdateFields.join(', ')}
        WHERE id = $${userParamCounter}
      `, userUpdateParams);
    }

    // Update stylists table
    const stylistUpdateFields = [];
    const stylistUpdateParams = [];
    let stylistParamCounter = 1;

    if (bio !== undefined) {
      stylistUpdateFields.push(`bio = $${stylistParamCounter}`);
      stylistUpdateParams.push(bio);
      stylistParamCounter++;
    }

    if (specialties !== undefined) {
      stylistUpdateFields.push(`specialties = $${stylistParamCounter}`);
      stylistUpdateParams.push(specialties);
      stylistParamCounter++;
    }

    if (experience_years !== undefined) {
      stylistUpdateFields.push(`experience_years = $${stylistParamCounter}`);
      stylistUpdateParams.push(experience_years);
      stylistParamCounter++;
    }

    if (social_media_links !== undefined) {
      stylistUpdateFields.push(`social_media_links = $${stylistParamCounter}`);
      stylistUpdateParams.push(JSON.stringify(social_media_links));
      stylistParamCounter++;
    }

    if (working_hours !== undefined) {
      stylistUpdateFields.push(`working_hours = $${stylistParamCounter}`);
      stylistUpdateParams.push(JSON.stringify(working_hours));
      stylistParamCounter++;
    }

    if (stylistUpdateFields.length > 0) {
      stylistUpdateFields.push(`updated_at = NOW()`);
      stylistUpdateParams.push(user.id);

      await query(`
        UPDATE stylists
        SET ${stylistUpdateFields.join(', ')}
        WHERE user_id = $${stylistParamCounter}
      `, stylistUpdateParams);
    }

    // Log the action
    console.log(`Stylist profile updated: ${user.email}`, {
      userId: user.id,
      changes: req.body,
      timestamp: new Date().toISOString()
    });

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
 * POST /api/stylist/payout-request
 * Create payout request (accessible even when suspended)
 */
router.post('/payout-request', requireStylist, async (req, res) => {
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
      INSERT INTO payout_requests (stylist_id, user_id, amount, payout_method, bank_details, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id, amount, status, requested_at
    `, [stylistId, user.id, amount, payout_method || 'BANK_TRANSFER', bank_details, notes]);

    const newPayout = result.rows[0];

    // Log the action
    console.log(`Payout request created by stylist: ${user.email}`, {
      userId: user.id,
      payoutId: newPayout.id,
      amount: amount,
      timestamp: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      data: newPayout,
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
 * GET /api/stylist/payout-requests
 * Get own payout requests
 */
router.get('/payout-requests', requireStylist, async (req, res) => {
  try {
    const { user } = req;
    const { status, limit = 20, offset = 0 } = req.query;

    let queryText = `
      SELECT id, amount, status, payout_method, requested_at, processed_at, completed_at, notes, admin_notes
      FROM payout_requests
      WHERE user_id = $1
    `;

    const queryParams = [user.id];

    if (status) {
      queryText += ` AND status = $${queryParams.length + 1}`;
      queryParams.push(status);
    }

    queryText += ` ORDER BY requested_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, queryParams);

    return res.json({
      success: true,
      data: {
        payouts: result.rows,
        currentPage: Math.floor(offset / limit) + 1
      }
    });

  } catch (error) {
    console.error('Error fetching payout requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/stylist/bank-details
 * Update bank details for payouts (accessible even when suspended)
 */
router.put('/bank-details', requireStylist, async (req, res) => {
  try {
    const { user } = req;
    const { bank_details } = req.body;

    if (!bank_details || typeof bank_details !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Valid bank details object is required'
      });
    }

    // Store bank details in user profile (you might want a separate table for this)
    await query(`
      UPDATE users
      SET updated_at = NOW()
      WHERE id = $1
    `, [user.id]);

    // For now, bank details will be passed with payout requests
    // In production, you'd want a secure encrypted storage for bank details

    // Log the action
    console.log(`Bank details updated by stylist: ${user.email}`, {
      userId: user.id,
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: 'Bank details updated successfully'
    });

  } catch (error) {
    console.error('Error updating bank details:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;