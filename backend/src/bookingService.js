const { query } = require('./db');
const SMSService = require('./smsService');

class BookingService {
  constructor() {
    this.smsService = new SMSService();
  }

  // Check for expired bookings and update their status
  async processExpiredBookings() {
    try {
      const now = new Date();
      let expiredCount = 0;

      // Find bookings with expired request windows (PENDING status)
      const expiredRequests = await query(`
        SELECT b.id, b.client_id, b.stylist_id, s.name as service_name
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        WHERE b.status = 'PENDING'
        AND b.request_expires_at IS NOT NULL
        AND b.request_expires_at < $1
      `, [now]);

      // Update expired request bookings
      for (const booking of expiredRequests.rows) {
        await query(`
          UPDATE bookings
          SET status = 'EXPIRED',
              last_status_change = $1,
              updated_at = $2
          WHERE id = $3
        `, [now, now, booking.id]);

        // Notify client that stylist didn't respond in time
        await this.smsService.sendSMS(
          booking.client_id,
          await this.getUserPhone(booking.client_id),
          `Your booking request for ${booking.service_name} has expired. The stylist didn't respond within 5 minutes. You can create a new booking anytime.`,
          'BOOKING_EXPIRED',
          booking.id
        );

        console.log(`Expired booking request: ${booking.id}`);
        expiredCount++;
      }

      // Find bookings with expired acceptance windows (VERIFY_ACCEPTANCE status)
      const expiredAcceptances = await query(`
        SELECT b.id, b.client_id, b.stylist_id, s.name as service_name
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        WHERE b.status = 'VERIFY_ACCEPTANCE'
        AND b.acceptance_expires_at IS NOT NULL
        AND b.acceptance_expires_at < $1
      `, [now]);

      // Update expired acceptance bookings
      for (const booking of expiredAcceptances.rows) {
        await query(`
          UPDATE bookings
          SET status = 'EXPIRED',
              last_status_change = $1,
              updated_at = $2
          WHERE id = $3
        `, [now, now, booking.id]);

        // Notify stylist that client didn't confirm in time
        await this.smsService.sendSMS(
          booking.stylist_id,
          await this.getUserPhone(booking.stylist_id),
          `Booking for ${booking.service_name} has expired. The client didn't confirm payment within 10 minutes.`,
          'BOOKING_EXPIRED',
          booking.id
        );

        console.log(`Expired booking acceptance: ${booking.id}`);
        expiredCount++;
      }

      return {
        success: true,
        expiredBookings: expiredCount,
        processedAt: now
      };

    } catch (error) {
      console.error('Error processing expired bookings:', error);
      return {
        success: false,
        error: error.message,
        processedAt: new Date()
      };
    }
  }

  // Get user's phone number
  async getUserPhone(userId) {
    try {
      const result = await query('SELECT phone FROM users WHERE id = $1', [userId]);
      return result.rows.length > 0 ? result.rows[0].phone : null;
    } catch (error) {
      console.error('Error getting user phone:', error);
      return null;
    }
  }

