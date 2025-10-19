const express = require('express');
const router = express.Router();
const { query } = require('./db');

// Request a refund
router.post('/request', async (req, res) => {
  try {
    const { bookingId, userId, reason } = req.body;

    if (!bookingId || !userId || !reason) {
      return res.status(400).json({
        error: 'Booking ID, user ID, and reason are required'
      });
    }

    // Check if booking exists and user is authorized
    const bookingResult = await query(`
      SELECT b.*, p.id as payment_id, p.status as payment_status
      FROM bookings b
      LEFT JOIN payments p ON b.id = p.booking_id
      WHERE b.id = $1 AND (b.client_id = $2 OR EXISTS (
        SELECT 1 FROM stylists s WHERE s.id = b.stylist_id AND s.user_id = $2
      ))
    `, [bookingId, userId]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or unauthorized' });
    }

    const booking = bookingResult.rows[0];

    // Check if booking was cancelled
    if (booking.status !== 'CANCELLED') {
      return res.status(400).json({
        error: 'Refunds can only be requested for cancelled bookings'
      });
    }

    // Check if payment exists and is retained
    if (!booking.payment_id || booking.payment_status !== 'RETAINED') {
      return res.status(400).json({
        error: 'No retained payment found for this booking'
      });
    }

    // Check if refund request already exists
    const existingRequest = await query(`
      SELECT * FROM refund_requests
      WHERE booking_id = $1 AND status IN ('PENDING', 'APPROVED')
    `, [bookingId]);

    if (existingRequest.rows.length > 0) {
      return res.status(400).json({
        error: 'A refund request already exists for this booking'
      });
    }

    // Create refund request
    const result = await query(`
      INSERT INTO refund_requests (
        payment_id, booking_id, requested_by, reason
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [booking.payment_id, bookingId, userId, reason]);

    res.json({
      success: true,
      message: 'Refund request submitted successfully',
      refundRequest: result.rows[0]
    });

  } catch (error) {
    console.error('Refund request error:', error);
    res.status(500).json({
      error: 'Failed to submit refund request'
    });
  }
});

// Get refund requests for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await query(`
      SELECT rr.*, b.booking_date, b.booking_time, s.name as service_name
      FROM refund_requests rr
      JOIN bookings b ON rr.booking_id = b.id
      LEFT JOIN services s ON b.service_id = s.id
      WHERE rr.requested_by = $1
      ORDER BY rr.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      refundRequests: result.rows
    });

  } catch (error) {
    console.error('Error fetching refund requests:', error);
    res.status(500).json({
      error: 'Failed to fetch refund requests'
    });
  }
});

// Admin endpoints for managing refund requests
router.get('/pending', async (req, res) => {
  try {
    // Check if user is admin (you'd implement proper auth middleware)
    // if (!req.user || req.user.role !== 'admin') {
    //   return res.status(403).json({ error: 'Admin access required' });
    // }

    const result = await query(`
      SELECT rr.*,
             b.booking_date,
             b.booking_time,
             b.total_price,
             u.name as requester_name,
             u.email as requester_email,
             s.name as service_name
      FROM refund_requests rr
      JOIN bookings b ON rr.booking_id = b.id
      JOIN users u ON rr.requested_by = u.id
      LEFT JOIN services s ON b.service_id = s.id
      WHERE rr.status = 'PENDING'
      ORDER BY rr.created_at ASC
    `);

    res.json({
      success: true,
      pendingRefunds: result.rows
    });

  } catch (error) {
    console.error('Error fetching pending refunds:', error);
    res.status(500).json({
      error: 'Failed to fetch pending refunds'
    });
  }
});

// Approve or deny refund request
router.put('/:refundId/review', async (req, res) => {
  try {
    const { refundId } = req.params;
    const { action, adminNotes, adminUserId } = req.body;

    if (!['APPROVED', 'DENIED'].includes(action)) {
      return res.status(400).json({
        error: 'Action must be APPROVED or DENIED'
      });
    }

    const now = new Date();

    // Update refund request
    const result = await query(`
      UPDATE refund_requests
      SET status = $1,
          admin_notes = $2,
          approved_by = $3,
          approved_at = $4,
          updated_at = $5
      WHERE id = $6 AND status = 'PENDING'
      RETURNING *
    `, [action, adminNotes, adminUserId, now, now, refundId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Refund request not found or already processed'
      });
    }

    const refundRequest = result.rows[0];

    // If approved, update payment status
    if (action === 'APPROVED') {
      await query(`
        UPDATE payments
        SET status = 'PENDING_REFUND',
            refund_reason = $1,
            updated_at = $2
        WHERE id = $3
      `, ['Refund request approved', now, refundRequest.payment_id]);
    }

    res.json({
      success: true,
      message: `Refund request ${action.toLowerCase()}`,
      refundRequest
    });

  } catch (error) {
    console.error('Error reviewing refund request:', error);
    res.status(500).json({
      error: 'Failed to review refund request'
    });
  }
});

module.exports = router;