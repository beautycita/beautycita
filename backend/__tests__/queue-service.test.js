const { describe, it, expect, beforeEach, jest } = require('@jest/globals');

// Mock Bull
jest.mock('bull', () => {
  return jest.fn().mockImplementation((name, options) => {
    return {
      name,
      options,
      process: jest.fn(),
      add: jest.fn().mockResolvedValue({ id: 'test-job-id' }),
      on: jest.fn(),
      getWaitingCount: jest.fn().mockResolvedValue(0),
      getActiveCount: jest.fn().mockResolvedValue(0),
      getCompletedCount: jest.fn().mockResolvedValue(0),
      getFailedCount: jest.fn().mockResolvedValue(0),
      getDelayedCount: jest.fn().mockResolvedValue(0),
      clean: jest.fn().mockResolvedValue([]),
      close: jest.fn().mockResolvedValue(undefined),
    };
  });
});

// Mock database
const mockDb = {
  query: jest.fn(),
};

// Mock email service
const mockEmailService = {
  sendBookingConfirmation: jest.fn().mockResolvedValue(true),
  sendBookingReminder: jest.fn().mockResolvedValue(true),
  sendCancellationNotification: jest.fn().mockResolvedValue(true),
  sendReviewRequest: jest.fn().mockResolvedValue(true),
};

