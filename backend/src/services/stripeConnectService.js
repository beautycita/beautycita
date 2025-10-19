const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { query } = require('../db');

class StripeConnectService {
  constructor() {
    this.platformUrl = process.env.PLATFORM_URL || 'https://beautycita.com';
  }

  /**
   * Create a Stripe Connect Express account for a stylist
   * @param {number} stylistId - The stylist ID from our database
   * @param {Object} stylistData - Stylist personal information
   * @returns {Object} Success/error response with account data
   */
  async createConnectAccount(stylistId, stylistData) {
    try {
      // Check if stylist already has a Connect account
      const existingResult = await query(
        'SELECT stripe_account_id FROM stylists WHERE id = $1',
        [stylistId]
      );

      if (existingResult.rows.length === 0) {
        return {
          success: false,
          error: 'Stylist not found'
        };
      }

      if (existingResult.rows[0].stripe_account_id) {
        return {
          success: false,
          error: 'Stylist already has a Stripe Connect account',
          accountId: existingResult.rows[0].stripe_account_id
        };
      }

      // Create Express account for the stylist
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'MX', // Mexico
        email: stylistData.email,
        capabilities: {
          card_payments: {
            requested: true,
          },
          transfers: {
            requested: true,
          },
        },
        business_type: 'individual',
        individual: {
          first_name: stylistData.first_name,
          last_name: stylistData.last_name,
          email: stylistData.email,
          phone: stylistData.phone,
        },
        business_profile: {
          name: stylistData.business_name,
          product_description: 'Beauty and wellness services',
          support_phone: stylistData.phone,
          url: stylistData.website || `${this.platformUrl}/stylist/${stylistId}`,
          mcc: '7230', // Beauty and barber services MCC
        },
        settings: {
          payouts: {
            schedule: {
              interval: 'daily', // Daily automatic payouts
            },
          },
        },
        metadata: {
          stylist_id: stylistId.toString(),
          platform: 'BeautyCita',
          created_by: 'system'
        }
      });

      const now = new Date();

      // Update stylist record with Connect account information
      await query(`
        UPDATE stylists
        SET stripe_account_id = $1,
            stripe_account_status = $2,
            stripe_onboarding_complete = $3,
            stripe_charges_enabled = $4,
            stripe_payouts_enabled = $5,
            stripe_account_created_at = $6,
            stripe_account_updated_at = $7
        WHERE id = $8
      `, [
        account.id,
        'pending',
        false,
        account.charges_enabled,
        account.payouts_enabled,
        now,
        now,
        stylistId
      ]);

      // Log the account creation event
      await this.logConnectEvent(stylistId, 'account.created', {
        account_id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted
      });

      console.log(`Stripe Connect account created for stylist ${stylistId}: ${account.id}`);

