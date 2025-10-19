#!/usr/bin/env node

/**
 * BTCPay Server Theme Uploader
 * Uploads BeautyCita custom themes to BTCPay Server via API
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const BTCPAY_URL = process.env.BTCPAY_URL;
const API_KEY = process.env.BTCPAY_API_KEY;
const STORE_ID = process.env.BTCPAY_STORE_ID;

// Read CSS files
const checkoutCSS = fs.readFileSync(
  path.join(__dirname, 'beautycita-checkout.css'),
  'utf8'
);

const backendCSS = fs.readFileSync(
  path.join(__dirname, 'beautycita-backend.css'),
  'utf8'
);

async function uploadCheckoutTheme() {
  console.log('📦 Uploading checkout theme to BTCPay Server...\n');

  try {
    // Get current store settings
    const getResponse = await axios.get(
      `${BTCPAY_URL}/api/v1/stores/${STORE_ID}`,
      {
        headers: {
          'Authorization': `token ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const currentSettings = getResponse.data;
    console.log('✅ Retrieved current store settings');

    // Update store with checkout CSS
    const updatePayload = {
      ...currentSettings,
      checkoutAppearance: {
        ...currentSettings.checkoutAppearance,
        customCSS: checkoutCSS,
        customLogo: currentSettings.checkoutAppearance?.customLogo || null
      }
    };

    const updateResponse = await axios.put(
      `${BTCPAY_URL}/api/v1/stores/${STORE_ID}`,
      updatePayload,
      {
        headers: {
          'Authorization': `token ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Checkout theme uploaded successfully!');
    console.log(`   - Custom CSS: ${checkoutCSS.length} characters`);
    console.log(`   - Store ID: ${STORE_ID}\n`);

    return true;
  } catch (error) {
    console.error('❌ Error uploading checkout theme:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || error.response.statusText}`);
      console.error(`   Details:`, error.response.data);
    } else {
      console.error(`   ${error.message}`);
    }
    return false;
  }
}

async function uploadServerTheme() {
  console.log('📦 Uploading server-wide backend theme...\n');

  try {
    // First, try to get server settings
    const getResponse = await axios.get(
      `${BTCPAY_URL}/api/v1/server/policies`,
      {
        headers: {
          'Authorization': `token ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Retrieved server policies');

    // Try to update server branding
    // Note: This endpoint might require server admin permissions
    try {
      await axios.put(
        `${BTCPAY_URL}/api/v1/server/branding`,
        {
          customCSS: backendCSS
        },
        {
          headers: {
            'Authorization': `token ${API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Server backend theme uploaded successfully!');
      console.log(`   - Custom CSS: ${backendCSS.length} characters\n`);
      return true;
    } catch (updateError) {
      if (updateError.response?.status === 403 || updateError.response?.status === 401) {
        console.log('⚠️  Server-wide theme requires admin access');
        console.log('   Please upload manually:');
        console.log('   1. Log into BTCPay Server as admin');
        console.log('   2. Go to: Server Settings → Branding');
        console.log('   3. Paste contents of: btcpay-customization/beautycita-backend.css');
        console.log('   4. Save\n');

        // Save instructions to file
        fs.writeFileSync(
          path.join(__dirname, 'MANUAL_UPLOAD_INSTRUCTIONS.txt'),
          `BTCPay Server Backend Theme - Manual Upload Instructions
==========================================================

Your API key doesn't have server admin permissions.
Please upload the backend theme manually:

1. Log into BTCPay Server at: ${BTCPAY_URL}
2. Navigate to: Server Settings → Branding
3. Find the "Custom CSS (Server-wide)" field
4. Copy and paste the contents of:
   ${path.join(__dirname, 'beautycita-backend.css')}
5. Click Save

The CSS file contains ${backendCSS.length} characters and will style:
- Admin dashboard
- Navigation sidebar
- Forms and tables
- All backend pages

Brand colors used:
- Pink: #ec4899
- Purple: #9333ea
- Gradient: linear-gradient(to right, #ec4899, #9333ea)
`
        );

        return false;
      }
      throw updateError;
    }
  } catch (error) {
    console.error('❌ Error uploading server theme:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || error.response.statusText}`);
    } else {
      console.error(`   ${error.message}`);
    }
    return false;
  }
}

async function main() {
  console.log('\n🎨 BeautyCita BTCPay Server Theme Uploader\n');
  console.log('='.repeat(50));
  console.log(`BTCPay URL: ${BTCPAY_URL}`);
  console.log(`Store ID: ${STORE_ID}`);
  console.log('='.repeat(50));
  console.log('');

  // Upload checkout theme (store-level)
  const checkoutSuccess = await uploadCheckoutTheme();

  // Upload server theme (server-level, may require admin)
  const serverSuccess = await uploadServerTheme();

  // Summary
  console.log('='.repeat(50));
  console.log('📊 Summary:');
  console.log(`   Checkout Theme: ${checkoutSuccess ? '✅ Uploaded' : '❌ Failed'}`);
  console.log(`   Backend Theme: ${serverSuccess ? '✅ Uploaded' : '⚠️  Manual upload needed'}`);
  console.log('='.repeat(50));
  console.log('');

  if (checkoutSuccess) {
    console.log('🎉 Your BTCPay checkout page now has BeautyCita styling!');
    console.log(`   View it at: ${BTCPAY_URL}/stores/${STORE_ID}`);
  }

  if (!serverSuccess) {
    console.log('📝 Check MANUAL_UPLOAD_INSTRUCTIONS.txt for backend theme setup');
  }

  console.log('');
  process.exit(checkoutSuccess ? 0 : 1);
}

// Run the script
main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
