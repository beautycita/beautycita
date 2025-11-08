require('dotenv').config({ path: '../.env' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { query } = require('./src/db');

/**
 * Fill in Stripe Express accounts with test data to activate them
 * This is for TEST MODE only - in production, stylists complete this via Stripe's onboarding UI
 */

async function fillAccountData(accountId, businessName) {
  try {
    console.log(`\n🔧 Activating account for: ${businessName}`);
    console.log(`   Account ID: ${accountId}`);

    // Update account with test data
    const account = await stripe.accounts.update(accountId, {
      business_type: 'individual',
      business_profile: {
        mcc: '7230', // Beauty shops
        url: 'https://beautycita.com',
        product_description: 'Professional beauty services'
      },
      individual: {
        first_name: 'Test',
        last_name: 'Stylist',
        email: 'test@beautycita.com',
        phone: '+16505551234',
        dob: {
          day: 1,
          month: 1,
          year: 1990
        },
        address: {
          line1: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          postal_code: '94102',
          country: 'US'
        },
        // Test SSN for Stripe test mode
        id_number: '000000000'
      },
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip: '127.0.0.1'
      }
    });

    console.log(`   ✅ Account data updated`);

    // Add external account (test bank account)
    await stripe.accounts.createExternalAccount(accountId, {
      external_account: {
        object: 'bank_account',
        country: 'US',
        currency: 'usd',
        account_holder_name: 'Test Stylist',
        account_holder_type: 'individual',
        routing_number: '110000000', // Test routing number
        account_number: '000123456789' // Test account number
      }
    });

    console.log(`   ✅ Bank account added`);

    // Retrieve updated account to check status
    const updatedAccount = await stripe.accounts.retrieve(accountId);

    console.log(`   📊 Charges enabled: ${updatedAccount.charges_enabled}`);
    console.log(`   📊 Payouts enabled: ${updatedAccount.payouts_enabled}`);

    if (updatedAccount.charges_enabled) {
      // Update database
      await query(`
        UPDATE stylists
        SET stripe_onboarding_complete = true,
            stripe_account_status = 'active',
            stripe_account_updated_at = CURRENT_TIMESTAMP
        WHERE stripe_account_id = $1
      `, [accountId]);

      console.log(`   ✅ Database updated - account ACTIVE`);
      return true;
    } else {
      console.log(`   ⚠️  Account not yet active. Requirements: ${JSON.stringify(updatedAccount.requirements.currently_due)}`);
      return false;
    }

  } catch (error) {
    console.error(`   ❌ Error:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 BeautyCita - Activate Stripe Test Accounts\n');
  console.log('================================================\n');
  console.log('⚠️  TEST MODE: Filling accounts with test data\n');

  const accounts = [
    { id: 'acct_1SR8al0oxpQ2ZpMC', name: 'Stylist Test' },
    { id: 'acct_1SR8ao03FxsKKsOV', name: 'Google Play Test Salon' },
    { id: 'acct_1SR8ar1AsyXyDEND', name: 'Maria Rodriguez' }
  ];

  let activated = 0;

  for (const acc of accounts) {
    const success = await fillAccountData(acc.id, acc.name);
    if (success) activated++;
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }

  console.log('\n\n📊 SUMMARY');
  console.log('================================================\n');
  console.log(`✅ Activated ${activated}/${accounts.length} Stripe accounts\n`);

  if (activated === accounts.length) {
    console.log('🎉 All stylists can now receive payments!\n');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
