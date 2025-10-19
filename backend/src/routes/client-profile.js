const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * Middleware to ensure only clients can access these routes
 */
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

/**
 * Middleware to check if client account is active
 */
const checkClientStatus = async (req, res, next) => {
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
        message: 'Account is blocked. Please contact support.'
      });
    }

    // If user is suspended, deny all access
    if (userStatus === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended. Please contact support.'
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

/**
 * GET /api/client/profile
 * Get own profile information (self-management only)
 */
router.get('/profile', requireClient, checkClientStatus, async (req, res) => {
  try {
    const { user } = req;

    const result = await query(`
      SELECT
        u.id, u.email, u.name, u.phone, u.role, u.user_status, u.email_verified,
        u.profile_picture_url, u.created_at,
        c.preferred_language, c.preferred_currency, c.notification_preferences
      FROM users u
      LEFT JOIN clients c ON u.id = c.user_id
      WHERE u.id = $1 AND u.role = 'CLIENT'
    `, [user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client profile not found'
      });
    }

    const profile = result.rows[0];

    return res.json({
      success: true,
      data: profile
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
 * Update own profile information (self-management only)
 * Clients cannot change their own status
 */
router.put('/profile', requireClient, checkClientStatus, async (req, res) => {
  try {
    const { user } = req;
    const { name, phone, preferred_language, preferred_currency, notification_preferences } = req.body;

    // Clients cannot modify email or role
    // Build update queries for users table
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

    // Update clients table if needed
    if (preferred_language || preferred_currency || notification_preferences) {
      // Check if client record exists
      const clientExists = await query(
        'SELECT id FROM clients WHERE user_id = $1',
        [user.id]
      );

      if (clientExists.rows.length === 0) {
        // Create client record
        await query(`
          INSERT INTO clients (user_id, preferred_language, preferred_currency, notification_preferences, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
        `, [
          user.id,
          preferred_language || 'es',
          preferred_currency || 'MXN',
          JSON.stringify(notification_preferences || {})
        ]);
      } else {
        // Update existing client record
        const clientUpdateFields = [];
        const clientUpdateParams = [];
        let clientParamCounter = 1;

        if (preferred_language !== undefined) {
          clientUpdateFields.push(`preferred_language = $${clientParamCounter}`);
          clientUpdateParams.push(preferred_language);
          clientParamCounter++;
        }

        if (preferred_currency !== undefined) {
          clientUpdateFields.push(`preferred_currency = $${clientParamCounter}`);
          clientUpdateParams.push(preferred_currency);
          clientParamCounter++;
        }

        if (notification_preferences !== undefined) {
          clientUpdateFields.push(`notification_preferences = $${clientParamCounter}`);
          clientUpdateParams.push(JSON.stringify(notification_preferences));
          clientParamCounter++;
        }

        if (clientUpdateFields.length > 0) {
          clientUpdateFields.push(`updated_at = NOW()`);
          clientUpdateParams.push(user.id);

          await query(`
            UPDATE clients
            SET ${clientUpdateFields.join(', ')}
            WHERE user_id = $${clientParamCounter}
          `, clientUpdateParams);
        }
      }
    }

    // Log the action
    console.log(`Client profile updated: ${user.email}`, {
      userId: user.id,
      changes: req.body,
      timestamp: new Date().toISOString()
    });

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
 * GET /api/client/bookings
 * Get own bookings only
 */
router.get('/bookings', requireClient, checkClientStatus, async (req, res) => {
  try {
    const { user } = req;
    const { status, limit = 20, offset = 0 } = req.query;

    let queryText = `
      SELECT
        b.id, b.status, b.date, b.time, b.duration, b.total_price,
        s.name as service_name,
        st.business_name, st.location_address, st.location_city,
        u.name as stylist_name
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN stylists st ON b.stylist_id = st.id
      LEFT JOIN users u ON st.user_id = u.id
      WHERE b.client_id = $1
    `;

    const queryParams = [user.id];

    if (status) {
      queryText += ` AND b.status = $${queryParams.length + 1}`;
      queryParams.push(status);
    }

    queryText += ` ORDER BY b.date DESC, b.time DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, queryParams);

    return res.json({
      success: true,
      data: {
        bookings: result.rows,
        currentPage: Math.floor(offset / limit) + 1
      }
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
 * Get own favorite stylists
 */
router.get('/favorites', requireClient, checkClientStatus, async (req, res) => {
  try {
    const { user } = req;

    const result = await query(`
      SELECT
        cf.id, cf.created_at,
        s.id as stylist_id, s.business_name, s.bio, s.rating_average, s.location_city,
        u.name as stylist_name
      FROM client_favorites cf
      LEFT JOIN stylists s ON cf.stylist_id = s.id
      LEFT JOIN users u ON s.user_id = u.id
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
 * POST /api/client/favorites
 * Add stylist to favorites
 */
router.post('/favorites', requireClient, checkClientStatus, async (req, res) => {
  try {
    const { user } = req;
    const { stylist_id } = req.body;

    if (!stylist_id) {
      return res.status(400).json({
        success: false,
        message: 'Stylist ID is required'
      });
    }

    // Check if already favorited
    const existing = await query(
      'SELECT id FROM client_favorites WHERE client_id = $1 AND stylist_id = $2',
      [user.id, stylist_id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Stylist already in favorites'
      });
    }

    // Add to favorites
    await query(`
      INSERT INTO client_favorites (client_id, stylist_id, created_at)
      VALUES ($1, $2, NOW())
    `, [user.id, stylist_id]);

    return res.status(201).json({
      success: true,
      message: 'Stylist added to favorites'
    });

  } catch (error) {
    console.error('Error adding favorite:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/client/favorites/:stylist_id
 * Remove stylist from favorites
 */
router.delete('/favorites/:stylist_id', requireClient, checkClientStatus, async (req, res) => {
  try {
    const { user } = req;
    const stylistId = req.params.stylist_id;

    const result = await query(
      'DELETE FROM client_favorites WHERE client_id = $1 AND stylist_id = $2 RETURNING id',
      [user.id, stylistId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    return res.json({
      success: true,
      message: 'Stylist removed from favorites'
    });

  } catch (error) {
    console.error('Error removing favorite:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;