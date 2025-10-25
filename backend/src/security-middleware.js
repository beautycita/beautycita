/**
 * Security Middleware - BeautyCita
 * Comprehensive security features including CSP, rate limiting, HMAC verification
 */

const crypto = require('crypto');
const { createClient } = require('redis');

// ==================== REDIS CLIENT FOR RATE LIMITING ====================
let redisClient;

async function initializeRedis() {
  if (redisClient) return redisClient;

  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  redisClient.on('error', (err) => console.error('Redis Client Error:', err));
  await redisClient.connect();

  return redisClient;
}

// ==================== 1. CONTENT SECURITY POLICY ====================
/**
 * Content Security Policy middleware to prevent XSS attacks
 */
function contentSecurityPolicy() {
  return (req, res, next) => {
    // CSP directives
    const cspDirectives = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Allow inline scripts (needed for some frameworks)
        "'unsafe-eval'", // Allow eval (needed for some libraries)
        'https://cdn.jsdelivr.net',
        'https://unpkg.com',
        'https://js.stripe.com', // Stripe payments
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Allow inline styles
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net',
      ],
      'img-src': [
        "'self'",
        'data:', // Allow data URLs for images
        'blob:', // Allow blob URLs
        'https:', // Allow HTTPS images
        'https://storage.googleapis.com', // Cloud storage
      ],
      'font-src': [
        "'self'",
        'data:',
        'https://fonts.gstatic.com',
        'https://cdn.jsdelivr.net',
      ],
      'connect-src': [
        "'self'",
        'https://api.stripe.com', // Stripe API
        'wss:', // WebSocket connections
      ],
      'frame-src': [
        "'self'",
        'https://js.stripe.com', // Stripe iframe
      ],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"], // Prevent clickjacking
      'upgrade-insecure-requests': [],
    };

    // Build CSP header string
    const cspString = Object.entries(cspDirectives)
      .map(([directive, values]) => {
        if (values.length === 0) return directive;
        return `${directive} ${values.join(' ')}`;
      })
      .join('; ');

    res.setHeader('Content-Security-Policy', cspString);

    // Report-only mode for testing (uncomment to use)
    // res.setHeader('Content-Security-Policy-Report-Only', cspString);

    next();
  };
}

// ==================== 2. SECURITY HEADERS ====================
/**
 * Comprehensive security headers middleware
 */
function securityHeaders() {
  return (req, res, next) => {
    // HSTS - Force HTTPS for 1 year
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS filter in browsers
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer policy - only send origin on cross-origin requests
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions policy (formerly Feature-Policy)
    res.setHeader('Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=(self)'
    );

    // Remove powered-by header
    res.removeHeader('X-Powered-By');

    next();
  };
}

// ==================== 3. IP-BASED RATE LIMITING ====================
/**
 * Advanced rate limiting with per-IP and per-user limits
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequestsPerIP = 100,
    maxRequestsPerUser = 200,
    skipSuccessfulRequests = false,
    keyGenerator = null,
  } = options;

  return async (req, res, next) => {
    try {
      // Skip rate limiting in test mode
      if (process.env.NODE_ENV === 'test') {
        return next();
      }
      await initializeRedis();

      const ip = req.ip || req.connection.remoteAddress;
      const userId = req.user?.userId || null;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Generate keys
      const ipKey = `ratelimit:ip:${ip}:${Math.floor(now / windowMs)}`;
      const userKey = userId ? `ratelimit:user:${userId}:${Math.floor(now / windowMs)}` : null;

      // Check IP rate limit
      const ipCount = await redisClient.incr(ipKey);
      if (ipCount === 1) {
        await redisClient.expire(ipKey, Math.ceil(windowMs / 1000));
      }

      if (ipCount > maxRequestsPerIP) {
        res.setHeader('X-RateLimit-Limit', maxRequestsPerIP);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

        return res.status(429).json({
          success: false,
          error: 'Too many requests from this IP. Please try again later.',
          retryAfter: Math.ceil(windowMs / 1000),
        });
      }

      // Check user rate limit (if authenticated)
      if (userKey) {
        const userCount = await redisClient.incr(userKey);
        if (userCount === 1) {
          await redisClient.expire(userKey, Math.ceil(windowMs / 1000));
        }

        if (userCount > maxRequestsPerUser) {
          res.setHeader('X-RateLimit-Limit', maxRequestsPerUser);
          res.setHeader('X-RateLimit-Remaining', 0);
          res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

          return res.status(429).json({
            success: false,
            error: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil(windowMs / 1000),
          });
        }

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', maxRequestsPerUser);
        res.setHeader('X-RateLimit-Remaining', maxRequestsPerUser - userCount);
      } else {
        res.setHeader('X-RateLimit-Limit', maxRequestsPerIP);
        res.setHeader('X-RateLimit-Remaining', maxRequestsPerIP - ipCount);
      }

      res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open - allow request if rate limiting fails
      next();
    }
  };
}

// ==================== 4. REQUEST SIGNING (HMAC) ====================
/**
 * HMAC signature verification for webhooks
 */
