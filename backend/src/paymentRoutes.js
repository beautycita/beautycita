const express = require('express');
const { query } = require('./db');
const SMSService = require('./smsService');
const EmailNotifications = require("./emailNotifications");
// const StripeConnectService = require('./services/stripeConnectService');
const router = express.Router();

const smsService = new SMSService();
// const stripeConnectService = new StripeConnectService();

// Initialize Stripe with your secret key
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51QVbEEGOz4OzxrU8VCLfyqALiT8wWb4bNXyOKdPvWVOvYpnXrjkC8tFrGGt2NuKbNTGTnmHx4Dv9Q0I9VwcKHPLw00SttEP2PC');

// Create payment intent for booking
router.post('/create-intent', async (req, res) => {
  try {
    const { amount, currency = 'mxn', booking } = req.body;
    const userId = req.userId; // From JWT middleware

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    if (!booking || !booking.stylistId || !booking.serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Booking information is required'
      });
    }

    // Get service details and stylist Stripe account for validation
    const serviceResult = await query(`
      SELECT s.*, st.business_name, st.stripe_account_id, st.stripe_charges_enabled,
             u.email as stylist_email, u.first_name, u.last_name
      FROM services s
      JOIN stylists st ON s.stylist_id = st.id
      JOIN users u ON st.user_id = u.id
      WHERE s.id = $1 AND st.id = $2
    `, [booking.serviceId, booking.stylistId]);

    if (serviceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const service = serviceResult.rows[0];
    const expectedAmount = service.price * 100; // Convert to cents

    // Validate stylist has Stripe Connect account and can receive payments
    if (!service.stripe_account_id) {
      return res.status(400).json({
        success: false,
        message: 'Stylist must complete payment setup before accepting bookings',
        requiresStripeSetup: true
      });
    }

    if (!service.stripe_charges_enabled) {
      return res.status(400).json({
        success: false,
        message: 'Stylist account is not enabled for payments',
        requiresStripeVerification: true
      });
    }

    // Client pays the full service price quoted by stylist
    // Platform takes 3% non-refundable, stylist gets 97% directly via Stripe Connect
    const totalExpected = expectedAmount; // Client pays exactly what stylist quoted
    const platformFee = Math.round(expectedAmount * 0.03); // 3% platform fee
    const stylistPayout = expectedAmount - platformFee; // 97% to stylist (handled by Stripe)

    if (Math.abs(amount - totalExpected) > 10) { // Allow 10 cent tolerance for rounding
      return res.status(400).json({
        success: false,
        message: 'Amount does not match service price'
      });
    }

    // Get client information
    const clientResult = await query(`
      SELECT u.email, u.name, c.phone
      FROM users u
      JOIN clients c ON u.id = c.user_id
      WHERE u.id = $1
    `, [userId]);

    if (clientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const client = clientResult.rows[0];

    // Calculate escrow release time (48 hours from payment)
    const escrowReleaseAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    // Create payment intent with Stripe Connect for automatic split
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      // Stripe Connect configuration for split payments
      application_fee_amount: platformFee, // Platform fee (3%)
      on_behalf_of: service.stripe_account_id, // Charge appears on stylist's dashboard
      transfer_data: {
        destination: service.stripe_account_id, // 97% goes directly to stylist
      },
      metadata: {
        clientId: userId.toString(),
        stylistId: booking.stylistId.toString(),
        serviceId: booking.serviceId.toString(),
        appointmentDate: booking.appointmentDate || '',
        appointmentTime: booking.appointmentTime || '',
        serviceName: service.service_name,
        stylistBusinessName: service.business_name,
        clientEmail: client.email,
        clientName: client.name,
        platformFee: platformFee.toString(),
        serviceAmount: expectedAmount.toString(),
        stylistPayout: stylistPayout.toString(),
        escrowReleaseAt: escrowReleaseAt.toISOString(),
        paymentType: 'split_payment'
      },
      description: `BeautyCita: ${service.service_name} con ${service.business_name}`,
      receipt_email: client.email,
    });

    // Store payment intent in database for tracking
    await query(`
      INSERT INTO payment_intents (
        payment_intent_id, client_id, stylist_id, service_id,
        amount, platform_fee, status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (payment_intent_id) DO UPDATE SET
        updated_at = $9
    `, [
      paymentIntent.id,
      userId,
      booking.stylistId,
      booking.serviceId,
      expectedAmount,
      platformFee,
      'created',
      new Date(),
      new Date()
    ]);

    // Also create a record in the payments table with Connect details
    await query(`
      INSERT INTO payments (
        stripe_payment_intent_id, amount, platform_fee, stylist_payout,
        currency, status, escrow_release_at, stylist_stripe_account_id,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (stripe_payment_intent_id) DO UPDATE SET
        updated_at = $10
    `, [
      paymentIntent.id,
      expectedAmount / 100, // Convert back to dollars
      platformFee / 100,
      stylistPayout / 100,
      currency.toUpperCase(),
      'PENDING',
      escrowReleaseAt,
      service.stripe_account_id,
      new Date(),
      new Date()
    ]);

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      platformFee: platformFee,
      serviceAmount: expectedAmount
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Confirm payment and create booking
router.post('/confirm', async (req, res) => {
  try {
    const { paymentIntentId, bookingData } = req.body;
    const userId = req.userId;

    if (!paymentIntentId || !bookingData) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID and booking data are required'
      });
    }

    // Verify payment intent exists and belongs to user
    const paymentIntentResult = await query(`
      SELECT * FROM payment_intents
      WHERE payment_intent_id = $1 AND client_id = $2
    `, [paymentIntentId, userId]);

    if (paymentIntentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment intent not found'
      });
    }

    // Retrieve payment intent from Stripe to verify status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment has not been completed'
      });
    }

    // Create the booking in PENDING_STYLIST_APPROVAL status
    const now = new Date();
    const requestExpiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
    const finalExpiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes total

    const booking = await query(`
      INSERT INTO bookings (
        client_id, stylist_id, service_id, appointment_date, appointment_time,
        total_price, notes, status, payment_intent_id, request_expires_at,
        acceptance_expires_at, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      userId,
      bookingData.stylist_id,
      bookingData.service_id,
      bookingData.appointment_date,
      bookingData.appointment_time,
      paymentIntent.amount / 100, // Convert back from cents
      bookingData.notes || '',
      'PENDING_STYLIST_APPROVAL',
      paymentIntentId,
      requestExpiresAt,
      finalExpiresAt,
      now,
      now
    ]);

    // Update payment intent status
    await query(`
      UPDATE payment_intents
      SET status = 'succeeded', booking_id = $1, updated_at = $2
      WHERE payment_intent_id = $3
    `, [booking.rows[0].id, new Date(), paymentIntentId]);

    // Get full booking details for response
    const fullBookingResult = await query(`
      SELECT b.*, s.name as service_name, s.price as service_price,
             s.duration as service_duration,
             st.business_name, st.location_address, st.location_city,
             u.name as stylist_name, u.email as stylist_email, u.phone as stylist_phone
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN stylists st ON b.stylist_id = st.id
      LEFT JOIN users u ON st.user_id = u.id
      WHERE b.id = $1
    `, [booking.rows[0].id]);

    const fullBooking = fullBookingResult.rows[0];

    // Send SMS notification to stylist about new booking request
    const serviceDetails = {
      service_name: fullBooking.service_name,
      appointment_date: `${fullBooking.appointment_date} at ${fullBooking.appointment_time}`,
      client_name: `Client`,
      duration: fullBooking.service_duration || 60,
      price: fullBooking.total_price,
      expires_at: requestExpiresAt
    };

    // Get stylist user ID for SMS
    const stylistUserResult = await query(`
      SELECT user_id FROM stylists WHERE id = $1
    `, [bookingData.stylist_id]);

    if (stylistUserResult.rows.length > 0) {
      const stylistUserId = stylistUserResult.rows[0].user_id;

      // Send booking request SMS to stylist
      const smsResult = await smsService.sendBookingRequest(
        stylistUserId,
        userId,
        booking.rows[0].id,
        serviceDetails
      );

      console.log(`SMS sent to stylist: ${smsResult.success ? 'Success' : 'Failed'}`);
    }

    console.log(`Payment confirmed: Booking ${booking.rows[0].id}, Status: PENDING_STYLIST_APPROVAL, Expires: ${requestExpiresAt}`);

    // Send payment receipt email
    EmailNotifications.sendPaymentReceipt(paymentIntentId).catch(err => {
      console.error('Failed to send payment receipt:', err);
    });

    res.json({
      success: true,
      message: 'Payment confirmed, booking request sent to stylist',
      booking: {
        ...fullBooking,
        status: 'PENDING_STYLIST_APPROVAL',
        expires_at: requestExpiresAt,
        final_expires_at: finalExpiresAt
      },
      paymentIntent: {
        id: paymentIntentId,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100
      }
    });

  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get payment status
router.get('/status/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const userId = req.userId;

    // Verify payment intent belongs to user
    const paymentIntentResult = await query(`
      SELECT * FROM payment_intents
      WHERE payment_intent_id = $1 AND client_id = $2
    `, [paymentIntentId, userId]);

    if (paymentIntentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment intent not found'
      });
    }

    // Get status from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        created: paymentIntent.created
      }
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Payment Methods Management

// Get all payment methods for user
router.get('/payment-methods', async (req, res) => {
  try {
    const userId = req.userId;

    const result = await query(`
      SELECT id, type, is_default as "isDefault", last_four as "lastFour",
             brand, expiry_month as "expiryMonth", expiry_year as "expiryYear",
             mercadopago_email as "mercadopagoEmail", bitcoin_address as "bitcoinAddress",
             created_at as "createdAt"
      FROM payment_methods
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at DESC
    `, [userId]);

    res.json(result.rows);

  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment methods',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Add new payment method
router.post('/payment-methods', async (req, res) => {
  try {
    const userId = req.userId;
    const { type, cardNumber, expiryMonth, expiryYear, cvv, cardholderName, mercadopagoEmail, bitcoinAddress } = req.body;

    // Validate type
    const validTypes = ['credit_card', 'debit_card', 'mercadopago', 'oxxo', 'bitcoin'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method type'
      });
    }

    let lastFour = null;
    let brand = null;
    let stripePaymentMethodId = null;

    // For card types, create Stripe payment method
    if (type === 'credit_card' || type === 'debit_card') {
      if (!cardNumber || !expiryMonth || !expiryYear || !cvv) {
        return res.status(400).json({
          success: false,
          message: 'Card details are required'
        });
      }

      // In production, you'd create a Stripe PaymentMethod here
      // For now, we'll store the last 4 digits
      lastFour = cardNumber.slice(-4);
      brand = detectCardBrand(cardNumber);
    }

    // If this is the first payment method, make it default
    const existingMethods = await query(`
      SELECT COUNT(*) as count FROM payment_methods WHERE user_id = $1
    `, [userId]);

    const isDefault = existingMethods.rows[0].count === '0';

    // Insert payment method
    const result = await query(`
      INSERT INTO payment_methods (
        user_id, type, is_default, last_four, brand, expiry_month, expiry_year,
        mercadopago_email, bitcoin_address, stripe_payment_method_id, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING id, type, is_default as "isDefault", last_four as "lastFour",
                brand, expiry_month as "expiryMonth", expiry_year as "expiryYear",
                mercadopago_email as "mercadopagoEmail", bitcoin_address as "bitcoinAddress",
                created_at as "createdAt"
    `, [
      userId,
      type,
      isDefault,
      lastFour,
      brand,
      expiryMonth,
      expiryYear,
      mercadopagoEmail,
      bitcoinAddress,
      stripePaymentMethodId
    ]);

    res.json({
      success: true,
      message: 'Payment method added successfully',
      paymentMethod: result.rows[0]
    });

  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add payment method',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete payment method
router.delete('/payment-methods/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Verify ownership
    const method = await query(`
      SELECT * FROM payment_methods WHERE id = $1 AND user_id = $2
    `, [id, userId]);

    if (method.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // Delete from database
    await query(`DELETE FROM payment_methods WHERE id = $1`, [id]);

    // If this was the default method, set another as default
    if (method.rows[0].is_default) {
      await query(`
        UPDATE payment_methods
        SET is_default = true
        WHERE user_id = $1 AND id = (
          SELECT id FROM payment_methods WHERE user_id = $1 LIMIT 1
        )
      `, [userId]);
    }

    res.json({
      success: true,
      message: 'Payment method deleted successfully'
    });

  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment method',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Set default payment method
router.patch('/payment-methods/:id/default', async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Verify ownership
    const method = await query(`
      SELECT * FROM payment_methods WHERE id = $1 AND user_id = $2
    `, [id, userId]);

    if (method.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // Remove default from all other methods
    await query(`
      UPDATE payment_methods SET is_default = false WHERE user_id = $1
    `, [userId]);

    // Set this method as default
    await query(`
      UPDATE payment_methods SET is_default = true WHERE id = $1
    `, [id]);

    res.json({
      success: true,
      message: 'Default payment method updated'
    });

  } catch (error) {
    console.error('Set default payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set default payment method',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper function to detect card brand
function detectCardBrand(cardNumber) {
  const number = cardNumber.replace(/\s/g, '');

  if (/^4/.test(number)) return 'Visa';
  if (/^5[1-5]/.test(number)) return 'Mastercard';
  if (/^3[47]/.test(number)) return 'American Express';
  if (/^6(?:011|5)/.test(number)) return 'Discover';

  return 'Unknown';
}

// Webhook endpoint for Stripe events
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  let event;

  try {
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);

      const now = new Date();

      // Update payment intent status
      await query(`
        UPDATE payment_intents
        SET status = 'succeeded', updated_at = $1
        WHERE payment_intent_id = $2
      `, [now, paymentIntent.id]);

      // Update payments table with success status and transfer info
      await query(`
        UPDATE payments
        SET status = 'SUCCEEDED',
            processed_at = $1,
            updated_at = $2,
            stripe_transfer_id = $3,
            stripe_application_fee_id = $4
        WHERE stripe_payment_intent_id = $5
      `, [
        now,
        now,
        paymentIntent.transfer_data?.destination || null,
        paymentIntent.application_fee || null,
        paymentIntent.id
      ]);

      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);

      const failedTime = new Date();

      // Update payment intent status
      await query(`
        UPDATE payment_intents
        SET status = 'failed', updated_at = $1
        WHERE payment_intent_id = $2
      `, [failedTime, failedPayment.id]);

      // Update payments table
      await query(`
        UPDATE payments
        SET status = 'FAILED', updated_at = $1
        WHERE stripe_payment_intent_id = $2
      `, [failedTime, failedPayment.id]);

      break;

    case 'charge.dispute.created':
      const dispute = event.data.object;
      console.log('Dispute created:', dispute.id);

      // Handle dispute creation (will be implemented in dispute management)
      await handleChargeDispute(dispute);
      break;

    case 'transfer.created':
      const transfer = event.data.object;
      console.log('Transfer created:', transfer.id);

      // Update payment record with transfer ID
      if (transfer.source_transaction) {
        await query(`
          UPDATE payments
          SET stripe_transfer_id = $1, updated_at = $2
          WHERE stripe_payment_intent_id IN (
            SELECT id FROM stripe_payment_intents
            WHERE latest_charge = $3
          )
        `, [transfer.id, new Date(), transfer.source_transaction]);
      }
      break;

    case 'application_fee.created':
      const appFee = event.data.object;
      console.log('Application fee created:', appFee.id);

      // Update payment record with application fee ID
      if (appFee.charge) {
        await query(`
          UPDATE payments
          SET stripe_application_fee_id = $1, updated_at = $2
          WHERE stripe_payment_intent_id IN (
            SELECT payment_intent FROM stripe_charges
            WHERE id = $3
          )
        `, [appFee.id, new Date(), appFee.charge]);
      }
      break;

    // Connect account events
    case 'account.updated':
    case 'account.external_account.created':
    case 'capability.updated':
      console.log(`Connect event: ${event.type}`);
      // await stripeConnectService.handleConnectWebhook(event);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Helper function for dispute handling
  async function handleChargeDispute(dispute) {
    try {
      // Find the payment associated with this charge
      const paymentResult = await query(`
        SELECT p.*, pi.client_id, pi.stylist_id
        FROM payments p
        JOIN payment_intents pi ON p.stripe_payment_intent_id = pi.payment_intent_id
        WHERE p.stripe_payment_intent_id = (
          SELECT payment_intent FROM stripe_charges WHERE id = $1
        )
      `, [dispute.charge]);

      if (paymentResult.rows.length > 0) {
        const payment = paymentResult.rows[0];

        // Update payment dispute status
        await query(`
          UPDATE payments
          SET dispute_status = $1,
              dispute_deadline = $2,
              updated_at = $3
          WHERE id = $4
        `, [
          'warning',
          new Date(dispute.evidence_details.due_by * 1000),
          new Date(),
          payment.id
        ]);

        // Create dispute record
        await query(`
          INSERT INTO payment_disputes (
            payment_id, stripe_dispute_id, amount, reason, status,
            evidence_deadline, client_id, stylist_id, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          payment.id,
          dispute.id,
          dispute.amount / 100, // Convert from cents
          dispute.reason,
          'warning_needs_response',
          new Date(dispute.evidence_details.due_by * 1000),
          payment.client_id,
          payment.stylist_id,
          new Date(),
          new Date()
        ]);

        console.log(`Dispute created for payment ${payment.id}: ${dispute.id}`);
      }
    } catch (error) {
      console.error('Error handling dispute:', error);
    }
  }

  res.json({received: true});
});

