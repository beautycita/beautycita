const {
  httpRequestsTotal,
  httpRequestDuration,
  httpRequestsActive,
} = require('../metrics');

/**
 * Prometheus HTTP metrics middleware
 * Tracks request count, duration, and active requests
 */
function metricsMiddleware(req, res, next) {
  // Skip metrics collection for the /metrics endpoint itself
  if (req.path === '/metrics') {
    return next();
  }

  // Start timer for request duration
  const start = Date.now();

  // Extract route pattern (e.g., /api/bookings/:id instead of /api/bookings/123)
  const route = req.route?.path || req.path;

  // Increment active requests
  httpRequestsActive.inc({ method: req.method, route });

  // Listen for response finish
  res.on('finish', () => {
    // Calculate duration in seconds
    const duration = (Date.now() - start) / 1000;

    // Record metrics
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode,
      },
      duration
    );

    // Decrement active requests
    httpRequestsActive.dec({ method: req.method, route });
  });

  next();
}

module.exports = metricsMiddleware;
