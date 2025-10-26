/**
 * Redis Bull Message Queue Service
 * Replaces cron jobs with scalable, reliable background job processing
 *
 * Features:
 * - Job retry with exponential backoff
 * - Job prioritization
 * - Scheduled/delayed jobs
 * - Job progress tracking
 * - Failed job handling
 * - Distributed processing
 */

const Queue = require('bull');
const db = require('./db');
const cacheService = require('./cacheService');
const emailService = require('./emailService');

// ============================================
// Queue Configuration
// ============================================

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
  enableReadyCheck: false
};

// ============================================
// Define Queues
// ============================================

const queues = {
  // Email notifications queue
  emailQueue: new Queue('email-notifications', {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: 100, // Keep last 100 completed jobs
      removeOnFail: 200 // Keep last 200 failed jobs
    }
  }),

  // Booking reminder queue
  reminderQueue: new Queue('booking-reminders', {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    }
  }),

  // Payment processing queue
  paymentQueue: new Queue('payments', {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 3000
      },
      timeout: 30000 // 30 seconds timeout
    }
  }),

  // Booking expiration queue
  expirationQueue: new Queue('booking-expiration', {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 10000
      }
    }
  }),

  // Analytics calculation queue
  analyticsQueue: new Queue('analytics', {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 2,
      priority: 5 // Lower priority
    }
  }),

  // Google Calendar sync queue
  calendarSyncQueue: new Queue('calendar-sync', {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    }
  }),

  // Cache warming queue
  cacheWarmingQueue: new Queue('cache-warming', {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 1,
      priority: 10 // Lowest priority
    }
  })
};

// ============================================
// Email Queue Processor
// ============================================

