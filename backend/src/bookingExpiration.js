const { query } = require('./db');
const { distributeBookingPayment } = require('./creditRoutes');
const SMSService = require('./smsService');

const smsService = new SMSService();

class BookingExpirationService {
  constructor() {
    this.isRunning = false;
    this.interval = null;
  }

  // Start the periodic check (runs every minute)
  start(intervalMinutes = 1) {
    if (this.isRunning) {
      console.log('Booking expiration service is already running');
      return;
    }

    this.isRunning = true;
    console.log(`Starting booking expiration service (checking every ${intervalMinutes} minute(s))`);

    this.interval = setInterval(async () => {
      try {
        await this.processExpiredBookings();
      } catch (error) {
        console.error('Error in booking expiration check:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }

  // Stop the periodic check
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('Booking expiration service stopped');
  }

  // Main function to process all expired bookings
  async processExpiredBookings() {
    try {
      const now = new Date();
      console.log(`[${now.toISOString()}] Checking for expired bookings...`);

      // Find expired stylist responses (5 minutes from request)
      await this.processExpiredStylistResponses(now);

      // Find expired client confirmations (15 minutes total from original request)
      await this.processExpiredClientConfirmations(now);

      console.log(`[${now.toISOString()}] Booking expiration check completed`);
    } catch (error) {
      console.error('Error processing expired bookings:', error);
    }
  }

  // Process bookings where stylist hasn't responded within 5 minutes
  async processExpiredStylistResponses(now) {
    try {
      // Find bookings in PENDING_STYLIST_APPROVAL that have expired
      const expiredBookings = await query(`
        SELECT b.id, b.client_id, b.stylist_id, b.total_price, b.booking_date, b.booking_time,
               s.name as service_name,
               u_client.id as client_user_id, u_client.phone as client_phone,
               u_stylist.id as stylist_user_id
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        JOIN users u_client ON b.client_id = u_client.id
        JOIN stylists st ON b.stylist_id = st.id
        JOIN users u_stylist ON st.user_id = u_stylist.id
        WHERE b.status = 'PENDING_STYLIST_APPROVAL'
          AND b.request_expires_at <= $1
        ORDER BY b.request_expires_at ASC
        LIMIT 50
      `, [now]);

      if (expiredBookings.rows.length === 0) {
        return;
      }

      console.log(`Processing ${expiredBookings.rows.length} bookings with expired stylist responses`);

      for (const booking of expiredBookings.rows) {
        try {
          // Update booking status
          await query(`
            UPDATE bookings
            SET status = 'STYLIST_NO_RESPONSE', updated_at = $1
            WHERE id = $2
          `, [now, booking.id]);

          // Process refund to client (97%)
          await distributeBookingPayment(booking.id, booking.total_price, 'STYLIST_NO_RESPONSE');

          // Send SMS notification to client
          const serviceDetails = {
            service_name: booking.service_name,
            appointment_date: booking.appointment_date,
            appointment_time: booking.appointment_time
          };

          await smsService.sendBookingExpiredNotification(
            booking.client_user_id,
            booking.id,
            'STYLIST_NO_RESPONSE',
            serviceDetails
          );

          console.log(`Expired booking ${booking.id} - stylist no response, client refunded 97%`);

        } catch (error) {
          console.error(`Error processing expired booking ${booking.id}:`, error);
        }
      }

    } catch (error) {
      console.error('Error processing expired stylist responses:', error);
    }
  }

  // Process bookings where client hasn't confirmed within 15 minutes total
  async processExpiredClientConfirmations(now) {
    try {
      // Find bookings in STYLIST_ACCEPTED that have expired (15 minutes total from original request)
      const expiredBookings = await query(`
        SELECT b.id, b.client_id, b.stylist_id, b.total_price, b.booking_date, b.booking_time,
               s.name as service_name,
               u_client.id as client_user_id, u_client.phone as client_phone,
               u_stylist.id as stylist_user_id
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        JOIN users u_client ON b.client_id = u_client.id
        JOIN stylists st ON b.stylist_id = st.id
        JOIN users u_stylist ON st.user_id = u_stylist.id
        WHERE b.status = 'STYLIST_ACCEPTED'
          AND b.acceptance_expires_at <= $1
        ORDER BY b.acceptance_expires_at ASC
        LIMIT 50
      `, [now]);

      if (expiredBookings.rows.length === 0) {
        return;
      }

      console.log(`Processing ${expiredBookings.rows.length} bookings with expired client confirmations`);

      for (const booking of expiredBookings.rows) {
        try {
          // Update booking status
          await query(`
            UPDATE bookings
            SET status = 'CLIENT_NO_CONFIRM', updated_at = $1
            WHERE id = $2
          `, [now, booking.id]);

          // Process payment distribution
          // Since stylist accepted but client didn't confirm, we'll process as CLIENT_NO_CONFIRM
          await distributeBookingPayment(booking.id, booking.total_price, 'CLIENT_NO_CONFIRM');

          // Send SMS notification to client
          const serviceDetails = {
            service_name: booking.service_name,
            appointment_date: booking.booking_date,
            appointment_time: booking.booking_time
          };

          await smsService.sendBookingExpiredNotification(
            booking.client_user_id,
            booking.id,
            'CLIENT_NO_CONFIRM',
            serviceDetails
          );

          console.log(`Expired booking ${booking.id} - client no confirmation, client refunded with partial penalty`);

        } catch (error) {
          console.error(`Error processing expired client confirmation ${booking.id}:`, error);
        }
      }

    } catch (error) {
      console.error('Error processing expired client confirmations:', error);
    }
  }

  // Manual function to process specific booking expiration
  async expireBooking(bookingId, expirationType) {
    try {
      const now = new Date();

      // Get booking details
      const bookingResult = await query(`
        SELECT b.*, s.name as service_name,
               u_client.id as client_user_id,
               u_stylist.id as stylist_user_id
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        JOIN users u_client ON b.client_id = u_client.id
        JOIN stylists st ON b.stylist_id = st.id
        JOIN users u_stylist ON st.user_id = u_stylist.id
        WHERE b.id = $1
      `, [bookingId]);

      if (bookingResult.rows.length === 0) {
        throw new Error('Booking not found');
      }

      const booking = bookingResult.rows[0];
      let newStatus, distributionType;

      switch (expirationType) {
        case 'STYLIST_NO_RESPONSE':
          newStatus = 'STYLIST_NO_RESPONSE';
          distributionType = 'STYLIST_NO_RESPONSE';
          break;
        case 'CLIENT_NO_CONFIRM':
          newStatus = 'CLIENT_NO_CONFIRM';
          distributionType = 'CLIENT_NO_CONFIRM';
          break;
        default:
          throw new Error(`Unknown expiration type: ${expirationType}`);
      }

      // Update booking status
      await query(`
        UPDATE bookings
        SET status = $1, updated_at = $2
        WHERE id = $3
      `, [newStatus, now, bookingId]);

      // Process payment distribution
      await distributeBookingPayment(bookingId, booking.total_price, distributionType);

      // Send SMS notification
      const serviceDetails = {
        service_name: booking.service_name,
        appointment_date: booking.booking_date,
        appointment_time: booking.booking_time
      };

      await smsService.sendBookingExpiredNotification(
        booking.client_user_id,
        bookingId,
        expirationType,
        serviceDetails
      );

      console.log(`Manually expired booking ${bookingId} with type ${expirationType}`);

      return { success: true, newStatus, booking };

    } catch (error) {
      console.error('Error manually expiring booking:', error);
      return { success: false, error: error.message };
    }
  }

  // Get statistics about expiration processing
  async getExpirationStats(startDate, endDate) {
    try {
      const stats = await query(`
        SELECT
          status,
          COUNT(*) as count,
          AVG(total_price) as avg_amount,
          SUM(total_price) as total_amount
        FROM bookings
        WHERE status IN ('STYLIST_NO_RESPONSE', 'CLIENT_NO_CONFIRM')
          AND updated_at BETWEEN $1 AND $2
        GROUP BY status
        ORDER BY status
      `, [startDate, endDate]);

      return { success: true, stats: stats.rows };

    } catch (error) {
      console.error('Error getting expiration stats:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const expirationService = new BookingExpirationService();

module.exports = expirationService;