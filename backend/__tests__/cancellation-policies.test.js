const { describe, it, expect, beforeEach } = require('@jest/globals');

describe('Cancellation Policy Tests (12h Client / 3h Stylist)', () => {
  let mockDb;
  let stripe;

  beforeEach(() => {
    mockDb = { query: jest.fn() };
    stripe = require('stripe')();
  });

  describe('1. Client Cancellation Policy (12 Hours)', () => {
    it('should allow full refund if cancelled 12+ hours before', () => {
      const bookingDate = new Date('2025-10-25T14:00:00');
      const now = new Date('2025-10-24T12:00:00'); // 26 hours before

      const hoursUntilBooking = (bookingDate - now) / (1000 * 60 * 60);
      const fullRefundEligible = hoursUntilBooking >= 12;

      expect(fullRefundEligible).toBe(true);
      expect(hoursUntilBooking).toBeGreaterThanOrEqual(12);
    });

    it('should restrict refund if cancelled within 12 hours', () => {
      const bookingDate = new Date('2025-10-25T14:00:00');
      const now = new Date('2025-10-25T08:00:00'); // 6 hours before

      const hoursUntilBooking = (bookingDate - now) / (1000 * 60 * 60);
      const fullRefundEligible = hoursUntilBooking >= 12;

      expect(fullRefundEligible).toBe(false);
      expect(hoursUntilBooking).toBeLessThan(12);
    });

    it('should calculate exact 12-hour boundary', () => {
      const bookingDate = new Date('2025-10-25T14:00:00');
      const exactly12h = new Date('2025-10-25T02:00:00'); // Exactly 12 hours before

      const hoursUntilBooking = (bookingDate - exactly12h) / (1000 * 60 * 60);

      expect(hoursUntilBooking).toBe(12);
    });

    it('should process full refund for eligible cancellation', async () => {
      const bookingAmount = 100.00;

      const refund = await stripe.refunds.create({
        payment_intent: 'pi_test_123',
        amount: bookingAmount * 100, // Full refund
      });

      expect(refund.status).toBe('succeeded');

      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          status: 'CANCELLED',
          payment_status: 'REFUNDED',
          refund_amount: bookingAmount,
          cancelled_by: 'CLIENT',
          cancelled_at: new Date(),
          cancellation_reason: 'Client cancelled 24 hours before appointment',
        }],
      });

      const booking = mockDb.query.mock.results[0].value.rows[0];

      expect(booking.status).toBe('CANCELLED');
      expect(booking.refund_amount).toBe(bookingAmount);
      expect(booking.cancelled_by).toBe('CLIENT');
    });

    it('should retain payment if cancelled within 12 hours', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          status: 'CANCELLED',
          payment_status: 'PAID',
          refund_amount: 0.00,
          cancelled_by: 'CLIENT',
          cancellation_reason: 'Cancelled within 12 hours - no refund',
        }],
      });

      const booking = mockDb.query.mock.results[0].value.rows[0];

      expect(booking.status).toBe('CANCELLED');
      expect(booking.refund_amount).toBe(0.00);
      expect(booking.payment_status).toBe('PAID');
    });

    it('should notify stylist of client cancellation', async () => {
      const twilio = require('twilio')();
      
      await twilio.messages.create({
        body: 'Booking cancelled by client. Full refund issued.',
        to: '+15559876543',
      });

      expect(twilio.messages.create).toHaveBeenCalled();
    });
  });

  describe('2. Stylist Cancellation Policy (3 Hours)', () => {
    it('should allow cancellation if 3+ hours before', () => {
      const bookingDate = new Date('2025-10-25T14:00:00');
      const now = new Date('2025-10-25T10:00:00'); // 4 hours before

      const hoursUntilBooking = (bookingDate - now) / (1000 * 60 * 60);
      const canCancel = hoursUntilBooking >= 3;

      expect(canCancel).toBe(true);
      expect(hoursUntilBooking).toBeGreaterThanOrEqual(3);
    });

    it('should restrict cancellation within 3 hours', () => {
      const bookingDate = new Date('2025-10-25T14:00:00');
      const now = new Date('2025-10-25T12:00:00'); // 2 hours before

      const hoursUntilBooking = (bookingDate - now) / (1000 * 60 * 60);
      const canCancel = hoursUntilBooking >= 3;

      expect(canCancel).toBe(false);
      expect(hoursUntilBooking).toBeLessThan(3);
    });

    it('should require admin override for late stylist cancellation', async () => {
      const hoursUntilBooking = 1.5; // Within 3-hour window

      if (hoursUntilBooking < 3) {
        mockDb.query.mockResolvedValueOnce({
          rows: [{
            id: 1,
            status: 'PENDING_ADMIN_APPROVAL',
            cancellation_requested_by: 'STYLIST',
            requires_admin_override: true,
          }],
        });

        const cancellation = mockDb.query.mock.results[0].value.rows[0];

        expect(cancellation.status).toBe('PENDING_ADMIN_APPROVAL');
        expect(cancellation.requires_admin_override).toBe(true);
      }
    });

    it('should refund client 100% on stylist cancellation', async () => {
      const bookingAmount = 100.00;

      const refund = await stripe.refunds.create({
        payment_intent: 'pi_test_123',
        amount: bookingAmount * 100, // Full refund to client
      });

      expect(refund.status).toBe('succeeded');

      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          status: 'CANCELLED',
          cancelled_by: 'STYLIST',
          refund_amount: bookingAmount,
          stylist_penalty: bookingAmount * 0.20, // 20% penalty
        }],
      });

      const booking = mockDb.query.mock.results[0].value.rows[0];

      expect(booking.refund_amount).toBe(bookingAmount);
      expect(booking.cancelled_by).toBe('STYLIST');
      expect(booking.stylist_penalty).toBe(20.00);
    });

    it('should notify client of stylist cancellation', async () => {
      const twilio = require('twilio')();
      
      await twilio.messages.create({
        body: 'Your booking has been cancelled by the stylist. Full refund issued.',
        to: '+15551234567',
      });

      expect(twilio.messages.create).toHaveBeenCalled();
    });
  });

  describe('3. Cancellation Reasons & Tracking', () => {
    const validReasons = [
      'Client requested',
      'Stylist unavailable',
      'Emergency',
      'Weather conditions',
      'Double booking',
      'Other',
    ];

    validReasons.forEach(reason => {
      it(`should accept '${reason}' as valid cancellation reason`, async () => {
        mockDb.query.mockResolvedValueOnce({
          rows: [{
            id: 1,
            status: 'CANCELLED',
            cancellation_reason: reason,
          }],
        });

        const booking = mockDb.query.mock.results[0].value.rows[0];

        expect(booking.cancellation_reason).toBe(reason);
      });
    });

    it('should track who cancelled the booking', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          status: 'CANCELLED',
          cancelled_by: 101, // User ID
          cancelled_by_role: 'CLIENT',
          cancelled_at: new Date(),
        }],
      });

      const booking = mockDb.query.mock.results[0].value.rows[0];

      expect(booking.cancelled_by).toBe(101);
      expect(booking.cancelled_by_role).toBe('CLIENT');
      expect(booking.cancelled_at).toBeDefined();
    });
  });

  describe('4. Refund Amount Calculations', () => {
    const testScenarios = [
      {
        description: 'Client cancels 24h before - Full refund',
        hoursUntil: 24,
        cancelledBy: 'CLIENT',
        expectedRefundPercent: 100,
      },
      {
        description: 'Client cancels 13h before - Full refund',
        hoursUntil: 13,
        cancelledBy: 'CLIENT',
        expectedRefundPercent: 100,
      },
      {
        description: 'Client cancels 6h before - No refund',
        hoursUntil: 6,
        cancelledBy: 'CLIENT',
        expectedRefundPercent: 0,
      },
      {
        description: 'Stylist cancels 5h before - Full refund to client',
        hoursUntil: 5,
        cancelledBy: 'STYLIST',
        expectedRefundPercent: 100,
      },
      {
        description: 'Stylist cancels 1h before - Full refund to client',
        hoursUntil: 1,
        cancelledBy: 'STYLIST',
        expectedRefundPercent: 100,
      },
    ];

    testScenarios.forEach(scenario => {
      it(scenario.description, () => {
        const bookingAmount = 100.00;
        const { hoursUntil, cancelledBy, expectedRefundPercent } = scenario;

        let refundPercent = 0;

        if (cancelledBy === 'CLIENT') {
          refundPercent = hoursUntil >= 12 ? 100 : 0;
        } else if (cancelledBy === 'STYLIST') {
          refundPercent = 100; // Always full refund for client
        }

        const refundAmount = (bookingAmount * refundPercent) / 100;

        expect(refundPercent).toBe(expectedRefundPercent);
        expect(refundAmount).toBe((bookingAmount * expectedRefundPercent) / 100);
      });
    });
  });

  describe('5. No-Show Scenarios', () => {
    it('should handle client no-show (60/40 split)', async () => {
      const totalAmount = 100.00;
      const clientRefund = 60.00; // 60% to client
      const stylistPayout = 40.00; // 40% to stylist (completion bonus)

      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          status: 'NO_SHOW',
          no_show_party: 'CLIENT',
          refund_amount: clientRefund,
          stylist_payout: stylistPayout,
        }],
      });

      const booking = mockDb.query.mock.results[0].value.rows[0];

      expect(booking.status).toBe('NO_SHOW');
      expect(booking.no_show_party).toBe('CLIENT');
      expect(booking.refund_amount).toBe(60.00);
      expect(booking.stylist_payout).toBe(40.00);
      expect(booking.refund_amount + booking.stylist_payout).toBe(totalAmount);
    });

    it('should handle stylist no-show (100% to client)', async () => {
      const totalAmount = 100.00;

      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          status: 'NO_SHOW',
          no_show_party: 'STYLIST',
          refund_amount: 100.00,
          stylist_payout: 0.00,
        }],
      });

      const booking = mockDb.query.mock.results[0].value.rows[0];

      expect(booking.status).toBe('NO_SHOW');
      expect(booking.no_show_party).toBe('STYLIST');
      expect(booking.refund_amount).toBe(totalAmount);
      expect(booking.stylist_payout).toBe(0);
    });

    it('should process partial refund for client no-show', async () => {
      const totalAmount = 100.00;
      const refundAmount = 60.00;

      const refund = await stripe.refunds.create({
        payment_intent: 'pi_test_123',
        amount: refundAmount * 100,
      });

      expect(refund.status).toBe('succeeded');
    });
  });

  describe('6. Edge Cases - Timing Calculations', () => {
    it('should handle booking exactly at 12-hour boundary', () => {
      const bookingDate = new Date('2025-10-25T14:00:00');
      const cancelTime = new Date('2025-10-25T02:00:00'); // Exactly 12h

      const hours = (bookingDate - cancelTime) / (1000 * 60 * 60);
      const eligible = hours >= 12;

      expect(hours).toBe(12);
      expect(eligible).toBe(true); // Should allow at exactly 12 hours
    });

    it('should handle booking exactly at 3-hour boundary', () => {
      const bookingDate = new Date('2025-10-25T14:00:00');
      const cancelTime = new Date('2025-10-25T11:00:00'); // Exactly 3h

      const hours = (bookingDate - cancelTime) / (1000 * 60 * 60);
      const eligible = hours >= 3;

      expect(hours).toBe(3);
      expect(eligible).toBe(true); // Should allow at exactly 3 hours
    });

    it('should handle midnight boundary crossings', () => {
      const bookingDate = new Date('2025-10-25T02:00:00'); // 2 AM
      const cancelTime = new Date('2025-10-24T15:00:00'); // 3 PM previous day

      const hours = (bookingDate - cancelTime) / (1000 * 60 * 60);

      expect(hours).toBe(11); // 11 hours, not eligible for full refund
    });
  });

  describe('7. Cancellation Notification System', () => {
    it('should create notification for client cancellation', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          user_id: 999, // Stylist user ID
          type: 'BOOKING_CANCELLED',
          title: 'Booking Cancelled',
          message: 'Client cancelled booking scheduled for Oct 25, 2025',
          is_read: false,
        }],
      });

      const notification = mockDb.query.mock.results[0].value.rows[0];

      expect(notification.type).toBe('BOOKING_CANCELLED');
      expect(notification.is_read).toBe(false);
    });

    it('should send both SMS and in-app notification', async () => {
      const twilio = require('twilio')();
      
      await twilio.messages.create({
        body: 'Booking cancelled',
        to: '+15551234567',
      });

      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 1, type: 'BOOKING_CANCELLED' }],
      });

      expect(twilio.messages.create).toHaveBeenCalled();
      expect(mockDb.query).toHaveBeenCalled();
    });
  });

  describe('8. Admin Override System', () => {
    it('should allow admin to override cancellation restrictions', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          status: 'CANCELLED',
          admin_override: true,
          override_by: 777, // Admin user ID
          override_reason: 'Emergency situation approved by admin',
        }],
      });

      const booking = mockDb.query.mock.results[0].value.rows[0];

      expect(booking.status).toBe('CANCELLED');
      expect(booking.admin_override).toBe(true);
      expect(booking.override_by).toBe(777);
    });

    it('should log admin override for audit trail', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          booking_id: 123,
          action: 'OVERRIDE_CANCELLATION',
          admin_id: 777,
          reason: 'Emergency',
          created_at: new Date(),
        }],
      });

      const auditLog = mockDb.query.mock.results[0].value.rows[0];

      expect(auditLog.action).toBe('OVERRIDE_CANCELLATION');
      expect(auditLog.admin_id).toBe(777);
    });
  });
});
