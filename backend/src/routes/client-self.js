const express = require('express');
const router = express.Router();
const { query } = require('../db');
const bcrypt = require('bcryptjs');

// Middleware to ensure only clients can access these routes
const requireClient = (req, res, next) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (user.role !== 'CLIENT') {
    return res.status(403).json({
      success: false,
      message: 'Client access required'
    });
  }

  next();
};

// Middleware to check if client account is blocked
const checkAccountStatus = async (req, res, next) => {
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
      return res.status(403).json({
        success: false,
        message: 'Account is suspended. Contact support.',
        restrictions: ['booking', 'reviews', 'profile_updates']
      });
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
router.use(requireClient);
router.use(checkAccountStatus);

/**
 * GET /api/client/profile
 * Get client's own profile information
 */
router.get('/profile', async (req, res) => {
  try {
    const { user } = req;

    const result = await query(`
      SELECT u.id, u.email, u.name, u.phone, u.user_status, u.created_at, u.profile_picture_url,
             c.preferences, c.location_preference, c.budget_range, c.favorite_services,
             c.communication_preferences, c.booking_history_count
      FROM users u
      LEFT JOIN clients c ON u.id = c.user_id
      WHERE u.id = $1
    `, [user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client profile not found'
      });
    }

    return res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching client profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/client/profile
 * Update client's own profile (limited fields)
 */
router.put('/profile', async (req, res) => {
  try {
    const { user } = req;
    const {
      name, phone, preferences, location_preference,
      budget_range, favorite_services, communication_preferences
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

    // Update or create client profile
    const clientFields = {
      preferences, location_preference, budget_range,
      favorite_services, communication_preferences
    };

    const clientUpdateFields = [];
    const clientUpdateParams = [];
    let clientParamCounter = 1;

    Object.entries(clientFields).forEach(([key, value]) => {
      if (value !== undefined) {
        clientUpdateFields.push(`${key} = $${clientParamCounter}`);
        clientUpdateParams.push(value);
        clientParamCounter++;
      }
    });

    if (clientUpdateFields.length > 0) {
      // Check if client profile exists
      const clientExists = await query(
        'SELECT id FROM clients WHERE user_id = $1',
        [user.id]
      );

      if (clientExists.rows.length > 0) {
        // Update existing
        clientUpdateFields.push('updated_at = NOW()');
        clientUpdateParams.push(user.id);

        await query(`
          UPDATE clients
          SET ${clientUpdateFields.join(', ')}
          WHERE user_id = $${clientParamCounter}
        `, clientUpdateParams);
      } else {
        // Create new client profile
        await query(`
          INSERT INTO clients (user_id, ${Object.keys(clientFields).filter(key => clientFields[key] !== undefined).join(', ')}, created_at, updated_at)
          VALUES ($${clientParamCounter}, ${clientUpdateParams.map((_, i) => `$${i + 1}`).join(', ')}, NOW(), NOW())
        `, [...clientUpdateParams, user.id]);
      }
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating client profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/client/password
 * Change client's password
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
 * GET /api/client/bookings
 * Get client's booking history
 */
router.get('/bookings', async (req, res) => {
  try {
    const { user } = req;
    const { status, limit = 20, offset = 0 } = req.query;

    let queryText = `
      SELECT b.id, b.service_id, sv.name as service_name, b.booking_date as appointment_date, b.booking_time as appointment_time, b.duration_minutes, b.status, b.total_price,
             b.special_requests, b.created_at,
             s.business_name as stylist_business_name, s.location_address as stylist_location, s.rating_average,
             u.name as stylist_name, u.phone as stylist_phone
      FROM bookings b
      JOIN services sv ON b.service_id = sv.id
      JOIN stylists s ON b.stylist_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE b.client_id = $1
    `;

    const queryParams = [user.id];

    if (status) {
      queryText += ` AND b.status = $${queryParams.length + 1}`;
      queryParams.push(status);
    }

    queryText += ` ORDER BY b.booking_date DESC, b.booking_time DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, queryParams);

    return res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching client bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/client/favorites
 * Get client's favorite stylists
 */
router.get('/favorites', async (req, res) => {
  try {
    const { user } = req;

    const result = await query(`
      SELECT cf.id as favorite_id, cf.created_at as favorited_at,
             s.id as stylist_id, s.business_name, s.bio, s.specialties,
             s.location_city, s.rating_average, s.total_bookings,
             u.name as stylist_name
      FROM client_favorites cf
      JOIN stylists s ON cf.stylist_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE cf.client_id = $1
      ORDER BY cf.created_at DESC
    `, [user.id]);

    return res.json({
      success: true,
      data: {
        favorites: result.rows
      }
    });

  } catch (error) {
    console.error('Error fetching client favorites:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/client/status
 * Get current account status and restrictions
 */
router.get('/status', async (req, res) => {
  try {
    const { userStatus } = req;

    return res.json({
      success: true,
      data: {
        status: userStatus || 'APPROVED',
        restrictions: userStatus === 'SUSPENDED' ? ['booking', 'reviews', 'favorites'] : [],
        allowedActions: userStatus === 'APPROVED' ? ['all'] : ['profile_view', 'password_change']
      }
    });

  } catch (error) {
    console.error('Error fetching client status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;