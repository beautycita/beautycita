const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * BOOKING MITIGATION ACTIONS API
 * Handle late client scenarios with various mitigation options
 */

/**
 * POST /api/bookings/:booking_id/mitigation/bump
 * Bump appointment to a later time
 */
router.post('/:booking_id/mitigation/bump', async (req, res) => {
  try {
    const { user } = req;
    const { booking_id } = req.params;
    const { new_time, reason, message_to_client } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify stylist owns this booking
    const booking = await query(
      `SELECT b.*, bt.duration_seconds, bt.distance_meters
       FROM bookings b
       LEFT JOIN booking_location_tracking bt ON b.id = bt.booking_id
       INNER JOIN stylists s ON b.stylist_id = s.id
       WHERE b.id = $1 AND s.user_id = $2`,
      [booking_id, user.id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    const bookingData = booking.rows[0];
    const etaMinutes = bookingData.duration_seconds ? Math.ceil(bookingData.duration_seconds / 60) : null;
    const appointmentTime = new Date(bookingData.booking_date + ' ' + bookingData.start_time);
    const minutesUntilAppointment = Math.ceil((appointmentTime - new Date()) / 60000);

    // Create mitigation action
    const mitigation = await query(
      `INSERT INTO booking_mitigation_actions (
        booking_id, initiated_by, action_type, original_time, new_time,
        reason, eta_at_action, minutes_until_appointment, message_sent, status, created_at
      )
      VALUES ($1, $2, 'bump_appointment', $3, $4, $5, $6, $7, $8, 'pending', NOW())
      RETURNING *`,
      [
        booking_id,
        user.id,
        appointmentTime,
        new_time,
        reason || 'Client running late',
        etaMinutes,
        minutesUntilAppointment,
        message_to_client || null
      ]
    );

    // Update booking time
    await query(
      `UPDATE bookings
       SET start_time = $1, updated_at = NOW()
       WHERE id = $2`,
      [new_time, booking_id]
    );

    // TODO: Notify client of new time

    return res.json({
      success: true,
      message: 'Appointment bumped successfully',
      data: mitigation.rows[0]
    });

  } catch (error) {
    console.error('Error bumping appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


/**
 * POST /api/bookings/:booking_id/mitigation/partial-refund
 * Issue partial refund for late client
 */
router.post('/:booking_id/mitigation/partial-refund', async (req, res) => {
  try {
    const { user } = req;
    const { booking_id } = req.params;
    const { refund_percentage, reason, message_to_client } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!refund_percentage || refund_percentage < 0 || refund_percentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid refund_percentage. Must be between 0 and 100.'
      });
    }

    // Verify stylist owns this booking
    const booking = await query(
      `SELECT b.*, bt.duration_seconds, bt.distance_meters
       FROM bookings b
       LEFT JOIN booking_location_tracking bt ON b.id = bt.booking_id
       INNER JOIN stylists s ON b.stylist_id = s.id
       WHERE b.id = $1 AND s.user_id = $2`,
      [booking_id, user.id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    const bookingData = booking.rows[0];
    const refundAmount = (bookingData.total_price * refund_percentage) / 100;
    const etaMinutes = bookingData.duration_seconds ? Math.ceil(bookingData.duration_seconds / 60) : null;
    const appointmentTime = new Date(bookingData.booking_date + ' ' + bookingData.start_time);
    const minutesUntilAppointment = Math.ceil((appointmentTime - new Date()) / 60000);

    // Create mitigation action
    const mitigation = await query(
      `INSERT INTO booking_mitigation_actions (
        booking_id, initiated_by, action_type, refund_amount, refund_percentage,
        reason, eta_at_action, minutes_until_appointment, message_sent, status, created_at
      )
      VALUES ($1, $2, 'partial_refund', $3, $4, $5, $6, $7, $8, 'pending', NOW())
      RETURNING *`,
      [
        booking_id,
        user.id,
        refundAmount,
        refund_percentage,
        reason || 'Client was late',
        etaMinutes,
        minutesUntilAppointment,
        message_to_client || null
      ]
    );

    // TODO: Process actual refund via Stripe

    return res.json({
      success: true,
      message: 'Partial refund initiated',
      data: {
        ...mitigation.rows[0],
        refund_amount: refundAmount
      }
    });

  } catch (error) {
    console.error('Error issuing partial refund:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


/**
 * POST /api/bookings/:booking_id/mitigation/contact-client
 * Contact client about being late
 */
router.post('/:booking_id/mitigation/contact-client', async (req, res) => {
  try {
    const { user } = req;
    const { booking_id } = req.params;
    const { message } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify stylist owns this booking
    const booking = await query(
      `SELECT b.*, bt.duration_seconds, c.phone, c.email
       FROM bookings b
       LEFT JOIN booking_location_tracking bt ON b.id = bt.booking_id
       LEFT JOIN users c ON b.client_id = c.id
       INNER JOIN stylists s ON b.stylist_id = s.id
       WHERE b.id = $1 AND s.user_id = $2`,
      [booking_id, user.id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    const bookingData = booking.rows[0];
    const etaMinutes = bookingData.duration_seconds ? Math.ceil(bookingData.duration_seconds / 60) : null;
    const appointmentTime = new Date(bookingData.booking_date + ' ' + bookingData.start_time);
    const minutesUntilAppointment = Math.ceil((appointmentTime - new Date()) / 60000);

    // Create mitigation action
    const mitigation = await query(
      `INSERT INTO booking_mitigation_actions (
        booking_id, initiated_by, action_type, reason, eta_at_action,
        minutes_until_appointment, message_sent, status, created_at
      )
      VALUES ($1, $2, 'contact_client', $3, $4, $5, $6, 'completed', NOW())
      RETURNING *`,
      [
        booking_id,
        user.id,
        'Checking on client status',
        etaMinutes,
        minutesUntilAppointment,
        message
      ]
    );

    // TODO: Send SMS/push notification to client
    console.log(`Contact client for booking ${booking_id}: ${message}`);

    return res.json({
      success: true,
      message: 'Client contacted successfully',
      data: mitigation.rows[0]
    });

  } catch (error) {
    console.error('Error contacting client:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


/**
 * POST /api/bookings/:booking_id/mitigation/cancel
 * Cancel appointment and issue full refund
 */
router.post('/:booking_id/mitigation/cancel', async (req, res) => {
  try {
    const { user } = req;
    const { booking_id } = req.params;
    const { reason, message_to_client } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify stylist owns this booking
    const booking = await query(
      `SELECT b.*, bt.duration_seconds
       FROM bookings b
       LEFT JOIN booking_location_tracking bt ON b.id = bt.booking_id
       INNER JOIN stylists s ON b.stylist_id = s.id
       WHERE b.id = $1 AND s.user_id = $2`,
      [booking_id, user.id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    const bookingData = booking.rows[0];
    const etaMinutes = bookingData.duration_seconds ? Math.ceil(bookingData.duration_seconds / 60) : null;
    const appointmentTime = new Date(bookingData.booking_date + ' ' + bookingData.start_time);
    const minutesUntilAppointment = Math.ceil((appointmentTime - new Date()) / 60000);

    // Create mitigation action
    const mitigation = await query(
      `INSERT INTO booking_mitigation_actions (
        booking_id, initiated_by, action_type, refund_amount, refund_percentage,
        reason, eta_at_action, minutes_until_appointment, message_sent, status, created_at
      )
      VALUES ($1, $2, 'cancel', $3, 100, $4, $5, $6, $7, 'completed', NOW())
      RETURNING *`,
      [
        booking_id,
        user.id,
        bookingData.total_price,
        reason || 'Client no-show or excessive lateness',
        etaMinutes,
        minutesUntilAppointment,
        message_to_client || null
      ]
    );

    // Update booking status
    await query(
      `UPDATE bookings
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1`,
      [booking_id]
    );

    // TODO: Process full refund via Stripe

    return res.json({
      success: true,
      message: 'Appointment cancelled and refund initiated',
      data: mitigation.rows[0]
    });

  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


/**
 * POST /api/bookings/:booking_id/mitigation/wait
 * Mark that stylist will wait for client
 */
router.post('/:booking_id/mitigation/wait', async (req, res) => {
  try {
    const { user } = req;
    const { booking_id } = req.params;
    const { reason } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify stylist owns this booking
    const booking = await query(
      `SELECT b.*, bt.duration_seconds
       FROM bookings b
       LEFT JOIN booking_location_tracking bt ON b.id = bt.booking_id
       INNER JOIN stylists s ON b.stylist_id = s.id
       WHERE b.id = $1 AND s.user_id = $2`,
      [booking_id, user.id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    const bookingData = booking.rows[0];
    const etaMinutes = bookingData.duration_seconds ? Math.ceil(bookingData.duration_seconds / 60) : null;
    const appointmentTime = new Date(bookingData.booking_date + ' ' + bookingData.start_time);
    const minutesUntilAppointment = Math.ceil((appointmentTime - new Date()) / 60000);

    // Create mitigation action
    const mitigation = await query(
      `INSERT INTO booking_mitigation_actions (
        booking_id, initiated_by, action_type, reason, eta_at_action,
        minutes_until_appointment, status, created_at
      )
      VALUES ($1, $2, 'wait_for_client', $3, $4, $5, 'completed', NOW())
      RETURNING *`,
      [
        booking_id,
        user.id,
        reason || 'Will wait for client',
        etaMinutes,
        minutesUntilAppointment
      ]
    );

    return res.json({
      success: true,
      message: 'Marked as waiting for client',
      data: mitigation.rows[0]
    });

  } catch (error) {
    console.error('Error marking wait:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


/**
 * POST /api/bookings/:booking_id/mitigation/shorten-service
 * Shorten service duration to accommodate lateness
 */
router.post('/:booking_id/mitigation/shorten-service', async (req, res) => {
  try {
    const { user } = req;
    const { booking_id } = req.params;
    const { new_duration, reason, message_to_client } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify stylist owns this booking
    const booking = await query(
      `SELECT b.*, bt.duration_seconds
       FROM bookings b
       LEFT JOIN booking_location_tracking bt ON b.id = bt.booking_id
       INNER JOIN stylists s ON b.stylist_id = s.id
       WHERE b.id = $1 AND s.user_id = $2`,
      [booking_id, user.id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    const bookingData = booking.rows[0];
    const etaMinutes = bookingData.duration_seconds ? Math.ceil(bookingData.duration_seconds / 60) : null;
    const appointmentTime = new Date(bookingData.booking_date + ' ' + bookingData.start_time);
    const minutesUntilAppointment = Math.ceil((appointmentTime - new Date()) / 60000);

    // Create mitigation action
    const mitigation = await query(
      `INSERT INTO booking_mitigation_actions (
        booking_id, initiated_by, action_type, reason, eta_at_action,
        minutes_until_appointment, message_sent, status, created_at
      )
      VALUES ($1, $2, 'shorten_service', $3, $4, $5, $6, 'pending', NOW())
      RETURNING *`,
      [
        booking_id,
        user.id,
        reason || `Service shortened to ${new_duration} minutes`,
        etaMinutes,
        minutesUntilAppointment,
        message_to_client || null
      ]
    );

    // TODO: Notify client of shortened service time

    return res.json({
      success: true,
      message: 'Service time shortened',
      data: mitigation.rows[0]
    });

  } catch (error) {
    console.error('Error shortening service:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


/**
 * GET /api/bookings/:booking_id/mitigation/history
 * Get all mitigation actions for a booking
 */
router.get('/:booking_id/mitigation/history', async (req, res) => {
  try {
    const { user } = req;
    const { booking_id } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify user has access to this booking
    const booking = await query(
      `SELECT b.id
       FROM bookings b
       LEFT JOIN stylists s ON b.stylist_id = s.id
       WHERE b.id = $1 AND (b.client_id = $2 OR s.user_id = $2)`,
      [booking_id, user.id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    // Get mitigation history
    const history = await query(
      `SELECT bma.*, u.first_name, u.last_name
       FROM booking_mitigation_actions bma
       LEFT JOIN users u ON bma.initiated_by = u.id
       WHERE bma.booking_id = $1
       ORDER BY bma.created_at DESC`,
      [booking_id]
    );

    return res.json({
      success: true,
      data: history.rows
    });

  } catch (error) {
    console.error('Error fetching mitigation history:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


/**
 * GET /api/stylist/late-risk-bookings
 * Get bookings at risk of client being late (for stylist dashboard)
 */
router.get('/late-risk-bookings', async (req, res) => {
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

    // Get upcoming bookings with tracking data
    const atRiskBookings = await query(
      `SELECT b.*, bt.duration_seconds, bt.distance_meters, bt.is_en_route,
              c.first_name, c.last_name, c.phone,
              EXTRACT(EPOCH FROM (b.booking_date + b.start_time - NOW())) / 60 as minutes_until_appointment
       FROM bookings b
       LEFT JOIN booking_location_tracking bt ON b.id = bt.booking_id
       LEFT JOIN users c ON b.client_id = c.id
       WHERE b.stylist_id = $1
         AND b.status = 'confirmed'
         AND b.booking_date = CURRENT_DATE
         AND b.start_time > NOW()::time
         AND (
           -- Client hasn't started journey and appointment is soon
           (bt.is_en_route = false AND EXTRACT(EPOCH FROM (b.booking_date + b.start_time - NOW())) / 60 < 30)
           OR
           -- Client is en route but ETA suggests they'll be late
           (bt.is_en_route = true AND bt.duration_seconds / 60 > EXTRACT(EPOCH FROM (b.booking_date + b.start_time - NOW())) / 60)
         )
       ORDER BY b.start_time ASC`,
      [stylistId]
    );

    return res.json({
      success: true,
      data: atRiskBookings.rows
    });

  } catch (error) {
    console.error('Error fetching at-risk bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


module.exports = router;
