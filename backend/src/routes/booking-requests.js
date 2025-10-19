const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { validateJWT } = require('../middleware/auth');

/**
 * POST /api/booking-requests/create
 * Client creates a new booking request
 */
router.post('/create', validateJWT, async (req, res) => {
  try {
    const { user } = req;
    const {
      stylistId,
      serviceId,
      requestedDate,
      requestedTime,
      durationMinutes,
      totalPrice,
      notes
    } = req.body;

    // Validate required fields
    if (!stylistId || !requestedDate || !requestedTime || !durationMinutes || !totalPrice) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if stylist is available
    const statusResult = await query(
      'SELECT status FROM stylist_work_status WHERE stylist_id = $1',
      [stylistId]
    );

    if (statusResult.rows.length === 0 || statusResult.rows[0].status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Stylist is not currently available for bookings'
      });
    }

    // Create booking request with expiration times
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
    const autoBookWindowEndsAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

    const result = await query(`
      INSERT INTO booking_requests (
        client_id,
        stylist_id,
        service_id,
        requested_date,
        requested_time,
        duration_minutes,
        total_price,
        notes,
        status,
        expires_at,
        auto_book_window_ends_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10)
      RETURNING *
    `, [
      user.id,
      stylistId,
      serviceId,
      requestedDate,
      requestedTime,
      durationMinutes,
      totalPrice,
      notes || null,
      expiresAt,
      autoBookWindowEndsAt
    ]);

    // Get stylist user ID for notification
    const stylistUserResult = await query(
      'SELECT user_id FROM stylists WHERE id = $1',
      [stylistId]
    );

    if (stylistUserResult.rows.length > 0) {
      // Create notification for stylist
      await query(`
        INSERT INTO notifications (user_id, type, title, message)
        VALUES ($1, 'BOOKING_REQUEST', 'New Booking Request', $2)
      `, [
        stylistUserResult.rows[0].user_id,
        `You have a new booking request for ${requestedDate} at ${requestedTime}. Respond within 5 minutes for auto-booking.`
      ]);
    }

    res.json({
      success: true,
      message: 'Booking request created',
      request: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating booking request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking request'
    });
  }
});

/**
 * GET /api/booking-requests/my-requests
 * Get booking requests for logged-in user (client or stylist)
 */
router.get('/my-requests', validateJWT, async (req, res) => {
  try {
    const { user } = req;
    const { status } = req.query;

    let queryText;
    let queryParams;

    if (user.role === 'STYLIST') {
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

      // Get requests for this stylist
      queryText = `
        SELECT
          br.*,
          u.name AS client_name,
          u.phone AS client_phone,
          s.name AS service_name,
          s.category AS service_category
        FROM booking_requests br
        JOIN users u ON br.client_id = u.id
        LEFT JOIN services s ON br.service_id = s.id
        WHERE br.stylist_id = $1
        ${status ? 'AND br.status = $2' : ''}
        ORDER BY br.created_at DESC
        LIMIT 50
      `;
      queryParams = status ? [stylistId, status] : [stylistId];
    } else {
      // Get requests for this client
      queryText = `
        SELECT
          br.*,
          u.name AS stylist_name,
          st.business_name,
          s.name AS service_name,
          s.category AS service_category
        FROM booking_requests br
        JOIN stylists st ON br.stylist_id = st.id
        JOIN users u ON st.user_id = u.id
        LEFT JOIN services s ON br.service_id = s.id
        WHERE br.client_id = $1
        ${status ? 'AND br.status = $2' : ''}
        ORDER BY br.created_at DESC
        LIMIT 50
      `;
      queryParams = status ? [user.id, status] : [user.id];
    }

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      requests: result.rows
    });
  } catch (error) {
    console.error('Error fetching booking requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking requests'
    });
  }
});

/**
 * POST /api/booking-requests/:requestId/respond
 * Stylist responds to a booking request (accept/decline)
 */
