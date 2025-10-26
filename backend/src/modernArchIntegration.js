/**
 * Modern Architecture Integration Module
 *
 * Integrates:
 * - GraphQL API
 * - BFF Mobile API
 * - API Versioning
 * - Redis Bull Message Queues
 * - Event Sourcing
 */

const express = require('express');

/**
 * Initialize modern architecture features
 * @param {Express} app - Express application instance
 */
async function initializeModernArchitecture(app) {
  console.log('🚀 Initializing modern architecture features...');

  try {
    // ==================== GRAPHQL SERVER ====================
    console.log('📊 Setting up GraphQL server...');

    const { createGraphQLServer } = require('./graphqlServer');
    await createGraphQLServer(app);

    console.log('✅ GraphQL server mounted at /graphql');

    // ==================== BFF MOBILE API ====================
    console.log('📱 Setting up Mobile BFF API...');

    const mobileApi = require('./routes/mobileApi');
    app.use('/api/mobile/v1', mobileApi);

    console.log('✅ Mobile BFF API mounted at /api/mobile/v1');

    // ==================== API VERSIONING ====================
    console.log('🔢 Setting up API versioning...');

    const { detectApiVersion, checkDeprecation, migrationGuideRouter } = require('./apiVersioning');

    // Apply version detection middleware to all API routes
    app.use('/api', detectApiVersion);
    app.use('/api', checkDeprecation);

    // Mount migration guide
    app.use('/api', migrationGuideRouter());

    console.log('✅ API versioning enabled with migration guide at /api/migration-guide');

    // ==================== MESSAGE QUEUES ====================
    console.log('📬 Initializing Redis Bull message queues...');

    const queueService = require('./queueService');

    // Initialize scheduled jobs (replaces cron)
    await queueService.initializeScheduledJobs();

    // Queue monitoring endpoint
    app.get('/api/admin/queues/stats', async (req, res) => {
      try {
        const stats = await queueService.getQueueStats();
        res.json({
          success: true,
          queues: stats,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch queue stats'
        });
      }
    });

    console.log('✅ Message queues initialized with 7 queues');
    console.log('   - Email notifications queue');
    console.log('   - Booking reminders queue');
    console.log('   - Payment processing queue');
    console.log('   - Booking expiration queue');
    console.log('   - Analytics queue');
    console.log('   - Calendar sync queue');
    console.log('   - Cache warming queue');

    // ==================== EVENT SOURCING INFO ====================
    console.log('📜 Event sourcing tables available:');
    console.log('   - booking_events (audit trail)');
    console.log('   - payment_events');
    console.log('   - booking_snapshots (performance)');

    // ==================== HEALTH CHECK ====================
    app.get('/api/health/modern-architecture', (req, res) => {
      res.json({
        success: true,
        features: {
          graphql: {
            status: 'active',
            endpoint: '/graphql'
          },
          mobileBff: {
            status: 'active',
            endpoint: '/api/mobile/v1'
          },
          apiVersioning: {
            status: 'active',
            versions: ['v1', 'v2'],
            migrationGuide: '/api/migration-guide'
          },
          messageQueues: {
            status: 'active',
            queues: 7,
            statsEndpoint: '/api/admin/queues/stats'
          },
          eventSourcing: {
            status: 'active',
            tables: ['booking_events', 'payment_events', 'booking_snapshots']
          }
        },
        timestamp: new Date().toISOString()
      });
    });

    console.log('✅ Health check endpoint: /api/health/modern-architecture');
    console.log('🎉 Modern architecture initialization complete!\n');
    console.log('📚 Available endpoints:');
    console.log('   - GraphQL:          /graphql');
    console.log('   - Mobile Dashboard: /api/mobile/v1/dashboard');
    console.log('   - Mobile Search:    /api/mobile/v1/stylists/search');
    console.log('   - Mobile Booking:   /api/mobile/v1/bookings');
    console.log('   - Migration Guide:  /api/migration-guide');
    console.log('   - Queue Stats:      /api/admin/queues/stats');
    console.log('   - Health Check:     /api/health/modern-architecture\n');

  } catch (error) {
    console.error('❌ Error initializing modern architecture:', error);
    throw error;
  }
}

/**
 * Graceful shutdown for queues and connections
 */
async function shutdownModernArchitecture() {
  console.log('\n🔄 Shutting down modern architecture...');

  try {
    const queueService = require('./queueService');

    // Close all queues
    for (const [name, queue] of Object.entries(queueService.queues)) {
      await queue.close();
      console.log(`✅ Closed queue: ${name}`);
    }

    console.log('✅ Modern architecture shutdown complete');
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', shutdownModernArchitecture);
process.on('SIGINT', shutdownModernArchitecture);

module.exports = {
  initializeModernArchitecture,
  shutdownModernArchitecture
};