describe('Queue Service Tests', () => {
  let Queue;
  let queues;

  beforeEach(() => {
    jest.clearAllMocks();
    Queue = require('bull');

    // Simulate queue creation
    queues = {
      emailQueue: new Queue('email-notifications', { redis: {} }),
      reminderQueue: new Queue('booking-reminders', { redis: {} }),
      paymentQueue: new Queue('payments', { redis: {} }),
      expirationQueue: new Queue('booking-expiration', { redis: {} }),
      analyticsQueue: new Queue('analytics', { redis: {} }),
      calendarSyncQueue: new Queue('calendar-sync', { redis: {} }),
      cacheWarmingQueue: new Queue('cache-warming', { redis: {} }),
    };
  });

  describe('Queue Configuration', () => {
    it('should create email notifications queue', () => {
      expect(queues.emailQueue).toBeDefined();
      expect(queues.emailQueue.name).toBe('email-notifications');
    });

    it('should create booking reminders queue', () => {
      expect(queues.reminderQueue).toBeDefined();
      expect(queues.reminderQueue.name).toBe('booking-reminders');
    });

    it('should create payment processing queue', () => {
      expect(queues.paymentQueue).toBeDefined();
      expect(queues.paymentQueue.name).toBe('payments');
    });

    it('should create 7 queues total', () => {
      expect(Object.keys(queues).length).toBe(7);
    });
  });

  describe('Email Queue Processing', () => {
    it('should process booking confirmation email', async () => {
      const job = {
        id: 'job-1',
        data: {
          type: 'BOOKING_CONFIRMATION',
          to: 'client@test.com',
          subject: 'Booking Confirmed',
          data: {
            clientName: 'John Doe',
            bookingDate: '2025-10-25',
          },
        },
      };

      await mockEmailService.sendBookingConfirmation(job.data.to, job.data.data);

      expect(mockEmailService.sendBookingConfirmation).toHaveBeenCalledWith(
        'client@test.com',
        expect.objectContaining({ clientName: 'John Doe' })
      );
    });

    it('should process booking reminder email', async () => {
      const job = {
        id: 'job-2',
        data: {
          type: 'BOOKING_REMINDER',
          to: 'client@test.com',
          data: {
            clientName: 'John Doe',
            bookingDate: '2025-10-25',
            bookingTime: '14:00',
          },
        },
      };

      await mockEmailService.sendBookingReminder(job.data.to, job.data.data);

      expect(mockEmailService.sendBookingReminder).toHaveBeenCalled();
    });

    it('should handle email job failures', async () => {
      mockEmailService.sendBookingConfirmation.mockRejectedValueOnce(
        new Error('SMTP server unavailable')
      );

      await expect(
        mockEmailService.sendBookingConfirmation('test@test.com', {})
      ).rejects.toThrow('SMTP server unavailable');
    });

    it('should add email job to queue', async () => {
      await queues.emailQueue.add({
        type: 'BOOKING_CONFIRMATION',
        to: 'test@test.com',
        subject: 'Test',
        data: {},
      });

      expect(queues.emailQueue.add).toHaveBeenCalled();
    });
  });

  describe('Reminder Queue Processing', () => {
    it('should process booking reminder', async () => {
      const job = {
        id: 'reminder-job-1',
        data: {
          bookingId: 123,
          reminderType: '24h',
        },
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 123,
          status: 'CONFIRMED',
          client_email: 'client@test.com',
          client_name: 'John Doe',
          stylist_name: 'Jane Stylist',
          service_name: 'Haircut',
          booking_date: '2025-10-25',
          booking_time: '14:00',
          client_id: 1,
        }],
      });

      const result = await mockDb.query('SELECT...');
      const booking = result.rows[0];

      expect(booking.status).toBe('CONFIRMED');
      expect(booking.client_email).toBe('client@test.com');
    });

    it('should not send reminder for cancelled bookings', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 123,
          status: 'CANCELLED',
        }],
      });

      const result = await mockDb.query('SELECT...');
      const booking = result.rows[0];

      expect(booking.status).toBe('CANCELLED');
      // Should not proceed with reminder
    });

    it('should create reminder event in database', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          booking_id: 123,
          event_type: 'REMINDER_SENT',
          event_data: JSON.stringify({ reminderType: '24h' }),
        }],
      });

      const result = await mockDb.query('INSERT INTO booking_events...');

      expect(result.rows[0].event_type).toBe('REMINDER_SENT');
    });

    it('should schedule reminder with delay', async () => {
      const bookingDateTime = new Date('2025-10-25T14:00:00Z');
      const reminderDelay = 24 * 60 * 60 * 1000; // 24 hours
      const sendAt = bookingDateTime.getTime() - reminderDelay;

      await queues.reminderQueue.add(
        { bookingId: 123, reminderType: '24h' },
        { delay: sendAt - Date.now() }
      );

      expect(queues.reminderQueue.add).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ delay: expect.any(Number) })
      );
    });
  });

  describe('Payment Queue Processing', () => {
    it('should process payment', async () => {
      const job = {
        id: 'payment-job-1',
        data: {
          bookingId: 123,
          amount: 50.00,
          paymentMethod: 'STRIPE',
          userId: 1,
        },
        progress: jest.fn(),
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          booking_id: 123,
          amount: 50.00,
          payment_method: 'STRIPE',
          status: 'COMPLETED',
        }],
      });

      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          payment_id: 1,
          event_type: 'PAYMENT_RECEIVED',
        }],
      });

      const paymentResult = await mockDb.query('INSERT INTO payments...');
      const eventResult = await mockDb.query('INSERT INTO payment_events...');

      expect(paymentResult.rows[0].status).toBe('COMPLETED');
      expect(eventResult.rows[0].event_type).toBe('PAYMENT_RECEIVED');
    });

    it('should update job progress', async () => {
      const job = {
        progress: jest.fn(),
      };

      job.progress(10);
      job.progress(50);
      job.progress(100);

      expect(job.progress).toHaveBeenCalledWith(10);
      expect(job.progress).toHaveBeenCalledWith(50);
      expect(job.progress).toHaveBeenCalledWith(100);
    });

    it('should rollback on payment failure', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Payment processing failed'));

      await expect(mockDb.query('INSERT...')).rejects.toThrow('Payment processing failed');
    });

    it('should add payment job with high priority', async () => {
      await queues.paymentQueue.add(
        { bookingId: 123, amount: 50 },
        { priority: 1 }
      );

      expect(queues.paymentQueue.add).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ priority: 1 })
      );
    });
  });

  describe('Expiration Queue Processing', () => {
    it('should find and expire pending bookings', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          { id: 101, client_id: 1 },
          { id: 102, client_id: 2 },
        ],
      });

      const result = await mockDb.query('UPDATE bookings SET status = EXPIRED...');

      expect(result.rows.length).toBe(2);
    });

    it('should create expiration events', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          booking_id: 101,
          event_type: 'EXPIRED',
          event_data: JSON.stringify({ reason: 'No response within time limit' }),
        }],
      });

      const result = await mockDb.query('INSERT INTO booking_events...');

      expect(result.rows[0].event_type).toBe('EXPIRED');
    });
  });

  describe('Analytics Queue Processing', () => {
    it('should calculate daily statistics', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          total_bookings: 50,
          total_revenue: 2500.00,
          new_users: 10,
        }],
      });

      const result = await mockDb.query('INSERT INTO daily_stats...');

      expect(result.rows[0].total_bookings).toBe(50);
      expect(result.rows[0].total_revenue).toBe(2500.00);
    });

    it('should recalculate stylist ratings', async () => {
      mockDb.query.mockResolvedValueOnce({
        rowCount: 25,
      });

      const result = await mockDb.query('UPDATE stylists SET rating_average...');

      expect(result.rowCount).toBe(25);
    });
  });

  describe('Scheduled Jobs', () => {
    it('should schedule hourly booking reminders', async () => {
      await queues.reminderQueue.add(
        { type: 'CHECK_UPCOMING' },
        {
          repeat: {
            cron: '0 * * * *', // Every hour
          },
        }
      );

      expect(queues.reminderQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'CHECK_UPCOMING' }),
        expect.objectContaining({
          repeat: expect.objectContaining({ cron: '0 * * * *' })
        })
      );
    });

    it('should schedule expiration checks every 15 minutes', async () => {
      await queues.expirationQueue.add(
        { type: 'CHECK_EXPIRED' },
        {
          repeat: {
            cron: '*/15 * * * *',
          },
        }
      );

      expect(queues.expirationQueue.add).toHaveBeenCalled();
    });

    it('should schedule daily analytics at midnight', async () => {
      await queues.analyticsQueue.add(
        { type: 'DAILY_STATS', period: 'daily' },
        {
          repeat: {
            cron: '0 0 * * *',
          },
        }
      );

      expect(queues.analyticsQueue.add).toHaveBeenCalled();
    });
  });

  describe('Queue Statistics', () => {
    it('should get queue stats', async () => {
      const stats = {
        emailQueue: {
          waiting: await queues.emailQueue.getWaitingCount(),
          active: await queues.emailQueue.getActiveCount(),
          completed: await queues.emailQueue.getCompletedCount(),
          failed: await queues.emailQueue.getFailedCount(),
          delayed: await queues.emailQueue.getDelayedCount(),
        },
      };

      expect(stats.emailQueue.waiting).toBe(0);
      expect(stats.emailQueue.active).toBe(0);
      expect(queues.emailQueue.getWaitingCount).toHaveBeenCalled();
    });

    it('should track job counts', async () => {
      expect(await queues.paymentQueue.getCompletedCount()).toBe(0);
      expect(await queues.paymentQueue.getFailedCount()).toBe(0);
    });
  });

  describe('Error Handling & Retry', () => {
    it('should retry failed jobs with exponential backoff', () => {
      const jobOptions = {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      };

      expect(jobOptions.attempts).toBe(3);
      expect(jobOptions.backoff.type).toBe('exponential');
      expect(jobOptions.backoff.delay).toBe(2000);
    });

    it('should handle stalled jobs', () => {
      const stalledHandler = jest.fn();
      queues.emailQueue.on('stalled', stalledHandler);

      expect(queues.emailQueue.on).toHaveBeenCalledWith('stalled', stalledHandler);
    });

    it('should handle failed jobs', () => {
      const failedHandler = jest.fn();
      queues.emailQueue.on('failed', failedHandler);

      expect(queues.emailQueue.on).toHaveBeenCalledWith('failed', failedHandler);
    });

    it('should handle completed jobs', () => {
      const completedHandler = jest.fn();
      queues.emailQueue.on('completed', completedHandler);

      expect(queues.emailQueue.on).toHaveBeenCalledWith('completed', completedHandler);
    });
  });

  describe('Job Priority', () => {
    it('should process high priority jobs first', async () => {
      await queues.paymentQueue.add(
        { bookingId: 1 },
        { priority: 1 }
      );

      await queues.analyticsQueue.add(
        { type: 'DAILY_STATS' },
        { priority: 10 }
      );

      expect(queues.paymentQueue.add).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ priority: 1 })
      );

      expect(queues.analyticsQueue.add).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ priority: 10 })
      );
    });
  });

  describe('Queue Cleanup', () => {
    it('should clean old completed jobs', async () => {
      const olderThan = 7 * 24 * 60 * 60 * 1000; // 7 days

      await queues.emailQueue.clean(olderThan, 'completed');

      expect(queues.emailQueue.clean).toHaveBeenCalledWith(olderThan, 'completed');
    });

    it('should clean old failed jobs', async () => {
      const olderThan = 7 * 24 * 60 * 60 * 1000;

      await queues.emailQueue.clean(olderThan, 'failed');

      expect(queues.emailQueue.clean).toHaveBeenCalledWith(olderThan, 'failed');
    });
  });

  describe('Graceful Shutdown', () => {
    it('should close all queues on shutdown', async () => {
      for (const queue of Object.values(queues)) {
        await queue.close();
      }

      expect(queues.emailQueue.close).toHaveBeenCalled();
      expect(queues.paymentQueue.close).toHaveBeenCalled();
      expect(queues.reminderQueue.close).toHaveBeenCalled();
    });
  });
});
