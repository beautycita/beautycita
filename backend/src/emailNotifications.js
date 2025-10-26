const emailService = require('./emailService');
const { query } = require('./db');

/**
 * Email Notifications Module
 * Handles all automated email communications for BeautyCita
 *
 * Email Types:
 * 1. Booking Confirmation (client + stylist)
 * 2. Booking Reminder (24h before)
 * 3. Payment Receipt
 * 4. Cancellation Notice
 * 5. Review Request
 * 6. Welcome Email
 * 7. Password Reset (already exists in emailService)
 * 8. Email Verification (already exists)
 */

class EmailNotifications {

  /**
   * 1. Send booking confirmation to client and stylist
   */
  static async sendBookingConfirmation(bookingId) {
    try {
      // Fetch booking details
      const result = await query(`
        SELECT
          b.*,
          c.name as client_name, c.email as client_email,
          s_user.name as stylist_name, s_user.email as stylist_email,
          s.business_name as stylist_business,
          srv.name as service_name, srv.price as service_price, srv.duration_minutes
        FROM bookings b
        JOIN users c ON b.client_id = c.id
        JOIN stylists s ON b.stylist_id = s.id
        JOIN users s_user ON s.user_id = s_user.id
        LEFT JOIN services srv ON b.service_id = srv.id
        WHERE b.id = $1
      `, [bookingId]);

      if (result.rows.length === 0) {
        throw new Error('Booking not found');
      }

      const booking = result.rows[0];

      // Check if client has email notifications enabled
      const clientPrefs = await this.getPrivacySettings(booking.client_id);
      if (clientPrefs && clientPrefs.booking_reminders) {
        await this.sendClientBookingConfirmation(booking);
      }

      // Check if stylist has email notifications enabled
      const stylistUserId = await query('SELECT user_id FROM stylists WHERE id = $1', [booking.stylist_id]);
      if (stylistUserId.rows.length > 0) {
        const stylistPrefs = await this.getPrivacySettings(stylistUserId.rows[0].user_id);
        if (stylistPrefs && stylistPrefs.booking_reminders) {
          await this.sendStylistBookingConfirmation(booking);
        }
      }

      console.log(`Booking confirmation emails sent for booking #${bookingId}`);
    } catch (error) {
      console.error('Failed to send booking confirmation:', error);
      throw error;
    }
  }

  static async sendClientBookingConfirmation(booking) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Inter', -apple-system, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #ec4899, #8b5cf6); padding: 40px; text-align: center; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          .details { background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: white; margin: 0; font-size: 28px;">✨ Booking Confirmed!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Your beauty appointment is all set</p>
          </div>
          <div class="content">
            <p style="font-size: 16px; color: #1f2937;">Hi ${booking.client_name},</p>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
              Great news! Your booking with <strong>${booking.stylist_business || booking.stylist_name}</strong> has been confirmed.
            </p>

