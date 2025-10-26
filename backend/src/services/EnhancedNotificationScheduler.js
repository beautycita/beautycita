// Enhanced NotificationScheduler - Handles SMS + Email notifications
const cron = require('node-cron')
const { query } = require('../db')
const SMSService = require('../smsService')
const ComprehensiveEmailService = require('../ComprehensiveEmailService')
const DistanceMatrixService = require('./distanceMatrixService')

class EnhancedNotificationScheduler {
  constructor() {
    this.smsService = new SMSService()
    this.emailService = new ComprehensiveEmailService()
    this.distanceMatrixService = new DistanceMatrixService()
    this.isRunning = false
    this.scheduledJobs = new Map()
  }

  // Start the notification scheduler
  start() {
    if (this.isRunning) {
      console.log('📅 EnhancedNotificationScheduler already running')
      return
    }

    console.log('📅 Starting EnhancedNotificationScheduler...')
    this.isRunning = true

    // Schedule notification checks every 5 minutes
    this.scheduledJobs.set('notification-check', cron.schedule('*/5 * * * *', () => {
      this.processScheduledNotifications()
    }, { scheduled: true }))

    // Schedule morning summary (runs at 7 AM local time)
    this.scheduledJobs.set('morning-summary', cron.schedule('0 7 * * *', () => {
      this.sendMorningSummaries()
    }, { scheduled: true }))

    // Schedule proximity checks (every 2 minutes during booking windows)
    this.scheduledJobs.set('proximity-check', cron.schedule('*/2 * * * *', () => {
      this.checkClientProximity()
    }, { scheduled: true }))

    // Schedule review requests (runs daily at 10 AM)
    this.scheduledJobs.set('review-requests', cron.schedule('0 10 * * *', () => {
      this.sendReviewRequests()
    }, { scheduled: true }))

    console.log('✅ EnhancedNotificationScheduler started with 4 jobs')
  }

  // Stop the scheduler
  stop() {
    if (!this.isRunning) return

    console.log('📅 Stopping EnhancedNotificationScheduler...')

    for (const [name, job] of this.scheduledJobs) {
      job.destroy()
      console.log(`🛑 Stopped job: ${name}`)
    }

    this.scheduledJobs.clear()
    this.isRunning = false
    console.log('✅ EnhancedNotificationScheduler stopped')
  }

  // Process scheduled notifications (day before, day of, 3 hours before)
  async processScheduledNotifications() {
    try {
      const now = new Date()
      console.log(`📅 Processing scheduled notifications at ${now.toISOString()}`)

      // Get upcoming bookings that need notifications
      const upcomingBookings = await query(`
        SELECT
          b.id, b.client_id, b.stylist_id, b.booking_date, b.booking_time,
          s.name as service_name, s.duration_minutes,
          u.email as client_email, u.phone, u.first_name as client_name, u.timezone,
          st.business_name as stylist_business,
          su.first_name as stylist_first_name, su.last_name as stylist_last_name,
          su.email as stylist_email, su.phone as stylist_phone
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        JOIN users u ON b.client_id = u.id
        JOIN stylists st ON b.stylist_id = st.id
        JOIN users su ON st.user_id = su.id
        WHERE b.status = 'CONFIRMED'
        AND b.booking_date >= CURRENT_DATE
        AND b.booking_date <= CURRENT_DATE + INTERVAL '2 days'
      `)

      for (const booking of upcomingBookings.rows) {
        await this.scheduleBookingNotifications(booking)
      }

    } catch (error) {
      console.error('❌ Error processing scheduled notifications:', error)
    }
  }

  // Schedule notifications for a specific booking
  async scheduleBookingNotifications(booking) {
    const appointmentDateTime = new Date(`${booking.booking_date} ${booking.booking_time}`)
    const now = new Date()
    const userTimezone = booking.timezone || 'America/Mexico_City'

    // Convert times to user's timezone
    const appointmentLocal = new Date(appointmentDateTime.toLocaleString("en-US", {timeZone: userTimezone}))
    const nowLocal = new Date(now.toLocaleString("en-US", {timeZone: userTimezone}))

    // Calculate notification times
    const dayBefore = new Date(appointmentLocal)
    dayBefore.setDate(dayBefore.getDate() - 1)
    dayBefore.setHours(18, 0, 0, 0) // 6 PM day before

    const dayOf7AM = new Date(appointmentLocal)
    dayOf7AM.setHours(7, 0, 0, 0) // 7 AM day of

    const threeHoursBefore = new Date(appointmentLocal)
    threeHoursBefore.setHours(appointmentLocal.getHours() - 3)

    // Ensure no notifications before 7 AM
    if (threeHoursBefore.getHours() < 7) {
      threeHoursBefore.setHours(7, 0, 0, 0)
    }

    // Check if we need to send day before notification
    if (nowLocal >= dayBefore && nowLocal < dayOf7AM) {
      await this.sendDayBeforeNotification(booking)
    }

    // Check if we need to send day of notification
    if (nowLocal >= dayOf7AM && nowLocal < threeHoursBefore) {
      await this.sendDayOfNotification(booking)
    }

    // Check if we need to send 3 hours before notification
    if (nowLocal >= threeHoursBefore && nowLocal < appointmentLocal) {
      await this.sendThreeHoursBeforeNotification(booking)
    }
  }

