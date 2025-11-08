require('dotenv').config({ path: '../.env' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { query } = require('./src/db');

async function setupStylistStripe(stylistId, userId, email, businessName) {
  try {
    console.log(`\n🔧 Setting up Stripe for: ${businessName} (ID: ${stylistId})`);

    // Create Stripe Express account
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
        platform: 'beautycita',
        business_name: businessName
      }
    });

    console.log(`   ✅ Created Stripe account: ${account.id}`);

    // Update database
    await query(`
      UPDATE stylists
      SET stripe_account_id = $1,
          stripe_account_status = 'pending',
          stripe_onboarding_complete = false,
          stripe_account_created_at = CURRENT_TIMESTAMP,
          stripe_account_updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [account.id, stylistId]);

    console.log(`   ✅ Database updated`);

    // Generate onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `https://beautycita.com/panel?stripe_refresh=true`,
      return_url: `https://beautycita.com/panel?stripe_complete=true`,
      type: 'account_onboarding'
    });

    console.log(`   📝 Onboarding URL: ${accountLink.url}`);
    console.log(`   ⏰ Expires: ${new Date(accountLink.expires_at * 1000).toLocaleString()}`);

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url
    };
  } catch (error) {
    console.error(`   ❌ Error for stylist ${stylistId}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 BeautyCita - Stripe Connect Setup for Stylists\n');
  console.log('================================================\n');

  const stylists = [
    { id: 20, userId: 122, email: 'stylist@example.com', name: 'Stylist Test' },
    { id: 22, userId: 128, email: 'googleplay-stylist@beautycita.com', name: 'Google Play Test Salon' },
    { id: 28, userId: 153, email: 'stylist1@beautycita.com', name: 'Maria Rodriguez' }
  ];

  const results = [];

  for (const s of stylists) {
    const result = await setupStylistStripe(s.id, s.userId, s.email, s.name);
    if (result) {
      results.push({ ...s, ...result });
    }
  }

  console.log('\n\n📊 SUMMARY');
  console.log('================================================\n');
  console.log(`✅ Successfully created ${results.length}/3 Stripe Connect accounts\n`);

  if (results.length > 0) {
    console.log('📧 Send these onboarding links to stylists:\n');
    results.forEach(r => {
      console.log(`${r.name} (${r.email}):`);
      console.log(`${r.onboardingUrl}\n`);
    });
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
