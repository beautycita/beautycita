const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { validateJWT } = require('../middleware/auth');

// All routes require authentication
router.use(validateJWT);

/**
 * Create a new dispute
 * POST /api/disputes
 */
router.post('/', async (req, res) => {
  try {
    const {
      booking_id,
      dispute_type,
      title,
      description,
      requested_resolution
    } = req.body;

    const initiator_id = req.userId;

    // Validate required fields
    if (!booking_id || !dispute_type || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get booking details and verify user is involved
    const bookingResult = await query(`
      SELECT b.*,
             CASE
               WHEN b.client_id = $1 THEN b.stylist_id
               WHEN s.user_id = $1 THEN b.client_id
               ELSE NULL
             END as respondent_user_id
      FROM bookings b
      LEFT JOIN stylists s ON b.stylist_id = s.id
      WHERE b.id = $2
    `, [initiator_id, booking_id]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = bookingResult.rows[0];

    // Check if user is involved in this booking
    if (!booking.respondent_user_id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to create a dispute for this booking'
      });
    }

    // Check if dispute already exists for this booking
    const existingDispute = await query(
      'SELECT id FROM disputes WHERE booking_id = $1',
      [booking_id]
    );

    if (existingDispute.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A dispute already exists for this booking',
        dispute_id: existingDispute.rows[0].id
      });
    }

    // Create the dispute
    const disputeResult = await query(`
      INSERT INTO disputes (
        booking_id, initiator_id, respondent_id, dispute_type,
        title, description, requested_resolution, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'OPEN')
      RETURNING *
    `, [
      booking_id,
      initiator_id,
      booking.respondent_user_id,
      dispute_type,
      title,
      description,
      requested_resolution
    ]);

    // Send notification to respondent
    const io = req.app.get('io');
    const emitNotification = req.app.get('emitNotification');

    if (emitNotification) {
      emitNotification(booking.respondent_user_id, {
        type: 'DISPUTE_CREATED',
        title: 'New Dispute',
        message: `A dispute has been filed regarding booking #${booking_id}`,
        dispute_id: disputeResult.rows[0].id,
        created_at: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Dispute created successfully',
      dispute: disputeResult.rows[0]
    });

  } catch (error) {
    console.error('Create dispute error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create dispute'
    });
  }
});

/**
 * Get all disputes for current user
 * GET /api/disputes
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { status } = req.query;

    let queryText = `
      SELECT d.*,
             b.booking_date, b.booking_time, b.total_price,
             s.name as service_name,
             st.business_name as stylist_name,
             u_init.name as initiator_name, u_init.email as initiator_email,
             u_resp.name as respondent_name, u_resp.email as respondent_email
      FROM disputes d
      INNER JOIN bookings b ON d.booking_id = b.id
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN stylists st ON b.stylist_id = st.id
      INNER JOIN users u_init ON d.initiator_id = u_init.id
      INNER JOIN users u_resp ON d.respondent_id = u_resp.id
      WHERE (d.initiator_id = $1 OR d.respondent_id = $1)
    `;

    const params = [userId];

    if (status) {
      queryText += ' AND d.status = $2';
      params.push(status);
    }

    queryText += ' ORDER BY d.created_at DESC';

    const result = await query(queryText, params);

    res.json({
      success: true,
      disputes: result.rows
    });

  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch disputes'
    });
  }
});

/**
 * Get specific dispute details
 * GET /api/disputes/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const disputeId = req.params.id;
    const userId = req.userId;

    const disputeResult = await query(`
      SELECT d.*,
             b.booking_date, b.booking_time, b.total_price, b.status as booking_status,
             s.name as service_name,
             st.business_name as stylist_name,
             u_init.name as initiator_name, u_init.email as initiator_email,
             u_resp.name as respondent_name, u_resp.email as respondent_email
      FROM disputes d
      INNER JOIN bookings b ON d.booking_id = b.id
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN stylists st ON b.stylist_id = st.id
      INNER JOIN users u_init ON d.initiator_id = u_init.id
      INNER JOIN users u_resp ON d.respondent_id = u_resp.id
      WHERE d.id = $1
    `, [disputeId]);

    if (disputeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }

    const dispute = disputeResult.rows[0];

    // Check if user is involved in this dispute
    if (dispute.initiator_id !== userId && dispute.respondent_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get dispute messages
    const messagesResult = await query(`
      SELECT dm.*, u.name as sender_name, u.email as sender_email
      FROM dispute_messages dm
      INNER JOIN users u ON dm.sender_id = u.id
      WHERE dm.dispute_id = $1
      ORDER BY dm.created_at ASC
    `, [disputeId]);

    // Get evidence
    const evidenceResult = await query(`
      SELECT de.*, u.name as uploaded_by_name
      FROM dispute_evidence de
      INNER JOIN users u ON de.uploaded_by = u.id
      WHERE de.dispute_id = $1
      ORDER BY de.created_at DESC
    `, [disputeId]);

    res.json({
      success: true,
      dispute: {
        ...dispute,
        messages: messagesResult.rows,
        evidence: evidenceResult.rows
      }
    });

  } catch (error) {
    console.error('Get dispute details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dispute details'
    });
  }
});

/**
 * Add message to dispute
 * POST /api/disputes/:id/messages
 */
