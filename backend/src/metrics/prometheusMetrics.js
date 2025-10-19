const promClient = require('prom-client');

// Create a Registry which registers the metrics
const register = new promClient.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'beautycita-backend',
  version: process.env.npm_package_version || '1.0.0'
});

// Enable the collection of default metrics
promClient.collectDefaultMetrics({ register });

// ==================== HTTP METRICS ====================
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestsActive = new promClient.Gauge({
  name: 'http_requests_active',
  help: 'Number of active HTTP requests'
});

// ==================== BUSINESS METRICS ====================
const bookingsTotal = new promClient.Counter({
  name: 'beautycita_bookings_total',
  help: 'Total number of booking attempts',
  labelNames: ['status', 'service_type']
});

const bookingsCompleted = new promClient.Counter({
  name: 'beautycita_bookings_completed_total',
  help: 'Total number of completed bookings',
  labelNames: ['service_type', 'stylist_id']
});

const bookingsFailed = new promClient.Counter({
  name: 'beautycita_bookings_failed_total',
  help: 'Total number of failed bookings',
  labelNames: ['reason', 'service_type']
});

const bookingAttempts = new promClient.Counter({
  name: 'beautycita_booking_attempts_total',
  help: 'Total number of booking page visits',
  labelNames: ['source']
});

const paymentsTotal = new promClient.Counter({
  name: 'beautycita_payments_total',
  help: 'Total number of payment attempts',
  labelNames: ['status', 'method']
});

const paymentsFailed = new promClient.Counter({
  name: 'beautycita_payments_failed_total',
  help: 'Total number of failed payments',
  labelNames: ['reason', 'method']
});

const revenueTotal = new promClient.Counter({
  name: 'beautycita_revenue_total',
  help: 'Total revenue in cents',
  labelNames: ['service_type', 'payment_method']
});

const activeUsers = new promClient.Gauge({
  name: 'beautycita_active_users',
  help: 'Number of currently active users'
});

const registrationsTotal = new promClient.Counter({
  name: 'beautycita_registrations_total',
  help: 'Total number of user registrations',
  labelNames: ['user_type', 'registration_method']
});

const authFailures = new promClient.Counter({
  name: 'beautycita_auth_failures_total',
  help: 'Total number of authentication failures',
  labelNames: ['reason', 'method']
});

// ==================== DATABASE METRICS ====================
const dbConnectionsActive = new promClient.Gauge({
  name: 'beautycita_db_connections_active',
  help: 'Number of active database connections'
});

const dbQueryDuration = new promClient.Histogram({
  name: 'beautycita_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5]
});

const dbQueriesTotal = new promClient.Counter({
  name: 'beautycita_db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table', 'status']
});

// ==================== AI/EXTERNAL SERVICE METRICS ====================
const aphroditeRequestsTotal = new promClient.Counter({
  name: 'beautycita_aphrodite_requests_total',
  help: 'Total number of Aphrodite AI requests',
  labelNames: ['endpoint', 'status']
});

const aphroditeResponseTime = new promClient.Histogram({
  name: 'beautycita_aphrodite_response_time_seconds',
  help: 'Response time for Aphrodite AI requests',
  labelNames: ['endpoint'],
  buckets: [0.5, 1, 2, 5, 10, 30]
});

const stripeRequestsTotal = new promClient.Counter({
  name: 'beautycita_stripe_requests_total',
  help: 'Total number of Stripe API requests',
  labelNames: ['operation', 'status']
});

const twilioSmsTotal = new promClient.Counter({
  name: 'beautycita_twilio_sms_total',
  help: 'Total number of SMS sent via Twilio',
  labelNames: ['type', 'status']
});

// ==================== SUPPORT METRICS ====================
const supportTicketsOpen = new promClient.Gauge({
  name: 'beautycita_support_tickets_open',
  help: 'Number of open support tickets'
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestsActive);
register.registerMetric(bookingsTotal);
register.registerMetric(bookingsCompleted);
register.registerMetric(bookingsFailed);
register.registerMetric(bookingAttempts);
register.registerMetric(paymentsTotal);
register.registerMetric(paymentsFailed);
register.registerMetric(revenueTotal);
register.registerMetric(activeUsers);
register.registerMetric(registrationsTotal);
register.registerMetric(authFailures);
register.registerMetric(dbConnectionsActive);
register.registerMetric(dbQueryDuration);
register.registerMetric(dbQueriesTotal);
register.registerMetric(aphroditeRequestsTotal);
register.registerMetric(aphroditeResponseTime);
register.registerMetric(stripeRequestsTotal);
register.registerMetric(twilioSmsTotal);
register.registerMetric(supportTicketsOpen);

// ==================== MIDDLEWARE FUNCTION ====================
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  httpRequestsActive.inc();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;

    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);

    httpRequestsTotal
      .labels(req.method, route, res.statusCode)
      .inc();

    httpRequestsActive.dec();
  });

  next();
};

