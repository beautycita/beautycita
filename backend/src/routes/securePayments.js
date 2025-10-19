const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { query } = require('../db');
const router = express.Router();

// Middleware to ensure user authentication
const requireAuth = (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  next();
};

// Get user's Stripe customer ID or create one
const getOrCreateStripeCustomer = async (userId) => {
  try {
    // Check if user already has a Stripe customer ID
    const userResult = await query(
      'SELECT stripe_customer_id, email, first_name, last_name FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    if (user.stripe_customer_id) {
      return user.stripe_customer_id;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.first_name} ${user.last_name}`.trim(),
      metadata: {
        user_id: userId.toString(),
        platform: 'beautycita'
      }
    });

    // Store Stripe customer ID in database
    await query(
      'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
      [customer.id, userId]
    );

    return customer.id;
  } catch (error) {
    console.error('Error getting/creating Stripe customer:', error);
    throw error;
  }
};

// GET /api/payments/methods - Fetch user's payment methods
router.get('/methods', requireAuth, async (req, res) => {
  try {
    const customerId = await getOrCreateStripeCustomer(req.userId);

    // Fetch payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    // Get default payment method
    const customer = await stripe.customers.retrieve(customerId);
    const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method;

    // Format payment methods for frontend
    const formattedMethods = paymentMethods.data.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: pm.card,
      billing_details: pm.billing_details,
      created: pm.created,
      is_default: pm.id === defaultPaymentMethodId
    }));

    res.json({
      success: true,
      paymentMethods: formattedMethods
    });

  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment methods',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/payments/setup-intent - Create setup intent for adding payment method
router.post('/setup-intent', requireAuth, async (req, res) => {
  try {
    const customerId = await getOrCreateStripeCustomer(req.userId);

    // Create setup intent for future payments
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session', // For future payments
      metadata: {
        user_id: req.userId.toString()
      }
    });

    res.json({
      success: true,
      client_secret: setupIntent.client_secret,
      setup_intent_id: setupIntent.id
    });

  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create setup intent',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/payments/methods/:paymentMethodId - Delete payment method
router.delete('/methods/:paymentMethodId', requireAuth, async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const customerId = await getOrCreateStripeCustomer(req.userId);

    // Verify payment method belongs to user
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (paymentMethod.customer !== customerId) {
      return res.status(403).json({
        success: false,
        message: 'Payment method does not belong to user'
      });
    }

    // Detach payment method from customer (effectively deletes it)
    await stripe.paymentMethods.detach(paymentMethodId);

    res.json({
      success: true,
      message: 'Payment method removed successfully'
    });

  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment method',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/payments/methods/:paymentMethodId/default - Set default payment method
router.put('/methods/:paymentMethodId/default', requireAuth, async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const customerId = await getOrCreateStripeCustomer(req.userId);

    // Verify payment method belongs to user
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (paymentMethod.customer !== customerId) {
      return res.status(403).json({
        success: false,
        message: 'Payment method does not belong to user'
      });
    }

    // Update customer's default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });

    res.json({
      success: true,
      message: 'Default payment method updated successfully'
    });

  } catch (error) {
    console.error('Error setting default payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set default payment method',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/payments/verify-method - Verify payment method after setup
router.post('/verify-method', requireAuth, async (req, res) => {
  try {
    const { setup_intent_id } = req.body;

    if (!setup_intent_id) {
      return res.status(400).json({
        success: false,
        message: 'Setup intent ID is required'
      });
    }

    // Retrieve setup intent to get payment method
    const setupIntent = await stripe.setupIntents.retrieve(setup_intent_id);

    if (setupIntent.status === 'succeeded') {
      res.json({
        success: true,
        payment_method_id: setupIntent.payment_method,
        message: 'Payment method verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment method verification failed',
        status: setupIntent.status
      });
    }

  } catch (error) {
    console.error('Error verifying payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment method',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/payments/compliance-info - Get PCI compliance information
router.get('/compliance-info', (req, res) => {
  res.json({
    success: true,
    compliance: {
      pci_dss_level: 1,
      certification: 'PCI DSS Level 1 Service Provider',
      processor: 'Stripe',
      security_standards: [
        'PCI DSS Level 1',
        'SOC 1 Type 2',
        'SOC 2 Type 2',
        'ISO 27001'
      ],
      data_encryption: 'AES-256',
      tls_version: 'TLS 1.2+',
      security_notice: 'BeautyCita never stores credit card information. All payment data is securely processed by Stripe, a certified PCI DSS Level 1 service provider.'
    }
  });
});

module.exports = router;