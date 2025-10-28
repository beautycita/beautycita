const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { validateJWT } = require('../middleware/auth');

/**
 * GET /api/sms-preferences
 * Get user's SMS notification preferences
 */
router.get('/', validateJWT, async (req, res) => {
  try {
    const userId = req.userId;

    const result = await query(
      `SELECT * FROM sms_preferences WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Create default preferences if none exist
      const defaultPrefs = await query(
        `INSERT INTO sms_preferences (user_id) VALUES ($1) RETURNING *`,
        [userId]
      );
      return res.json({
        success: true,
        preferences: defaultPrefs.rows[0]
      });
    }

    res.json({
      success: true,
      preferences: result.rows[0]
    });
  } catch (error) {
    console.error('Get SMS preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve SMS preferences'
    });
  }
});

/**
 * PUT /api/sms-preferences
 * Update user's SMS notification preferences
 */
router.put('/', validateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const {
      booking_requests,
      booking_confirmations,
      proximity_alerts,
      payment_notifications,
      reminders,
      cancellations,
      marketing,
      emergency_only,
      booking_expired
    } = req.body;

    // Ensure preferences exist
    const existing = await query(
      `SELECT id FROM sms_preferences WHERE user_id = $1`,
      [userId]
    );

    if (existing.rows.length === 0) {
      // Create new preferences
      const result = await query(
        `INSERT INTO sms_preferences (
          user_id, booking_requests, booking_confirmations, proximity_alerts,
          payment_notifications, reminders, cancellations, marketing, emergency_only, booking_expired
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          userId,
          booking_requests !== undefined ? booking_requests : true,
          booking_confirmations !== undefined ? booking_confirmations : true,
          proximity_alerts !== undefined ? proximity_alerts : true,
          payment_notifications !== undefined ? payment_notifications : true,
          reminders !== undefined ? reminders : true,
          cancellations !== undefined ? cancellations : true,
          marketing !== undefined ? marketing : false,
          emergency_only !== undefined ? emergency_only : false,
          booking_expired !== undefined ? booking_expired : true
        ]
      );

      return res.json({
        success: true,
        message: 'SMS preferences created successfully',
        preferences: result.rows[0]
      });
    }

    // Update existing preferences
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (booking_requests !== undefined) {
      updateFields.push(`booking_requests = $${paramCount++}`);
      updateValues.push(booking_requests);
    }
    if (booking_confirmations !== undefined) {
      updateFields.push(`booking_confirmations = $${paramCount++}`);
      updateValues.push(booking_confirmations);
    }
    if (proximity_alerts !== undefined) {
      updateFields.push(`proximity_alerts = $${paramCount++}`);
      updateValues.push(proximity_alerts);
    }
    if (payment_notifications !== undefined) {
      updateFields.push(`payment_notifications = $${paramCount++}`);
      updateValues.push(payment_notifications);
    }
    if (reminders !== undefined) {
      updateFields.push(`reminders = $${paramCount++}`);
      updateValues.push(reminders);
    }
    if (cancellations !== undefined) {
      updateFields.push(`cancellations = $${paramCount++}`);
      updateValues.push(cancellations);
    }
    if (marketing !== undefined) {
      updateFields.push(`marketing = $${paramCount++}`);
      updateValues.push(marketing);
    }
    if (emergency_only !== undefined) {
      updateFields.push(`emergency_only = $${paramCount++}`);
      updateValues.push(emergency_only);
    }
    if (booking_expired !== undefined) {
      updateFields.push(`booking_expired = $${paramCount++}`);
      updateValues.push(booking_expired);
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(userId);

    const result = await query(
      `UPDATE sms_preferences
       SET ${updateFields.join(', ')}
       WHERE user_id = $${paramCount}
       RETURNING *`,
      updateValues
    );

    res.json({
      success: true,
      message: 'SMS preferences updated successfully',
      preferences: result.rows[0]
    });
  } catch (error) {
    console.error('Update SMS preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update SMS preferences'
    });
  }
});

module.exports = router;
