# Application-Level Prometheus Metrics Setup
**Created:** November 5, 2025
**Priority:** P1 (High - needed for production visibility)
**Estimated Time:** 4-6 hours

---

## Current State

### What's Working ✅
- Prometheus server running on port 9090
- Node Exporter providing system metrics (CPU, memory, disk)
- Grafana dashboards configured
- HTTP Basic Auth protection

### What's Missing ❌
- Application-level metrics (HTTP requests, response times, errors)
- Business metrics (bookings created, payments processed)
- Database metrics (query times, connection pool)
- Custom alerts based on business logic

**Current Query Results:**
```
http_requests_total: Empty (no data)
http_request_duration_seconds: Empty (no data)
```

**Why:** Backend not exposing `/metrics` endpoint with application data.

---

## Implementation Plan

### Step 1: Install Prometheus Client Library

The `prom-client` package is already installed in `package.json` (v15.1.3). Verified! ✅

### Step 2: Create Metrics Module

Create `backend/src/metrics.js`:

```javascript
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
```

### Step 3: Create HTTP Metrics Middleware

Create `backend/src/middleware/metricsMiddleware.js`:

```javascript
const {
  httpRequestsTotal,
  httpRequestDuration,
  httpRequestsActive,
} = require('../metrics');

function metricsMiddleware(req, res, next) {
  // Start timer
  const start = Date.now();

  // Increment active requests
  const route = req.route?.path || req.path || 'unknown';
  httpRequestsActive.inc({ method: req.method, route });

  // On response finish
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const statusCode = res.statusCode;

    // Record metrics
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: statusCode,
      },
      duration
    );

    httpRequestsActive.dec({ method: req.method, route });
  });

  next();
}

module.exports = metricsMiddleware;
```

### Step 4: Create /metrics Endpoint

In `backend/src/server.js`, add:

```javascript
const { register } = require('./metrics');
const metricsMiddleware = require('./middleware/metricsMiddleware');

// Apply metrics middleware to all routes
app.use(metricsMiddleware);

// Metrics endpoint (should be before auth middleware)
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    console.error('Error generating metrics:', error);
    res.status(500).end('Error generating metrics');
  }
});
```

### Step 5: Instrument Key Functions

#### Booking Service (`backend/src/bookingService.js`)

```javascript
const { bookingsCreated, bookingStatusChanges } = require('./metrics');

async function createBooking(data) {
  // ... existing code ...

  // After successful booking creation
  bookingsCreated.inc({ status: 'PENDING' });

  return booking;
}

async function updateBookingStatus(bookingId, newStatus, oldStatus) {
  // ... existing code ...

  // After successful status change
  bookingStatusChanges.inc({ from_status: oldStatus, to_status: newStatus });

  return booking;
}
```

#### Payment Service (`backend/src/paymentService.js`)

```javascript
const { paymentsProcessed, paymentAmounts } = require('./metrics');

async function processPayment(bookingId, amount, paymentMethod) {
  try {
    // ... existing payment code ...

    // On success
    paymentsProcessed.inc({ status: 'success', payment_method: paymentMethod });
    paymentAmounts.observe({ payment_method: paymentMethod }, amount);

    return result;
  } catch (error) {
    // On failure
    paymentsProcessed.inc({ status: 'failed', payment_method: paymentMethod });
    throw error;
  }
}
```

#### SMS Service (`backend/src/smsService.js`)

```javascript
const { smsSent } = require('./metrics');

async function sendVerificationCode(phone) {
  try {
    // ... existing code ...

    smsSent.inc({ type: 'verification', status: 'success' });
  } catch (error) {
    smsSent.inc({ type: 'verification', status: 'failed' });
    throw error;
  }
}
```

#### Database Connection (`backend/src/db.js`)