function verifyWebhookSignature(secret) {
  return async (req, res, next) => {
    try {
      const signature = req.headers['x-webhook-signature'];
      const timestamp = req.headers['x-webhook-timestamp'];

      if (!signature || !timestamp) {
        return res.status(401).json({
          success: false,
          error: 'Missing webhook signature or timestamp',
        });
      }

      // Check timestamp - reject requests older than 5 minutes
      const requestTime = parseInt(timestamp, 10);
      const currentTime = Math.floor(Date.now() / 1000);

      if (Math.abs(currentTime - requestTime) > 300) {
        return res.status(401).json({
          success: false,
          error: 'Webhook timestamp is too old',
        });
      }

      // Compute HMAC
      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${payload}`)
        .digest('hex');

      // Constant-time comparison to prevent timing attacks
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid webhook signature',
        });
      }

      next();
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify webhook signature',
      });
    }
  };
}

/**
 * Generate HMAC signature for outgoing webhooks
 */
function generateWebhookSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payloadString}`)
    .digest('hex');

  return {
    signature,
    timestamp,
  };
}

// ==================== 5. HONEYPOT FIELD ====================
/**
 * Honeypot middleware to prevent bot registrations
 */
function honeypotProtection(fieldName = 'website') {
  return (req, res, next) => {
    // Check if honeypot field exists and is filled
    const honeypotValue = req.body[fieldName];

    if (honeypotValue && honeypotValue.trim() !== '') {
      // Bot detected - pretend success but don't process
      console.warn(`Honeypot triggered: ${req.ip} filled field "${fieldName}" with "${honeypotValue}"`);

      return res.status(200).json({
        success: true,
        message: 'Registration successful', // Fake success
      });
    }

    // Remove honeypot field from body
    delete req.body[fieldName];

    next();
  };
}

// ==================== 6. AUDIT LOGGING ====================
/**
 * Audit logging middleware for admin actions
 */
function auditLog(db) {
  return async (req, res, next) => {
    // Only log for authenticated admin users
    if (!req.user || !['ADMIN', 'SUPERADMIN'].includes(req.user.role)) {
      return next();
    }

    const originalJson = res.json.bind(res);

    res.json = function (data) {
      // Log after response
      setImmediate(async () => {
        try {
          await db.query(`
            INSERT INTO audit_logs (
              user_id,
              action,
              resource_type,
              resource_id,
              ip_address,
              user_agent,
              request_method,
              request_path,
              request_body,
              response_status,
              metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `, [
            req.user.userId,
            determineAction(req.method, req.path),
            determineResourceType(req.path),
            extractResourceId(req),
            req.ip || req.connection.remoteAddress,
            req.headers['user-agent'],
            req.method,
            req.path,
            JSON.stringify(sanitizeBody(req.body)),
            res.statusCode,
            JSON.stringify({
              query: req.query,
              params: req.params,
            }),
          ]);
        } catch (error) {
          console.error('Audit logging failed:', error);
        }
      });

      return originalJson(data);
    };

    next();
  };
}

// Helper functions for audit logging
function determineAction(method, path) {
  if (path.includes('delete')) return 'DELETE';
  if (method === 'POST' && path.includes('create')) return 'CREATE';
  if (method === 'PUT' || method === 'PATCH') return 'UPDATE';
  if (method === 'GET') return 'READ';
  if (method === 'DELETE') return 'DELETE';
  return method;
}

function determineResourceType(path) {
  if (path.includes('/users')) return 'USER';
  if (path.includes('/bookings')) return 'BOOKING';
  if (path.includes('/services')) return 'SERVICE';
  if (path.includes('/stylists')) return 'STYLIST';
  if (path.includes('/payments')) return 'PAYMENT';
  return 'UNKNOWN';
}

function extractResourceId(req) {
  return req.params.id || req.params.userId || req.params.bookingId || null;
}

function sanitizeBody(body) {
  if (!body) return {};

  const sanitized = { ...body };

  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

// ==================== RATE LIMIT PRESETS ====================
const rateLimitPresets = {
  // Strict limits for authentication endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequestsPerIP: 5,
    maxRequestsPerUser: 10,
  }),

  // Moderate limits for API endpoints
  api: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequestsPerIP: 100,
    maxRequestsPerUser: 200,
  }),

  // Strict limits for registration/signup
  registration: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequestsPerIP: 3,
    maxRequestsPerUser: 5,
  }),

  // Very strict limits for password reset
  passwordReset: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequestsPerIP: 3,
    maxRequestsPerUser: 3,
  }),

  // Moderate limits for file uploads
  upload: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequestsPerIP: 50,
    maxRequestsPerUser: 100,
  }),
};

// ==================== EXPORTS ====================
module.exports = {
  // Middleware
  contentSecurityPolicy,
  securityHeaders,
  createRateLimiter,
  verifyWebhookSignature,
  honeypotProtection,
  auditLog,

  // Utilities
  generateWebhookSignature,
  initializeRedis,

  // Presets
  rateLimitPresets,
};
