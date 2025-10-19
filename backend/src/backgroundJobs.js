const cron = require('node-cron');
const BookingService = require('./bookingService');
const SMSService = require('./smsService');

class BackgroundJobProcessor {
  constructor() {
    this.bookingService = new BookingService();
    this.smsService = new SMSService();
    this.jobs = new Map();
    this.isRunning = false;
  }

  // Start all background jobs
  start() {
    if (this.isRunning) {
      console.log('Background jobs already running');
      return;
    }

    console.log('🚀 Starting background job processor...');

    // Check for expired bookings every 30 seconds
    const expirationJob = cron.schedule('*/30 * * * * *', async () => {
      await this.processExpiredBookings();
    }, {
      scheduled: false,
      timezone: 'America/Mexico_City'
    });

    // Process scheduled SMS every minute
    const smsJob = cron.schedule('* * * * *', async () => {
      await this.processScheduledSMS();
    }, {
      scheduled: false,
      timezone: 'America/Mexico_City'
    });

    // Process automatic payouts at midnight every day
    const payoutJob = cron.schedule('0 0 * * *', async () => {
      await this.processAutomaticPayouts();
    }, {
      scheduled: false,
      timezone: 'America/Mexico_City'
    });

    // Clean up old data every day at 2 AM
    const cleanupJob = cron.schedule('0 2 * * *', async () => {
      await this.cleanupOldData();
    }, {
      scheduled: false,
      timezone: 'America/Mexico_City'
    });

    // Generate daily statistics at 3 AM
    const statsJob = cron.schedule('0 3 * * *', async () => {
      await this.generateDailyStats();
    }, {
      scheduled: false,
      timezone: 'America/Mexico_City'
    });

    // Store job references
    this.jobs.set('expiration', expirationJob);
    this.jobs.set('sms', smsJob);
    this.jobs.set('payouts', payoutJob);
    this.jobs.set('cleanup', cleanupJob);
    this.jobs.set('stats', statsJob);

    // Start all jobs
    expirationJob.start();
    smsJob.start();
    payoutJob.start();
    cleanupJob.start();
    statsJob.start();

    this.isRunning = true;
    console.log('✅ All background jobs started successfully');

    // Log job schedule
    console.log('📋 Job Schedule:');
    console.log('  - Booking expiration check: Every 30 seconds');
    console.log('  - Scheduled SMS processing: Every minute');
    console.log('  - Automatic payouts: Daily at midnight');
    console.log('  - Data cleanup: Daily at 2:00 AM');
    console.log('  - Statistics generation: Daily at 3:00 AM');
  }

  // Stop all background jobs
  stop() {
    if (!this.isRunning) {
      console.log('Background jobs are not running');
      return;
    }

    console.log('🛑 Stopping background job processor...');

    // Stop all jobs
    for (const [name, job] of this.jobs) {
      try {
        job.stop();
        console.log(`  ✅ Stopped ${name} job`);
      } catch (error) {
        console.error(`  ❌ Error stopping ${name} job:`, error);
      }
    }

    this.jobs.clear();
    this.isRunning = false;
    console.log('✅ All background jobs stopped');
  }

  // Process expired bookings
  async processExpiredBookings() {
    try {
      const result = await this.bookingService.processExpiredBookings();

      if (result.success && result.expiredBookings > 0) {
        console.log(`📅 Processed ${result.expiredBookings} expired bookings at ${result.processedAt}`);
      }

      return result;

    } catch (error) {
      console.error('❌ Error processing expired bookings:', error);
      return {
        success: false,
        error: error.message,
        processedAt: new Date()
      };
    }
  }

  // Process scheduled SMS messages
  async processScheduledSMS() {
    try {
      const result = await this.smsService.processPendingScheduledSMS();

      if (result.processed > 0) {
        console.log(`📱 Processed ${result.processed} scheduled SMS messages`);
      }

      return result;

    } catch (error) {
      console.error('❌ Error processing scheduled SMS:', error);
      return {
        processed: 0,
        error: error.message
      };
    }
  }

  // Process automatic payouts (run at midnight)
  async processAutomaticPayouts() {
    try {
      console.log('💰 Starting automatic payout processing...');

      const result = await this.bookingService.processPendingPayouts();

      if (result.success) {
        console.log(`✅ Processed ${result.payoutsProcessed} payouts at ${result.processedAt}`);

        // Send summary to admin if there were payouts
        if (result.payoutsProcessed > 0) {
          // TODO: Send admin notification about successful payouts
          console.log(`📊 Daily payout summary: ${result.payoutsProcessed} payments processed`);
        }
      } else {
        console.error('❌ Payout processing failed:', result.error);
      }

      return result;

    } catch (error) {
      console.error('❌ Error processing automatic payouts:', error);
      return {
        success: false,
        error: error.message,
        processedAt: new Date()
      };
    }
  }