```javascript
const { dbConnections, dbQueries, dbQueryDuration, dbErrors } = require('./metrics');

// Wrap the query function
const originalQuery = pool.query.bind(pool);
pool.query = async function(text, params) {
  const start = Date.now();

  // Determine operation type
  const operation = text.trim().split(' ')[0].toUpperCase(); // SELECT, INSERT, UPDATE, DELETE

  dbQueries.inc({ operation });

  try {
    const result = await originalQuery(text, params);

    const duration = (Date.now() - start) / 1000;
    dbQueryDuration.observe({ operation }, duration);

    return result;
  } catch (error) {
    dbErrors.inc({ error_type: error.code || 'unknown' });
    throw error;
  }
};

// Update connection count periodically
setInterval(() => {
  dbConnections.set(pool.totalCount - pool.idleCount);
}, 5000);
```

### Step 6: Configure Prometheus Scraping

Edit `/etc/prometheus/prometheus.yml` on production server:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # Existing node exporter
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']

  # NEW: BeautyCita Backend API
  - job_name: 'beautycita-api'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['localhost:4000']
    scrape_interval: 10s

  # Existing Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
```

Reload Prometheus:
```bash
sudo systemctl reload prometheus
```

### Step 7: Create Grafana Dashboards

#### Dashboard 1: HTTP Performance
**Panels:**
1. **Request Rate (RPS)**
   - Query: `rate(http_requests_total[5m])`
   - Visualization: Graph

2. **Response Time (p50, p95, p99)**
   - Query: `histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))`
   - Visualization: Graph

3. **Error Rate**
   - Query: `rate(http_requests_total{status_code=~"5.."}[5m])`
   - Visualization: Graph

4. **Top 10 Slowest Endpoints**
   - Query: `topk(10, histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])))`
   - Visualization: Table

#### Dashboard 2: Business Metrics
**Panels:**
1. **Bookings Created (Last 24h)**
   - Query: `increase(bookings_created_total[24h])`
   - Visualization: Stat

2. **Booking Status Distribution**
   - Query: `sum by (status) (bookings_created_total)`
   - Visualization: Pie Chart

3. **Revenue (Last 7 days)**
   - Query: `sum(increase(payment_amount_dollars_sum[7d]))`
   - Visualization: Stat

4. **User Registrations (per day)**
   - Query: `increase(user_registrations_total[1d])`
   - Visualization: Graph

5. **SMS/Email Send Rates**
   - Query: `rate(sms_sent_total[5m])` and `rate(emails_sent_total[5m])`
   - Visualization: Graph

#### Dashboard 3: Database Performance
**Panels:**
1. **Active DB Connections**
   - Query: `db_connections_active`
   - Visualization: Gauge

2. **Query Rate by Operation**
   - Query: `rate(db_queries_total[5m])`
   - Visualization: Graph (stacked)

3. **Query Duration (p95)**
   - Query: `histogram_quantile(0.95, rate(db_query_duration_seconds_bucket[5m]))`
   - Visualization: Graph

4. **Database Errors**
   - Query: `increase(db_errors_total[5m])`
   - Visualization: Graph

---

## Alert Rules

Create `/etc/prometheus/alerts/beautycita.yml`:

```yaml
groups:
  - name: beautycita_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/second"

      # Slow response times
      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow API response times"
          description: "95th percentile response time is {{ $value }}s"

      # Database connection pool exhaustion
      - alert: DatabaseConnectionPoolHigh
        expr: db_connections_active > 18
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "{{ $value }} out of 20 connections in use"

      # Payment failures
      - alert: HighPaymentFailureRate
        expr: rate(payments_processed_total{status="failed"}[5m]) / rate(payments_processed_total[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High payment failure rate"
          description: "{{ $value | humanizePercentage }} of payments are failing"

      # Queue backlog
      - alert: QueueBacklogHigh
        expr: queue_jobs_waiting > 100
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Queue backlog is high"
          description: "{{ $value }} jobs waiting in {{ $labels.queue_name }} queue"

      # SMS failures
      - alert: SMSFailureRate
        expr: rate(sms_sent_total{status="failed"}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High SMS failure rate"
          description: "SMS failures at {{ $value }}/second"

      # Application down
      - alert: ApplicationDown
        expr: up{job="beautycita-api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "BeautyCita API is down"
          description: "The API has been unreachable for 1 minute"
```

Update `/etc/prometheus/prometheus.yml` to include alerts:

```yaml
rule_files:
  - '/etc/prometheus/alerts/*.yml'
```

---

## Deployment Steps

### 1. Deploy Code Changes
```bash
# On local machine
git add backend/src/metrics.js backend/src/middleware/metricsMiddleware.js
git commit -m "feat: Add Prometheus application metrics"
git push origin main

# On production server
ssh www-data@beautycita.com
cd /var/www/beautycita.com
sudo -u www-data git pull
sudo -u www-data pm2 restart beautycita-api
```

### 2. Configure Prometheus
```bash
# On production server
sudo nano /etc/prometheus/prometheus.yml
# Add beautycita-api scrape config

sudo mkdir -p /etc/prometheus/alerts
sudo nano /etc/prometheus/alerts/beautycita.yml
# Add alert rules

sudo systemctl reload prometheus
```

### 3. Verify Metrics
```bash
# Check metrics endpoint
curl http://localhost:4000/metrics

# Check Prometheus targets
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | select(.job=="beautycita-api")'
```

### 4. Create Grafana Dashboards
1. Login to Grafana: https://beautycita.com/grafana/
2. Import dashboard JSON (see `/monitoring/grafana-dashboards/`)
3. Set default dashboard

---

## Expected Results

### Before:
```bash
curl -u admin:monitoring123 "https://beautycita.com/prometheus/api/v1/query?query=http_requests_total"
# Result: {"data":{"result":[]}} (empty)
```

### After:
```bash
curl -u admin:monitoring123 "https://beautycita.com/prometheus/api/v1/query?query=http_requests_total"
# Result: {"data":{"result":[{"metric":{"method":"GET","route":"/api/health","status_code":"200"},"value":[1730815200,"1524"]}]}}
```

---

## Maintenance & Best Practices

### 1. Metric Naming Conventions
- Use `_total` suffix for counters
- Use `_seconds` or `_bytes` for units
- Use `snake_case` for names
- Keep cardinality low (avoid high-cardinality labels like user IDs)

### 2. Label Best Practices
- Use labels for dimensions you want to filter/aggregate by
- Avoid user-specific labels (causes cardinality explosion)
- Keep label values finite (e.g., status codes, not error messages)

### 3. Performance Considerations
- Metrics collection adds ~1-2ms per request (negligible)
- Use histograms sparingly (expensive)
- Aggregate metrics in application, not Prometheus

### 4. Retention
- Default: 15 days
- Increase in `/etc/prometheus/prometheus.yml`:
  ```yaml
  storage:
    tsdb:
      retention.time: 90d
  ```

---

## Cost-Benefit Analysis

### Time Investment:
- Initial setup: 4-6 hours
- Ongoing maintenance: 1 hour/month

### Benefits:
- **Faster incident response:** Identify issues in seconds vs. hours
- **Proactive monitoring:** Catch problems before users report them
- **Data-driven decisions:** Optimize based on real usage patterns
- **SLA tracking:** Measure uptime, response times objectively
- **Capacity planning:** Know when to scale resources

---

## Next Steps

1. **Week 1:** Implement metrics module and HTTP middleware
2. **Week 1:** Deploy `/metrics` endpoint and configure Prometheus scraping
3. **Week 2:** Instrument critical services (payments, bookings)
4. **Week 2:** Create Grafana dashboards
5. **Week 3:** Set up alerts and test alert firing
6. **Week 4:** Train team on using metrics for debugging

---

## Questions & Support

- **Prometheus Docs:** https://prometheus.io/docs/
- **prom-client Docs:** https://github.com/simmotron/prom-client
- **Grafana Docs:** https://grafana.com/docs/

**Contact:** Development team for questions or issues
