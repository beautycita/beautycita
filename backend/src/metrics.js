const promClient = require('prom-client');

// Create a Registry to register metrics
const register = new promClient.Registry();

// Add default metrics (event loop lag, memory usage, GC stats)
promClient.collectDefaultMetrics({ register });

// === HTTP Metrics ===

// Counter: Total HTTP requests
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Histogram: HTTP request duration
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10], // 10ms, 50ms, 100ms, 500ms, 1s, 2s, 5s, 10s
  registers: [register],
});

// Gauge: Active requests
const httpRequestsActive = new promClient.Gauge({
  name: 'http_requests_active',
  help: 'Number of active HTTP requests',
  labelNames: ['method', 'route'],
  registers: [register],
});

// === Business Metrics ===

// Counter: Bookings created
const bookingsCreated = new promClient.Counter({
  name: 'bookings_created_total',
  help: 'Total number of bookings created',
  labelNames: ['status'], // PENDING, CONFIRMED, etc.
  registers: [register],
});

// Counter: Bookings by status
const bookingStatusChanges = new promClient.Counter({
  name: 'booking_status_changes_total',
  help: 'Total number of booking status changes',
  labelNames: ['from_status', 'to_status'],
  registers: [register],
});

// Counter: Payments processed
const paymentsProcessed = new promClient.Counter({
  name: 'payments_processed_total',
  help: 'Total number of payments processed',
  labelNames: ['status', 'payment_method'], // success/failed, stripe/btcpay
  registers: [register],
});

// Histogram: Payment amounts
const paymentAmounts = new promClient.Histogram({
  name: 'payment_amount_dollars',
  help: 'Payment amounts in dollars',
  labelNames: ['payment_method'],
  buckets: [10, 20, 50, 100, 200, 500, 1000], // $10, $20, $50, etc.
  registers: [register],
});

// Counter: SMS sent
const smsSent = new promClient.Counter({
  name: 'sms_sent_total',
  help: 'Total number of SMS messages sent',
  labelNames: ['type', 'status'], // verification/notification, success/failed
  registers: [register],
});

// Counter: Emails sent
const emailsSent = new promClient.Counter({
  name: 'emails_sent_total',
  help: 'Total number of emails sent',
  labelNames: ['type', 'status'], // confirmation/reminder/marketing, success/failed
  registers: [register],
});

// Counter: User registrations
const userRegistrations = new promClient.Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
  labelNames: ['role', 'auth_method'], // CLIENT/STYLIST, email/google/webauthn
  registers: [register],
});

// Gauge: Active users
const activeUsers = new promClient.Gauge({
  name: 'active_users',
  help: 'Number of currently active users',
  labelNames: ['role'], // CLIENT, STYLIST, ADMIN
  registers: [register],
});

// === Database Metrics ===

// Gauge: Database connections
const dbConnections = new promClient.Gauge({
  name: 'db_connections_active',
  help: 'Number of active database connections',
  registers: [register],
});

// Counter: Database queries
const dbQueries = new promClient.Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation'], // SELECT, INSERT, UPDATE, DELETE
  registers: [register],
});

// Histogram: Database query duration
const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2], // 1ms, 10ms, 50ms, 100ms, 500ms, 1s, 2s
  registers: [register],
});

// Counter: Database errors
const dbErrors = new promClient.Counter({
  name: 'db_errors_total',
  help: 'Total number of database errors',
  labelNames: ['error_type'], // timeout, connection_error, query_error
  registers: [register],
});

// === Redis Metrics ===

// Gauge: Redis connections
const redisConnections = new promClient.Gauge({
  name: 'redis_connections_active',
  help: 'Number of active Redis connections',
  registers: [register],
});

// Counter: Redis operations
const redisOperations = new promClient.Counter({
  name: 'redis_operations_total',
  help: 'Total number of Redis operations',
  labelNames: ['operation'], // get, set, del, etc.
  registers: [register],
});

// Histogram: Redis operation duration
const redisOperationDuration = new promClient.Histogram({
  name: 'redis_operation_duration_seconds',
  help: 'Duration of Redis operations in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5], // 1ms, 10ms, 50ms, 100ms, 500ms
  registers: [register],
});

// === Queue Metrics ===

// Gauge: Queue job counts
const queueJobsWaiting = new promClient.Gauge({
  name: 'queue_jobs_waiting',
  help: 'Number of jobs waiting in queue',
  labelNames: ['queue_name'], // email, reminder, payment, etc.
  registers: [register],
});

const queueJobsActive = new promClient.Gauge({
  name: 'queue_jobs_active',
  help: 'Number of jobs currently being processed',
  labelNames: ['queue_name'],
  registers: [register],
});

const queueJobsFailed = new promClient.Counter({
  name: 'queue_jobs_failed_total',
  help: 'Total number of failed queue jobs',
  labelNames: ['queue_name', 'failure_reason'],
  registers: [register],
});

const queueJobsCompleted = new promClient.Counter({
  name: 'queue_jobs_completed_total',
  help: 'Total number of completed queue jobs',
  labelNames: ['queue_name'],
  registers: [register],
});

// === Export Metrics ===

module.exports = {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  httpRequestsActive,
  bookingsCreated,
  bookingStatusChanges,
  paymentsProcessed,
  paymentAmounts,
  smsSent,
  emailsSent,
  userRegistrations,
  activeUsers,
  dbConnections,
  dbQueries,
  dbQueryDuration,
  dbErrors,
  redisConnections,
  redisOperations,
  redisOperationDuration,
  queueJobsWaiting,
  queueJobsActive,
  queueJobsFailed,
  queueJobsCompleted,
};