  // Clean up old data (run daily at 2 AM)
  async cleanupOldData() {
    try {
      console.log('🧹 Starting data cleanup...');

      const { query } = require('./db');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // Keep 90 days of data

      let cleanedItems = 0;

      // Clean up old SMS logs (keep last 90 days)
      const smsCleanup = await query(`
        DELETE FROM sms_logs
        WHERE sent_at < $1 AND status IN ('DELIVERED', 'FAILED')
      `, [cutoffDate]);
      cleanedItems += smsCleanup.rowCount || 0;

      // Clean up old phone verification records (keep last 30 days)
      const verificationCutoff = new Date();
      verificationCutoff.setDate(verificationCutoff.getDate() - 30);

      const verificationCleanup = await query(`
        DELETE FROM user_phone_verification
        WHERE created_at < $1 AND (is_verified = true OR expires_at < NOW())
      `, [verificationCutoff]);
      cleanedItems += verificationCleanup.rowCount || 0;

      // Clean up completed scheduled SMS (keep last 30 days)
      const scheduledCleanup = await query(`
        DELETE FROM scheduled_sms
        WHERE created_at < $1 AND status IN ('SENT', 'CANCELLED', 'FAILED')
      `, [verificationCutoff]);
      cleanedItems += scheduledCleanup.rowCount || 0;

      console.log(`✅ Data cleanup completed: ${cleanedItems} records removed`);

      return {
        success: true,
        itemsRemoved: cleanedItems,
        processedAt: new Date()
      };

    } catch (error) {
      console.error('❌ Error during data cleanup:', error);
      return {
        success: false,
        error: error.message,
        processedAt: new Date()
      };
    }
  }

  // Generate daily statistics (run daily at 3 AM)
  async generateDailyStats() {
    try {
      console.log('📊 Generating daily statistics...');

      // Get booking statistics for the last 24 hours
      const bookingStats = await this.bookingService.getBookingStats('24h');

      // Get payment statistics
      const PaymentService = require('./paymentService');
      const paymentService = new PaymentService();
      const paymentStats = await paymentService.getPaymentStats('24h');

      // Log summary statistics
      if (bookingStats.success && paymentStats.success) {
        console.log('📈 Daily Statistics Summary:');

        // Booking stats
        const totalBookings = bookingStats.statusBreakdown.reduce((sum, stat) => sum + parseInt(stat.count), 0);
        const totalValue = bookingStats.statusBreakdown.reduce((sum, stat) => sum + parseFloat(stat.total_value || 0), 0);

        console.log(`  📅 Bookings: ${totalBookings} total, $${totalValue.toFixed(2)} value`);

        // Payment stats
        const totalPayments = paymentStats.paymentStats.reduce((sum, stat) => sum + parseInt(stat.count), 0);
        const totalRevenue = paymentStats.paymentStats.reduce((sum, stat) => sum + parseFloat(stat.total_platform_fees || 0), 0);

        console.log(`  💳 Payments: ${totalPayments} processed, $${totalRevenue.toFixed(2)} platform revenue`);

        // TODO: Store these statistics in a daily_stats table for historical tracking
        // TODO: Send daily summary email to admin team

        return {
          success: true,
          bookingStats,
          paymentStats,
          generatedAt: new Date()
        };
      } else {
        throw new Error('Failed to generate statistics');
      }

    } catch (error) {
      console.error('❌ Error generating daily statistics:', error);
      return {
        success: false,
        error: error.message,
        generatedAt: new Date()
      };
    }
  }

  // Get current job status
  getStatus() {
    const status = {
      isRunning: this.isRunning,
      jobs: {},
      timestamp: new Date()
    };

    for (const [name, job] of this.jobs) {
      status.jobs[name] = {
        running: job.running || false,
        scheduled: !!job.scheduled
      };
    }

    return status;
  }

  // Manual trigger for specific jobs (useful for testing)
  async runJob(jobName) {
    console.log(`🔧 Manually triggering ${jobName} job...`);

    switch (jobName) {
      case 'expiration':
        return await this.processExpiredBookings();

      case 'sms':
        return await this.processScheduledSMS();

      case 'payouts':
        return await this.processAutomaticPayouts();

      case 'cleanup':
        return await this.cleanupOldData();

      case 'stats':
        return await this.generateDailyStats();

      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }

  // Graceful shutdown
  async shutdown() {
    console.log('🔄 Shutting down background job processor...');

    this.stop();

    // Close service connections
    try {
      await this.bookingService.close();
      await this.smsService.close();
      console.log('✅ Background job processor shutdown complete');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }
}

module.exports = BackgroundJobProcessor;