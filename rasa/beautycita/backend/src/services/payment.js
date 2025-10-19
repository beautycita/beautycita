import Stripe from 'stripe';
import { query, withTransaction } from './database.js';
import { v4 as uuidv4 } from 'uuid';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create payment intent for booking
export async function createPaymentIntent(bookingId, userId) {
  return withTransaction(async (client) => {
    // Get booking details with permission check
    const bookingResult = await client.query(`
      SELECT
        b.*,
        srv.name as service_name,
        srv.price as service_price,
        c.user_id as client_user_id,
        u.email as client_email,
        u.first_name,
        u.last_name
      FROM bookings b
      JOIN services srv ON b.service_id = srv.id
      JOIN clients c ON b.client_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE b.id = $1 AND c.user_id = $2
    `, [bookingId, userId]);

    if (bookingResult.rows.length === 0) {
      throw new Error('Booking not found or unauthorized');
    }

    const booking = bookingResult.rows[0];

    if (booking.status !== 'PENDING') {
      throw new Error('Booking is not in a payable state');
    }

    // Check if payment already exists
    const existingPayment = await client.query(`
      SELECT * FROM payments WHERE booking_id = $1
    `, [bookingId]);

    if (existingPayment.rows.length > 0) {
      const payment = existingPayment.rows[0];
      if (payment.status === 'SUCCEEDED') {
        throw new Error('Booking has already been paid');
      }
      if (payment.status === 'PENDING') {
        // Return existing payment intent
        const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);
        return {
          clientSecret: paymentIntent.client_secret,
          paymentId: payment.id
        };
      }
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.total_price * 100), // Convert to cents
      currency: 'mxn',
      metadata: {
        bookingId: bookingId,
        userId: userId,
        serviceName: booking.service_name
      },
      receipt_email: booking.client_email,
      description: `BeautyCita - ${booking.service_name} - ${booking.first_name} ${booking.last_name}`
    });

    // Create payment record
    const paymentId = uuidv4();
    await client.query(`
      INSERT INTO payments (
        id, booking_id, stripe_payment_intent_id,
        amount, currency, status, payment_method
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      paymentId, bookingId, paymentIntent.id,
      booking.total_price, 'MXN', 'PENDING', 'card'
    ]);

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentId
    };
  });
}

// Confirm payment and update booking
export async function confirmPayment(paymentIntentId) {
  return withTransaction(async (client) => {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Update payment record
    const paymentResult = await client.query(`
      UPDATE payments
      SET status = $1, processed_at = CURRENT_TIMESTAMP
      WHERE stripe_payment_intent_id = $2
      RETURNING *
    `, [paymentIntent.status.toUpperCase(), paymentIntentId]);

    if (paymentResult.rows.length === 0) {
      throw new Error('Payment record not found');
    }

    const payment = paymentResult.rows[0];

    // If payment succeeded, confirm the booking
    if (paymentIntent.status === 'succeeded') {
      await client.query(`
        UPDATE bookings
        SET status = 'CONFIRMED', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [payment.booking_id]);

      // TODO: Send confirmation email/SMS
    }

    return payment;
  });
}

// Process refund
export async function processRefund(bookingId, amount, reason, userId, userRole) {
  return withTransaction(async (client) => {
    // Get booking and payment details
    const result = await client.query(`
      SELECT
        b.*,
        p.stripe_payment_intent_id,
        p.amount as payment_amount,
        p.id as payment_id,
        c.user_id as client_user_id,
        s.user_id as stylist_user_id
      FROM bookings b
      JOIN payments p ON b.id = p.booking_id
      LEFT JOIN clients c ON b.client_id = c.id
      LEFT JOIN stylists s ON b.stylist_id = s.id
      WHERE b.id = $1 AND p.status = 'SUCCEEDED'
    `, [bookingId]);

    if (result.rows.length === 0) {
      throw new Error('Booking not found or payment not completed');
    }

    const booking = result.rows[0];

    // Check permissions
    if (userRole !== 'ADMIN' &&
        userId !== booking.client_user_id &&
        userId !== booking.stylist_user_id) {
      throw new Error('Insufficient permissions for refund');
    }

    // Validate refund amount
    const maxRefund = booking.payment_amount - (booking.refund_amount || 0);
    if (amount > maxRefund) {
      throw new Error(`Refund amount cannot exceed ${maxRefund}`);
    }

    // Process refund with Stripe
    const refund = await stripe.refunds.create({
      payment_intent: booking.stripe_payment_intent_id,
      amount: Math.round(amount * 100), // Convert to cents
      reason: reason || 'requested_by_customer',
      metadata: {
        bookingId: bookingId,
        userId: userId,
        reason: reason
      }
    });

    // Update payment record
    await client.query(`
      UPDATE payments
      SET refund_amount = COALESCE(refund_amount, 0) + $1
      WHERE id = $2
    `, [amount, booking.payment_id]);

    // Update booking status if fully refunded
    if (amount === booking.payment_amount) {
      await client.query(`
        UPDATE bookings
        SET status = 'CANCELLED', cancellation_reason = $1
        WHERE id = $2
      `, [reason, bookingId]);
    }

    return refund;
  });
}