router.post('/:requestId/respond', validateJWT, async (req, res) => {
  try {
    const { user } = req;
    const { requestId } = req.params;
    const { response, declineReason } = req.body;

    // Validate response
    if (!['accept', 'decline'].includes(response)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid response. Must be "accept" or "decline"'
      });
    }

    // Get stylist ID
    const stylistResult = await query(
      'SELECT id FROM stylists WHERE user_id = $1',
      [user.id]
    );

    if (stylistResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only stylists can respond to booking requests'
      });
    }

    const stylistId = stylistResult.rows[0].id;

    // Get the booking request
    const requestResult = await query(
      'SELECT * FROM booking_requests WHERE id = $1 AND stylist_id = $2',
      [requestId, stylistId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking request not found'
      });
    }

    const bookingRequest = requestResult.rows[0];

    // Check if already responded or expired
    if (bookingRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This booking request has already been processed'
      });
    }

    // Check if expired
    if (new Date() > new Date(bookingRequest.expires_at)) {
      await query(
        'UPDATE booking_requests SET status = $1, updated_at = NOW() WHERE id = $2',
        ['expired', requestId]
      );
      return res.status(400).json({
        success: false,
        message: 'This booking request has expired'
      });
    }

    const now = new Date();
    const autoBookWindowEndsAt = new Date(bookingRequest.auto_book_window_ends_at);

    if (response === 'decline') {
      // Decline the request
      await query(`
        UPDATE booking_requests
        SET
          status = 'declined',
          stylist_response = 'decline',
          stylist_decline_reason = $1,
          stylist_responded_at = NOW(),
          updated_at = NOW()
        WHERE id = $2
      `, [declineReason || null, requestId]);

      // Notify client
      await query(`
        INSERT INTO notifications (user_id, type, title, message)
        VALUES ($1, 'BOOKING_DECLINED', 'Booking Request Declined', $2)
      `, [
        bookingRequest.client_id,
        `Your booking request for ${bookingRequest.requested_date} at ${bookingRequest.requested_time} was declined.`
      ]);

      return res.json({
        success: true,
        message: 'Booking request declined',
        newStatus: 'declined'
      });
    }

    // Accept the request
    const withinAutoBookWindow = now <= autoBookWindowEndsAt;

    if (withinAutoBookWindow) {
      // Auto-book: Update status to trigger the database trigger
      await query(`
        UPDATE booking_requests
        SET
          status = 'auto_booked',
          stylist_response = 'accept',
          stylist_responded_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
      `, [requestId]);

      // Get the updated request with booking_id
      const updatedResult = await query(
        'SELECT * FROM booking_requests WHERE id = $1',
        [requestId]
      );

      res.json({
        success: true,
        message: 'Booking automatically confirmed',
        newStatus: 'auto_booked',
        bookingId: updatedResult.rows[0].booking_id
      });
    } else {
      // Outside window: Require client confirmation
      await query(`
        UPDATE booking_requests
        SET
          status = 'awaiting_client_confirmation',
          stylist_response = 'accept',
          stylist_responded_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
      `, [requestId]);

      // Notify client
      await query(`
        INSERT INTO notifications (user_id, type, title, message)
        VALUES ($1, 'BOOKING_AWAITING_CONFIRMATION', 'Booking Request Accepted', $2)
      `, [
        bookingRequest.client_id,
        `Your booking request for ${bookingRequest.requested_date} at ${bookingRequest.requested_time} was accepted. Please confirm to finalize.`
      ]);

      res.json({
        success: true,
        message: 'Booking request accepted, awaiting client confirmation',
        newStatus: 'awaiting_client_confirmation'
      });
    }
  } catch (error) {
    console.error('Error responding to booking request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to booking request'
    });
  }
});

/**
 * POST /api/booking-requests/:requestId/confirm
 * Client confirms a booking request that's awaiting confirmation
 */