// Stripe Connect onboarding routes - temporarily commented out
/*
router.post('/connect/create-account', async (req, res) => {
  try {
    const userId = req.userId; // From JWT middleware
    const { first_name, last_name, email, phone, business_name, website } = req.body;

    // Get stylist ID from user ID
    const stylistResult = await query(`
      SELECT id FROM stylists WHERE user_id = $1
    `, [userId]);

    if (stylistResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stylist profile not found'
      });
    }

    const stylistId = stylistResult.rows[0].id;

    // Create Connect account
    const result = await stripeConnectService.createConnectAccount(stylistId, {
      first_name,
      last_name,
      email,
      phone,
      business_name,
      website
    });

    res.json(result);

  } catch (error) {
    console.error('Create Connect account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create Connect account',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.get('/connect/onboarding-link', async (req, res) => {
  try {
    const userId = req.userId;

    // Get stylist ID
    const stylistResult = await query(`
      SELECT id FROM stylists WHERE user_id = $1
    `, [userId]);

    if (stylistResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stylist profile not found'
      });
    }

    const stylistId = stylistResult.rows[0].id;

    // Get onboarding link
    const result = await stripeConnectService.getOnboardingLink(stylistId);

    res.json(result);

  } catch (error) {
    console.error('Get onboarding link error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get onboarding link',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.get('/connect/account-status', async (req, res) => {
  try {
    const userId = req.userId;

    // Get stylist ID
    const stylistResult = await query(`
      SELECT id FROM stylists WHERE user_id = $1
    `, [userId]);

    if (stylistResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stylist profile not found'
      });
    }

    const stylistId = stylistResult.rows[0].id;

    // Check account status
    const result = await stripeConnectService.checkAccountStatus(stylistId);

    res.json(result);

  } catch (error) {
    console.error('Check account status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check account status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.get('/connect/dashboard-link', async (req, res) => {
  try {
    const userId = req.userId;

    // Get stylist ID
    const stylistResult = await query(`
      SELECT id FROM stylists WHERE user_id = $1
    `, [userId]);

    if (stylistResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stylist profile not found'
      });
    }

    const stylistId = stylistResult.rows[0].id;

    // Get dashboard link
    const result = await stripeConnectService.getDashboardLink(stylistId);

    res.json(result);

  } catch (error) {
    console.error('Get dashboard link error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard link',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.get('/connect/account-summary', async (req, res) => {
  try {
    const userId = req.userId;

    // Get stylist ID
    const stylistResult = await query(`
      SELECT id FROM stylists WHERE user_id = $1
    `, [userId]);

    if (stylistResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stylist profile not found'
      });
    }

    const stylistId = stylistResult.rows[0].id;

    // Get account summary
    const result = await stripeConnectService.getAccountSummary(stylistId);

    res.json(result);

  } catch (error) {
    console.error('Get account summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get account summary',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

*/

module.exports = router;