router.post('/:id/messages', async (req, res) => {
  try {
    const disputeId = req.params.id;
    const userId = req.userId;
    const { message, attachments } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Verify user is involved in dispute
    const disputeCheck = await query(
      'SELECT initiator_id, respondent_id FROM disputes WHERE id = $1',
      [disputeId]
    );

    if (disputeCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }

    const dispute = disputeCheck.rows[0];
    if (dispute.initiator_id !== userId && dispute.respondent_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Add message
    const messageResult = await query(`
      INSERT INTO dispute_messages (dispute_id, sender_id, message, attachments)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [disputeId, userId, message, JSON.stringify(attachments || [])]);

    // Update dispute updated_at
    await query('UPDATE disputes SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [disputeId]);

    // Notify other party
    const otherPartyId = dispute.initiator_id === userId ? dispute.respondent_id : dispute.initiator_id;
    const emitNotification = req.app.get('emitNotification');

    if (emitNotification) {
      emitNotification(otherPartyId, {
        type: 'DISPUTE_MESSAGE',
        title: 'New Dispute Message',
        message: 'You have a new message in your dispute',
        dispute_id: disputeId,
        created_at: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message added successfully',
      disputeMessage: messageResult.rows[0]
    });

  } catch (error) {
    console.error('Add dispute message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add message'
    });
  }
});

/**
 * Upload evidence for dispute
 * POST /api/disputes/:id/evidence
 */
router.post('/:id/evidence', async (req, res) => {
  try {
    const disputeId = req.params.id;
    const userId = req.userId;
    const { file_type, file_url, file_name, description } = req.body;

    if (!file_type || !file_url || !file_name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Verify user is involved in dispute
    const disputeCheck = await query(
      'SELECT initiator_id, respondent_id FROM disputes WHERE id = $1',
      [disputeId]
    );

    if (disputeCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }

    const dispute = disputeCheck.rows[0];
    if (dispute.initiator_id !== userId && dispute.respondent_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Upload evidence
    const evidenceResult = await query(`
      INSERT INTO dispute_evidence (dispute_id, uploaded_by, file_type, file_url, file_name, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [disputeId, userId, file_type, file_url, file_name, description]);

    res.status(201).json({
      success: true,
      message: 'Evidence uploaded successfully',
      evidence: evidenceResult.rows[0]
    });

  } catch (error) {
    console.error('Upload evidence error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload evidence'
    });
  }
});

/**
 * Update dispute status (admin only)
 * PUT /api/disputes/:id/status
 */
router.put('/:id/status', async (req, res) => {
  try {
    const disputeId = req.params.id;
    const userId = req.userId;
    const { status, resolution_details, admin_notes } = req.body;

    // Check if user is admin
    const userCheck = await query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0 || !['ADMIN', 'SUPERADMIN'].includes(userCheck.rows[0].role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Update dispute
    const updateFields = [];
    const params = [disputeId];
    let paramCount = 2;

    if (status) {
      updateFields.push(`status = $${paramCount++}`);
      params.push(status);
    }

    if (resolution_details) {
      updateFields.push(`resolution_details = $${paramCount++}`);
      params.push(resolution_details);
    }

    if (admin_notes) {
      updateFields.push(`admin_notes = $${paramCount++}`);
      params.push(admin_notes);
    }

    if (status && ['RESOLVED', 'REFUNDED', 'CLOSED'].includes(status)) {
      updateFields.push(`resolved_at = CURRENT_TIMESTAMP`);
      updateFields.push(`resolved_by = $${paramCount++}`);
      params.push(userId);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    const result = await query(`
      UPDATE disputes
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, params);

    // Notify both parties
    const dispute = result.rows[0];
    const emitNotification = req.app.get('emitNotification');

    if (emitNotification) {
      [dispute.initiator_id, dispute.respondent_id].forEach(uid => {
        emitNotification(uid, {
          type: 'DISPUTE_UPDATED',
          title: 'Dispute Status Updated',
          message: `Your dispute status has been updated to ${status}`,
          dispute_id: disputeId,
          created_at: new Date()
        });
      });
    }

    res.json({
      success: true,
      message: 'Dispute status updated successfully',
      dispute: result.rows[0]
    });

  } catch (error) {
    console.error('Update dispute status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update dispute status'
    });
  }
});

module.exports = router;