router.post('/:requestId/confirm', validateJWT, async (req, res) => {
  try {
    const { user } = req;
    const { requestId } = req.params;

    // Get the booking request
    const requestResult = await query(
      'SELECT * FROM booking_requests WHERE id = $1 AND client_id = $2',
      [requestId, user.id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking request not found'
      });
    }

    const bookingRequest = requestResult.rows[0];

    // Check if awaiting confirmation
    if (bookingRequest.status !== 'awaiting_client_confirmation') {
      return res.status(400).json({
        success: false,
        message: 'This booking request is not awaiting confirmation'
      });
    }

    // Check if expired
    if (new Date() > new Date(bookingRequest.expires_at)) {
      await query(
        'UPDATE booking_requests SET status = $1, updated_at = NOW() WHERE id = $2',
        ['expired', requestId]
      );
      return res.status(400).json({
        success: false,
        message: 'This booking request has expired'
      });
    }

    // Create the booking
    const bookingResult = await query(`
      INSERT INTO bookings (
        client_id,
        stylist_id,
        service_id,
        booking_date,
        booking_time,
        duration_minutes,
        status,
        total_price,
        notes,
        confirmed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'CONFIRMED', $7, $8, NOW())
      RETURNING *
    `, [
      bookingRequest.client_id,
      bookingRequest.stylist_id,
      bookingRequest.service_id,
      bookingRequest.requested_date,
      bookingRequest.requested_time,
      bookingRequest.duration_minutes,
      bookingRequest.total_price,
      bookingRequest.notes
    ]);

    const bookingId = bookingResult.rows[0].id;

    // Update request status
    await query(`
      UPDATE booking_requests
      SET
        status = 'confirmed',
        booking_id = $1,
        client_confirmed_at = NOW(),
        updated_at = NOW()
      WHERE id = $2
    `, [bookingId, requestId]);

    // Get stylist user ID for notification
    const stylistUserResult = await query(
      'SELECT user_id FROM stylists WHERE id = $1',
      [bookingRequest.stylist_id]
    );

    if (stylistUserResult.rows.length > 0) {
      // Notify stylist
      await query(`
        INSERT INTO notifications (user_id, type, title, message, related_booking_id)
        VALUES ($1, 'BOOKING_CONFIRMED', 'Booking Confirmed', $2, $3)
      `, [
        stylistUserResult.rows[0].user_id,
        `Client confirmed the booking for ${bookingRequest.requested_date} at ${bookingRequest.requested_time}.`,
        bookingId
      ]);
    }

    res.json({
      success: true,
      message: 'Booking confirmed',
      bookingId: bookingId
    });
  } catch (error) {
    console.error('Error confirming booking request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm booking request'
    });
  }
});

/**
 * POST /api/booking-requests/:requestId/cancel
 * Client cancels a pending booking request
 */
router.post('/:requestId/cancel', validateJWT, async (req, res) => {
  try {
    const { user } = req;
    const { requestId } = req.params;

    // Get the booking request
    const requestResult = await query(
      'SELECT * FROM booking_requests WHERE id = $1 AND client_id = $2',
      [requestId, user.id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking request not found'
      });
    }

    const bookingRequest = requestResult.rows[0];

    // Can only cancel pending or awaiting confirmation
    if (!['pending', 'awaiting_client_confirmation'].includes(bookingRequest.status)) {
      return res.status(400).json({
        success: false,
        message: 'This booking request cannot be cancelled'
      });
    }

    // Cancel the request
    await query(`
      UPDATE booking_requests
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = $1
    `, [requestId]);

    res.json({
      success: true,
      message: 'Booking request cancelled'
    });
  } catch (error) {
    console.error('Error cancelling booking request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking request'
    });
  }
});

/**
 * POST /api/booking-requests/expire-old
 * Expire old booking requests (called by cron/scheduler)
 */
router.post('/expire-old', async (req, res) => {
  try {
    // Call the database function to expire old requests
    const result = await query('SELECT expire_old_booking_requests() AS expired_count');
    const expiredCount = result.rows[0].expired_count;

    res.json({
      success: true,
      message: `Expired ${expiredCount} old booking requests`
    });
  } catch (error) {
    console.error('Error expiring old requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to expire old requests'
    });
  }
});

module.exports = router;