queues.emailQueue.process(async (job) => {
  const { type, to, subject, data } = job.data;

  console.log(`📧 Processing email job: ${job.id} - Type: ${type}`);

  try {
    switch (type) {
      case 'BOOKING_CONFIRMATION':
        await emailService.sendBookingConfirmation(to, data);
        break;

      case 'BOOKING_REMINDER':
        await emailService.sendBookingReminder(to, data);
        break;

      case 'BOOKING_CANCELLED':
        await emailService.sendCancellationNotification(to, data);
        break;

      case 'REVIEW_REQUEST':
        await emailService.sendReviewRequest(to, data);
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    return { success: true, emailType: type };
  } catch (error) {
    console.error(`Email job ${job.id} failed:`, error);
    throw error;
  }
});

// ============================================
// Booking Reminder Queue Processor
// ============================================

queues.reminderQueue.process(async (job) => {
  const { bookingId, reminderType } = job.data;

  console.log(`⏰ Processing reminder: ${job.id} - Booking: ${bookingId}`);

  try {
    // Get booking details
    const bookingResult = await db.query(`
      SELECT
        b.*,
        u.email as client_email,
        u.name as client_name,
        s.business_name as stylist_name,
        srv.name as service_name
      FROM bookings b
      JOIN users u ON b.client_id = u.id
      JOIN stylists s ON b.stylist_id = s.id
      JOIN services srv ON b.service_id = srv.id
      WHERE b.id = $1
    `, [bookingId]);

    const booking = bookingResult.rows[0];

    if (!booking) {
      console.log(`Booking ${bookingId} not found, skipping reminder`);
      return { success: false, reason: 'Booking not found' };
    }

    // Don't send reminders for cancelled bookings
    if (booking.status === 'CANCELLED' || booking.status === 'NO_SHOW') {
      return { success: false, reason: 'Booking cancelled' };
    }

    // Send reminder email
    await queues.emailQueue.add({
      type: 'BOOKING_REMINDER',
      to: booking.client_email,
      subject: `Reminder: Upcoming appointment`,
      data: {
        clientName: booking.client_name,
        stylistName: booking.stylist_name,
        serviceName: booking.service_name,
        bookingDate: booking.booking_date,
        bookingTime: booking.booking_time
      }
    });

    // Create event
    await db.query(`
      INSERT INTO booking_events (booking_id, event_type, event_data, user_id)
      VALUES ($1, 'REMINDER_SENT', $2, $3)
    `, [
      bookingId,
      JSON.stringify({ reminderType, sentAt: new Date() }),
      booking.client_id
    ]);

    return { success: true, reminderSent: true };
  } catch (error) {
    console.error(`Reminder job ${job.id} failed:`, error);
    throw error;
  }
});

// ============================================
// Payment Processing Queue Processor
// ============================================

queues.paymentQueue.process(async (job) => {
  const { bookingId, amount, paymentMethod } = job.data;

  console.log(`💳 Processing payment: ${job.id} - Booking: ${bookingId}`);

  // Update job progress
  job.progress(10);

  try {
    // Simulate payment processing
    // In production, integrate with Stripe, Bitcoin, etc.

    job.progress(50);

    // Create payment record
    const paymentResult = await db.query(`
      INSERT INTO payments (booking_id, amount, payment_method, status)
      VALUES ($1, $2, $3, 'COMPLETED')
      RETURNING *
    `, [bookingId, amount, paymentMethod]);

    job.progress(75);

    // Create payment event
    await db.query(`
      INSERT INTO payment_events (payment_id, booking_id, event_type, event_data)
      VALUES ($1, $2, 'PAYMENT_RECEIVED', $3)
    `, [
      paymentResult.rows[0].id,
      bookingId,
      JSON.stringify({ amount, paymentMethod, processedAt: new Date() })
    ]);

    // Create booking event
    await db.query(`
      INSERT INTO booking_events (booking_id, event_type, event_data, user_id)
      VALUES ($1, 'PAYMENT_RECEIVED', $2, $3)
    `, [
      bookingId,
      JSON.stringify({ amount, paymentMethod }),
      job.data.userId
    ]);

    job.progress(100);

    return {
      success: true,
      paymentId: paymentResult.rows[0].id,
      amount
    };
  } catch (error) {
    console.error(`Payment job ${job.id} failed:`, error);
    throw error;
  }
});

// ============================================
// Booking Expiration Queue Processor
// ============================================

queues.expirationQueue.process(async (job) => {
  console.log(`⏳ Processing expiration check: ${job.id}`);

  try {
    // Find expired pending bookings
    const result = await db.query(`
      UPDATE bookings
      SET status = 'EXPIRED', updated_at = NOW()
      WHERE status = 'PENDING'
        AND request_expires_at < NOW()
      RETURNING id, client_id
    `);

    const expiredBookings = result.rows;

    // Create events for each expired booking
    for (const booking of expiredBookings) {
      await db.query(`
        INSERT INTO booking_events (booking_id, event_type, event_data, user_id)
        VALUES ($1, 'EXPIRED', $2, $3)
      `, [
        booking.id,
        JSON.stringify({ expiredAt: new Date(), reason: 'No response within time limit' }),
        booking.client_id
      ]);
    }

    return {
      success: true,
      expiredCount: expiredBookings.length
    };
  } catch (error) {
    console.error(`Expiration job ${job.id} failed:`, error);
    throw error;
  }
});

// ============================================
// Google Calendar Sync Queue Processor
// ============================================

queues.calendarSyncQueue.process(async (job) => {
  const { userId } = job.data;

  console.log(`📅 Processing calendar sync: ${job.id} - User: ${userId}`);

  try {
    // Check if user has Google Calendar enabled
    const userResult = await db.query(`
      SELECT google_calendar_connected, google_calendar_sync_enabled
      FROM users
      WHERE id = $1
    `, [userId]);

    const user = userResult.rows[0];

    if (!user?.google_calendar_connected || !user?.google_calendar_sync_enabled) {
      return { success: false, reason: 'Google Calendar not enabled' };
    }

    // Implement Google Calendar sync logic here
    // (Use the existing GoogleCalendarSync component logic)

    await db.query(`
      UPDATE users
      SET google_calendar_last_sync = NOW()
      WHERE id = $1
    `, [userId]);

    return { success: true, syncedAt: new Date() };
  } catch (error) {
    console.error(`Calendar sync job ${job.id} failed:`, error);
    throw error;
  }
});

// ============================================
// Analytics Queue Processor
// ============================================

queues.analyticsQueue.process(async (job) => {
  const { type, period } = job.data;

  console.log(`📊 Processing analytics: ${job.id} - Type: ${type}`);

  try {
    switch (type) {
      case 'DAILY_STATS':
        // Calculate daily statistics
        await db.query(`
          INSERT INTO daily_stats (date, total_bookings, total_revenue, new_users)
          SELECT
            CURRENT_DATE,
            COUNT(DISTINCT b.id),
            SUM(b.total_price),
            COUNT(DISTINCT u.id)
          FROM bookings b
          CROSS JOIN users u
          WHERE b.created_at >= CURRENT_DATE
            AND u.created_at >= CURRENT_DATE
        `);
        break;

      case 'STYLIST_RATINGS':
        // Recalculate stylist ratings
        await db.query(`
          UPDATE stylists s
          SET
            rating_average = COALESCE((
              SELECT AVG(rating) FROM reviews WHERE stylist_id = s.id
            ), 0),
            rating_count = (
              SELECT COUNT(*) FROM reviews WHERE stylist_id = s.id
            )
        `);
        break;

      default:
        console.log(`Unknown analytics type: ${type}`);
    }

    return { success: true, analyticsType: type };
  } catch (error) {
    console.error(`Analytics job ${job.id} failed:`, error);
    throw error;
  }
});

// ============================================
// Cache Warming Queue Processor
// ============================================

queues.cacheWarmingQueue.process(async (job) => {
  console.log(`🔥 Warming cache: ${job.id}`);

  try {
    // Warm popular caches
    await Promise.all([
      cacheService.getPopularStylists(20),
      cacheService.getServiceCategories()
    ]);

    return { success: true, cacheWarmed: true };
  } catch (error) {
    console.error(`Cache warming job ${job.id} failed:`, error);
    throw error;
  }
});

// ============================================
// Event Listeners (Monitoring)
// ============================================

Object.values(queues).forEach(queue => {
  queue.on('completed', (job, result) => {
    console.log(`✅ Job ${job.id} completed in queue ${queue.name}:`, result);
  });

  queue.on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} failed in queue ${queue.name}:`, err.message);
  });

  queue.on('stalled', (job) => {
    console.warn(`⚠️  Job ${job.id} stalled in queue ${queue.name}`);
  });
});

// ============================================
// Scheduled Jobs (Replaces cron)
// ============================================

/**
 * Schedule recurring jobs
 */
async function initializeScheduledJobs() {
  // Booking reminders - Every hour
  await queues.reminderQueue.add(
    { type: 'CHECK_UPCOMING' },
    {
      repeat: {
        cron: '0 * * * *' // Every hour
      }
    }
  );

  // Booking expiration check - Every 15 minutes
  await queues.expirationQueue.add(
    { type: 'CHECK_EXPIRED' },
    {
      repeat: {
        cron: '*/15 * * * *' // Every 15 minutes
      }
    }
  );

  // Daily analytics - Every day at midnight
  await queues.analyticsQueue.add(
    { type: 'DAILY_STATS', period: 'daily' },
    {
      repeat: {
        cron: '0 0 * * *' // Midnight daily
      }
    }
  );

  // Cache warming - Every 5 minutes
  await queues.cacheWarmingQueue.add(
    { type: 'WARM_POPULAR_CACHES' },
    {
      repeat: {
        cron: '*/5 * * * *' // Every 5 minutes
      }
    }
  );

  console.log('✅ Scheduled jobs initialized');
}

// ============================================
// Helper Functions
// ============================================

/**
 * Schedule a booking reminder
 */
async function scheduleBookingReminder(bookingId, bookingDateTime, reminderType = '24h') {
  const reminderTimes = {
    '24h': 24 * 60 * 60 * 1000, // 24 hours before
    '2h': 2 * 60 * 60 * 1000,   // 2 hours before
    '30m': 30 * 60 * 1000        // 30 minutes before
  };

  const delay = reminderTimes[reminderType];
  const sendAt = new Date(bookingDateTime).getTime() - delay;

  await queues.reminderQueue.add(
    {
      bookingId,
      reminderType
    },
    {
      delay: sendAt - Date.now(),
      jobId: `reminder-${bookingId}-${reminderType}`
    }
  );

  console.log(`⏰ Scheduled ${reminderType} reminder for booking ${bookingId}`);
}

/**
 * Process payment
 */
async function processPayment(bookingId, amount, paymentMethod, userId) {
  return await queues.paymentQueue.add(
    {
      bookingId,
      amount,
      paymentMethod,
      userId
    },
    {
      priority: 1 // High priority
    }
  );
}

/**
 * Send email notification
 */
async function sendEmail(type, to, subject, data) {
  return await queues.emailQueue.add({
    type,
    to,
    subject,
    data
  });
}

/**
 * Schedule Google Calendar sync
 */
async function scheduleCalendarSync(userId) {
  return await queues.calendarSyncQueue.add(
    { userId },
    {
      jobId: `calendar-sync-${userId}`,
      removeOnComplete: true
    }
  );
}

/**
 * Get queue statistics
 */
async function getQueueStats() {
  const stats = {};

  for (const [name, queue] of Object.entries(queues)) {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount()
    ]);

    stats[name] = {
      waiting,
      active,
      completed,
      failed,
      delayed
    };
  }

  return stats;
}

/**
 * Clean old jobs (maintenance)
 */
async function cleanOldJobs(olderThan = 7 * 24 * 60 * 60 * 1000) { // 7 days
  for (const queue of Object.values(queues)) {
    await queue.clean(olderThan, 'completed');
    await queue.clean(olderThan, 'failed');
  }
  console.log('✅ Old jobs cleaned');
}

// ============================================
// Graceful Shutdown
// ============================================

async function shutdown() {
  console.log('Shutting down queues...');

  for (const queue of Object.values(queues)) {
    await queue.close();
  }

  console.log('✅ All queues closed');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ============================================
// Exports
// ============================================

module.exports = {
  queues,
  initializeScheduledJobs,
  scheduleBookingReminder,
  processPayment,
  sendEmail,
  scheduleCalendarSync,
  getQueueStats,
  cleanOldJobs
};