      return {
        success: true,
        account: {
          id: account.id,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          requiresOnboarding: !account.details_submitted
        }
      };

    } catch (error) {
      console.error('Error creating Stripe Connect account:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate onboarding link for stylist to complete Stripe setup
   * @param {number} stylistId - The stylist ID
   * @returns {Object} Onboarding link or error
   */
  async getOnboardingLink(stylistId) {
    try {
      // Get stylist's Stripe account ID
      const stylistResult = await query(
        'SELECT stripe_account_id, stripe_onboarding_complete FROM stylists WHERE id = $1',
        [stylistId]
      );

      if (stylistResult.rows.length === 0) {
        return {
          success: false,
          error: 'Stylist not found'
        };
      }

      const stylist = stylistResult.rows[0];

      if (!stylist.stripe_account_id) {
        return {
          success: false,
          error: 'Stylist does not have a Stripe Connect account'
        };
      }

      if (stylist.stripe_onboarding_complete) {
        return {
          success: false,
          error: 'Stylist has already completed onboarding'
        };
      }

      // Create onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: stylist.stripe_account_id,
        refresh_url: `${this.platformUrl}/admin2/settings?tab=payouts&action=refresh`,
        return_url: `${this.platformUrl}/admin2/settings?tab=payouts&action=success`,
        type: 'account_onboarding',
      });

      return {
        success: true,
        onboardingUrl: accountLink.url,
        expiresAt: new Date(accountLink.expires_at * 1000)
      };

    } catch (error) {
      console.error('Error creating onboarding link:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check and update stylist's Stripe account status
   * @param {number} stylistId - The stylist ID
   * @returns {Object} Current account status
   */
  async checkAccountStatus(stylistId) {
    try {
      // Get stylist's Stripe account ID
      const stylistResult = await query(
        'SELECT stripe_account_id FROM stylists WHERE id = $1',
        [stylistId]
      );

      if (stylistResult.rows.length === 0) {
        return {
          success: false,
          error: 'Stylist not found'
        };
      }

      const stripeAccountId = stylistResult.rows[0].stripe_account_id;

      if (!stripeAccountId) {
        return {
          success: false,
          error: 'Stylist does not have a Stripe Connect account'
        };
      }

      // Retrieve account status from Stripe
      const account = await stripe.accounts.retrieve(stripeAccountId);

      const now = new Date();
      let accountStatus = 'pending';

      // Determine account status
      if (account.charges_enabled && account.payouts_enabled) {
        accountStatus = 'active';
      } else if (account.requirements.disabled_reason) {
        accountStatus = 'disabled';
      } else if (account.requirements.currently_due.length > 0) {
        accountStatus = 'restricted';
      }

      // Update database with current status
      await query(`
        UPDATE stylists
        SET stripe_account_status = $1,
            stripe_onboarding_complete = $2,
            stripe_charges_enabled = $3,
            stripe_payouts_enabled = $4,
            stripe_account_updated_at = $5
        WHERE id = $6
      `, [
        accountStatus,
        account.details_submitted,
        account.charges_enabled,
        account.payouts_enabled,
        now,
        stylistId
      ]);

      return {
        success: true,
        account: {
          id: account.id,
          status: accountStatus,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          onboardingComplete: account.details_submitted,
          requiresAction: account.requirements.currently_due.length > 0,
          requiredFields: account.requirements.currently_due,
          disabledReason: account.requirements.disabled_reason
        }
      };

    } catch (error) {
      console.error('Error checking account status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get Stripe Express dashboard link for stylists
   * @param {number} stylistId - The stylist ID
   * @returns {Object} Dashboard link or error
   */
  async getDashboardLink(stylistId) {
    try {
      // Get stylist's Stripe account ID
      const stylistResult = await query(
        'SELECT stripe_account_id, stripe_onboarding_complete FROM stylists WHERE id = $1',
        [stylistId]
      );

      if (stylistResult.rows.length === 0) {
        return {
          success: false,
          error: 'Stylist not found'
        };
      }

      const stylist = stylistResult.rows[0];

      if (!stylist.stripe_account_id) {
        return {
          success: false,
          error: 'Stylist does not have a Stripe Connect account'
        };
      }

      if (!stylist.stripe_onboarding_complete) {
        return {
          success: false,
          error: 'Stylist must complete onboarding first'
        };
      }

      // Create login link for Express dashboard
      const loginLink = await stripe.accounts.createLoginLink(stylist.stripe_account_id);

      return {
        success: true,
        dashboardUrl: loginLink.url
      };

    } catch (error) {
      console.error('Error creating dashboard link:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle Stripe webhook events related to Connect accounts
   * @param {Object} event - Stripe webhook event
   * @returns {Object} Processing result
   */
  async handleConnectWebhook(event) {
    try {
      console.log(`Processing Connect webhook: ${event.type}`);

      // Log all events for debugging
      await this.logConnectEvent(null, event.type, event.data.object, event.id);

      switch (event.type) {
        case 'account.updated':
          return await this.handleAccountUpdated(event.data.object);

        case 'account.external_account.created':
          return await this.handleExternalAccountCreated(event.data.object);

        case 'capability.updated':
          return await this.handleCapabilityUpdated(event.data.object);

        default:
          console.log(`Unhandled Connect webhook event: ${event.type}`);
          return { success: true, processed: false };
      }

    } catch (error) {
      console.error('Error handling Connect webhook:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle account.updated webhook
   * @param {Object} account - Stripe account object
   */
  async handleAccountUpdated(account) {
    try {
      // Find stylist by Stripe account ID
      const stylistResult = await query(
        'SELECT id FROM stylists WHERE stripe_account_id = $1',
        [account.id]
      );

      if (stylistResult.rows.length === 0) {
        console.log(`No stylist found for Stripe account: ${account.id}`);
        return { success: true, processed: false };
      }

      const stylistId = stylistResult.rows[0].id;

      // Update account status based on Stripe data
      let accountStatus = 'pending';
      if (account.charges_enabled && account.payouts_enabled) {
        accountStatus = 'active';
      } else if (account.requirements.disabled_reason) {
        accountStatus = 'disabled';
      } else if (account.requirements.currently_due.length > 0) {
        accountStatus = 'restricted';
      }

      const now = new Date();

      await query(`
        UPDATE stylists
        SET stripe_account_status = $1,
            stripe_onboarding_complete = $2,
            stripe_charges_enabled = $3,
            stripe_payouts_enabled = $4,
            stripe_account_updated_at = $5
        WHERE stripe_account_id = $6
      `, [
        accountStatus,
        account.details_submitted,
        account.charges_enabled,
        account.payouts_enabled,
        now,
        account.id
      ]);

      // Log the update
      await this.logConnectEvent(stylistId, 'account.updated', {
        account_id: account.id,
        status: accountStatus,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted
      });

      console.log(`Updated account status for stylist ${stylistId}: ${accountStatus}`);

      return { success: true, processed: true };

    } catch (error) {
      console.error('Error handling account.updated:', error);
      throw error;
    }
  }

  /**
   * Log Connect events for tracking and debugging
   * @param {number} stylistId - Stylist ID (can be null for general events)
   * @param {string} eventType - Type of event
   * @param {Object} eventData - Event data
   * @param {string} stripeEventId - Stripe event ID
   */
  async logConnectEvent(stylistId, eventType, eventData, stripeEventId = null) {
    try {
      await query(`
        INSERT INTO stripe_connect_events (
          stylist_id, stripe_event_id, event_type, event_data, processed, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (stripe_event_id) DO NOTHING
      `, [
        stylistId,
        stripeEventId,
        eventType,
        JSON.stringify(eventData),
        stripeEventId ? false : true, // Auto-mark non-webhook events as processed
        new Date()
      ]);
    } catch (error) {
      console.error('Error logging Connect event:', error);
      // Don't throw here to avoid breaking the main process
    }
  }

  /**
   * Handle other Connect webhook events
   */
  async handleExternalAccountCreated(externalAccount) {
    console.log(`External account created: ${externalAccount.id} for account: ${externalAccount.account}`);
    return { success: true, processed: true };
  }

  async handleCapabilityUpdated(capability) {
    console.log(`Capability updated: ${capability.id} status: ${capability.status}`);
    return { success: true, processed: true };
  }

  /**
   * Get stylist's Connect account summary
   * @param {number} stylistId - The stylist ID
   * @returns {Object} Account summary
   */
  async getAccountSummary(stylistId) {
    try {
      const stylistResult = await query(`
        SELECT stripe_account_id, stripe_account_status, stripe_onboarding_complete,
               stripe_charges_enabled, stripe_payouts_enabled, stripe_account_created_at
        FROM stylists WHERE id = $1
      `, [stylistId]);

      if (stylistResult.rows.length === 0) {
        return {
          success: false,
          error: 'Stylist not found'
        };
      }

      const stylist = stylistResult.rows[0];

      if (!stylist.stripe_account_id) {
        return {
          success: true,
          account: {
            exists: false,
            needsCreation: true
          }
        };
      }

      return {
        success: true,
        account: {
          exists: true,
          id: stylist.stripe_account_id,
          status: stylist.stripe_account_status,
          onboardingComplete: stylist.stripe_onboarding_complete,
          chargesEnabled: stylist.stripe_charges_enabled,
          payoutsEnabled: stylist.stripe_payouts_enabled,
          createdAt: stylist.stripe_account_created_at,
          canReceivePayments: stylist.stripe_charges_enabled && stylist.stripe_payouts_enabled
        }
      };

    } catch (error) {
      console.error('Error getting account summary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = StripeConnectService;