  // Send day before notification (SMS + Email)
  async sendDayBeforeNotification(booking) {
    try {
      // Check if already sent
      const existing = await query(`
        SELECT id FROM notifications
        WHERE booking_id = $1 AND type = 'DAY_BEFORE'
      `, [booking.id])

      if (existing.rows.length > 0) return

      // Send SMS
      const smsMessage = `¡Hola ${booking.client_name}! 👋 Recordatorio: Tienes una cita mañana para ${booking.service_name} con ${booking.stylist_first_name} a las ${booking.booking_time}. ¡Nos vemos pronto! - BeautyCita`

      await this.smsService.sendSMS(
        booking.client_id,
        booking.phone_number,
        smsMessage,
        'DAY_BEFORE_BOOKING',
        booking.id
      )

      // Send Email
      await this.emailService.sendBookingReminderEmail(booking, 'day_before')

      // Record notification
      await query(`
        INSERT INTO notifications (user_id, booking_id, type, message, sent_at, channels)
        VALUES ($1, $2, 'DAY_BEFORE', $3, NOW(), $4)
      `, [booking.client_id, booking.id, smsMessage, JSON.stringify(['SMS', 'EMAIL'])])

      console.log(`📱📧 Sent day-before notification (SMS + Email) for booking ${booking.id}`)

    } catch (error) {
      console.error(`❌ Error sending day-before notification for booking ${booking.id}:`, error)
    }
  }

  // Send day of notification (SMS + Email)
  async sendDayOfNotification(booking) {
    try {
      // Check if already sent
      const existing = await query(`
        SELECT id FROM notifications
        WHERE booking_id = $1 AND type = 'DAY_OF'
      `, [booking.id])

      if (existing.rows.length > 0) return

      // Send SMS to client
      const clientSMS = `¡Buenos días ${booking.client_name}! ☀️ Tu cita con ${booking.stylist_first_name} para ${booking.service_name} es hoy a las ${booking.booking_time}. Duración: ${booking.duration_minutes} min. ¡Prepárate para verte increíble! - BeautyCita`

      await this.smsService.sendSMS(
        booking.client_id,
        booking.phone_number,
        clientSMS,
        'DAY_OF_BOOKING',
        booking.id
      )

      // Send Email to client
      await this.emailService.sendBookingReminderEmail(booking, 'day_of')

      // Send SMS to stylist
      const stylistSMS = `Buenos días! Recordatorio: Tienes una cita hoy con ${booking.client_name} a las ${booking.booking_time} para ${booking.service_name}. - BeautyCita`

      await this.smsService.sendSMS(
        booking.stylist_id,
        booking.stylist_phone,
        stylistSMS,
        'STYLIST_DAY_OF',
        booking.id
      )

      // Record notifications
      await query(`
        INSERT INTO notifications (user_id, booking_id, type, message, sent_at, channels)
        VALUES ($1, $2, 'DAY_OF', $3, NOW(), $4)
      `, [booking.client_id, booking.id, clientSMS, JSON.stringify(['SMS', 'EMAIL'])])

      console.log(`📱📧 Sent day-of notifications (SMS + Email) for booking ${booking.id}`)

    } catch (error) {
      console.error(`❌ Error sending day-of notification for booking ${booking.id}:`, error)
    }
  }

  // Send 3 hours before notification (SMS + Email)
  async sendThreeHoursBeforeNotification(booking) {
    try {
      // Check if already sent
      const existing = await query(`
        SELECT id FROM notifications
        WHERE booking_id = $1 AND type = 'THREE_HOURS_BEFORE'
      `, [booking.id])

      if (existing.rows.length > 0) return

      // Send SMS
      const smsMessage = `¡Hola ${booking.client_name}! ⏰ Tu cita con ${booking.stylist_first_name} es en 3 horas (${booking.booking_time}). Comenzaremos a rastrear tu ubicación para notificar a tu estilista cuando estés cerca. - BeautyCita`

      await this.smsService.sendSMS(
        booking.client_id,
        booking.phone_number,
        smsMessage,
        'THREE_HOURS_BEFORE',
        booking.id
      )

      // Send Email
      await this.emailService.sendBookingReminderEmail(booking, 'hours_before')

      // Start location tracking for this booking
      await this.startLocationTracking(booking.id, booking.client_id)

      // Record notification
      await query(`
        INSERT INTO notifications (user_id, booking_id, type, message, sent_at, channels)
        VALUES ($1, $2, 'THREE_HOURS_BEFORE', $3, NOW(), $4)
      `, [booking.client_id, booking.id, smsMessage, JSON.stringify(['SMS', 'EMAIL'])])

      console.log(`📱📧 Sent 3-hours-before notification (SMS + Email) for booking ${booking.id}`)

    } catch (error) {
      console.error(`❌ Error sending 3-hours-before notification for booking ${booking.id}:`, error)
    }
  }

