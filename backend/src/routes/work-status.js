const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { validateJWT } = require('../middleware/auth');

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

/**
 * GET /api/work-status/my-status
 * Get current work status for logged-in stylist
 */
router.get('/my-status', validateJWT, requireStylist, async (req, res) => {
  try {
    const { user } = req;

    // Get stylist ID from user
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

    // Get work status
    const statusResult = await query(`
      SELECT * FROM stylist_work_status
      WHERE stylist_id = $1
    `, [stylistId]);

    if (statusResult.rows.length === 0) {
      // Create default status if doesn't exist
      await query(`
        INSERT INTO stylist_work_status (stylist_id, status)
        VALUES ($1, 'offline')
      `, [stylistId]);

      return res.json({
        success: true,
        status: {
          stylist_id: stylistId,
          status: 'offline',
          work_started_at: null,
          estimated_available_at: null,
          actual_available_at: null,
          alert_sent: false,
          work_extended_count: 0,
          status_note: null
        }
      });
    }

    res.json({
      success: true,
      status: statusResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching work status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch work status'
    });
  }
});

/**
 * POST /api/work-status/mark-working
 * Mark stylist as currently working with ETA
 */
router.post('/mark-working', validateJWT, requireStylist, async (req, res) => {
  try {
    const { user } = req;
    const { estimatedAvailableAt, statusNote } = req.body;

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

    // Update work status
    const result = await query(`
      INSERT INTO stylist_work_status (
        stylist_id,
        status,
        work_started_at,
        estimated_available_at,
        status_note,
        last_status_change,
        alert_sent,
        work_extended_count
      ) VALUES ($1, 'working', NOW(), $2, $3, NOW(), false, 0)
      ON CONFLICT (stylist_id)
      DO UPDATE SET
        status = 'working',
        work_started_at = NOW(),
        estimated_available_at = $2,
        status_note = $3,
        last_status_change = NOW(),
        alert_sent = false,
        work_extended_count = 0,
        updated_at = NOW()
      RETURNING *
    `, [stylistId, estimatedAvailableAt, statusNote || null]);

    res.json({
      success: true,
      message: 'Work status updated to working',
      status: result.rows[0]
    });
  } catch (error) {
    console.error('Error marking as working:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update work status'
    });
  }
});

/**
 * POST /api/work-status/mark-available
 * Mark stylist as available for bookings
 */
router.post('/mark-available', validateJWT, requireStylist, async (req, res) => {
  try {
    const { user } = req;
    const { statusNote } = req.body;

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

    // Update work status
    const result = await query(`
      INSERT INTO stylist_work_status (
        stylist_id,
        status,
        actual_available_at,
        status_note,
        last_status_change
      ) VALUES ($1, 'available', NOW(), $2, NOW())
      ON CONFLICT (stylist_id)
      DO UPDATE SET
        status = 'available',
        actual_available_at = NOW(),
        status_note = $2,
        last_status_change = NOW(),
        updated_at = NOW()
      RETURNING *
    `, [stylistId, statusNote || null]);

    res.json({
      success: true,
      message: 'Work status updated to available',
      status: result.rows[0]
    });
  } catch (error) {
    console.error('Error marking as available:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update work status'
    });
  }
});

/**
 * POST /api/work-status/mark-unavailable
 * Mark stylist as temporarily unavailable with ETA
 */
router.post('/mark-unavailable', validateJWT, requireStylist, async (req, res) => {
  try {
    const { user } = req;
    const { estimatedAvailableAt, statusNote } = req.body;

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

    // Update work status
    const result = await query(`
      INSERT INTO stylist_work_status (
        stylist_id,
        status,
        estimated_available_at,
        status_note,
        last_status_change
      ) VALUES ($1, 'unavailable', $2, $3, NOW())
      ON CONFLICT (stylist_id)
      DO UPDATE SET
        status = 'unavailable',
        estimated_available_at = $2,
        status_note = $3,
        last_status_change = NOW(),
        updated_at = NOW()
      RETURNING *
    `, [stylistId, estimatedAvailableAt, statusNote || null]);

    res.json({
      success: true,
      message: 'Work status updated to unavailable',
      status: result.rows[0]
    });
  } catch (error) {
    console.error('Error marking as unavailable:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update work status'
    });
  }
});

/**
 * POST /api/work-status/extend-work
 * Extend work hours (increment counter and update ETA)
 */
router.post('/extend-work', validateJWT, requireStylist, async (req, res) => {
  try {
    const { user } = req;
    const { estimatedAvailableAt } = req.body;

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

    // Update work status and increment extension count
    const result = await query(`
      UPDATE stylist_work_status
      SET
        estimated_available_at = $1,
        work_extended_count = work_extended_count + 1,
        alert_sent = false,
        updated_at = NOW()
      WHERE stylist_id = $2
      RETURNING *
    `, [estimatedAvailableAt, stylistId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Work status not found'
      });
    }

    res.json({
      success: true,
      message: 'Work hours extended',
      status: result.rows[0]
    });
  } catch (error) {
    console.error('Error extending work:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to extend work hours'
    });
  }
});

/**
 * POST /api/work-status/mark-alert-sent
 * Mark that alert has been sent (used internally by notification system)
 */
router.post('/mark-alert-sent', validateJWT, requireStylist, async (req, res) => {
  try {
    const { user } = req;

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

    // Update alert status
    await query(`
      UPDATE stylist_work_status
      SET alert_sent = true, alert_sent_at = NOW(), updated_at = NOW()
      WHERE stylist_id = $1
    `, [stylistId]);

    res.json({
      success: true,
      message: 'Alert marked as sent'
    });
  } catch (error) {
    console.error('Error marking alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark alert'
    });
  }
});

/**
 * GET /api/work-status/stylist/:stylistId
 * Get work status for a specific stylist (public for clients to check)
 */
router.get('/stylist/:stylistId', validateJWT, async (req, res) => {
  try {
    const { stylistId } = req.params;

    const result = await query(`
      SELECT
        stylist_id,
        status,
        estimated_available_at,
        status_note,
        last_status_change
      FROM stylist_work_status
      WHERE stylist_id = $1
    `, [stylistId]);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        status: {
          stylist_id: parseInt(stylistId),
          status: 'offline',
          estimated_available_at: null,
          status_note: null
        }
      });
    }

    // Only return public information
    const publicStatus = {
      stylist_id: result.rows[0].stylist_id,
      status: result.rows[0].status,
      estimated_available_at: result.rows[0].estimated_available_at,
      status_note: result.rows[0].status_note
    };

    res.json({
      success: true,
      status: publicStatus
    });
  } catch (error) {
    console.error('Error fetching stylist status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stylist status'
    });
  }
});

/**
 * GET /api/work-status/available-stylists
 * Get list of currently available stylists
 */
router.get('/available-stylists', validateJWT, async (req, res) => {
  try {
    const result = await query(`
      SELECT
        s.id AS stylist_id,
        u.name,
        s.business_name,
        s.location_city,
        s.location_state,
        s.rating_average,
        s.rating_count,
        ws.status,
        ws.status_note
      FROM stylist_work_status ws
      JOIN stylists s ON ws.stylist_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE ws.status = 'available'
        AND u.is_active = true
      ORDER BY s.rating_average DESC, s.rating_count DESC
      LIMIT 50
    `);

    res.json({
      success: true,
      stylists: result.rows
    });
  } catch (error) {
    console.error('Error fetching available stylists:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available stylists'
    });
  }
});

module.exports = router;