// Get payment details for a booking
export async function getPaymentDetails(bookingId, userId, userRole) {
  let whereClause = 'WHERE b.id = $1';
  let params = [bookingId];

  // Add permission check
  if (userRole !== 'ADMIN') {
    whereClause += ` AND (c.user_id = $2 OR s.user_id = $2)`;
    params.push(userId);
  }

  const result = await query(`
    SELECT
      p.*,
      b.status as booking_status,
      b.appointment_date,
      b.appointment_time,
      srv.name as service_name,
      srv.name_es as service_name_es
    FROM payments p
    JOIN bookings b ON p.booking_id = b.id
    LEFT JOIN clients c ON b.client_id = c.id
    LEFT JOIN stylists s ON b.stylist_id = s.id
    LEFT JOIN services srv ON b.service_id = srv.id
    ${whereClause}
  `, params);

  if (result.rows.length === 0) {
    throw new Error('Payment not found or unauthorized');
  }

  return result.rows[0];
}

// Create Stripe Connect account for stylist
export async function createConnectAccount(userId) {
  return withTransaction(async (client) => {
    // Get stylist details
    const stylistResult = await client.query(`
      SELECT s.*, u.email, u.first_name, u.last_name
      FROM stylists s
      JOIN users u ON s.user_id = u.id
      WHERE u.id = $1
    `, [userId]);

    if (stylistResult.rows.length === 0) {
      throw new Error('Stylist profile not found');
    }

    const stylist = stylistResult.rows[0];

    if (stylist.stripe_account_id) {
      throw new Error('Stripe account already exists');
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'MX',
      email: stylist.email,
      business_profile: {
        name: stylist.business_name || `${stylist.first_name} ${stylist.last_name}`,
        product_description: 'Beauty services',
        support_email: stylist.email
      },
      metadata: {
        userId: userId,
        stylistId: stylist.id
      }
    });

    // Update stylist record
    await client.query(`
      UPDATE stylists
      SET stripe_account_id = $1
      WHERE id = $2
    `, [account.id, stylist.id]);

    return account;
  });
}

// Create account link for Stripe onboarding
export async function createAccountLink(userId) {
  const stylistResult = await query(`
    SELECT stripe_account_id
    FROM stylists s
    JOIN users u ON s.user_id = u.id
    WHERE u.id = $1
  `, [userId]);

  if (stylistResult.rows.length === 0 || !stylistResult.rows[0].stripe_account_id) {
    throw new Error('Stripe account not found');
  }

  const accountLink = await stripe.accountLinks.create({
    account: stylistResult.rows[0].stripe_account_id,
    refresh_url: `${process.env.FRONTEND_URL}/stylist/stripe/refresh`,
    return_url: `${process.env.FRONTEND_URL}/stylist/stripe/success`,
    type: 'account_onboarding',
  });

  return accountLink;
}

// Webhook handler for Stripe events
export async function handleStripeWebhook(sig, body) {
  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      await confirmPayment(event.data.object.id);
      break;

    case 'payment_intent.payment_failed':
      await query(`
        UPDATE payments
        SET status = 'FAILED', failure_reason = $1
        WHERE stripe_payment_intent_id = $2
      `, [event.data.object.last_payment_error?.message || 'Payment failed', event.data.object.id]);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return { received: true };
}

export default {
  createPaymentIntent,
  confirmPayment,
  processRefund,
  getPaymentDetails,
  createConnectAccount,
  createAccountLink,
  handleStripeWebhook
};