  // Update booking status to IN_PROGRESS (when stylist marks as started)
  async startService(bookingId, stylistId) {
    try {
      const now = new Date();

      // Verify booking is confirmed and belongs to stylist
      const bookingResult = await query(`
        SELECT b.*, s.name as service_name
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        WHERE b.id = $1 AND b.stylist_id = $2 AND b.status = 'CONFIRMED'
      `, [bookingId, stylistId]);

      if (bookingResult.rows.length === 0) {
        return {
          success: false,
          error: 'Booking not found, unauthorized, or not confirmed'
        };
      }

      const booking = bookingResult.rows[0];

      // Update status to IN_PROGRESS
      await query(`
        UPDATE bookings
        SET status = 'IN_PROGRESS',
            last_status_change = $1,
            updated_at = $2
        WHERE id = $3
      `, [now, now, bookingId]);

      // Notify client that service has started
      const clientPhone = await this.getUserPhone(booking.client_id);
      if (clientPhone) {
        await this.smsService.sendSMS(
          booking.client_id,
          clientPhone,
          `Your ${booking.service_name} service has started! 💄✨`,
          'SERVICE_STARTED',
          bookingId
        );
      }

      console.log(`Service started for booking: ${bookingId}`);

      return {
        success: true,
        booking: {
          id: bookingId,
          status: 'IN_PROGRESS',
          startedAt: now
        }
      };

    } catch (error) {
      console.error('Error starting service:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Complete booking and trigger payment release
  async completeService(bookingId, stylistId) {
    try {
      const now = new Date();

      // Verify booking is in progress and belongs to stylist
      const bookingResult = await query(`
        SELECT b.*, s.name as service_name, s.price,
               p.id as payment_id, p.stylist_payout, p.platform_fee
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        LEFT JOIN payments p ON b.id = p.booking_id
        WHERE b.id = $1 AND b.stylist_id = $2 AND b.status = 'IN_PROGRESS'
      `, [bookingId, stylistId]);

      if (bookingResult.rows.length === 0) {
        return {
          success: false,
          error: 'Booking not found, unauthorized, or not in progress'
        };
      }

      const booking = bookingResult.rows[0];

      // Update booking status to COMPLETED
      await query(`
        UPDATE bookings
        SET status = 'COMPLETED',
            completed_at = $1,
            last_status_change = $2,
            updated_at = $3
        WHERE id = $4
      `, [now, now, now, bookingId]);

      // Create platform transaction records for fee processing
      if (booking.payment_id) {
        // Platform fee transaction
        await query(`
          INSERT INTO platform_transactions (
            booking_id, user_id, transaction_type, amount_cents, status, created_at
          )
          VALUES ($1, NULL, 'PLATFORM_FEE', $2, 'COMPLETED', $3)
        `, [bookingId, Math.round(booking.platform_fee * 100), now]);

        // Stylist payout transaction (to be processed at midnight)
        await query(`
          INSERT INTO platform_transactions (
            booking_id, user_id, transaction_type, amount_cents, status, created_at
          )
          VALUES ($1, $2, 'PAYOUT', $3, 'PENDING', $4)
        `, [bookingId, stylistId, Math.round(booking.stylist_payout * 100), now]);
      }

      // Notify both parties of completion
      const clientPhone = await this.getUserPhone(booking.client_id);
      const stylistPhone = await this.getUserPhone(booking.stylist_id);

      if (clientPhone) {
        await this.smsService.sendSMS(
          booking.client_id,
          clientPhone,
          `Your ${booking.service_name} service is complete! ✨ Thank you for using BeautyCita. You can leave a review in the app.`,
          'SERVICE_COMPLETED',
          bookingId
        );
      }

      if (stylistPhone) {
        await this.smsService.sendSMS(
          booking.stylist_id,
          stylistPhone,
          `Service completed! Your payout of $${booking.stylist_payout?.toFixed(2)} will be processed tonight. Great work! 💰`,
          'PAYOUT_NOTIFICATION',
          bookingId
        );
      }

      console.log(`Service completed for booking: ${bookingId}, payout: $${booking.stylist_payout?.toFixed(2)}`);

      return {
        success: true,
        booking: {
          id: bookingId,
          status: 'COMPLETED',
          completedAt: now,
          stylistPayout: booking.stylist_payout
        }
      };

    } catch (error) {
      console.error('Error completing service:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process automatic payouts (run at midnight)
  async processPendingPayouts() {
    try {
      const now = new Date();
      let payoutCount = 0;

      // Get all pending payouts
      const pendingPayouts = await query(`
        SELECT pt.*, u.first_name, u.phone
        FROM platform_transactions pt
        JOIN users u ON pt.user_id = u.id
        WHERE pt.transaction_type = 'PAYOUT'
        AND pt.status = 'PENDING'
        ORDER BY pt.created_at ASC
      `);

      for (const payout of pendingPayouts.rows) {
        try {
          // TODO: Process actual payout to stylist's Stripe account
          // For now, we'll mark as completed and notify

          await query(`
            UPDATE platform_transactions
            SET status = 'COMPLETED', processed_at = $1
            WHERE id = $2
          `, [now, payout.id]);

          // Notify stylist of payout
          if (payout.phone) {
            await this.smsService.sendSMS(
              payout.user_id,
              payout.phone,
              `💰 Payout processed! $${(payout.amount_cents / 100).toFixed(2)} has been sent to your account. Thank you for using BeautyCita!`,
              'PAYOUT_PROCESSED'
            );
          }

          console.log(`Payout processed: $${(payout.amount_cents / 100).toFixed(2)} to user ${payout.user_id}`);
          payoutCount++;

        } catch (payoutError) {
          console.error(`Error processing payout ${payout.id}:`, payoutError);

          await query(`
            UPDATE platform_transactions
            SET status = 'FAILED', processed_at = $1, notes = $2
            WHERE id = $3
          `, [now, payoutError.message, payout.id]);
        }
      }

      return {
        success: true,
        payoutsProcessed: payoutCount,
        processedAt: now
      };

    } catch (error) {
      console.error('Error processing payouts:', error);
      return {
        success: false,
        error: error.message,
        processedAt: new Date()
      };
    }
  }

  // Get booking statistics
  async getBookingStats(timeRange = '24h') {
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
          SUM(total_price) as total_value
        FROM bookings
        WHERE created_at >= $1
        GROUP BY status
        ORDER BY count DESC
      `, [timeCondition]);

      const expiredStats = await query(`
        SELECT
          COUNT(*) as expired_requests,
          COUNT(CASE WHEN status = 'EXPIRED' AND request_expires_at IS NOT NULL THEN 1 END) as expired_at_request,
          COUNT(CASE WHEN status = 'EXPIRED' AND acceptance_expires_at IS NOT NULL THEN 1 END) as expired_at_acceptance
        FROM bookings
        WHERE created_at >= $1 AND status = 'EXPIRED'
      `, [timeCondition]);

      return {
        success: true,
        timeRange,
        statusBreakdown: stats.rows,
        expirationBreakdown: expiredStats.rows[0],
        generatedAt: now
      };

    } catch (error) {
      console.error('Error getting booking stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Close database connections
  async close() {
    await this.smsService.close();
  }
}

module.exports = BookingService;