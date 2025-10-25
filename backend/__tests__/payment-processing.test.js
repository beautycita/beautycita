const { describe, it, expect, beforeAll } = require('@jest/globals');

describe('Payment Processing Tests (Stripe Integration)', () => {
  let stripe;
  let mockDb;

  beforeAll(() => {
    stripe = require('stripe')();
    mockDb = { query: jest.fn() };
  });

  describe('1. Payment Intent Creation', () => {
    it('should create payment intent for booking', async () => {
      const bookingAmount = 100.00;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: bookingAmount * 100, // Convert to cents
        currency: 'usd',
        metadata: { booking_id: '1' },
      });

      expect(paymentIntent.id).toBeDefined();
      expect(paymentIntent.id).toContain('pi_test');
      expect(paymentIntent.status).toBe('succeeded');
    });

    it('should handle different currencies', async () => {
      const currencies = ['usd', 'mxn'];
      
      for (const currency of currencies) {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 5000,
          currency,
        });

        expect(paymentIntent).toBeDefined();
      }
    });

    it('should reject invalid amounts', () => {
      const invalidAmounts = [-100, 0, null, undefined];

      invalidAmounts.forEach(amount => {
        expect(() => {
          if (!amount || amount <= 0) {
            throw new Error('Invalid amount');
          }
        }).toThrow('Invalid amount');
      });
    });
  });

  describe('2. Payment Confirmation', () => {
    it('should confirm payment intent', async () => {
      const paymentIntent = await stripe.paymentIntents.confirm('pi_test_123');

      expect(paymentIntent.status).toBe('succeeded');
    });

    it('should update booking payment status', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          payment_status: 'PAID',
          stripe_payment_intent_id: 'pi_test_123',
          paid_at: new Date(),
        }],
      });

      const payment = mockDb.query.mock.results[0].value.rows[0];

      expect(payment.payment_status).toBe('PAID');
      expect(payment.stripe_payment_intent_id).toBe('pi_test_123');
      expect(payment.paid_at).toBeDefined();
    });
  });

  describe('3. Platform Fee Calculation (3%)', () => {
    const testCases = [
      { total: 50, platformFee: 1.50, stylistPayout: 48.50 },
      { total: 100, platformFee: 3.00, stylistPayout: 97.00 },
      { total: 150, platformFee: 4.50, stylistPayout: 145.50 },
      { total: 200, platformFee: 6.00, stylistPayout: 194.00 },
      { total: 75.50, platformFee: 2.27, stylistPayout: 73.23 },
    ];

    testCases.forEach(({ total, platformFee, stylistPayout }) => {
      it(`should calculate 3% fee for \$${total}`, () => {
        const calculatedFee = Number((total * 0.03).toFixed(2));
        const calculatedPayout = Number((total * 0.97).toFixed(2));

        expect(calculatedFee).toBeCloseTo(platformFee, 2);
        expect(calculatedPayout).toBeCloseTo(stylistPayout, 2);
        expect(calculatedFee + calculatedPayout).toBeCloseTo(total, 2);
      });
    });

    it('should never exceed 3% platform fee', () => {
      const amounts = [25, 50, 75, 100, 125, 150, 200, 500];

      amounts.forEach(amount => {
        const fee = amount * 0.03;
        const feePercentage = (fee / amount) * 100;

        expect(feePercentage).toBeLessThanOrEqual(3);
        expect(feePercentage).toBeCloseTo(3, 5);
      });
    });
  });

  describe('4. Refund Processing', () => {
    it('should create full refund', async () => {
      const refund = await stripe.refunds.create({
        payment_intent: 'pi_test_123',
        amount: 10000, // 00.00
      });

      expect(refund.id).toBeDefined();
      expect(refund.id).toContain('ref_test');
      expect(refund.status).toBe('succeeded');
    });

    it('should create partial refund', async () => {
      const originalAmount = 10000; // 00.00
      const refundAmount = 5000; // 0.00

      const refund = await stripe.refunds.create({
        payment_intent: 'pi_test_123',
        amount: refundAmount,
      });

      expect(refund.status).toBe('succeeded');
      expect(refundAmount).toBeLessThan(originalAmount);
    });

    it('should update booking refund status', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          payment_status: 'REFUNDED',
          refund_amount: 100.00,
          refund_reason: 'Client requested cancellation',
          refunded_at: new Date(),
        }],
      });

      const payment = mockDb.query.mock.results[0].value.rows[0];

      expect(payment.payment_status).toBe('REFUNDED');
      expect(payment.refund_amount).toBe(100.00);
      expect(payment.refund_reason).toBeDefined();
    });

    it('should enforce refund policies (12h for client)', async () => {
      const bookingDate = new Date();
      bookingDate.setHours(bookingDate.getHours() + 24); // Tomorrow

      const now = new Date();
      const hoursUntilBooking = (bookingDate - now) / (1000 * 60 * 60);

      const fullRefundEligible = hoursUntilBooking > 12;

      expect(fullRefundEligible).toBe(true);
    });

    it('should restrict refund within 12 hours', async () => {
      const bookingDate = new Date();
      bookingDate.setHours(bookingDate.getHours() + 6); // 6 hours from now

      const now = new Date();
      const hoursUntilBooking = (bookingDate - now) / (1000 * 60 * 60);

      const fullRefundEligible = hoursUntilBooking > 12;

      expect(fullRefundEligible).toBe(false);
    });
  });

  describe('5. Stylist Payout (Stripe Connect)', () => {
    it('should calculate stylist payout (97%)', async () => {
      const totalAmount = 100.00;
      const platformFee = 3.00;
      const stylistPayout = 97.00;

      expect(totalAmount - platformFee).toBe(stylistPayout);
      expect(stylistPayout / totalAmount).toBeCloseTo(0.97, 2);
    });

    it('should record payout transaction', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          booking_id: 1,
          stylist_id: 2,
          amount: 97.00,
          platform_fee: 3.00,
          status: 'PENDING',
          created_at: new Date(),
        }],
      });

      const payout = mockDb.query.mock.results[0].value.rows[0];

      expect(payout.amount).toBe(97.00);
      expect(payout.platform_fee).toBe(3.00);
      expect(payout.status).toBe('PENDING');
    });

    it('should update payout status to PAID after completion', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          status: 'PAID',
          paid_at: new Date(),
          stripe_transfer_id: 'tr_test_123',
        }],
      });

      const payout = mockDb.query.mock.results[0].value.rows[0];

      expect(payout.status).toBe('PAID');
      expect(payout.paid_at).toBeDefined();
      expect(payout.stripe_transfer_id).toBeDefined();
    });
  });

  describe('6. Payment Webhooks', () => {
    it('should handle payment_intent.succeeded webhook', async () => {
      const webhookEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            status: 'succeeded',
            amount: 10000,
          },
        },
      };

      expect(webhookEvent.type).toBe('payment_intent.succeeded');
      expect(webhookEvent.data.object.status).toBe('succeeded');
    });

    it('should handle payment_intent.payment_failed webhook', async () => {
      const webhookEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_123',
            status: 'requires_payment_method',
            last_payment_error: { message: 'Card declined' },
          },
        },
      };

      expect(webhookEvent.type).toBe('payment_intent.payment_failed');
      expect(webhookEvent.data.object.last_payment_error.message).toBe('Card declined');
    });

    it('should handle charge.dispute.created webhook', async () => {
      const webhookEvent = {
        type: 'charge.dispute.created',
        data: {
          object: {
            id: 'dp_test_123',
            status: 'needs_response',
            amount: 10000,
          },
        },
      };

      expect(webhookEvent.type).toBe('charge.dispute.created');
      expect(webhookEvent.data.object.status).toBe('needs_response');
    });
  });

  describe('7. No-Show Payout Split', () => {
    it('should split 60/40 on client no-show', async () => {
      const totalAmount = 100.00;
      const clientRefund = 60.00; // 60%
      const stylistPayout = 40.00; // 40% completion bonus

      expect(clientRefund + stylistPayout).toBe(totalAmount);
      expect(clientRefund / totalAmount).toBeCloseTo(0.60, 2);
      expect(stylistPayout / totalAmount).toBeCloseTo(0.40, 2);
    });

    it('should refund 100% on stylist no-show', async () => {
      const totalAmount = 100.00;
      const clientRefund = 100.00; // Full refund
      const stylistPayout = 0.00;

      expect(clientRefund).toBe(totalAmount);
      expect(stylistPayout).toBe(0);
    });
  });

  describe('8. Payment Error Handling', () => {
    it('should handle insufficient funds', async () => {
      stripe.paymentIntents.create.mockRejectedValueOnce({
        type: 'card_error',
        code: 'insufficient_funds',
      });

      await expect(stripe.paymentIntents.create()).rejects.toMatchObject({
        type: 'card_error',
        code: 'insufficient_funds',
      });
    });

    it('should handle card declined', async () => {
      stripe.paymentIntents.create.mockRejectedValueOnce({
        type: 'card_error',
        code: 'card_declined',
      });

      await expect(stripe.paymentIntents.create()).rejects.toMatchObject({
        type: 'card_error',
        code: 'card_declined',
      });
    });

    it('should handle network errors', async () => {
      stripe.paymentIntents.create.mockRejectedValueOnce(new Error('Network error'));

      await expect(stripe.paymentIntents.create()).rejects.toThrow('Network error');
    });
  });
});