// ==================== BUSINESS METRIC HELPERS ====================
const trackBooking = (status, serviceType, stylistId = null, reason = null) => {
  try {
    bookingsTotal.labels(status, serviceType).inc();

    if (status === 'completed') {
      bookingsCompleted.labels(serviceType, stylistId || 'unknown').inc();
    } else if (status === 'failed') {
      bookingsFailed.labels(reason || 'unknown', serviceType).inc();
    }
  } catch (error) {
    console.error('Error tracking booking metric:', error);
  }
};

const trackPayment = (status, method, amount = 0, serviceType = null, reason = null) => {
  try {
    paymentsTotal.labels(status, method).inc();

    if (status === 'succeeded' && amount > 0) {
      revenueTotal.labels(serviceType || 'unknown', method).inc(amount);
    } else if (status === 'failed') {
      paymentsFailed.labels(reason || 'unknown', method).inc();
    }
  } catch (error) {
    console.error('Error tracking payment metric:', error);
  }
};

const trackRegistration = (userType, method) => {
  try {
    registrationsTotal.labels(userType, method).inc();
  } catch (error) {
    console.error('Error tracking registration metric:', error);
  }
};

const trackAuthFailure = (reason, method) => {
  try {
    authFailures.labels(reason, method).inc();
  } catch (error) {
    console.error('Error tracking auth failure metric:', error);
  }
};

const trackDbQuery = (operation, table, status, duration) => {
  try {
    dbQueriesTotal.labels(operation, table, status).inc();
    if (duration) {
      dbQueryDuration.labels(operation, table).observe(duration);
    }
  } catch (error) {
    console.error('Error tracking database metric:', error);
  }
};

const trackExternalAPI = (service, operation, status, duration = null) => {
  try {
    switch (service) {
      case 'aphrodite':
        aphroditeRequestsTotal.labels(operation, status).inc();
        if (duration) {
          aphroditeResponseTime.labels(operation).observe(duration);
        }
        break;
      case 'stripe':
        stripeRequestsTotal.labels(operation, status).inc();
        break;
      case 'twilio':
        twilioSmsTotal.labels(operation, status).inc();
        break;
    }
  } catch (error) {
    console.error(`Error tracking ${service} metric:`, error);
  }
};

// ==================== PERIODIC METRICS COLLECTION ====================
const updateActiveUsers = async () => {
  try {
    // This would query your database for active sessions
    // For now, we'll simulate with a placeholder
    const activeUserCount = Math.floor(Math.random() * 100); // Replace with actual query
    activeUsers.set(activeUserCount);
  } catch (error) {
    console.error('Error updating active users metric:', error);
  }
};

const updateSupportTickets = async () => {
  try {
    // This would query your support system
    // For now, we'll simulate with a placeholder
    const openTickets = Math.floor(Math.random() * 20); // Replace with actual query
    supportTicketsOpen.set(openTickets);
  } catch (error) {
    console.error('Error updating support tickets metric:', error);
  }
};

// Update metrics every 30 seconds
setInterval(() => {
  updateActiveUsers();
  updateSupportTickets();
}, 30000);

module.exports = {
  register,
  metricsMiddleware,
  trackBooking,
  trackPayment,
  trackRegistration,
  trackAuthFailure,
  trackDbQuery,
  trackExternalAPI,
  metrics: {
    httpRequestDuration,
    httpRequestsTotal,
    httpRequestsActive,
    bookingsTotal,
    bookingsCompleted,
    bookingsFailed,
    bookingAttempts,
    paymentsTotal,
    paymentsFailed,
    revenueTotal,
    activeUsers,
    registrationsTotal,
    authFailures,
    dbConnectionsActive,
    dbQueryDuration,
    dbQueriesTotal,
    aphroditeRequestsTotal,
    aphroditeResponseTime,
    stripeRequestsTotal,
    twilioSmsTotal,
    supportTicketsOpen
  }
};