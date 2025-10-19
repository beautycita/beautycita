const express = require('express');
const router = express.Router();
const { query } = require('./db');
const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: '/var/www/beautycita.com/backend/logs/stylist-bookings.log' }),
    new winston.transports.Console()
  ]
});

// Note: Authentication is handled by validateJWT middleware in server.js
// req.user is guaranteed to exist at this point

// Middleware to ensure user is a stylist and get stylist ID
const requireStylist = async (req, res, next) => {
  try {
    if (req.user.role !== 'STYLIST' && req.user.role !== 'ADMIN' && req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ success: false, message: 'Stylist access required' });
    }

    // Get stylist ID
    const stylistResult = await query(
      'SELECT id FROM stylists WHERE user_id = $1',
      [req.user.id]
    );

    if (stylistResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Stylist profile not found' });
    }

    req.stylistId = stylistResult.rows[0].id;
    next();
  } catch (error) {
    logger.error('Error in requireStylist middleware:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/stylist/bookings
 * List all bookings for the authenticated stylist
 */
router.get('/bookings', requireStylist, async (req, res) => {
  try {
    const stylistId = req.stylistId;
    const { status, startDate, endDate, limit = 100, offset = 0 } = req.query;

    // Build WHERE clause dynamically
    let whereConditions = ['b.stylist_id = $1'];
    let queryParams = [stylistId];
    let paramIndex = 2;

    if (status) {
      whereConditions.push(`b.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (startDate) {
      whereConditions.push(`b.booking_date >= $${paramIndex}`);
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`b.booking_date <= $${paramIndex}`);
      queryParams.push(endDate);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get bookings with client and service details
    const bookingsQuery = `
      SELECT
        b.id,
        b.booking_date,
        b.booking_time,
        b.booking_time as start_time,
        (b.booking_time::time + (b.duration_minutes || ' minutes')::interval)::time as end_time,
        b.duration_minutes,
        b.status,
        b.total_price,
        b.notes,
        b.stylist_notes,
        b.created_at,
        b.updated_at,
        b.confirmed_at,
        b.completed_at,
        b.cancelled_at,
        b.cancellation_reason,
        COALESCE(u.first_name || ' ' || u.last_name, u.name, 'Unknown Client') as client_name,
        COALESCE(u.first_name, SPLIT_PART(u.name, ' ', 1)) as client_first_name,
        COALESCE(u.last_name, SPLIT_PART(u.name, ' ', 2)) as client_last_name,
        u.email as client_email,
        u.phone as client_phone,
        u.profile_picture_url as client_avatar,
        s.name as service_name,
        s.description as service_description,
        s.price as service_price,
        s.category as service_category
      FROM bookings b
      JOIN users u ON b.client_id = u.id
      LEFT JOIN services s ON b.service_id = s.id
      WHERE ${whereClause}
      ORDER BY b.booking_date DESC, b.booking_time DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), parseInt(offset));

    const bookingsResult = await query(bookingsQuery, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM bookings b
      WHERE ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams.slice(0, -2)); // Remove limit and offset

    res.json({
      success: true,
      data: {
        bookings: bookingsResult.rows,
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

    logger.info('Stylist bookings fetched', { stylistId, count: bookingsResult.rows.length });
  } catch (error) {
    logger.error('Error fetching stylist bookings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

/**
 * GET /api/stylist/bookings/:id
 * Get a specific booking by ID
 */
router.get('/bookings/:id', requireStylist, async (req, res) => {
  try {
    const stylistId = req.stylistId;
    const bookingId = req.params.id;

    const bookingResult = await query(`
      SELECT
        b.*,
        COALESCE(u.first_name, SPLIT_PART(u.name, ' ', 1)) as client_first_name,
        COALESCE(u.last_name, SPLIT_PART(u.name, ' ', 2)) as client_last_name,
        u.email as client_email,
        u.phone as client_phone,
        u.profile_picture_url as client_avatar,
        s.name as service_name,
        s.description as service_description,
        s.price as service_price,
        s.duration_minutes as service_duration
      FROM bookings b
      JOIN users u ON b.client_id = u.id
      LEFT JOIN services s ON b.service_id = s.id
      WHERE b.id = $1 AND b.stylist_id = $2
    `, [bookingId, stylistId]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({
      success: true,
      data: bookingResult.rows[0]
    });

    logger.info('Stylist booking detail fetched', { stylistId, bookingId });
  } catch (error) {
    logger.error('Error fetching booking detail:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch booking' });
  }
});

/**
 * PATCH /api/stylist/bookings/:id/confirm
 * Stylist confirms/accepts a pending booking
 */
router.patch('/bookings/:id/confirm', requireStylist, async (req, res) => {
  try {
    const stylistId = req.stylistId;
    const bookingId = req.params.id;

    // Get booking details
    const bookingResult = await query(`
      SELECT b.*, s.name as service_name,
             u.first_name as client_first_name, u.phone as client_phone
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.client_id = u.id
      WHERE b.id = $1 AND b.stylist_id = $2
    `, [bookingId, stylistId]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    // Check if booking is in pending status
    if (booking.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Booking is ${booking.status.toLowerCase()}, cannot confirm`
      });
    }

    // Check if booking has expired
    const now = new Date();
    if (booking.request_expires_at && new Date(booking.request_expires_at) < now) {
      await query(`
        UPDATE bookings
        SET status = 'EXPIRED', last_status_change = $1
        WHERE id = $2
      `, [now, bookingId]);

      return res.status(400).json({ success: false, message: 'Booking request has expired' });
    }

    // Update booking to VERIFY_ACCEPTANCE status
    const acceptanceExpiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

    await query(`
      UPDATE bookings
      SET status = 'VERIFY_ACCEPTANCE',
          acceptance_expires_at = $1,
          last_status_change = $2,
          updated_at = $3
      WHERE id = $4
    `, [acceptanceExpiresAt, now, now, bookingId]);

    // TODO: Send SMS notification to client

    res.json({
      success: true,
      message: 'Booking confirmed! Waiting for client payment confirmation.',
      data: {
        id: bookingId,
        status: 'VERIFY_ACCEPTANCE',
        acceptance_expires_at: acceptanceExpiresAt
      }
    });

    logger.info('Stylist confirmed booking', { stylistId, bookingId });
  } catch (error) {
    logger.error('Error confirming booking:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm booking' });
  }
});

/**
 * PATCH /api/stylist/bookings/:id/cancel
 * Stylist cancels a booking
 */
router.patch('/bookings/:id/cancel', requireStylist, async (req, res) => {
  try {
    const stylistId = req.stylistId;
    const bookingId = req.params.id;
    const { reason = 'Cancelled by stylist' } = req.body;

    // Get booking details
    const bookingResult = await query(`
      SELECT b.*, s.name as service_name
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      WHERE b.id = $1 AND b.stylist_id = $2
    `, [bookingId, stylistId]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    // Check if booking can be cancelled
    if (['CANCELLED', 'COMPLETED', 'EXPIRED'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel booking that is ${booking.status.toLowerCase()}`
      });
    }

    const now = new Date();

    // Calculate time until booking
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
    const hoursUntilBooking = (bookingDateTime - now) / (1000 * 60 * 60);

    // Stylists must cancel at least 3 hours before
    if (hoursUntilBooking < 3 && booking.status === 'CONFIRMED') {
      return res.status(403).json({
        success: false,
        message: 'Stylists must cancel at least 3 hours before the appointment',
        hoursUntilBooking: hoursUntilBooking.toFixed(1)
      });
    }

    // Update booking status
    await query(`
      UPDATE bookings
      SET status = 'CANCELLED',
          cancellation_reason = $1,
          cancelled_by = $2,
          cancelled_at = $3,
          last_status_change = $4,
          updated_at = $5
      WHERE id = $6
    `, [reason, req.user.id, now, now, now, bookingId]);

    // TODO: Handle refund logic if payment was made
    // TODO: Send SMS notification to client

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        id: bookingId,
        status: 'CANCELLED',
        cancelled_at: now,
        reason: reason
      }
    });

    logger.info('Stylist cancelled booking', { stylistId, bookingId, reason });
  } catch (error) {
    logger.error('Error cancelling booking:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel booking' });
  }
});

/**
 * PATCH /api/stylist/bookings/:id/reschedule
 * Reschedule a booking to a new date/time
 */
router.patch('/bookings/:id/reschedule', requireStylist, async (req, res) => {
  try {
    const stylistId = req.stylistId;
    const bookingId = req.params.id;
    const { newDate, newTime, reason } = req.body;

    if (!newDate || !newTime) {
      return res.status(400).json({
        success: false,
        message: 'New date and time are required'
      });
    }

    // Get booking details
    const bookingResult = await query(`
      SELECT b.*, s.name as service_name, s.duration_minutes
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      WHERE b.id = $1 AND b.stylist_id = $2
    `, [bookingId, stylistId]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    // Only allow rescheduling of confirmed or pending bookings
    if (!['PENDING', 'VERIFY_ACCEPTANCE', 'CONFIRMED'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule booking that is ${booking.status.toLowerCase()}`
      });
    }

    // Check if new time slot is available
    const conflictCheck = await query(`
      SELECT id FROM bookings
      WHERE stylist_id = $1
        AND booking_date = $2
        AND booking_time = $3
        AND status IN ('PENDING', 'VERIFY_ACCEPTANCE', 'CONFIRMED')
        AND id != $4
    `, [stylistId, newDate, newTime, bookingId]);

    if (conflictCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'The new time slot is already booked'
      });
    }

    const now = new Date();

    // Update booking with new date/time
    await query(`
      UPDATE bookings
      SET booking_date = $1,
          booking_time = $2,
          stylist_notes = COALESCE(stylist_notes, '') || E'\n' || $3,
          updated_at = $4
      WHERE id = $5
    `, [
      newDate,
      newTime,
      `Rescheduled by stylist: ${reason || 'No reason provided'}`,
      now,
      bookingId
    ]);

    // TODO: Send SMS notification to client about reschedule

    res.json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: {
        id: bookingId,
        booking_date: newDate,
        booking_time: newTime,
        updated_at: now
      }
    });

    logger.info('Stylist rescheduled booking', { stylistId, bookingId, newDate, newTime });
  } catch (error) {
    logger.error('Error rescheduling booking:', error);
    res.status(500).json({ success: false, message: 'Failed to reschedule booking' });
  }
});

/**
 * POST /api/stylist/bookings/:id/complete
 * Mark a booking as completed
 */
router.post('/bookings/:id/complete', requireStylist, async (req, res) => {
  try {
    const stylistId = req.stylistId;
    const bookingId = req.params.id;
    const { notes } = req.body;

    // Get booking details
    const bookingResult = await query(`
      SELECT * FROM bookings
      WHERE id = $1 AND stylist_id = $2
    `, [bookingId, stylistId]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    // Can only complete confirmed bookings
    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: 'Can only complete confirmed bookings'
      });
    }

    const now = new Date();

    // Update booking to completed
    await query(`
      UPDATE bookings
      SET status = 'COMPLETED',
          completed_at = $1,
          stylist_notes = COALESCE(stylist_notes, '') || E'\n' || $2,
          last_status_change = $3,
          updated_at = $4
      WHERE id = $5
    `, [now, notes || 'Service completed', now, now, bookingId]);

    // TODO: Process payment distribution to stylist
    // TODO: Send review request to client

    res.json({
      success: true,
      message: 'Booking marked as completed',
      data: {
        id: bookingId,
        status: 'COMPLETED',
        completed_at: now
      }
    });

    logger.info('Stylist completed booking', { stylistId, bookingId });
  } catch (error) {
    logger.error('Error completing booking:', error);
    res.status(500).json({ success: false, message: 'Failed to complete booking' });
  }
});

/**
 * GET /api/stylist/bookings/stats/summary
 * Get booking statistics summary for stylist
 */
router.get('/bookings/stats/summary', requireStylist, async (req, res) => {
  try {
    const stylistId = req.stylistId;

    // Get counts by status
    const statsResult = await query(`
      SELECT
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'VERIFY_ACCEPTANCE' THEN 1 END) as verify_acceptance,
        COUNT(CASE WHEN status = 'CONFIRMED' AND booking_date >= CURRENT_DATE THEN 1 END) as upcoming,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled
      FROM bookings
      WHERE stylist_id = $1
    `, [stylistId]);

    res.json({
      success: true,
      data: statsResult.rows[0]
    });

    logger.info('Stylist booking stats fetched', { stylistId });
  } catch (error) {
    logger.error('Error fetching booking stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

module.exports = router;
