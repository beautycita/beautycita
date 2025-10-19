const { query } = require('./db');
const SMSService = require('./smsService');
const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: '/var/www/beautycita.com/backend/logs/reminders.log' }),
    new winston.transports.Console()
  ]
});

class AppointmentReminderService {
  constructor() {
    this.smsService = new SMSService();
    this.isRunning = false;
  }

  /**
   * Schedule reminders for upcoming bookings
   * Creates scheduled SMS for 24 hours and 1 hour before appointments
   */
  async scheduleUpcomingReminders() {
    try {
      logger.info('Starting reminder scheduler...');

      // Find confirmed bookings in the next 48 hours that don't have reminders scheduled yet
      const upcomingBookingsQuery = `
        SELECT
          b.id as booking_id,
          b.booking_date,
          b.booking_time,
          b.client_id,
          b.stylist_id,
          u_client.phone as client_phone,
          u_client.first_name as client_name,
          u_stylist.first_name || ' ' || COALESCE(u_stylist.last_name, '') as stylist_name,
          st.business_name,
          srv.name as service_name,
          srv.duration_minutes
        FROM bookings b
        JOIN users u_client ON b.client_id = u_client.id
        JOIN services srv ON b.service_id = srv.id
        JOIN stylists st ON b.stylist_id = st.id
        JOIN users u_stylist ON st.user_id = u_stylist.id
        WHERE b.status = 'CONFIRMED'
          AND b.booking_date >= CURRENT_DATE
          AND b.booking_date <= CURRENT_DATE + INTERVAL '48 hours'
          AND u_client.phone IS NOT NULL
          AND u_client.phone_verified = true
          AND NOT EXISTS (
            SELECT 1 FROM scheduled_sms ss
            WHERE ss.booking_id = b.id
              AND ss.message_type = 'REMINDER'
              AND ss.status IN ('PENDING', 'SENT')
          )
        ORDER BY b.booking_date, b.booking_time
      `;

      const bookingsResult = await query(upcomingBookingsQuery);
      logger.info(`Found ${bookingsResult.rows.length} bookings needing reminders`);

      let scheduledCount = 0;

      for (const booking of bookingsResult.rows) {
        try {
          // Parse date and time properly
          const bookingDate = new Date(booking.booking_date);
          const [hours, minutes, seconds] = booking.booking_time.split(':');

          const appointmentDateTime = new Date(bookingDate);
          appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || 0), 0);

          const now = new Date();

          logger.info(`Processing booking ${booking.booking_id}: appointment=${appointmentDateTime.toISOString()}, now=${now.toISOString()}`);

          // Schedule 24-hour reminder
          const twentyFourHoursBefore = new Date(appointmentDateTime);
          twentyFourHoursBefore.setHours(twentyFourHoursBefore.getHours() - 24);

          logger.info(`24h reminder would be at ${twentyFourHoursBefore.toISOString()}, condition: ${twentyFourHoursBefore > now}`);

          if (twentyFourHoursBefore > now) {
            const message24h = this.create24HourReminderMessage(booking);
            await this.smsService.scheduleReminder(
              booking.client_id,
              booking.booking_id,
              message24h,
              twentyFourHoursBefore
            );
            logger.info(`Scheduled 24h reminder for booking ${booking.booking_id}`);
            scheduledCount++;
          }

          // Schedule 1-hour reminder
          const oneHourBefore = new Date(appointmentDateTime);
          oneHourBefore.setHours(oneHourBefore.getHours() - 1);

          if (oneHourBefore > now) {
            const message1h = this.create1HourReminderMessage(booking);
            await this.smsService.scheduleReminder(
              booking.client_id,
              booking.booking_id,
              message1h,
              oneHourBefore
            );
            logger.info(`Scheduled 1h reminder for booking ${booking.booking_id}`);
            scheduledCount++;
          }
        } catch (error) {
          logger.error(`Error scheduling reminders for booking ${booking.booking_id}:`, error);
        }
      }

