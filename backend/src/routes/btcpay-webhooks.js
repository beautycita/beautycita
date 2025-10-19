const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query } = require('../db');
const SMSService = require('../smsService');

const smsService = new SMSService();

// BTCPay webhook secret for signature validation
const BTCPAY_WEBHOOK_SECRET = process.env.BTCPAY_WEBHOOK_SECRET || '';

/**
 * Validate BTCPay webhook signature
 */
function validateWebhookSignature(req) {
  const signature = req.headers['btcpay-sig'];
  if (!signature || !BTCPAY_WEBHOOK_SECRET) {
    return false;
  }

  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', BTCPAY_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  // Check lengths first to avoid timingSafeEqual error
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * POST /api/webhooks/btcpay
 * BTCPay Server webhook handler for booking payments
 */
router.post('/btcpay', express.json(), async (req, res) => {
  try {
    // Validate webhook signature for security
    if (BTCPAY_WEBHOOK_SECRET && !validateWebhookSignature(req)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    console.log(`[BTCPay Webhook] Received event: ${event.type} for invoice ${event.invoiceId}`);

    // Log the webhook event
    const logResult = await query(`
      INSERT INTO btcpay_webhook_events (event_type, invoice_id, store_id, payload)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [
      event.type,
      event.invoiceId,
      event.storeId,
      JSON.stringify(event)
    ]);

    const webhookId = logResult.rows[0].id;

    // Process based on event type
    switch (event.type) {
      case 'InvoiceReceivedPayment':
      case 'InvoiceProcessing':
        // Payment detected (0 confirmations or seen in mempool)
        await handleInvoiceProcessing(event, webhookId);
        break;

      case 'InvoiceSettled':
      case 'InvoicePaymentSettled':
        // Payment confirmed (sufficient confirmations)
        await handleInvoiceSettled(event, webhookId);
        break;

      case 'InvoiceExpired':
        // Invoice expired without payment
        await handleInvoiceExpired(event, webhookId);
        break;

      case 'InvoiceInvalid':
        // Payment issue detected
        await handleInvoiceInvalid(event, webhookId);
        break;
    }

    // Mark webhook as processed
    await query(`
      UPDATE btcpay_webhook_events
      SET processed = true, processed_at = NOW()
      WHERE id = $1
    `, [webhookId]);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[BTCPay Webhook] Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle InvoiceProcessing event (payment detected)
 */
async function handleInvoiceProcessing(event, webhookId) {
  try {
    const invoiceId = event.invoiceId;
    const metadata = event.metadata || {};

    // Check if this is a booking payment
    if (metadata.bookingId) {
      const bookingId = metadata.bookingId;

      // Find payment record
      const paymentResult = await query(`
        SELECT p.*, b.client_id, b.stylist_id, b.total_price, u.phone as client_phone, u.name as client_name
        FROM payments p
        JOIN bookings b ON p.booking_id = b.id
        JOIN users u ON b.client_id = u.id
        WHERE p.btcpay_invoice_id = $1
      `, [invoiceId]);

      if (paymentResult.rows.length === 0) {
        console.error(`[BTCPay] Payment not found for invoice ${invoiceId}`);
        return;
      }

      const payment = paymentResult.rows[0];

      // Update payment status to PROCESSING
      await query(`
        UPDATE payments
        SET
          status = 'PROCESSING',
          payment_method = $1,
          updated_at = NOW()
        WHERE btcpay_invoice_id = $2
      `, [
        event.paymentMethod || 'bitcoin',
        invoiceId
      ]);

      console.log(`[BTCPay] Payment ${payment.id} for booking ${bookingId} is processing`);

      // Send SMS notification to client (payment detected)
      if (payment.client_phone) {
        try {
          await smsService.sendSMS(
            payment.client_phone,
            `BeautyCita: Your Bitcoin payment has been detected and is confirming. You'll receive another message once confirmed. Booking #${bookingId}`,
            'payment_notification'
          );
        } catch (smsError) {
          console.error('[BTCPay] Error sending SMS:', smsError);
        }
      }
    }
  } catch (error) {
    console.error('[BTCPay] Error handling InvoiceProcessing:', error);
    await query(`
      UPDATE btcpay_webhook_events
      SET error = $1
      WHERE id = $2
    `, [error.message, webhookId]);
  }
}

/**
 * Handle InvoiceSettled event (payment confirmed)
 */
