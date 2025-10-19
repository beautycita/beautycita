import express from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import { requireRole } from '../middleware/auth.js';
import {
  createPaymentIntent,
  confirmPayment,
  processRefund,
  getPaymentDetails,
  createConnectAccount,
  createAccountLink,
  handleStripeWebhook
} from '../services/payment.js';

const router = express.Router();

// Create payment intent for booking
router.post('/intent',
  requireRole('CLIENT'),
  body('bookingId').isUUID().withMessage('Valid booking ID is required'),
  validateRequest,
  async (req, res, next) => {
    try {
      const { bookingId } = req.body;

      const result = await createPaymentIntent(bookingId, req.user.id);

      res.json({
        message: 'Payment intent created successfully',
        clientSecret: result.clientSecret,
        paymentId: result.paymentId
      });

    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('unauthorized')) {
        return res.status(404).json({
          error: error.message,
          code: 'BOOKING_NOT_FOUND'
        });
      }
      if (error.message.includes('not in a payable state') || error.message.includes('already been paid')) {
        return res.status(409).json({
          error: error.message,
          code: 'PAYMENT_CONFLICT'
        });
      }
      next(error);
    }
  }
);

// Get payment details for a booking
router.get('/booking/:bookingId',
  param('bookingId').isUUID().withMessage('Valid booking ID is required'),
  validateRequest,
  async (req, res, next) => {
    try {
      const { bookingId } = req.params;

      const payment = await getPaymentDetails(bookingId, req.user.id, req.user.role);

      res.json(payment);

    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('unauthorized')) {
        return res.status(404).json({
          error: error.message,
          code: 'PAYMENT_NOT_FOUND'
        });
      }
      next(error);
    }
  }
);

// Process refund (clients and stylists can request, admins can approve)
router.post('/refund',
  body('bookingId').isUUID().withMessage('Valid booking ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid refund amount is required'),
  body('reason').optional().trim().isLength({ max: 500 }),
  validateRequest,
  async (req, res, next) => {
    try {
      const { bookingId, amount, reason } = req.body;

      const refund = await processRefund(bookingId, amount, reason, req.user.id, req.user.role);

      res.json({
        message: 'Refund processed successfully',
        refund: {
          id: refund.id,
          amount: refund.amount / 100, // Convert from cents
          status: refund.status,
          reason: refund.reason
        }
      });

    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: error.message,
          code: 'BOOKING_NOT_FOUND'
        });
      }
      if (error.message.includes('Insufficient permissions')) {
        return res.status(403).json({
          error: error.message,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
      if (error.message.includes('cannot exceed')) {
        return res.status(400).json({
          error: error.message,
          code: 'INVALID_REFUND_AMOUNT'
        });
      }
      next(error);
    }
  }
);

// Create Stripe Connect account for stylist
router.post('/connect/account',
  requireRole('STYLIST'),
  async (req, res, next) => {
    try {
      const account = await createConnectAccount(req.user.id);

      res.json({
        message: 'Stripe Connect account created successfully',
        accountId: account.id,
        needsOnboarding: !account.details_submitted
      });

    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: error.message,
          code: 'STYLIST_NOT_FOUND'
        });
      }
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          error: error.message,
          code: 'ACCOUNT_EXISTS'
        });
      }
      next(error);
    }
  }
);

// Create onboarding link for Stripe Connect
router.post('/connect/onboarding',
  requireRole('STYLIST'),
  async (req, res, next) => {
    try {
      const accountLink = await createAccountLink(req.user.id);

      res.json({
        onboardingUrl: accountLink.url
      });

    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: error.message,
          code: 'STRIPE_ACCOUNT_NOT_FOUND'
        });
      }
      next(error);
    }
  }
);

// Stripe webhook endpoint (no auth required)
router.post('/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res, next) => {
    try {
      const sig = req.headers['stripe-signature'];

      await handleStripeWebhook(sig, req.body);

      res.json({ received: true });

    } catch (error) {
      console.error('Stripe webhook error:', error.message);
      return res.status(400).json({
        error: error.message,
        code: 'WEBHOOK_ERROR'
      });
    }
  }
);

export default router;