            <div class="details">
              <div class="detail-row">
                <span style="color: #6b7280;">Service</span>
                <strong style="color: #1f2937;">${booking.service_name || 'Beauty Service'}</strong>
              </div>
              <div class="detail-row">
                <span style="color: #6b7280;">Date & Time</span>
                <strong style="color: #1f2937;">${new Date(booking.scheduled_date).toLocaleString()}</strong>
              </div>
              <div class="detail-row">
                <span style="color: #6b7280;">Duration</span>
                <strong style="color: #1f2937;">${booking.duration_minutes} minutes</strong>
              </div>
              <div class="detail-row">
                <span style="color: #6b7280;">Price</span>
                <strong style="color: #1f2937;">$${booking.service_price || booking.total_amount}</strong>
              </div>
              <div class="detail-row" style="border: none;">
                <span style="color: #6b7280;">Booking ID</span>
                <strong style="color: #1f2937;">#${booking.id}</strong>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="https://beautycita.com/bookings/${booking.id}" class="button">View Booking Details</a>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              <strong>Cancellation Policy:</strong> You can cancel up to 12 hours before your appointment for a full refund.
            </p>

            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              Questions? Reply to this email or contact us at support@beautycita.com
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await emailService.sendEmail(
      booking.client_email,
      '✨ Your BeautyCita Booking is Confirmed!',
      html
    );
  }

  static async sendStylistBookingConfirmation(booking) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Inter', -apple-system, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #8b5cf6, #3b82f6); padding: 40px; text-align: center; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #3b82f6); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          .details { background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: white; margin: 0; font-size: 28px;">💼 New Booking Received!</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px; color: #1f2937;">Hi ${booking.stylist_name},</p>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
              You have a new booking from <strong>${booking.client_name}</strong>.
            </p>
            <div class="details">
              <p><strong>Service:</strong> ${booking.service_name || 'Beauty Service'}</p>
              <p><strong>Date & Time:</strong> ${new Date(booking.scheduled_date).toLocaleString()}</p>
              <p><strong>Duration:</strong> ${booking.duration_minutes} minutes</p>
              <p><strong>Payment:</strong> $${booking.service_price || booking.total_amount}</p>
              <p><strong>Booking ID:</strong> #${booking.id}</p>
            </div>
            <div style="text-align: center;">
              <a href="https://beautycita.com/dashboard/bookings" class="button">View in Dashboard</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await emailService.sendEmail(
      booking.stylist_email,
      '💼 New Booking Received - BeautyCita',
      html
    );
  }

  /**
   * 2. Send booking reminder (24h before appointment)
   */
  static async sendBookingReminder(bookingId) {
    try {
      const result = await query(`
        SELECT
          b.*,
          c.name as client_name, c.email as client_email, c.id as client_user_id,
          s_user.name as stylist_name,
          s.business_name,
          srv.name as service_name
        FROM bookings b
        JOIN users c ON b.client_id = c.id
        JOIN stylists s ON b.stylist_id = s.id
        JOIN users s_user ON s.user_id = s_user.id
        LEFT JOIN services srv ON b.service_id = srv.id
        WHERE b.id = $1 AND b.status IN ('CONFIRMED', 'IN_PROGRESS')
      `, [bookingId]);

      if (result.rows.length === 0) return;

      const booking = result.rows[0];
      const clientPrefs = await this.getPrivacySettings(booking.client_user_id);

      if (!clientPrefs || !clientPrefs.booking_reminders) return;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', -apple-system, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #f59e0b, #ec4899); padding: 40px; text-align: center; }
            .content { padding: 40px 30px; }
            .button { display: inline-block; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; margin: 10px 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Reminder: Appointment Tomorrow!</h1>
            </div>
            <div class="content">
              <p style="font-size: 16px; color: #1f2937;">Hi ${booking.client_name},</p>
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
                This is a friendly reminder about your appointment tomorrow with <strong>${booking.business_name || booking.stylist_name}</strong>.
              </p>
              <div style="background: #fef3c7; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 5px 0;"><strong>Service:</strong> ${booking.service_name}</p>
                <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${new Date(booking.scheduled_date).toLocaleString()}</p>
                <p style="margin: 5px 0;"><strong>Booking ID:</strong> #${booking.id}</p>
              </div>
              <div style="text-align: center;">
                <a href="https://beautycita.com/bookings/${booking.id}" class="button">View Booking</a>
                <a href="https://beautycita.com/bookings/${booking.id}/cancel" class="button" style="background: #dc2626;">Cancel Booking</a>
              </div>
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                Looking forward to seeing you! ✨
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      await emailService.sendEmail(
        booking.client_email,
        '⏰ Reminder: Your BeautyCita Appointment Tomorrow',
        html
      );

      console.log(`Booking reminder sent for booking #${bookingId}`);
    } catch (error) {
      console.error('Failed to send booking reminder:', error);
    }
  }

  /**
   * 3. Send payment receipt
   */
  static async sendPaymentReceipt(paymentId) {
    try {
      const result = await query(`
        SELECT
          p.*,
          u.name, u.email,
          b.id as booking_id, b.scheduled_date,
          srv.name as service_name
        FROM payments p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN bookings b ON p.booking_id = b.id
        LEFT JOIN services srv ON b.service_id = srv.id
        WHERE p.id = $1
      `, [paymentId]);

      if (result.rows.length === 0) return;

      const payment = result.rows[0];

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', -apple-system, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #10b981, #3b82f6); padding: 40px; text-align: center; }
            .content { padding: 40px 30px; }
            .receipt { background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: white; margin: 0; font-size: 28px;">💳 Payment Receipt</h1>
            </div>
            <div class="content">
              <p style="font-size: 16px; color: #1f2937;">Hi ${payment.name},</p>
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
                Thank you for your payment! Here's your receipt.
              </p>
              <div class="receipt">
                <h3 style="margin-top: 0;">Payment Details</h3>
                <p><strong>Amount Paid:</strong> $${payment.amount}</p>
                <p><strong>Payment Method:</strong> ${payment.payment_method || 'Card'}</p>
                <p><strong>Transaction ID:</strong> ${payment.stripe_payment_intent_id || payment.id}</p>
                <p><strong>Date:</strong> ${new Date(payment.created_at).toLocaleString()}</p>
                ${payment.service_name ? `<p><strong>Service:</strong> ${payment.service_name}</p>` : ''}
                <p><strong>Status:</strong> ✅ Completed</p>
              </div>
              <p style="font-size: 14px; color: #6b7280;">
                This receipt serves as confirmation of your payment. Keep it for your records.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      await emailService.sendEmail(
        payment.email,
        `💳 Payment Receipt - $${payment.amount} - BeautyCita`,
        html
      );

      console.log(`Payment receipt sent for payment #${paymentId}`);
    } catch (error) {
      console.error('Failed to send payment receipt:', error);
    }
  }

  /**
   * 4. Send cancellation notice
   */
  static async sendCancellationNotice(bookingId, cancelledBy) {
    try {
      const result = await query(`
        SELECT
          b.*,
          c.name as client_name, c.email as client_email,
          s_user.name as stylist_name, s_user.email as stylist_email,
          s.business_name
        FROM bookings b
        JOIN users c ON b.client_id = c.id
        JOIN stylists s ON b.stylist_id = s.id
        JOIN users s_user ON s.user_id = s_user.id
        WHERE b.id = $1
      `, [bookingId]);

      if (result.rows.length === 0) return;

      const booking = result.rows[0];
      const refundInfo = booking.refund_amount ? `A refund of $${booking.refund_amount} will be processed within 5-7 business days.` : '';

      // Send to client
      await emailService.sendEmail(
        booking.client_email,
        '❌ Booking Cancelled - BeautyCita',
        this.getCancellationHTML(booking.client_name, booking, refundInfo, 'client', cancelledBy)
      );

      // Send to stylist
      await emailService.sendEmail(
        booking.stylist_email,
        '❌ Booking Cancelled - BeautyCita',
        this.getCancellationHTML(booking.stylist_name, booking, '', 'stylist', cancelledBy)
      );

      console.log(`Cancellation notices sent for booking #${bookingId}`);
    } catch (error) {
      console.error('Failed to send cancellation notice:', error);
    }
  }

  static getCancellationHTML(name, booking, refundInfo, recipientType, cancelledBy) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Inter', -apple-system, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #ef4444, #dc2626); padding: 40px; text-align: center; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: white; margin: 0; font-size: 28px;">Booking Cancelled</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px; color: #1f2937;">Hi ${name},</p>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
              ${cancelledBy === 'client' ? 'You have' : 'The ' + cancelledBy + ' has'} cancelled booking #${booking.id} scheduled for ${new Date(booking.scheduled_date).toLocaleString()}.
            </p>
            ${refundInfo ? `<p style="background: #fef3c7; padding: 15px; border-radius: 8px;">${refundInfo}</p>` : ''}
            ${recipientType === 'client' ? `<div style="text-align: center;"><a href="https://beautycita.com/stylists" class="button">Find Another Stylist</a></div>` : ''}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 5. Send review request (after booking completion)
   */
  static async sendReviewRequest(bookingId) {
    try {
      const result = await query(`
        SELECT
          b.*,
          c.name as client_name, c.email as client_email, c.id as client_user_id,
          s_user.name as stylist_name,
          s.business_name, s.id as stylist_id
        FROM bookings b
        JOIN users c ON b.client_id = c.id
        JOIN stylists s ON b.stylist_id = s.id
        JOIN users s_user ON s.user_id = s_user.id
        WHERE b.id = $1 AND b.status = 'COMPLETED'
      `, [bookingId]);

      if (result.rows.length === 0) return;

      const booking = result.rows[0];

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', -apple-system, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #f59e0b, #ec4899); padding: 40px; text-align: center; }
            .content { padding: 40px 30px; }
            .button { display: inline-block; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .stars { font-size: 32px; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: white; margin: 0; font-size: 28px;">⭐ How was your experience?</h1>
            </div>
            <div class="content">
              <p style="font-size: 16px; color: #1f2937;">Hi ${booking.client_name},</p>
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
                We hope you enjoyed your service with <strong>${booking.business_name || booking.stylist_name}</strong>!
              </p>
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
                Your feedback helps other clients make informed decisions and helps stylists improve their services.
              </p>
              <div class="stars">⭐⭐⭐⭐⭐</div>
              <div style="text-align: center;">
                <a href="https://beautycita.com/bookings/${booking.id}/review" class="button">Leave a Review</a>
              </div>
              <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
                Takes less than 2 minutes ✨
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      await emailService.sendEmail(
        booking.client_email,
        '⭐ How was your BeautyCita experience?',
        html
      );

      console.log(`Review request sent for booking #${bookingId}`);
    } catch (error) {
      console.error('Failed to send review request:', error);
    }
  }

  /**
   * 6. Send welcome email (after registration)
   */
  static async sendWelcomeEmail(userId) {
    try {
      const result = await query('SELECT name, email FROM users WHERE id = $1', [userId]);
      if (result.rows.length === 0) return;

      const user = result.rows[0];

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', -apple-system, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6); padding: 50px 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .button { display: inline-block; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; margin: 20px 5px; }
            .feature { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: white; margin: 0; font-size: 36px;">✨ Welcome to BeautyCita!</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 15px 0 0;">Your beauty journey starts here</p>
            </div>
            <div class="content">
              <p style="font-size: 18px; color: #1f2937;">Hi ${user.name}! 👋</p>
              <p style="font-size: 16px; color: #4b5563; line-height: 1.8;">
                We're thrilled to have you join our community! BeautyCita connects you with the best beauty professionals in your area.
              </p>

              <h3 style="color: #1f2937; margin-top: 30px;">What you can do:</h3>
              <div class="feature">
                <strong>💇 Find Stylists</strong><br>
                <span style="color: #6b7280;">Browse verified professionals near you</span>
              </div>
              <div class="feature">
                <strong>📅 Book Appointments</strong><br>
                <span style="color: #6b7280;">Easy online booking with instant confirmation</span>
              </div>
              <div class="feature">
                <strong>💳 Secure Payments</strong><br>
                <span style="color: #6b7280;">Safe and convenient payment processing</span>
              </div>
              <div class="feature">
                <strong>⭐ Leave Reviews</strong><br>
                <span style="color: #6b7280;">Share your experience with the community</span>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="https://beautycita.com/stylists" class="button">Find Stylists Near You</a>
                <a href="https://beautycita.com/profile" class="button" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6);">Complete Your Profile</a>
              </div>

              <p style="font-size: 14px; color: #6b7280; margin-top: 40px; text-align: center;">
                Need help? Check out our <a href="https://beautycita.com/help" style="color: #ec4899;">Help Center</a> or reply to this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      await emailService.sendEmail(
        user.email,
        '✨ Welcome to BeautyCita - Your Beauty Journey Starts Here!',
        html
      );

      console.log(`Welcome email sent to user #${userId}`);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }
  }

  /**
   * Helper: Get user's privacy settings
   */
  static async getPrivacySettings(userId) {
    try {
      const result = await query(
        'SELECT * FROM user_privacy_settings WHERE user_id = $1',
        [userId]
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Failed to fetch privacy settings:', error);
      return null;
    }
  }
}

module.exports = EmailNotifications;