async function handleInvoiceSettled(event, webhookId) {
  try {
    const invoiceId = event.invoiceId;
    const metadata = event.metadata || {};

    // Check if this is a booking payment
    if (metadata.bookingId) {
      const bookingId = metadata.bookingId;

      // Find payment and booking details
      const paymentResult = await query(`
        SELECT
          p.*,
          b.client_id,
          b.stylist_id,
          b.booking_date,
          b.booking_time,
          b.total_price,
          client.phone as client_phone,
          client.name as client_name,
          client.email as client_email,
          stylist_user.phone as stylist_phone,
          stylist_user.name as stylist_name,
          s.business_name
        FROM payments p
        JOIN bookings b ON p.booking_id = b.id
        JOIN users client ON b.client_id = client.id
        JOIN stylists s ON b.stylist_id = s.id
        JOIN users stylist_user ON s.user_id = stylist_user.id
        WHERE p.btcpay_invoice_id = $1
      `, [invoiceId]);

      if (paymentResult.rows.length === 0) {
        console.error(`[BTCPay] Payment not found for invoice ${invoiceId}`);
        return;
      }

      const payment = paymentResult.rows[0];

      // Update payment status to SUCCEEDED
      await query(`
        UPDATE payments
        SET
          status = 'SUCCEEDED',
          processed_at = NOW(),
          updated_at = NOW()
        WHERE btcpay_invoice_id = $1
      `, [invoiceId]);

      // Update booking status to CONFIRMED
      await query(`
        UPDATE bookings
        SET
          status = 'CONFIRMED',
          confirmed_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
      `, [bookingId]);

      console.log(`[BTCPay] Payment ${payment.id} confirmed, booking ${bookingId} confirmed`);

      // Send SMS to client (payment confirmed)
      if (payment.client_phone) {
        try {
          const bookingDate = new Date(payment.booking_date).toLocaleDateString();
          const bookingTime = payment.booking_time;

          await smsService.sendSMS(
            payment.client_phone,
            `BeautyCita: ✅ Payment confirmed! Your booking on ${bookingDate} at ${bookingTime} with ${payment.business_name || payment.stylist_name} is confirmed. Booking #${bookingId}`,
            'payment_notification'
          );
        } catch (smsError) {
          console.error('[BTCPay] Error sending client SMS:', smsError);
        }
      }

      // Send SMS to stylist (new booking confirmed)
      if (payment.stylist_phone) {
        try {
          const bookingDate = new Date(payment.booking_date).toLocaleDateString();
          const bookingTime = payment.booking_time;

          await smsService.sendSMS(
            payment.stylist_phone,
            `BeautyCita: 🎉 New booking confirmed! ${payment.client_name} on ${bookingDate} at ${bookingTime}. Payment: $${payment.total_price} (Bitcoin). Booking #${bookingId}`,
            'booking_confirmation'
          );
        } catch (smsError) {
          console.error('[BTCPay] Error sending stylist SMS:', smsError);
        }
      }

      // Create notification for client
      await query(`
        INSERT INTO notifications (user_id, type, title, message, related_booking_id)
        VALUES ($1, 'PAYMENT_CONFIRMED', 'Payment Confirmed', $2, $3)
      `, [
        payment.client_id,
        `Your Bitcoin payment has been confirmed. Your booking is confirmed!`,
        bookingId
      ]);

      // Create notification for stylist
      await query(`
        INSERT INTO notifications (user_id, type, title, message, related_booking_id)
        VALUES ($1, 'BOOKING_CONFIRMED', 'New Booking Confirmed', $2, $3)
      `, [
        payment.stylist_id,
        `New booking from ${payment.client_name} has been confirmed with Bitcoin payment.`,
        bookingId
      ]);
    }
  } catch (error) {
    console.error('[BTCPay] Error handling InvoiceSettled:', error);
    await query(`
      UPDATE btcpay_webhook_events
      SET error = $1
      WHERE id = $2
    `, [error.message, webhookId]);
  }
}

/**
 * Handle InvoiceExpired event
 */
async function handleInvoiceExpired(event, webhookId) {
  try {
    const invoiceId = event.invoiceId;
    const metadata = event.metadata || {};

    if (metadata.bookingId) {
      const bookingId = metadata.bookingId;

      // Update payment status to FAILED
      await query(`
        UPDATE payments
        SET
          status = 'FAILED',
          updated_at = NOW()
        WHERE btcpay_invoice_id = $1
      `, [invoiceId]);

      // Optionally cancel the booking
      await query(`
        UPDATE bookings
        SET
          status = 'CANCELLED',
          cancellation_reason = 'Payment invoice expired',
          cancelled_at = NOW(),
          updated_at = NOW()
        WHERE id = $1 AND status = 'PENDING'
      `, [bookingId]);

      console.log(`[BTCPay] Invoice ${invoiceId} expired, booking ${bookingId} cancelled`);
    }
  } catch (error) {
    console.error('[BTCPay] Error handling InvoiceExpired:', error);
    await query(`
      UPDATE btcpay_webhook_events
      SET error = $1
      WHERE id = $2
    `, [error.message, webhookId]);
  }
}

/**
 * Handle InvoiceInvalid event
 */
async function handleInvoiceInvalid(event, webhookId) {
  try {
    const invoiceId = event.invoiceId;
    const metadata = event.metadata || {};

    if (metadata.bookingId) {
      // Update payment status to FAILED
      await query(`
        UPDATE payments
        SET
          status = 'FAILED',
          updated_at = NOW()
        WHERE btcpay_invoice_id = $1
      `, [invoiceId]);

      console.log(`[BTCPay] Invoice ${invoiceId} invalid, payment failed`);
    }
  } catch (error) {
    console.error('[BTCPay] Error handling InvoiceInvalid:', error);
    await query(`
      UPDATE btcpay_webhook_events
      SET error = $1
      WHERE id = $2
    `, [error.message, webhookId]);
  }
}

module.exports = router;
