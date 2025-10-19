const express = require('express');
const { query } = require('../db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// Create Stripe Connect account for stylist
router.post('/create-account', async (req, res) => {
  try {
    const { stylistId, email } = req.body;
    const userId = req.user?.id || req.body.userId;

    if (!stylistId || !email || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Stylist ID, email, and user ID are required'
      });
    }

    // Verify stylist belongs to user
    const stylistResult = await query(
      'SELECT * FROM stylists WHERE id = $1 AND user_id = $2',
      [stylistId, userId]
    );

    if (stylistResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stylist not found or unauthorized'
      });
    }

    const stylist = stylistResult.rows[0];

    // Check if already has Stripe account
    if (stylist.stripe_account_id) {
      return res.status(400).json({
        success: false,
        message: 'Stylist already has a Stripe Connect account',
        accountId: stylist.stripe_account_id
      });
    }

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      business_type: 'individual',
      metadata: {
        stylist_id: stylistId.toString(),
        user_id: userId.toString(),
        platform: 'beautycita'
      }
    });

    // Save Stripe account ID to database
    await query(`
      UPDATE stylists
      SET stripe_account_id = $1,
          stripe_account_status = 'pending',
          stripe_account_created_at = CURRENT_TIMESTAMP,
          stripe_account_updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [account.id, stylistId]);

    console.log(`Created Stripe Connect account ${account.id} for stylist ${stylistId}`);

    res.json({
      success: true,
      accountId: account.id,
      message: 'Stripe Connect account created successfully'
    });

  } catch (error) {
    console.error('Create Stripe account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create Stripe account',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Generate Stripe Connect onboarding link
router.post('/onboarding-link', async (req, res) => {
  try {
    const { stylistId } = req.body;
    const userId = req.user?.id || req.body.userId;

    if (!stylistId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Stylist ID and user ID are required'
      });
    }

    // Get stylist with Stripe account ID
    const stylistResult = await query(
      'SELECT * FROM stylists WHERE id = $1 AND user_id = $2',
      [stylistId, userId]
    );

    if (stylistResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stylist not found or unauthorized'
      });
    }

    const stylist = stylistResult.rows[0];

    if (!stylist.stripe_account_id) {
      return res.status(400).json({
        success: false,
        message: 'No Stripe account found. Please create one first.'
      });
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stylist.stripe_account_id,
      refresh_url: `${process.env.FRONTEND_URL}/dashboard?stripe_refresh=true`,
      return_url: `${process.env.FRONTEND_URL}/dashboard?stripe_onboarding=success`,
      type: 'account_onboarding'
    });

    res.json({
      success: true,
      url: accountLink.url,
      message: 'Onboarding link generated'
    });

  } catch (error) {
    console.error('Generate onboarding link error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate onboarding link',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Check Stripe Connect account status
router.get('/account-status/:stylistId', async (req, res) => {
  try {
    const { stylistId } = req.params;
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Get stylist
    const stylistResult = await query(
      'SELECT * FROM stylists WHERE id = $1 AND user_id = $2',
      [stylistId, userId]
    );

    if (stylistResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stylist not found or unauthorized'
      });
    }

    const stylist = stylistResult.rows[0];

    if (!stylist.stripe_account_id) {
      return res.json({
        success: true,
        hasAccount: false,
        needsOnboarding: true,
        message: 'No Stripe account found'
      });
    }

    // Fetch account details from Stripe
    const account = await stripe.accounts.retrieve(stylist.stripe_account_id);

    // Update database with latest status
    const chargesEnabled = account.charges_enabled || false;
    const payoutsEnabled = account.payouts_enabled || false;
    const detailsSubmitted = account.details_submitted || false;

    await query(`
      UPDATE stylists
      SET stripe_account_status = $1,
          stripe_charges_enabled = $2,
          stripe_payouts_enabled = $3,
          stripe_onboarding_complete = $4,
          stripe_account_updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
    `, [
      detailsSubmitted ? 'active' : 'pending',
      chargesEnabled,
      payoutsEnabled,
      detailsSubmitted,
      stylistId
    ]);

    res.json({
      success: true,
      hasAccount: true,
      accountId: stylist.stripe_account_id,
      chargesEnabled,
      payoutsEnabled,
      detailsSubmitted,
      needsOnboarding: !detailsSubmitted,
      requirements: account.requirements,
      message: detailsSubmitted
        ? 'Stripe account is fully set up'
        : 'Onboarding incomplete'
    });

  } catch (error) {
    console.error('Check account status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check account status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Generate login link for Stripe Dashboard
router.post('/dashboard-link', async (req, res) => {
  try {
    const { stylistId } = req.body;
    const userId = req.user?.id || req.body.userId;

    if (!stylistId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Stylist ID and user ID are required'
      });
    }

    // Get stylist
    const stylistResult = await query(
      'SELECT * FROM stylists WHERE id = $1 AND user_id = $2',
      [stylistId, userId]
    );

    if (stylistResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stylist not found or unauthorized'
      });
    }

    const stylist = stylistResult.rows[0];

    if (!stylist.stripe_account_id) {
      return res.status(400).json({
        success: false,
        message: 'No Stripe account found'
      });
    }

    // Create login link
    const loginLink = await stripe.accounts.createLoginLink(stylist.stripe_account_id);

    res.json({
      success: true,
      url: loginLink.url,
      message: 'Dashboard link generated'
    });

  } catch (error) {
    console.error('Generate dashboard link error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate dashboard link',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Webhook handler for Stripe Connect events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_CONNECT_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`Received Stripe Connect webhook: ${event.type}`);

  try {
    // Handle the event
    switch (event.type) {
      case 'account.updated':
        const account = event.data.object;
        await query(`
          UPDATE stylists
          SET stripe_account_status = $1,
              stripe_charges_enabled = $2,
              stripe_payouts_enabled = $3,
              stripe_onboarding_complete = $4,
              stripe_account_updated_at = CURRENT_TIMESTAMP
          WHERE stripe_account_id = $5
        `, [
          account.details_submitted ? 'active' : 'pending',
          account.charges_enabled || false,
          account.payouts_enabled || false,
          account.details_submitted || false,
          account.id
        ]);
        console.log(`Updated account status for ${account.id}`);
        break;

      case 'account.application.deauthorized':
        // Handle account disconnection
        const deauthAccount = event.data.object;
        await query(`
          UPDATE stylists
          SET stripe_account_status = 'deauthorized',
              stripe_account_updated_at = CURRENT_TIMESTAMP
          WHERE stripe_account_id = $1
        `, [deauthAccount.id]);
        console.log(`Account deauthorized: ${deauthAccount.id}`);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
