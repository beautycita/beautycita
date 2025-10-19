#!/usr/bin/env node

/**
 * Standalone RSS Feed Processing Script
 * Runs the RSS content enhancer directly without needing API authentication
 */

const path = require('path');

// Set up environment
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import the RSS enhancer
const rssEnhancer = require('../backend/src/rssContentEnhancer');

async function main() {
  console.log('🚀 Starting RSS Feed Processing...');
  console.log('Time:', new Date().toISOString());

  try {
    const result = await rssEnhancer.processAllFeeds();

    if (result.success) {
      console.log(`✅ Success! Processed ${result.totalProcessed} new articles`);
      process.exit(0);
    } else {
      console.error('❌ RSS processing failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Fatal error during RSS processing:', error);
    process.exit(1);
  }
}

main();
