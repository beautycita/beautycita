const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { query } = require('../db');
const SMSService = require('../smsService');

class DisputeService {
  constructor() {
    this.smsService = new SMSService();
  }

  /**
   * File a dispute for a payment
   * @param {number} clientId - Client filing the dispute
   * @param {number} paymentId - Payment ID to dispute
   * @param {string} reason - Reason for dispute
   * @param {string} statement - Client's statement
   * @param {Array} evidenceFiles - Evidence files (if any)
   * @returns {Object} Dispute creation result
   */
  async fileDispute(clientId, paymentId, reason, statement, evidenceFiles = []) {
    try {
      // Verify payment exists and belongs to client
      const paymentResult = await query(`
        SELECT p.*, pi.client_id, pi.stylist_id, s.name as service_name,
               st.business_name, b.id as booking_id
        FROM payments p
        JOIN payment_intents pi ON p.stripe_payment_intent_id = pi.payment_intent_id
        LEFT JOIN bookings b ON p.booking_id = b.id
        LEFT JOIN services s ON pi.service_id = s.id
        LEFT JOIN stylists st ON pi.stylist_id = st.id
        WHERE p.id = $1 AND pi.client_id = $2 AND p.status = 'SUCCEEDED'
      `, [paymentId, clientId]);

      if (paymentResult.rows.length === 0) {
        return {
          success: false,
          error: 'Payment not found or not eligible for dispute'
        };
      }

      const payment = paymentResult.rows[0];

      // Check if payment is within dispute window (48 hours)
      const now = new Date();
      const paymentTime = new Date(payment.processed_at);
      const hoursSincePayment = (now - paymentTime) / (1000 * 60 * 60);

      if (hoursSincePayment > 48) {
        return {
          success: false,
          error: 'Dispute window has expired (48 hours after payment)'
        };
      }

      // Check if dispute already exists
      const existingDispute = await query(`
        SELECT id FROM payment_disputes WHERE payment_id = $1
      `, [paymentId]);

      if (existingDispute.rows.length > 0) {
        return {
          success: false,
          error: 'Dispute already exists for this payment'
        };
      }

      // Create dispute in our system first
      const disputeResult = await query(`
        INSERT INTO payment_disputes (
          payment_id, amount, reason, status, client_statement,
          client_id, stylist_id, evidence_deadline, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        paymentId,
        payment.amount,
        reason,
        'pending_review',
        statement,
        clientId,
        payment.stylist_id,
        new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days for evidence
        now,
        now
      ]);

      const dispute = disputeResult.rows[0];

      // Update payment status
      await query(`
        UPDATE payments
        SET dispute_status = 'under_review',
            dispute_deadline = $1,
            updated_at = $2
        WHERE id = $3
      `, [dispute.evidence_deadline, now, paymentId]);

      // Notify stylist via SMS
      const stylistUserResult = await query(`
        SELECT user_id FROM stylists WHERE id = $1
      `, [payment.stylist_id]);

      if (stylistUserResult.rows.length > 0) {
        await this.smsService.sendDisputeNotification(
          stylistUserResult.rows[0].user_id,
          {
            disputeId: dispute.id,
            serviceName: payment.service_name,
            amount: payment.amount,
            reason: reason,
            deadline: dispute.evidence_deadline
          }
        );
      }

      console.log(`Dispute filed: ${dispute.id} for payment ${paymentId}`);

      return {
        success: true,
        dispute: {
          id: dispute.id,
          status: dispute.status,
          reason: dispute.reason,
          amount: dispute.amount,
          evidenceDeadline: dispute.evidence_deadline,
          createdAt: dispute.created_at
        }
      };

    } catch (error) {
      console.error('Error filing dispute:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Submit stylist response to a dispute
   * @param {number} stylistId - Stylist ID
   * @param {number} disputeId - Dispute ID
   * @param {string} response - Stylist's response
   * @param {Array} evidenceFiles - Evidence files
   * @returns {Object} Response submission result
   */
  async submitStylistResponse(stylistId, disputeId, response, evidenceFiles = []) {
    try {
      // Verify dispute exists and belongs to stylist
      const disputeResult = await query(`
        SELECT * FROM payment_disputes
        WHERE id = $1 AND stylist_id = $2 AND status IN ('pending_review', 'needs_response')
      `, [disputeId, stylistId]);

      if (disputeResult.rows.length === 0) {
        return {
          success: false,
          error: 'Dispute not found or not eligible for response'
        };
      }

      const dispute = disputeResult.rows[0];

      // Check if still within deadline
      const now = new Date();
      if (now > dispute.evidence_deadline) {
        return {
          success: false,
          error: 'Response deadline has passed'
        };
      }

      // Update dispute with stylist response
      await query(`
        UPDATE payment_disputes
        SET stylist_response = $1,
            status = 'awaiting_decision',
            updated_at = $2
        WHERE id = $3
      `, [response, now, disputeId]);

      console.log(`Stylist response submitted for dispute ${disputeId}`);

      return {
        success: true,
        message: 'Response submitted successfully',
        status: 'awaiting_decision'
      };

    } catch (error) {
      console.error('Error submitting stylist response:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Admin resolve dispute
   * @param {number} adminId - Admin user ID
   * @param {number} disputeId - Dispute ID
   * @param {string} resolution - Resolution decision
   * @param {string} adminNotes - Admin notes
   * @returns {Object} Resolution result
   */
  async resolveDispute(adminId, disputeId, resolution, adminNotes) {
    try {
      // Verify dispute exists
      const disputeResult = await query(`
        SELECT pd.*, p.stripe_payment_intent_id, p.amount as payment_amount
        FROM payment_disputes pd
        JOIN payments p ON pd.payment_id = p.id
        WHERE pd.id = $1 AND pd.status = 'awaiting_decision'
      `, [disputeId]);

      if (disputeResult.rows.length === 0) {
        return {
          success: false,
          error: 'Dispute not found or not eligible for resolution'
        };
      }

      const dispute = disputeResult.rows[0];
      const now = new Date();

      let finalStatus = 'closed';
      let refundAmount = 0;

      // Process resolution
      switch (resolution) {
        case 'refund':
          finalStatus = 'resolved_refund';
          refundAmount = dispute.amount;

          // Process refund through Stripe
          try {
            const refund = await stripe.refunds.create({
              payment_intent: dispute.stripe_payment_intent_id,
              amount: Math.round(dispute.amount * 100), // Convert to cents
              reason: 'requested_by_customer',
              metadata: {
                dispute_id: disputeId.toString(),
                resolved_by: adminId.toString(),
                resolution_type: 'full_refund'
              }
            });

            // Update payment status
            await query(`
              UPDATE payments
              SET status = 'REFUNDED',
                  refund_amount = $1,
                  refund_reason = $2,
                  dispute_status = 'lost',
                  updated_at = $3
              WHERE stripe_payment_intent_id = $4
            `, [dispute.amount, 'Dispute resolved in favor of client', now, dispute.stripe_payment_intent_id]);

          } catch (stripeError) {
            console.error('Stripe refund error:', stripeError);
            return {
              success: false,
              error: 'Failed to process refund through Stripe'
            };
          }
          break;

        case 'partial_refund':
          finalStatus = 'resolved_partial_refund';
          refundAmount = dispute.amount * 0.5; // 50% refund for partial

          try {
            await stripe.refunds.create({
              payment_intent: dispute.stripe_payment_intent_id,
              amount: Math.round(refundAmount * 100),
              reason: 'requested_by_customer',
              metadata: {
                dispute_id: disputeId.toString(),
                resolved_by: adminId.toString(),
                resolution_type: 'partial_refund'
              }
            });

            await query(`
              UPDATE payments
              SET refund_amount = $1,
                  refund_reason = $2,
                  dispute_status = 'partially_lost',
                  updated_at = $3
              WHERE stripe_payment_intent_id = $4
            `, [refundAmount, 'Dispute resolved with partial refund', now, dispute.stripe_payment_intent_id]);

          } catch (stripeError) {
            console.error('Stripe partial refund error:', stripeError);
            return {
              success: false,
              error: 'Failed to process partial refund through Stripe'
            };
          }
          break;

        case 'no_refund':
          finalStatus = 'resolved_no_refund';
          // Update payment to show dispute was won
          await query(`
            UPDATE payments
            SET dispute_status = 'won',
                updated_at = $1
            WHERE stripe_payment_intent_id = $2
          `, [now, dispute.stripe_payment_intent_id]);
          break;

        default:
          return {
            success: false,
            error: 'Invalid resolution type'
          };
      }

      // Update dispute record
      await query(`
        UPDATE payment_disputes
        SET status = $1,
            resolution = $2,
            admin_notes = $3,
            resolved_at = $4,
            updated_at = $5
        WHERE id = $6
      `, [finalStatus, resolution, adminNotes, now, now, disputeId]);

      console.log(`Dispute ${disputeId} resolved: ${resolution} by admin ${adminId}`);

      return {
        success: true,
        resolution: {
          disputeId: disputeId,
          status: finalStatus,
          resolution: resolution,
          refundAmount: refundAmount,
          resolvedAt: now
        }
      };

    } catch (error) {
      console.error('Error resolving dispute:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get disputes for a client
   * @param {number} clientId - Client ID
   * @returns {Object} Client's disputes
   */
  async getClientDisputes(clientId) {
    try {
      const disputes = await query(`
        SELECT pd.*, p.amount as payment_amount, s.name as service_name,
               st.business_name, b.appointment_date
        FROM payment_disputes pd
        JOIN payments p ON pd.payment_id = p.id
        JOIN payment_intents pi ON p.stripe_payment_intent_id = pi.payment_intent_id
        LEFT JOIN services s ON pi.service_id = s.id
        LEFT JOIN stylists st ON pi.stylist_id = st.id
        LEFT JOIN bookings b ON p.booking_id = b.id
        WHERE pd.client_id = $1
        ORDER BY pd.created_at DESC
      `, [clientId]);

      return {
        success: true,
        disputes: disputes.rows.map(dispute => ({
          id: dispute.id,
          status: dispute.status,
          reason: dispute.reason,
          amount: dispute.amount,
          serviceName: dispute.service_name,
          stylistName: dispute.business_name,
          appointmentDate: dispute.appointment_date,
          createdAt: dispute.created_at,
          evidenceDeadline: dispute.evidence_deadline,
          resolution: dispute.resolution,
          resolvedAt: dispute.resolved_at
        }))
      };

    } catch (error) {
      console.error('Error getting client disputes:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get disputes for a stylist
   * @param {number} stylistId - Stylist ID
   * @returns {Object} Stylist's disputes
   */
  async getStylistDisputes(stylistId) {
    try {
      const disputes = await query(`
        SELECT pd.*, p.amount as payment_amount, s.name as service_name,
               u.name as client_name, b.appointment_date
        FROM payment_disputes pd
        JOIN payments p ON pd.payment_id = p.id
        JOIN payment_intents pi ON p.stripe_payment_intent_id = pi.payment_intent_id
        LEFT JOIN services s ON pi.service_id = s.id
        LEFT JOIN users u ON pd.client_id = u.id
        LEFT JOIN bookings b ON p.booking_id = b.id
        WHERE pd.stylist_id = $1
        ORDER BY pd.created_at DESC
      `, [stylistId]);

      return {
        success: true,
        disputes: disputes.rows.map(dispute => ({
          id: dispute.id,
          status: dispute.status,
          reason: dispute.reason,
          amount: dispute.amount,
          serviceName: dispute.service_name,
          clientName: dispute.client_name,
          appointmentDate: dispute.appointment_date,
          clientStatement: dispute.client_statement,
          stylistResponse: dispute.stylist_response,
          createdAt: dispute.created_at,
          evidenceDeadline: dispute.evidence_deadline,
          resolution: dispute.resolution,
          resolvedAt: dispute.resolved_at,
          needsResponse: dispute.status === 'pending_review' && !dispute.stylist_response
        }))
      };

    } catch (error) {
      console.error('Error getting stylist disputes:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all disputes for admin review
   * @param {string} status - Filter by status (optional)
   * @returns {Object} All disputes
   */
  async getAllDisputes(status = null) {
    try {
      let query_text = `
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
      `;

      const params = [];
      if (status) {
        query_text += ' WHERE pd.status = $1';
        params.push(status);
      }

      query_text += ' ORDER BY pd.created_at DESC';

      const disputes = await query(query_text, params);

      return {
        success: true,
        disputes: disputes.rows.map(dispute => ({
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
        }))
      };

    } catch (error) {
      console.error('Error getting all disputes:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get dispute statistics
   * @returns {Object} Dispute statistics
   */
  async getDisputeStats() {
    try {
      const stats = await query(`
        SELECT
          COUNT(*) as total_disputes,
          COUNT(CASE WHEN status = 'pending_review' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'awaiting_decision' THEN 1 END) as awaiting_decision,
          COUNT(CASE WHEN resolution = 'refund' THEN 1 END) as refunds,
          COUNT(CASE WHEN resolution = 'no_refund' THEN 1 END) as no_refunds,
          AVG(CASE WHEN resolved_at IS NOT NULL
              THEN EXTRACT(EPOCH FROM (resolved_at - created_at))/3600
              ELSE NULL END) as avg_resolution_hours,
          SUM(CASE WHEN resolution IN ('refund', 'partial_refund') THEN amount ELSE 0 END) as total_refunded
        FROM payment_disputes
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `);

      return {
        success: true,
        stats: stats.rows[0]
      };

    } catch (error) {
      console.error('Error getting dispute stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = DisputeService;