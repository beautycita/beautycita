const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { query } = require('./db');

class PaymentService {
  constructor() {
    this.platformFeePercentage = 0.03; // 3% platform fee
    this.currency = 'usd';
  }

  // Create payment intent for booking
  async createPaymentIntent(bookingId, clientId) {
    try {
      // Get booking details
      const bookingResult = await query(`
        SELECT b.*, s.name as service_name, s.price, s.duration_minutes,
               c.email as client_email, c.first_name as client_name,
               st.business_name, u.first_name as stylist_name
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        JOIN users c ON b.client_id = c.id
        JOIN stylists st ON b.stylist_id = st.id
        JOIN users u ON st.user_id = u.id
        WHERE b.id = $1 AND b.client_id = $2
      `, [bookingId, clientId]);

      if (bookingResult.rows.length === 0) {
        return {
          success: false,
          error: 'Booking not found or unauthorized'
        };
      }

      const booking = bookingResult.rows[0];

      // Verify booking is in correct status for payment
      if (booking.status !== 'VERIFY_ACCEPTANCE') {
        return {
          success: false,
          error: `Cannot create payment for booking with status: ${booking.status}`
        };
      }

      // Check if booking is not expired
      const now = new Date();
      if (booking.acceptance_expires_at && new Date(booking.acceptance_expires_at) < now) {
        return {
          success: false,
          error: 'Booking confirmation window has expired'
        };
      }

      // Calculate amounts
      const totalAmountCents = Math.round(booking.total_price * 100);
      const platformFeeCents = Math.round(totalAmountCents * this.platformFeePercentage);
      const stylistPayoutCents = totalAmountCents - platformFeeCents;

      // Create Stripe Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmountCents,
        currency: this.currency,
        customer: await this.getOrCreateStripeCustomer(booking.client_email, booking.client_name),
        metadata: {
          bookingId: bookingId.toString(),
          clientId: clientId.toString(),
          stylistId: booking.stylist_id.toString(),
          serviceName: booking.service_name,
          platformFeeCents: platformFeeCents.toString(),
          stylistPayoutCents: stylistPayoutCents.toString()
        },
        description: `BeautyCita: ${booking.service_name} with ${booking.business_name || booking.stylist_name}`,
        receipt_email: booking.client_email,
        automatic_payment_methods: {
          enabled: true
        }
      });

      // Store payment intent in database
      await query(`
        INSERT INTO payments (
          booking_id, stripe_payment_intent_id, amount, platform_fee, stylist_payout,
          currency, status, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (stripe_payment_intent_id)
        DO UPDATE SET updated_at = $9
      `, [
        bookingId,
        paymentIntent.id,
        booking.total_price,
        booking.total_price * this.platformFeePercentage,
        booking.total_price * (1 - this.platformFeePercentage),
        this.currency.toUpperCase(),
        'PENDING',
        now,
        now
      ]);

      console.log(`Payment intent created: ${paymentIntent.id} for booking ${bookingId}`);

