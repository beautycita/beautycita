require('dotenv').config({ path: '../.env' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { query } = require('./src/db');

/**
 * In TEST MODE, we can mark accounts as onboarding complete without
 * going through the full Stripe Connect flow. This is for development only.
 */

async function completeOnboardingForTesting(stylistId, stripeAccountId) {
  try {
    console.log(`\n🔧 Completing onboarding for stylist ${stylistId}`);

    // In test mode, update the account to enable charges and payouts
    const account = await stripe.accounts.update(stripeAccountId, {
      charges_enabled: true,
      payouts_enabled: true
    });

    console.log(`   ✅ Stripe account updated: charges=${account.charges_enabled}, payouts=${account.payouts_enabled}`);

    // Update database to mark as complete
    await query(`
      UPDATE stylists
      SET stripe_onboarding_complete = true,
          stripe_account_status = 'active',
          stripe_account_updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [stylistId]);

    console.log(`   ✅ Database updated - onboarding marked complete`);

    return true;
  } catch (error) {
    console.error(`   ❌ Error for stylist ${stylistId}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 BeautyCita - Complete Stripe Onboarding (TEST MODE)\n');
  console.log('================================================\n');

  // Get stylists with Stripe accounts but incomplete onboarding
  const result = await query(`
    SELECT id, business_name, stripe_account_id, stripe_onboarding_complete
    FROM stylists
    WHERE stripe_account_id IS NOT NULL
      AND (stripe_onboarding_complete = false OR stripe_onboarding_complete IS NULL)
    ORDER BY id
  `);

  const stylists = result.rows;

  if (stylists.length === 0) {
    console.log('✅ All stylists have completed Stripe onboarding!');
    process.exit(0);
  }

  console.log(`Found ${stylists.length} stylists with incomplete onboarding:\n`);

  let completed = 0;
  for (const s of stylists) {
    console.log(`${s.business_name} (ID: ${s.id})`);
    const success = await completeOnboardingForTesting(s.id, s.stripe_account_id);
    if (success) completed++;
  }

  console.log('\n\n📊 SUMMARY');
  console.log('================================================\n');
  console.log(`✅ Completed onboarding for ${completed}/${stylists.length} stylists\n`);
  console.log('⚠️  NOTE: This is TEST MODE only. In production, stylists must');
  console.log('   complete the full Stripe Connect onboarding flow.\n');

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
