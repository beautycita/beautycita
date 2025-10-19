const express = require('express');
const { query } = require('../db');
const DisputeService = require('../services/disputeService');
const router = express.Router();

const disputeService = new DisputeService();

// File a new dispute (Client only)
router.post('/file', async (req, res) => {
  try {
    const userId = req.userId; // From JWT middleware
    const { paymentId, reason, statement, evidenceFiles } = req.body;

    if (!paymentId || !reason || !statement) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID, reason, and statement are required'
      });
    }

    // Verify user is a client
    const clientResult = await query(`
      SELECT id FROM clients WHERE user_id = $1
    `, [userId]);

    if (clientResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only clients can file disputes'
      });
    }

    const result = await disputeService.fileDispute(
      userId, // Using user_id as client_id
      paymentId,
      reason,
      statement,
      evidenceFiles
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('File dispute error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to file dispute',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Submit stylist response to dispute
router.post('/:disputeId/respond', async (req, res) => {
  try {
    const userId = req.userId;
    const { disputeId } = req.params;
    const { response, evidenceFiles } = req.body;

    if (!response) {
      return res.status(400).json({
        success: false,
        message: 'Response is required'
      });
    }

    // Get stylist ID from user ID
    const stylistResult = await query(`
      SELECT id FROM stylists WHERE user_id = $1
    `, [userId]);

    if (stylistResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only stylists can respond to disputes'
      });
    }

    const stylistId = stylistResult.rows[0].id;

    const result = await disputeService.submitStylistResponse(
      stylistId,
      parseInt(disputeId),
      response,
      evidenceFiles
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Submit stylist response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit response',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Admin resolve dispute
router.post('/:disputeId/resolve', async (req, res) => {
  try {
    const userId = req.userId;
    const { disputeId } = req.params;
    const { resolution, adminNotes } = req.body;

    if (!resolution) {
      return res.status(400).json({
        success: false,
        message: 'Resolution decision is required'
      });
    }

    // Verify user is admin
    const userResult = await query(`
      SELECT role FROM users WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0 || !['ADMIN', 'SUPERADMIN'].includes(userResult.rows[0].role)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can resolve disputes'
      });
    }

    const result = await disputeService.resolveDispute(
      userId,
      parseInt(disputeId),
      resolution,
      adminNotes
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve dispute',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get client's disputes
router.get('/client', async (req, res) => {
  try {
    const userId = req.userId;

    // Verify user is a client
    const clientResult = await query(`
      SELECT id FROM clients WHERE user_id = $1
    `, [userId]);

    if (clientResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const result = await disputeService.getClientDisputes(userId);
    res.json(result);

  } catch (error) {
    console.error('Get client disputes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get disputes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get stylist's disputes
router.get('/stylist', async (req, res) => {
  try {
    const userId = req.userId;

    // Get stylist ID
    const stylistResult = await query(`
      SELECT id FROM stylists WHERE user_id = $1
    `, [userId]);

    if (stylistResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const stylistId = stylistResult.rows[0].id;
    const result = await disputeService.getStylistDisputes(stylistId);
    res.json(result);

  } catch (error) {
    console.error('Get stylist disputes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get disputes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get all disputes (Admin only)
router.get('/admin', async (req, res) => {
  try {
    const userId = req.userId;
    const { status } = req.query;

    // Verify user is admin
    const userResult = await query(`
      SELECT role FROM users WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0 || !['ADMIN', 'SUPERADMIN'].includes(userResult.rows[0].role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const result = await disputeService.getAllDisputes(status);
    res.json(result);

  } catch (error) {
    console.error('Get admin disputes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get disputes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get dispute statistics (Admin only)
router.get('/admin/stats', async (req, res) => {
  try {
    const userId = req.userId;

    // Verify user is admin
    const userResult = await query(`
      SELECT role FROM users WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0 || !['ADMIN', 'SUPERADMIN'].includes(userResult.rows[0].role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const result = await disputeService.getDisputeStats();
    res.json(result);

  } catch (error) {
    console.error('Get dispute stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dispute statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get specific dispute details
router.get('/:disputeId', async (req, res) => {
  try {
    const userId = req.userId;
    const { disputeId } = req.params;

    // Get user role
    const userResult = await query(`
      SELECT role FROM users WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userRole = userResult.rows[0].role;

    // Get dispute with access control
    let disputeQuery = `
      SELECT pd.*, p.amount as payment_amount, s.name as service_name,
             st.business_name, uc.name as client_name, us.name as stylist_name,
             b.appointment_date
      FROM payment_disputes pd
      JOIN payments p ON pd.payment_id = p.id
      JOIN payment_intents pi ON p.stripe_payment_intent_id = pi.payment_intent_id
      LEFT JOIN services s ON pi.service_id = s.id
      LEFT JOIN stylists st ON pi.stylist_id = st.id
      LEFT JOIN users uc ON pd.client_id = uc.id
      LEFT JOIN users us ON st.user_id = us.id
      LEFT JOIN bookings b ON p.booking_id = b.id
      WHERE pd.id = $1
    `;

    // Add access control based on role
    if (['ADMIN', 'SUPERADMIN'].includes(userRole)) {
      // Admin can see all disputes
    } else if (userRole === 'CLIENT') {
      disputeQuery += ' AND pd.client_id = $2';
    } else if (userRole === 'STYLIST') {
      // Get stylist ID and check access
      const stylistResult = await query(`
        SELECT id FROM stylists WHERE user_id = $1
      `, [userId]);

      if (stylistResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      disputeQuery += ' AND pd.stylist_id = $2';
      userId = stylistResult.rows[0].id; // Use stylist ID for the query
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const params = ['ADMIN', 'SUPERADMIN'].includes(userRole) ? [disputeId] : [disputeId, userId];
    const disputeResult = await query(disputeQuery, params);

    if (disputeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }

    const dispute = disputeResult.rows[0];

    res.json({
      success: true,
      dispute: {
        id: dispute.id,
        status: dispute.status,
        reason: dispute.reason,
        amount: dispute.amount,
        serviceName: dispute.service_name,
        clientName: dispute.client_name,
        stylistName: dispute.stylist_name,
        businessName: dispute.business_name,
        appointmentDate: dispute.appointment_date,
        clientStatement: dispute.client_statement,
        stylistResponse: dispute.stylist_response,
        adminNotes: dispute.admin_notes,
        createdAt: dispute.created_at,
        evidenceDeadline: dispute.evidence_deadline,
        resolution: dispute.resolution,
        resolvedAt: dispute.resolved_at
      }
    });

  } catch (error) {
    console.error('Get dispute details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dispute details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Check if payment is eligible for dispute
router.get('/check-eligibility/:paymentId', async (req, res) => {
  try {
    const userId = req.userId;
    const { paymentId } = req.params;

    // Verify payment exists and belongs to client
    const paymentResult = await query(`
      SELECT p.*, pi.client_id, b.appointment_date
      FROM payments p
      JOIN payment_intents pi ON p.stripe_payment_intent_id = pi.payment_intent_id
      LEFT JOIN bookings b ON p.booking_id = b.id
      WHERE p.id = $1 AND pi.client_id = $2 AND p.status = 'SUCCEEDED'
    `, [paymentId, userId]);

    if (paymentResult.rows.length === 0) {
      return res.json({
        success: true,
        eligible: false,
        reason: 'Payment not found or not eligible'
      });
    }

    const payment = paymentResult.rows[0];

    // Check if dispute already exists
    const existingDispute = await query(`
      SELECT id FROM payment_disputes WHERE payment_id = $1
    `, [paymentId]);

    if (existingDispute.rows.length > 0) {
      return res.json({
        success: true,
        eligible: false,
        reason: 'Dispute already exists for this payment'
      });
    }

    // Check if within dispute window (48 hours)
    const now = new Date();
    const paymentTime = new Date(payment.processed_at);
    const hoursSincePayment = (now - paymentTime) / (1000 * 60 * 60);

    if (hoursSincePayment > 48) {
      return res.json({
        success: true,
        eligible: false,
        reason: 'Dispute window has expired (48 hours after payment)',
        hoursRemaining: 0
      });
    }

    res.json({
      success: true,
      eligible: true,
      hoursRemaining: Math.max(0, 48 - hoursSincePayment),
      payment: {
        id: payment.id,
        amount: payment.amount,
        processedAt: payment.processed_at,
        appointmentDate: payment.appointment_date
      }
    });

  } catch (error) {
    console.error('Check dispute eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check dispute eligibility',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Submit evidence to Stripe for a chargeback dispute
router.post('/:disputeId/submit-evidence', async (req, res) => {
  try {
    const userId = req.userId;
    const { disputeId } = req.params;
    const { evidence } = req.body;

    // Verify user is admin or the affected stylist
    const userResult = await query(`
      SELECT u.role, s.id as stylist_id
      FROM users u
      LEFT JOIN stylists s ON u.id = s.user_id
      WHERE u.id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];
    const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(user.role);

    // Get dispute details
    const disputeResult = await query(`
      SELECT pd.*, p.stripe_payment_intent_id
      FROM payment_disputes pd
      JOIN payments p ON pd.payment_id = p.id
      WHERE pd.id = $1
    `, [disputeId]);

    if (disputeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }

    const dispute = disputeResult.rows[0];

    // Verify access (admin or dispute owner)
    if (!isAdmin && dispute.stylist_id !== user.stylist_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Use PaymentService to submit evidence
    const PaymentService = require('../paymentService');
    const paymentService = new PaymentService();

    const result = await paymentService.submitDisputeEvidence(
      dispute.stripe_dispute_id,
      evidence
    );

    res.json({
      success: true,
      message: 'Evidence submitted successfully',
      disputeId: result.disputeId
    });

  } catch (error) {
    console.error('Submit evidence error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit evidence',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get active disputes needing response (Admin and Stylist)
router.get('/needs-response', async (req, res) => {
  try {
    const userId = req.userId;

    // Get user role
    const userResult = await query(`
      SELECT u.role, s.id as stylist_id
      FROM users u
      LEFT JOIN stylists s ON u.id = s.user_id
      WHERE u.id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];
    const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(user.role);

    let disputes;

    if (isAdmin) {
      // Admin sees all active disputes
      disputes = await query(`
        SELECT * FROM active_disputes_needing_response
        ORDER BY hours_until_deadline ASC
      `);
    } else if (user.stylist_id) {
      // Stylist sees only their disputes
      disputes = await query(`
        SELECT * FROM active_disputes_needing_response
        WHERE stylist_id = $1
        ORDER BY hours_until_deadline ASC
      `, [user.stylist_id]);
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      disputes: disputes.rows,
      count: disputes.rows.length
    });

  } catch (error) {
    console.error('Get disputes needing response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get disputes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;