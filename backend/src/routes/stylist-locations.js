const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * STYLIST LOCATIONS API
 * Manage multiple business locations for stylists
 */

/**
 * GET /api/stylist/locations
 * Get all locations for authenticated stylist
 */
router.get('/locations', async (req, res) => {
  try {
    const { user } = req;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get stylist_id from stylists table
    const stylistQuery = await query(
      'SELECT id FROM stylists WHERE user_id = $1',
      [user.id]
    );

    if (stylistQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stylist profile not found'
      });
    }

    const stylistId = stylistQuery.rows[0].id;

    // Get all locations
    const locations = await query(
      `SELECT * FROM stylist_locations
       WHERE stylist_id = $1
       ORDER BY is_primary DESC, created_at ASC`,
      [stylistId]
    );

    return res.json({
      success: true,
      data: locations.rows
    });

  } catch (error) {
    console.error('Error fetching locations:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


/**
 * POST /api/stylist/locations
 * Add a new business location
 */
router.post('/locations', async (req, res) => {
  try {
    const { user } = req;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get stylist_id
    const stylistQuery = await query(
      'SELECT id FROM stylists WHERE user_id = $1',
      [user.id]
    );

    if (stylistQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stylist profile not found'
      });
    }

    const stylistId = stylistQuery.rows[0].id;

    const {
      location_name,
      location_type,
      address,
      city,
      state,
      zip,
      country,
      latitude,
      longitude,
      is_primary,
      accepts_walkins,
      parking_available,
      wheelchair_accessible,
      working_hours,
      notes,
      photos
    } = req.body;

    // Validate required fields
    if (!location_name || !address || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: location_name, address, latitude, longitude'
      });
    }

    // Insert new location
    const result = await query(
      `INSERT INTO stylist_locations (
        stylist_id, location_name, location_type, address, city, state, zip, country,
        latitude, longitude, is_primary, accepts_walkins, parking_available,
        wheelchair_accessible, working_hours, notes, photos, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
      RETURNING *`,
      [
        stylistId,
        location_name,
        location_type || 'salon',
        address,
        city || '',
        state || '',
        zip || '',
        country || 'Mexico',
        latitude,
        longitude,
        is_primary || false,
        accepts_walkins || false,
        parking_available || false,
        wheelchair_accessible || false,
        working_hours || {},
        notes || null,
        photos || []
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Location added successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error adding location:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


/**
 * PUT /api/stylist/locations/:id
 * Update a location
 */
router.put('/locations/:id', async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get stylist_id
    const stylistQuery = await query(
      'SELECT id FROM stylists WHERE user_id = $1',
      [user.id]
    );

    if (stylistQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stylist profile not found'
      });
    }

    const stylistId = stylistQuery.rows[0].id;

    // Verify ownership
    const locationCheck = await query(
      'SELECT id FROM stylist_locations WHERE id = $1 AND stylist_id = $2',
      [id, stylistId]
    );

    if (locationCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Location not found or access denied'
      });
    }

    const {
      location_name,
      location_type,
      address,
      city,
      state,
      zip,
      country,
      latitude,
      longitude,
      is_primary,
      is_active,
      accepts_walkins,
      parking_available,
      wheelchair_accessible,
      working_hours,
      notes,
      photos
    } = req.body;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (location_name !== undefined) {
      updates.push(`location_name = $${paramCount++}`);
      values.push(location_name);
    }
    if (location_type !== undefined) {
      updates.push(`location_type = $${paramCount++}`);
      values.push(location_type);
    }
    if (address !== undefined) {
      updates.push(`address = $${paramCount++}`);
      values.push(address);
    }
    if (city !== undefined) {
      updates.push(`city = $${paramCount++}`);
      values.push(city);
    }
    if (state !== undefined) {
      updates.push(`state = $${paramCount++}`);
      values.push(state);
    }
    if (zip !== undefined) {
      updates.push(`zip = $${paramCount++}`);
      values.push(zip);
    }
    if (country !== undefined) {
      updates.push(`country = $${paramCount++}`);
      values.push(country);
    }
    if (latitude !== undefined) {
      updates.push(`latitude = $${paramCount++}`);
      values.push(latitude);
    }
    if (longitude !== undefined) {
      updates.push(`longitude = $${paramCount++}`);
      values.push(longitude);
    }
    if (is_primary !== undefined) {
      updates.push(`is_primary = $${paramCount++}`);
      values.push(is_primary);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }
    if (accepts_walkins !== undefined) {
      updates.push(`accepts_walkins = $${paramCount++}`);
      values.push(accepts_walkins);
    }
    if (parking_available !== undefined) {
      updates.push(`parking_available = $${paramCount++}`);
      values.push(parking_available);
    }
    if (wheelchair_accessible !== undefined) {
      updates.push(`wheelchair_accessible = $${paramCount++}`);
      values.push(wheelchair_accessible);
    }
    if (working_hours !== undefined) {
      updates.push(`working_hours = $${paramCount++}`);
      values.push(working_hours);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes);
    }
    if (photos !== undefined) {
      updates.push(`photos = $${paramCount++}`);
      values.push(photos);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE stylist_locations
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return res.json({
      success: true,
      message: 'Location updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating location:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


/**
 * DELETE /api/stylist/locations/:id
 * Delete a location
 */
router.delete('/locations/:id', async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get stylist_id
    const stylistQuery = await query(
      'SELECT id FROM stylists WHERE user_id = $1',
      [user.id]
    );

    if (stylistQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stylist profile not found'
      });
    }

    const stylistId = stylistQuery.rows[0].id;

    // Verify ownership and check if primary
    const locationCheck = await query(
      'SELECT id, is_primary FROM stylist_locations WHERE id = $1 AND stylist_id = $2',
      [id, stylistId]
    );

    if (locationCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Location not found or access denied'
      });
    }

    if (locationCheck.rows[0].is_primary) {
      // Check if there are other locations
      const otherLocations = await query(
        'SELECT COUNT(*) FROM stylist_locations WHERE stylist_id = $1 AND id != $2',
        [stylistId, id]
      );

      if (otherLocations.rows[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete primary location. Please set another location as primary first.'
        });
      }
    }

    // Delete location
    await query('DELETE FROM stylist_locations WHERE id = $1', [id]);

    return res.json({
      success: true,
      message: 'Location deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting location:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


/**
 * POST /api/stylist/locations/:id/set-primary
 * Set a location as primary
 */
router.post('/locations/:id/set-primary', async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get stylist_id
    const stylistQuery = await query(
      'SELECT id FROM stylists WHERE user_id = $1',
      [user.id]
    );

    if (stylistQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stylist profile not found'
      });
    }

    const stylistId = stylistQuery.rows[0].id;

    // Verify ownership
    const locationCheck = await query(
      'SELECT id FROM stylist_locations WHERE id = $1 AND stylist_id = $2',
      [id, stylistId]
    );

    if (locationCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Location not found or access denied'
      });
    }

    // Update all locations to not primary
    await query(
      'UPDATE stylist_locations SET is_primary = false WHERE stylist_id = $1',
      [stylistId]
    );

    // Set this location as primary
    const result = await query(
      'UPDATE stylist_locations SET is_primary = true, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );

    return res.json({
      success: true,
      message: 'Primary location updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error setting primary location:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


/**
 * GET /api/stylist/:stylist_id/locations/public
 * Public endpoint to get stylist locations (for clients)
 */
router.get('/:stylist_id/locations/public', async (req, res) => {
  try {
    const { stylist_id } = req.params;

    // Get active locations only
    const locations = await query(
      `SELECT
        id, location_name, location_type, address, city, state, zip, country,
        latitude, longitude, is_primary, accepts_walkins, parking_available,
        wheelchair_accessible, working_hours, notes
       FROM stylist_locations
       WHERE stylist_id = $1 AND is_active = true
       ORDER BY is_primary DESC, location_name ASC`,
      [stylist_id]
    );

    return res.json({
      success: true,
      data: locations.rows
    });

  } catch (error) {
    console.error('Error fetching public locations:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


module.exports = router;
