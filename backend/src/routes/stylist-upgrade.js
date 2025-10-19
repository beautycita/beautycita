const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * POST /api/stylist/upgrade
 * Allow CLIENT users to become stylists (dual role)
 * This creates a stylist profile while preserving client functionality
 */
router.post('/upgrade', async (req, res) => {
  try {
    const { user } = req;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user is eligible (not already a stylist, not an admin)
    if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin users cannot become stylists'
      });
    }

    // Check if stylist profile already exists
    const existingStylest = await query(
      'SELECT id FROM stylists WHERE user_id = $1',
      [user.id]
    );

    if (existingStylest.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Stylist profile already exists'
      });
    }

    // Extract stylist profile data from request
    const {
      business_name,
      bio,
      specialties,
      experience_years,
      location_address,
      location_city,
      location_state,
      latitude,
      longitude,
      service_radius,
      mobile_services,
      working_hours,
      instagram_url,
      tiktok_url
    } = req.body;

    // Validate required fields
    if (!business_name || !bio || !specialties || !experience_years || !location_address) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create stylist profile
    const stylistResult = await query(`
      INSERT INTO stylists (
        user_id, business_name, bio, specialties, experience_years,
        location_address, location_city, location_state, latitude, longitude,
        service_radius, mobile_services, working_hours, instagram_url, tiktok_url,
        is_verified, rating_average, rating_count, total_bookings,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, false, 0.00, 0, 0, NOW(), NOW())
      RETURNING id
    `, [
      user.id,
      business_name,
      bio,
      Array.isArray(specialties) ? specialties : [specialties],
      experience_years,
      location_address,
      location_city || '',
      location_state || '',
      latitude || 0,
      longitude || 0,
      service_radius || 10,
      mobile_services || false,
      working_hours || {},
      instagram_url || null,
      tiktok_url || null
    ]);

    // If user is currently CLIENT, we keep them as CLIENT
    // The presence of a stylist record allows them to access stylist features
    // No role change needed - they remain CLIENT with stylist capabilities

    // Set user_status to indicate onboarding required if not already set
    await query(`
      UPDATE users
      SET user_status = CASE
        WHEN user_status IS NULL THEN 'PENDING_ONBOARDING'
        ELSE user_status
      END,
      updated_at = NOW()
      WHERE id = $1
    `, [user.id]);

    return res.status(201).json({
      success: true,
      message: 'Stylist profile created successfully',
      data: {
        stylist_id: stylistResult.rows[0].id,
        maintains_client_access: true
      }
    });

  } catch (error) {
    console.error('Error creating stylist profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Middleware helper to check if user has stylist profile
 * Can be used in other routes to allow both STYLIST role and CLIENT with stylist record
 */
async function hasStylistProfile(userId) {
  try {
    const result = await query(
      'SELECT id FROM stylists WHERE user_id = $1',
      [userId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking stylist profile:', error);
    return false;
  }
}

/**
 * Improved middleware that allows both STYLIST role and CLIENT with stylist profile
 */
const requireStylistAccess = async (req, res, next) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Allow if role is STYLIST
  if (user.role === 'STYLIST') {
    return next();
  }

  // Allow if role is CLIENT but has stylist profile
  if (user.role === 'CLIENT') {
    const hasProfile = await hasStylistProfile(user.id);
    if (hasProfile) {
      return next();
    }
  }

  return res.status(403).json({
    success: false,
    message: 'Stylist access required. Please complete stylist onboarding.'
  });
};

module.exports = router;
module.exports.requireStylistAccess = requireStylistAccess;
module.exports.hasStylistProfile = hasStylistProfile;