      return {
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          amount: totalAmountCents,
          currency: this.currency,
          platformFee: platformFeeCents,
          stylistPayout: stylistPayoutCents
        },
        booking: {
          id: bookingId,
          serviceName: booking.service_name,
          stylistName: booking.business_name || booking.stylist_name,
          duration: booking.duration_minutes,
          expiresAt: booking.acceptance_expires_at
        }
      };

    } catch (error) {
      console.error('Error creating payment intent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Confirm payment and update booking status
  async confirmPayment(paymentIntentId, bookingId, clientId) {
    try {
      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        return {
          success: false,
          error: `Payment status is ${paymentIntent.status}, expected succeeded`
        };
      }

      // Verify payment belongs to this booking and client
      if (paymentIntent.metadata.bookingId !== bookingId.toString() ||
          paymentIntent.metadata.clientId !== clientId.toString()) {
        return {
          success: false,
          error: 'Payment intent does not match booking details'
        };
      }

      const now = new Date();

      // Update payment record
      await query(`
        UPDATE payments
        SET status = 'SUCCEEDED',
            processed_at = $1,
            updated_at = $2
        WHERE stripe_payment_intent_id = $3
      `, [now, now, paymentIntentId]);

      // Get booking details for confirmation
      const bookingResult = await query(`
        SELECT b.*, s.name as service_name
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        WHERE b.id = $1
      `, [bookingId]);

      if (bookingResult.rows.length === 0) {
        return {
          success: false,
          error: 'Booking not found'
        };
      }

      const booking = bookingResult.rows[0];

      console.log(`Payment confirmed: ${paymentIntentId} for booking ${bookingId}`);

      return {
        success: true,
        payment: {
          id: paymentIntentId,
          status: 'succeeded',
          amount: paymentIntent.amount,
          confirmedAt: now
        },
        booking: {
          id: bookingId,
          serviceName: booking.service_name,
          status: booking.status
        }
      };

    } catch (error) {
      console.error('Error confirming payment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process refund for cancelled booking
  async processRefund(bookingId, reason = 'Booking cancelled') {
    try {
      // Get payment details
      const paymentResult = await query(`
        SELECT p.*, b.status as booking_status, s.name as service_name
        FROM payments p
        JOIN bookings b ON p.booking_id = b.id
        JOIN services s ON b.service_id = s.id
        WHERE p.booking_id = $1 AND p.status = 'SUCCEEDED'
      `, [bookingId]);

      if (paymentResult.rows.length === 0) {
        return {
          success: false,
          error: 'No successful payment found for this booking'
        };
      }

      const payment = paymentResult.rows[0];

      // Check if booking can be refunded
      if (['COMPLETED', 'IN_PROGRESS'].includes(payment.booking_status)) {
        return {
          success: false,
          error: `Cannot refund booking that is ${payment.booking_status.toLowerCase()}`
        };
      }

      // Create refund in Stripe
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripe_payment_intent_id,
        reason: 'requested_by_customer',
        metadata: {
          bookingId: bookingId.toString(),
          refundReason: reason
        }
      });

      const now = new Date();

      // Update payment record
      await query(`
        UPDATE payments
        SET status = 'REFUNDED',
            refund_amount = $1,
            refund_reason = $2,
            updated_at = $3
        WHERE id = $4
      `, [payment.amount, reason, now, payment.id]);

      console.log(`Refund processed: ${refund.id} for booking ${bookingId}`);

      return {
        success: true,
        refund: {
          id: refund.id,
          amount: refund.amount,
          status: refund.status,
          reason: reason,
          processedAt: now
        },
        booking: {
          id: bookingId,
          serviceName: payment.service_name
        }
      };

    } catch (error) {
      console.error('Error processing refund:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get or create Stripe customer
  async getOrCreateStripeCustomer(email, name) {
    try {
      // Search for existing customer
      const customers = await stripe.customers.list({
        email: email,
        limit: 1
      });

      if (customers.data.length > 0) {
        return customers.data[0].id;
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email: email,
        name: name,
        metadata: {
          source: 'BeautyCita'
        }
      });

      return customer.id;

    } catch (error) {
      console.error('Error managing Stripe customer:', error);
      throw error;
    }
  }

  // Handle Stripe webhook events
  async handleWebhook(event) {
    try {
      console.log(`Processing Stripe webhook: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;

        // Dispute/Chargeback Events
        case 'charge.dispute.created':
          await this.handleDisputeCreated(event.data.object);
          break;

        case 'charge.dispute.updated':
          await this.handleDisputeUpdated(event.data.object);
          break;

        case 'charge.dispute.closed':
          await this.handleDisputeClosed(event.data.object);
          break;

        case 'charge.dispute.funds_withdrawn':
          await this.handleDisputeFundsWithdrawn(event.data.object);
          break;

        case 'charge.dispute.funds_reinstated':
          await this.handleDisputeFundsReinstated(event.data.object);
          break;

        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }

      return { success: true, processed: event.type };

    } catch (error) {
      console.error('Error handling webhook:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle successful payment webhook
  async handlePaymentSuccess(paymentIntent) {
    try {
      const bookingId = paymentIntent.metadata.bookingId;
      if (!bookingId) {
        console.log('Payment intent missing booking ID metadata');
        return;
      }

      const now = new Date();

      // Update payment status
      await query(`
        UPDATE payments
        SET status = 'SUCCEEDED',
            processed_at = $1,
            updated_at = $2
        WHERE stripe_payment_intent_id = $3
      `, [now, now, paymentIntent.id]);

      console.log(`Webhook: Payment succeeded for booking ${bookingId}`);

    } catch (error) {
      console.error('Error handling payment success webhook:', error);
    }
  }

  // Handle failed payment webhook
  async handlePaymentFailure(paymentIntent) {
    try {
      const bookingId = paymentIntent.metadata.bookingId;
      if (!bookingId) {
        console.log('Payment intent missing booking ID metadata');
        return;
      }

      const now = new Date();

      // Update payment status
      await query(`
        UPDATE payments
        SET status = 'FAILED',
            updated_at = $1
        WHERE stripe_payment_intent_id = $2
      `, [now, paymentIntent.id]);

      // Optionally mark booking as cancelled due to payment failure
      await query(`
        UPDATE bookings
        SET status = 'CANCELLED',
            cancellation_reason = 'Payment failed',
            cancelled_at = $1,
            last_status_change = $2
        WHERE id = $3 AND status = 'VERIFY_ACCEPTANCE'
      `, [now, now, bookingId]);

      console.log(`Webhook: Payment failed for booking ${bookingId}`);

    } catch (error) {
      console.error('Error handling payment failure webhook:', error);
    }
  }

  // ========================================
  // DISPUTE/CHARGEBACK WEBHOOK HANDLERS
  // ========================================

  /**
   * Handle new dispute creation from Stripe (customer filed chargeback)
   * This is when a customer disputes a charge with their bank
   */
  async handleDisputeCreated(dispute) {
    try {
      console.log(`🚨 DISPUTE CREATED: ${dispute.id} for charge ${dispute.charge}`);
      console.log(`Reason: ${dispute.reason} | Amount: $${dispute.amount / 100} | Status: ${dispute.status}`);

      const now = new Date();
      const evidenceDeadline = new Date(dispute.evidence_details.due_by * 1000);

      // Find the payment by charge ID
      const chargeDetails = await stripe.charges.retrieve(dispute.charge);
      const paymentIntent = chargeDetails.payment_intent;

      const paymentResult = await query(`
        SELECT p.*, b.client_id, b.stylist_id, s.name as service_name,
               st.business_name, u.email as client_email, u.name as client_name
        FROM payments p
        LEFT JOIN bookings b ON p.booking_id = b.id
        LEFT JOIN services s ON b.service_id = s.id
        LEFT JOIN stylists st ON b.stylist_id = st.id
        LEFT JOIN users u ON b.client_id = u.id
        WHERE p.stripe_payment_intent_id = $1
      `, [paymentIntent]);

      if (paymentResult.rows.length === 0) {
        console.error(`Payment not found for payment intent: ${paymentIntent}`);
        return;
      }

      const payment = paymentResult.rows[0];

      // Create dispute record in database
      await query(`
        INSERT INTO payment_disputes (
          payment_id, stripe_dispute_id, amount, reason, status,
          evidence_deadline, client_id, stylist_id, client_statement,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (stripe_dispute_id)
        DO UPDATE SET status = $5, updated_at = $11
      `, [
        payment.id,
        dispute.id,
        dispute.amount / 100, // Convert from cents
        dispute.reason,
        'warning_needs_response',
        evidenceDeadline,
        payment.client_id,
        payment.stylist_id,
        `Customer filed dispute with bank: ${dispute.reason}`,
        now,
        now
      ]);

      // Update payment status to reflect dispute
      await query(`
        UPDATE payments
        SET dispute_status = 'needs_response',
            dispute_deadline = $1,
            updated_at = $2
        WHERE id = $3
      `, [evidenceDeadline, now, payment.id]);

      // Freeze future payouts for this stylist (if using Connect)
      if (payment.stylist_stripe_account_id) {
        await this.freezeStylistPayouts(payment.stylist_id, dispute.id);
      }

      // Send urgent notification to admin and stylist
      await this.notifyDisputeCreated(payment, dispute, evidenceDeadline);

      console.log(`✅ Dispute ${dispute.id} recorded. Evidence due by ${evidenceDeadline.toISOString()}`);

    } catch (error) {
      console.error('Error handling dispute created webhook:', error);
      throw error;
    }
  }

  /**
   * Handle dispute updates from Stripe
   */
  async handleDisputeUpdated(dispute) {
    try {
      console.log(`📝 DISPUTE UPDATED: ${dispute.id} | Status: ${dispute.status}`);

      const now = new Date();

      // Update dispute record
      await query(`
        UPDATE payment_disputes
        SET status = $1,
            updated_at = $2
        WHERE stripe_dispute_id = $3
      `, [
        this.mapStripeDisputeStatus(dispute.status),
        now,
        dispute.id
      ]);

      // Update payment dispute status
      await query(`
        UPDATE payments
        SET dispute_status = $1,
            updated_at = $2
        WHERE id IN (
          SELECT payment_id FROM payment_disputes WHERE stripe_dispute_id = $3
        )
      `, [
        this.mapStripeDisputeStatus(dispute.status),
        now,
        dispute.id
      ]);

      console.log(`✅ Dispute ${dispute.id} updated to status: ${dispute.status}`);

    } catch (error) {
      console.error('Error handling dispute updated webhook:', error);
    }
  }

  /**
   * Handle dispute closed (won or lost)
   */
  async handleDisputeClosed(dispute) {
    try {
      console.log(`🏁 DISPUTE CLOSED: ${dispute.id} | Status: ${dispute.status}`);

      const now = new Date();
      const won = dispute.status === 'won';
      const resolution = won ? 'won' : 'lost';

      // Update dispute record
      await query(`
        UPDATE payment_disputes
        SET status = $1,
            resolution = $2,
            resolved_at = $3,
            admin_notes = $4,
            updated_at = $5
        WHERE stripe_dispute_id = $6
      `, [
        won ? 'won' : 'lost',
        resolution,
        now,
        `Stripe dispute ${won ? 'won' : 'lost'}. Outcome: ${dispute.outcome?.type || 'unknown'}`,
        now,
        dispute.id
      ]);

      // Update payment status
      const paymentStatus = won ? 'won' : 'lost';
      await query(`
        UPDATE payments
        SET dispute_status = $1,
            updated_at = $2
        WHERE id IN (
          SELECT payment_id FROM payment_disputes WHERE stripe_dispute_id = $3
        )
      `, [paymentStatus, now, dispute.id]);

      // If won, unfreeze stylist payouts
      if (won) {
        const paymentResult = await query(`
          SELECT p.stylist_id FROM payments p
          JOIN payment_disputes pd ON p.id = pd.payment_id
          WHERE pd.stripe_dispute_id = $1
        `, [dispute.id]);

        if (paymentResult.rows.length > 0) {
          await this.unfreezeStylistPayouts(paymentResult.rows[0].stylist_id, dispute.id);
        }
      }

      // Notify stakeholders
      await this.notifyDisputeClosed(dispute, won);

      console.log(`✅ Dispute ${dispute.id} closed. Result: ${won ? 'WON ✅' : 'LOST ❌'}`);

    } catch (error) {
      console.error('Error handling dispute closed webhook:', error);
    }
  }

  /**
   * Handle funds withdrawn (we lost the dispute)
   */
  async handleDisputeFundsWithdrawn(dispute) {
    try {
      console.log(`💸 DISPUTE FUNDS WITHDRAWN: ${dispute.id} | Amount: $${dispute.amount / 100}`);

      const now = new Date();

      // Update payment to show funds were withdrawn
      await query(`
        UPDATE payments
        SET dispute_status = 'lost',
            refund_amount = $1,
            refund_reason = 'Chargeback lost - funds withdrawn by bank',
            updated_at = $2
        WHERE id IN (
          SELECT payment_id FROM payment_disputes WHERE stripe_dispute_id = $3
        )
      `, [dispute.amount / 100, now, dispute.id]);

      console.log(`✅ Marked payment as lost, funds withdrawn: $${dispute.amount / 100}`);

    } catch (error) {
      console.error('Error handling dispute funds withdrawn webhook:', error);
    }
  }

  /**
   * Handle funds reinstated (we won the dispute)
   */
  async handleDisputeFundsReinstated(dispute) {
    try {
      console.log(`💰 DISPUTE FUNDS REINSTATED: ${dispute.id} | Amount: $${dispute.amount / 100}`);

      const now = new Date();

      // Update payment to show we won
      await query(`
        UPDATE payments
        SET dispute_status = 'won',
            updated_at = $1
        WHERE id IN (
          SELECT payment_id FROM payment_disputes WHERE stripe_dispute_id = $2
        )
      `, [now, dispute.id]);

      console.log(`✅ Funds reinstated for dispute ${dispute.id}`);

    } catch (error) {
      console.error('Error handling dispute funds reinstated webhook:', error);
    }
  }

  // ========================================
  // DISPUTE HELPER METHODS
  // ========================================

  /**
   * Map Stripe dispute status to our internal status
   */
  mapStripeDisputeStatus(stripeStatus) {
    const statusMap = {
      'warning_needs_response': 'warning_needs_response',
      'warning_under_review': 'under_review',
      'warning_closed': 'warning_closed',
      'needs_response': 'needs_response',
      'under_review': 'under_review',
      'charge_refunded': 'charge_refunded',
      'won': 'won',
      'lost': 'lost'
    };
    return statusMap[stripeStatus] || 'under_review';
  }

  /**
   * Freeze stylist payouts during dispute
   */
  async freezeStylistPayouts(stylistId, disputeId) {
    try {
      console.log(`🔒 Freezing payouts for stylist ${stylistId} due to dispute ${disputeId}`);

      // Mark stylist as having active dispute
      await query(`
        UPDATE stylists
        SET has_active_dispute = true,
            updated_at = $1
        WHERE id = $2
      `, [new Date(), stylistId]);

      // If stylist has Stripe Connect account, we could pause payouts there too
      // This would require additional Stripe API calls

      console.log(`✅ Payouts frozen for stylist ${stylistId}`);

    } catch (error) {
      console.error('Error freezing stylist payouts:', error);
    }
  }

  /**
   * Unfreeze stylist payouts after dispute resolution
   */
  async unfreezeStylistPayouts(stylistId, disputeId) {
    try {
      console.log(`🔓 Unfreezing payouts for stylist ${stylistId} after dispute ${disputeId}`);

      // Check if stylist has any other active disputes
      const activeDisputes = await query(`
        SELECT COUNT(*) as count
        FROM payment_disputes pd
        WHERE pd.stylist_id = $1
        AND pd.status IN ('warning_needs_response', 'needs_response', 'under_review')
      `, [stylistId]);

      if (parseInt(activeDisputes.rows[0].count) === 0) {
        await query(`
          UPDATE stylists
          SET has_active_dispute = false,
              updated_at = $1
          WHERE id = $2
        `, [new Date(), stylistId]);

        console.log(`✅ Payouts unfrozen for stylist ${stylistId}`);
      } else {
        console.log(`⚠️ Stylist ${stylistId} still has ${activeDisputes.rows[0].count} active disputes`);
      }

    } catch (error) {
      console.error('Error unfreezing stylist payouts:', error);
    }
  }

  /**
   * Send notifications when dispute is created
   */
  async notifyDisputeCreated(payment, dispute, evidenceDeadline) {
    try {
      // This would integrate with your notification system (email, SMS, etc.)
      console.log(`📧 NOTIFICATION: Dispute ${dispute.id} created`);
      console.log(`   - Amount: $${dispute.amount / 100}`);
      console.log(`   - Reason: ${dispute.reason}`);
      console.log(`   - Evidence due: ${evidenceDeadline.toISOString()}`);
      console.log(`   - Stylist: ${payment.business_name || 'Unknown'}`);

      // TODO: Send email to admin
      // TODO: Send SMS to stylist
      // TODO: Create admin dashboard notification

    } catch (error) {
      console.error('Error sending dispute notifications:', error);
    }
  }

  /**
   * Send notifications when dispute is closed
   */
  async notifyDisputeClosed(dispute, won) {
    try {
      console.log(`📧 NOTIFICATION: Dispute ${dispute.id} closed - ${won ? 'WON' : 'LOST'}`);

      // TODO: Send email to admin
      // TODO: Send notification to stylist
      // TODO: Update admin dashboard

    } catch (error) {
      console.error('Error sending dispute closed notifications:', error);
    }
  }

  /**
   * Submit evidence to Stripe for a dispute
   * This can be called manually or automatically when we detect a dispute
   */
  async submitDisputeEvidence(disputeId, evidence) {
    try {
      console.log(`📤 Submitting evidence for dispute ${disputeId}`);

      // Get dispute record
      const disputeResult = await query(`
        SELECT pd.*, p.booking_id, b.appointment_date, s.name as service_name
        FROM payment_disputes pd
        JOIN payments p ON pd.payment_id = p.id
        LEFT JOIN bookings b ON p.booking_id = b.id
        LEFT JOIN services s ON b.service_id = s.id
        WHERE pd.stripe_dispute_id = $1
      `, [disputeId]);

      if (disputeResult.rows.length === 0) {
        throw new Error(`Dispute ${disputeId} not found`);
      }

      const dispute = disputeResult.rows[0];

      // Build evidence object for Stripe
      const stripeEvidence = {
        customer_name: evidence.customerName || 'Unknown',
        customer_email_address: evidence.customerEmail || '',
        product_description: evidence.serviceDescription || dispute.service_name,
        service_date: dispute.appointment_date ?
          new Date(dispute.appointment_date).toISOString() : null,
        ...evidence // Include any additional evidence fields
      };

      // Submit to Stripe
      await stripe.disputes.update(disputeId, {
        evidence: stripeEvidence,
        submit: true
      });

      // Update our record
      await query(`
        UPDATE payment_disputes
        SET stylist_response = $1,
            status = 'under_review',
            updated_at = $2
        WHERE stripe_dispute_id = $3
      `, [
        JSON.stringify(stripeEvidence),
        new Date(),
        disputeId
      ]);

      console.log(`✅ Evidence submitted for dispute ${disputeId}`);

      return { success: true, disputeId };

    } catch (error) {
      console.error('Error submitting dispute evidence:', error);
      throw error;
    }
  }

  // Get payment statistics
  async getPaymentStats(timeRange = '24h') {
    try {
      let timeCondition;
      const now = new Date();

      switch (timeRange) {
        case '1h':
          timeCondition = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          timeCondition = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          timeCondition = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          timeCondition = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const stats = await query(`
        SELECT
          status,
          COUNT(*) as count,
          SUM(amount) as total_amount,
          SUM(platform_fee) as total_platform_fees,
          SUM(stylist_payout) as total_stylist_payouts
        FROM payments
        WHERE created_at >= $1
        GROUP BY status
        ORDER BY count DESC
      `, [timeCondition]);

      return {
        success: true,
        timeRange,
        paymentStats: stats.rows,
        generatedAt: now
      };

    } catch (error) {
      console.error('Error getting payment stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = PaymentService;