      logger.info(`Reminder scheduling complete. Scheduled ${scheduledCount} reminders for ${bookingsResult.rows.length} bookings.`);
      return { success: true, bookingsProcessed: bookingsResult.rows.length, remindersScheduled: scheduledCount };

    } catch (error) {
      logger.error('Error in reminder scheduler:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process and send pending scheduled reminders
   */
  async sendPendingReminders() {
    try {
      logger.info('Processing pending reminders...');
      const result = await this.smsService.processPendingScheduledSMS();
      logger.info(`Processed ${result.processed} pending reminders`);
      return result;
    } catch (error) {
      logger.error('Error processing pending reminders:', error);
      return { processed: 0, error: error.message };
    }
  }

  /**
   * Create 24-hour reminder message
   */
  create24HourReminderMessage(booking) {
    const stylistName = booking.business_name || booking.stylist_name;
    const appointmentDate = new Date(booking.booking_date).toLocaleDateString('es-MX', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
    const appointmentTime = booking.booking_time.substring(0, 5); // HH:MM format

    return `✨ BeautyCita Recordatorio: Mañana tienes cita con ${stylistName} para ${booking.service_name} a las ${appointmentTime}. ¡Te esperamos! 💅

📍 Fecha: ${appointmentDate}
⏰ Hora: ${appointmentTime}

Si necesitas cancelar, hazlo con al menos 12h de anticipación: https://beautycita.com/bookings`;
  }

  /**
   * Create 1-hour reminder message
   */
  create1HourReminderMessage(booking) {
    const stylistName = booking.business_name || booking.stylist_name;
    const appointmentTime = booking.booking_time.substring(0, 5); // HH:MM format

    return `⏰ BeautyCita: Tu cita con ${stylistName} es en 1 hora (${appointmentTime}). ¡Prepárate para verte increíble! 💖✨

Servicio: ${booking.service_name}

¿Tienes alguna pregunta? Contáctanos: https://beautycita.com/help`;
  }

  /**
   * Start the reminder service (runs every 5 minutes)
   */
  start() {
    if (this.isRunning) {
      logger.warn('Reminder service is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting appointment reminder service...');

    // Run immediately
    this.runCycle();

    // Then run every 5 minutes
    this.intervalId = setInterval(() => {
      this.runCycle();
    }, 5 * 60 * 1000); // 5 minutes

    logger.info('Appointment reminder service started successfully');
  }

  /**
   * Run a complete cycle: schedule new reminders and send pending ones
   */
  async runCycle() {
    try {
      logger.info('=== Reminder Service Cycle Started ===');

      // First, schedule new reminders
      await this.scheduleUpcomingReminders();

      // Then, send pending reminders
      await this.sendPendingReminders();

      logger.info('=== Reminder Service Cycle Completed ===');
    } catch (error) {
      logger.error('Error in reminder service cycle:', error);
    }
  }

  /**
   * Stop the reminder service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('Appointment reminder service stopped');
  }

  /**
   * Cancel all pending reminders for a booking
   */
  async cancelRemindersForBooking(bookingId) {
    try {
      await query(`
        UPDATE scheduled_sms
        SET cancelled_at = CURRENT_TIMESTAMP, status = 'CANCELLED'
        WHERE booking_id = $1
          AND status = 'PENDING'
          AND message_type = 'REMINDER'
      `, [bookingId]);

      logger.info(`Cancelled all pending reminders for booking ${bookingId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error cancelling reminders for booking ${bookingId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get reminder statistics
   */
  async getReminderStats(startDate, endDate) {
    try {
      const statsQuery = `
        SELECT
          DATE(sent_at) as date,
          COUNT(*) as total_sent,
          COUNT(CASE WHEN status = 'SENT' THEN 1 END) as successful,
          COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed
        FROM scheduled_sms
        WHERE message_type = 'REMINDER'
          AND sent_at BETWEEN $1 AND $2
        GROUP BY DATE(sent_at)
        ORDER BY date DESC
      `;

      const result = await query(statsQuery, [startDate, endDate]);

      return {
        success: true,
        stats: result.rows
      };
    } catch (error) {
      logger.error('Error getting reminder stats:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const reminderService = new AppointmentReminderService();

module.exports = reminderService;