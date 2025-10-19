// Setup fully onboarded test stylist with Stripe Connect
require('dotenv').config({ path: '/var/www/beautycita.com/.env' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function setupTestStylist() {
  try {
    console.log('Creating Stripe Connect Express account for test stylist...');

    // Create Express account with test data
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'MX',
      email: 'coiffeur@beautycita.com',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      individual: {
        first_name: 'Coiffeur',
        last_name: 'Professional',
        email: 'coiffeur@beautycita.com',
        phone: '+523221215551',
      },
      business_profile: {
        name: 'Coiffeur Professional Salon',
        product_description: 'Expert hair styling and beauty services',
        support_phone: '+523221215551',
        url: 'https://beautycita.com/stylist/25',
        mcc: '7230', // Beauty and barber services
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'daily',
          },
        },
      },
      metadata: {
        stylist_id: '25',
        platform: 'BeautyCita',
        created_by: 'test_setup',
        test_mode: 'true'
      }
    });

    console.log(`✓ Stripe account created: ${account.id}`);

    // Update the database with the Stripe account
    const now = new Date();
    await pool.query(`
      UPDATE stylists
      SET stripe_account_id = $1,
          stripe_account_status = $2,
          stripe_onboarding_complete = $3,
          stripe_charges_enabled = $4,
          stripe_payouts_enabled = $5,
          stripe_account_created_at = $6,
          stripe_account_updated_at = $7,
          payment_setup_completed = $8
      WHERE id = $9
    `, [
      account.id,
      'active', // Mark as active for test
      true, // Onboarding complete
      true, // Charges enabled for test
      true, // Payouts enabled for test
      now,
      now,
      true, // Payment setup complete
      25 // stylist_id
    ]);

    console.log('✓ Database updated with Stripe account info');
    console.log('\n=== Test Stylist Setup Complete ===');
    console.log(`Stylist ID: 25`);
    console.log(`Stripe Account ID: ${account.id}`);
    console.log(`Status: Active (Test Mode)`);
    console.log(`Email: coiffeur@beautycita.com`);
    console.log(`Password: SS2juwFjau3n^^r1`);
    console.log(`\nNote: In test mode, this account is ready to receive payments.`);
    console.log(`The 3% platform fee will be automatically applied on payment intents.`);

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('Error setting up test stylist:', error);
    await pool.end();
    process.exit(1);
  }
}

setupTestStylist();