  // Start location tracking for a booking
  async startLocationTracking(bookingId, userId) {
    try {
      await query(`
        INSERT INTO booking_location_tracking (booking_id, client_id, journey_started_at, is_en_route)
        VALUES ($1, $2, NOW(), false)
        ON CONFLICT (booking_id)
        DO UPDATE SET
          is_en_route = false,
          journey_started_at = NOW(),
          last_updated = NOW()
      `, [bookingId, userId])

      console.log(`📍 Started location tracking for booking ${bookingId}`)

    } catch (error) {
      console.error(`❌ Error starting location tracking for booking ${bookingId}:`, error)
    }
  }

  // Send morning summaries to stylists (SMS + Email)
  async sendMorningSummaries() {
    try {
      console.log('🌅 Sending morning summaries to stylists...')

      // Get stylists with bookings today
      const stylistsWithBookings = await query(`
        SELECT
          s.id as stylist_id, s.business_name,
          u.first_name, u.last_name, u.email, u.phone, u.timezone,
          COUNT(b.id) as booking_count,
          STRING_AGG(
            b.booking_time || ' - ' || cl.first_name || ' (' || srv.name || ')',
            ', ' ORDER BY b.booking_time
          ) as bookings_summary
        FROM stylists s
        JOIN users u ON s.user_id = u.id
        JOIN bookings b ON s.id = b.stylist_id
        JOIN users cl ON b.client_id = cl.id
        JOIN services srv ON b.service_id = srv.id
        WHERE b.booking_date = CURRENT_DATE
        AND b.status = 'CONFIRMED'
        GROUP BY s.id, s.business_name, u.first_name, u.last_name, u.email, u.phone, u.timezone
        HAVING COUNT(b.id) > 0
      `)

      for (const stylist of stylistsWithBookings.rows) {
        // Send SMS
        const smsMessage = `¡Buenos días ${stylist.first_name}! 🌟 Hoy tienes ${stylist.booking_count} cita${stylist.booking_count > 1 ? 's' : ''}: ${stylist.bookings_summary}. ¡Que tengas un día increíble! - BeautyCita`

        await this.smsService.sendSMS(
          stylist.stylist_id,
          stylist.phone_number,
          smsMessage,
          'MORNING_SUMMARY',
          null
        )

        console.log(`🌅 Sent morning summary to stylist ${stylist.stylist_id}`)
      }

    } catch (error) {
      console.error('❌ Error sending morning summaries:', error)
    }
  }

  // Check client proximity and notify stylists
  async checkClientProximity() {
    try {
      // Get active location tracking sessions
      const activeTracking = await query(`
        SELECT
          blt.booking_id, blt.client_id, blt.client_latitude, blt.client_longitude,
          b.stylist_id, b.booking_time,
          u.first_name as client_name,
          su.phone as stylist_phone, su.email as stylist_email,
          s.location_coordinates[0] as stylist_lat, s.location_coordinates[1] as stylist_lng
        FROM booking_location_tracking blt
        JOIN bookings b ON blt.booking_id = b.id
        JOIN users u ON blt.client_id = u.id
        JOIN stylists s ON b.stylist_id = s.id
        JOIN users su ON s.user_id = su.id
        WHERE blt.is_en_route = true
        AND b.booking_date = CURRENT_DATE
        AND b.status = 'CONFIRMED'
        AND blt.client_latitude IS NOT NULL
        AND blt.client_longitude IS NOT NULL
        AND s.location_coordinates IS NOT NULL
        AND blt.last_updated > NOW() - INTERVAL '10 minutes'
      `)

      for (const tracking of activeTracking.rows) {
        await this.processProximityCheck(tracking)
      }

    } catch (error) {
      console.error('❌ Error checking client proximity:', error)
    }
  }

  // Process individual proximity check
  async processProximityCheck(tracking) {
    try {
      // Calculate ETA using Google Distance Matrix
      const eta = await this.distanceMatrixService.calculateETA(
        { lat: parseFloat(tracking.client_latitude), lng: parseFloat(tracking.client_longitude) },
        { lat: parseFloat(tracking.stylist_lat), lng: parseFloat(tracking.stylist_lng) }
      )

      if (!eta) return

      // Check if client is within 10 minutes
      if (eta.duration_minutes <= 10 && eta.duration_minutes > 0) {
        // Check if we already sent 10-minute notification
        const trackingData = await query(`
          SELECT five_minute_alert_sent
          FROM booking_location_tracking
          WHERE booking_id = $1
        `, [tracking.booking_id])

        if (trackingData.rows.length > 0 && !trackingData.rows[0].five_minute_alert_sent) {
          const message = `🚗 ${tracking.client_name} está llegando! ETA: ${eta.duration_minutes} minutos (${eta.distance_text}). Prepárate para su cita. - BeautyCita`

          await this.smsService.sendSMS(
            tracking.stylist_id,
            tracking.stylist_phone,
            message,
            'CLIENT_APPROACHING',
            tracking.booking_id
          )

          // Record notification
          await query(`
            INSERT INTO notifications (user_id, booking_id, type, message, sent_at, metadata)
            VALUES ($1, $2, 'TEN_MINUTES_AWAY', $3, NOW(), $4)
          `, [tracking.stylist_id, tracking.booking_id, message, JSON.stringify(eta)])

          // Mark alert as sent
          await query(`
            UPDATE booking_location_tracking
            SET five_minute_alert_sent = true, last_updated = NOW()
            WHERE booking_id = $1
          `, [tracking.booking_id])

          console.log(`🚗 Sent proximity notification for booking ${tracking.booking_id}: ${eta.duration_minutes} minutes away`)
        }
      }

      // Update tracking with ETA info
      const estimatedArrival = new Date(Date.now() + (eta.duration_minutes * 60 * 1000))
      await query(`
        UPDATE booking_location_tracking
        SET estimated_arrival = $1,
            distance_remaining = $2,
            last_updated = NOW()
        WHERE booking_id = $3
      `, [estimatedArrival, Math.round(eta.distance_meters), tracking.booking_id])

    } catch (error) {
      console.error(`❌ Error processing proximity check for booking ${tracking.booking_id}:`, error)
    }
  }

  // Send review requests (24 hours after booking completion)
  async sendReviewRequests() {
    try {
      console.log('⭐ Sending review requests...')

      // Get completed bookings from yesterday that don't have reviews
      const bookingsForReview = await query(`
        SELECT
          b.id as booking_id, b.stylist_id,
          u.email as client_email, u.first_name as client_name,
          s.name as service_name,
          st.business_name as stylist_business,
          su.first_name as stylist_first_name
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        JOIN users u ON b.client_id = u.id
        JOIN stylists st ON b.stylist_id = st.id
        JOIN users su ON st.user_id = su.id
        LEFT JOIN reviews r ON b.id = r.booking_id
        WHERE b.status = 'COMPLETED'
        AND b.booking_date = CURRENT_DATE - INTERVAL '1 day'
        AND r.id IS NULL
      `)

      for (const booking of bookingsForReview.rows) {
        await this.emailService.sendReviewRequestEmail({
          client_email: booking.client_email,
          client_name: booking.client_name,
          stylist_name: booking.stylist_first_name,
          service_name: booking.service_name,
          booking_id: booking.booking_id,
          stylist_id: booking.stylist_id
        })

        console.log(`⭐ Sent review request for booking ${booking.booking_id}`)
      }

    } catch (error) {
      console.error('❌ Error sending review requests:', error)
    }
  }

  // Send new booking alert to stylist
  async sendNewBookingAlert(booking) {
    try {
      await this.emailService.sendStylistNewBookingAlert(booking)
      console.log(`🎉 Sent new booking alert to stylist for booking ${booking.booking_id}`)
    } catch (error) {
      console.error(`❌ Error sending new booking alert:`, error)
    }
  }

  // Send booking confirmation to client
  async sendBookingConfirmation(booking) {
    try {
      await this.emailService.sendBookingConfirmationEmail(booking)
      console.log(`✅ Sent booking confirmation to client for booking ${booking.booking_id}`)
    } catch (error) {
      console.error(`❌ Error sending booking confirmation:`, error)
    }
  }

  // Get notification statistics
  async getStats() {
    const stats = await query(`
      SELECT
        type,
        COUNT(*) as total,
        COUNT(CASE WHEN sent_at > NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h,
        MAX(sent_at) as last_sent,
        channels
      FROM notifications
      WHERE sent_at > NOW() - INTERVAL '7 days'
      GROUP BY type, channels
      ORDER BY total DESC
    `)

    return {
      isRunning: this.isRunning,
      activeJobs: Array.from(this.scheduledJobs.keys()),
      notificationStats: stats.rows
    }
  }
}

module.exports = EnhancedNotificationScheduler
