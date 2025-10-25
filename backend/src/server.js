// Load environment variables FIRST (before any other imports)
require('dotenv').config({ path: '/var/www/beautycita.com/.env' });
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const redis = require('redis');
const winston = require('winston');
const expressWinston = require('express-winston');
const bcrypt = require('bcryptjs');
const { query } = require('./db');
const { validateJWT } = require('./middleware/auth');
const promClient = require('prom-client');
const cacheService = require('./services/cacheService');
const { initializeModernArchitecture } = require('./modernArchIntegration');
// Security middleware
const { contentSecurityPolicy, securityHeaders, rateLimitPresets, auditLog, initializeRedis } = require('./security-middleware');
const { requireAccessToken } = require('./auth-security');

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Configure Winston Logger for production-grade logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'beautycita-backend' },
  transports: [
    new winston.transports.File({ filename: path.join(__dirname, '../logs/error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(__dirname, '../logs/combined.log') }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ==================== PROMETHEUS METRICS SETUP ====================
// Create a Registry which registers the metrics
const register = new promClient.Registry();

// Add default metrics (CPU, memory, event loop lag, etc.)
promClient.collectDefaultMetrics({
  register,
  prefix: 'beautycita_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'beautycita_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

const httpRequestTotal = new promClient.Counter({
  name: 'beautycita_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const activeConnections = new promClient.Gauge({
  name: 'beautycita_active_connections',
  help: 'Number of active connections',
  registers: [register],
});

const databaseQueryDuration = new promClient.Histogram({
  name: 'beautycita_database_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['query_type'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 5],
  registers: [register],
});

const databaseConnectionPool = new promClient.Gauge({
  name: 'beautycita_database_connection_pool',
  help: 'Database connection pool status',
  labelNames: ['status'],
  registers: [register],
});

const redisOperations = new promClient.Counter({
  name: 'beautycita_redis_operations_total',
  help: 'Total number of Redis operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

const activeUsers = new promClient.Gauge({
  name: 'beautycita_active_users',
  help: 'Number of currently active users',
  labelNames: ['role'],
  registers: [register],
});

const bookingsTotal = new promClient.Counter({
  name: 'beautycita_bookings_total',
  help: 'Total number of bookings',
  labelNames: ['status'],
  registers: [register],
});

const revenueTotal = new promClient.Counter({
  name: 'beautycita_revenue_total',
  help: 'Total revenue in cents',
  labelNames: ['currency'],
  registers: [register],
});

// Middleware to track HTTP metrics
app.use((req, res, next) => {
  const start = Date.now();
  activeConnections.inc();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    const labels = {
      method: req.method,
      route: route,
      status_code: res.statusCode,
    };

    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);
    activeConnections.dec();
  });

  next();
});

// Configure Redis client for session storage with improved reliability
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  socket: {
    keepAlive: true,
    reconnectDelay: 500,
    connectTimeout: 60000,
    lazyConnect: true,
    noDelay: true
  },
  pingInterval: 1000,
  retryDelayOnFailover: 100,
  retryDelayOnReconnect: 500,
  maxRetriesPerRequest: 3
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis client connected successfully');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready to use');
});

redisClient.on('reconnecting', () => {
  logger.info('Redis client reconnecting...');
});

redisClient.on('end', () => {
  logger.warn('Redis client connection ended');
});

// Connect to Redis with retry logic
const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    logger.error('Failed to connect to Redis:', err);
    setTimeout(connectRedis, 5000);
  }
};

connectRedis();

// Initialize cache service
const initCacheService = async () => {
  try {
    await cacheService.connect();
    logger.info('✅ Cache service initialized successfully');
  } catch (err) {
    logger.error('❌ Failed to initialize cache service:', err);
    // Retry after 5 seconds
    setTimeout(initCacheService, 5000);
  }
};

initCacheService();

// Trust proxy for nginx reverse proxy
app.set('trust proxy', 1);

// Security middleware with ES modules support
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
    },
  },
}));
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Rate limiting - exempt download routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  skip: (req) => {
    // Skip rate limiting in test mode or for download endpoints
    if (process.env.NODE_ENV === 'test') return true;
    // Skip rate limiting for download endpoints
    return req.path.startsWith('/api/app-downloads/');
  }
});
app.use(limiter);

// BOAFORM ATTACK PROTECTION - Block malicious endpoints
app.use((req, res, next) => {
  const url = req.url.toLowerCase();
  const suspiciousPatterns = [
    '/boaform/',
    '/boa/',
    '/formlogin',
    '/formping',
    '/formping6',
    '/admin/formlogin',
    '/admin/forming'
  ];

  if (suspiciousPatterns.some(pattern => url.includes(pattern))) {
    logger.warn('Boaform Attack Attempt Blocked', {
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    return res.status(403).json({ error: 'Access denied' });
  }

  // Check for command injection patterns in any parameter
  const checkParams = (params) => {
    if (!params || typeof params !== 'object') return false;
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        const dangerousPatterns = [
          /[;&|`$(){}[\]\\]/,  // Command injection characters
          /\.\./,               // Directory traversal
          /\/bin\//,            // System binaries
          /\/etc\//,            // System config
          /ping.*[;&|]/,        // Ping command injection
          /curl.*[;&|]/,        // Curl command injection
          /wget.*[;&|]/,        // Wget command injection
        ];
        if (dangerousPatterns.some(pattern => pattern.test(value))) {
          logger.warn('Command Injection Attempt Blocked', {
            ip: req.ip,
            parameter: key,
            value: value,
            url: req.url,
            timestamp: new Date().toISOString()
          });
          return true;
        }
      }
    }
    return false;
  };

  if (checkParams(req.query) || checkParams(req.body) || checkParams(req.params)) {
    return res.status(403).json({ error: 'Malicious input detected' });
  }

  next();
});

// Structured logging middleware for all requests
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}}",
  expressFormat: true,
  colorize: false,
  ignoreRoute: function (req, res) { return false; }
}));

// OAuth debugging middleware
app.use('/api/auth', (req, res, next) => {
  const requestId = `oauth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.oauthRequestId = requestId;

  logger.info('OAuth Request Started', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    sessionId: req.sessionID,
    headers: {
      authorization: req.get('authorization') ? '[PRESENT]' : '[NOT_PRESENT]',
      cookie: req.get('cookie') ? '[PRESENT]' : '[NOT_PRESENT]'
    }
  });

  next();
});

// Body parsing middleware
app.use((req, res, next) => {
  if (req.path === '/graphql') return next();
  express.json({ limit: '10mb' })(req, res, next);
});
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Cookie parsing middleware (required for CSRF protection)
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// ==================== SECURITY MIDDLEWARE ====================
console.log('🔐 Initializing security features...');

// Initialize Redis for rate limiting
(async () => {
  try {
    await initializeRedis();
    console.log('✅ Redis initialized for rate limiting');
  } catch (error) {
    console.warn('⚠️  Redis initialization failed:', error.message);
  }
})();

// Apply global security headers
app.use(contentSecurityPolicy());
app.use(securityHeaders());
console.log('✅ Security headers enabled (CSP, HSTS, X-Frame-Options)');

// Apply rate limiting
app.use('/api/auth/login', rateLimitPresets.auth);
app.use('/api/auth/register', rateLimitPresets.registration);
app.use('/api/auth/reset-password', rateLimitPresets.passwordReset);
app.use('/api/upload', rateLimitPresets.upload);
app.use('/api', rateLimitPresets.api);
console.log('✅ Rate limiting enabled');

// Apply audit logging
app.use('/api/admin', auditLog(query));
console.log('✅ Audit logging enabled');


// Production-grade session configuration with Redis
const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'beautycita:sess:',
  ttl: 24 * 60 * 60 // 24 hours in seconds (sliding expiry for long work sessions)
});

app.use(session({
  store: redisStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'beautycita.sid', // Shorter, non-obvious name
  rolling: true, // Reset expiry on each request (sliding window)
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // JavaScript cannot access cookie (XSS protection)
    maxAge: 24 * 60 * 60 * 1000, // 24 hours (matches Redis TTL for long sessions)
    sameSite: 'lax', // CSRF protection (lax allows top-level navigation)
    domain: process.env.NODE_ENV === 'production' ? 'beautycita.com' : undefined,
    path: '/'
  }
}));

// Passport removed - using pure JWT authentication
// Google OAuth now handled by routes/googleAuth.js with JWT

// Initialize Socket.io server
const { initializeSocketServer, emitNotification, emitChatMessage } = require('./socket/socketServer');
const io = initializeSocketServer(httpServer);

// Make socket helpers and Redis client available to routes
app.set('io', io);
app.set('emitNotification', emitNotification);
app.set('emitChatMessage', emitChatMessage);
app.set('redisClient', redisClient);

// Middleware to check role (JWT-based)
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

// ==================== ROUTES ====================

// Import enhanced auth routes
const authRoutes = require('./authRoutes');
app.use('/api/auth', authRoutes);

// Import Google OAuth routes (JWT-only, no Passport)
const googleAuthRoutes = require('./routes/googleAuth');
app.use('/api/auth', googleAuthRoutes);

// Import Email Verification routes
const emailVerificationRoutes = require('./routes/email-verification');
app.use('/api/auth', emailVerificationRoutes);

// Import Session Management routes
const sessionRoutes = require('./routes/sessions');
app.use('/api/sessions', sessionRoutes);

// Import WebAuthn/FIDO2 routes for passwordless authentication
const webauthnRoutes = require('./routes/webauthn');
const onboardingRoutes = require('./routes/onboarding');
app.use('/api/webauthn', webauthnRoutes);
app.use('/api/onboarding', validateJWT, onboardingRoutes);
const clientOnboardingRoutes = require("./routes/client-onboarding");
app.use("/api/onboarding", validateJWT, clientOnboardingRoutes);

// Import Twilio Verify routes for SMS verification (hybrid approach)
const twilioVerifyAuthRoutes = require('./routes/twilioVerifyAuth');
app.use('/api/verify', twilioVerifyAuthRoutes);

// Import 2FA routes
const twoFactorRoutes = require('./twoFactorRoutes');
app.use('/api/2fa', twoFactorRoutes);

// Import Athenas OpenAI chat routes
const chatRoutes = require('./chatRoutes');
app.use('/api/chat', chatRoutes);

// Import dashboard routes
const dashboardRoutes = require('./dashboardRoutes');
// Dashboard routes use their own requireAuth middleware for passport-based auth

// Payment and credit routes will be imported after validateJWT is defined

// Enhanced health check with OAuth configuration status
app.get('/api/health', async (req, res) => {
  try {
    // Test Redis connection
    const redisStatus = await redisClient.ping();

    // Test database connection
    const dbTest = await query('SELECT 1 as test');

    // Check OAuth configuration
    const oauthConfig = {
      googleClientIdConfigured: !!process.env.GOOGLE_CLIENT_ID,
      googleClientSecretConfigured: !!process.env.GOOGLE_CLIENT_SECRET,
      callbackUrlConfigured: !!process.env.GOOGLE_CALLBACK_URL,
      sessionSecretConfigured: !!process.env.SESSION_SECRET
    };

    logger.info("Health check successful", { services: { database: dbTest.rows[0].test === 1 ? "connected" : "error", redis: redisStatus === "PONG" ? "connected" : "error" } });
    res.json({
      status: 'ok',
      message: 'BeautyCita API is running',
      timestamp: new Date().toISOString(),
      services: {
        database: dbTest.rows[0].test === 1 ? 'connected' : 'error',
        redis: redisStatus === 'PONG' ? 'connected' : 'error',
        oauth: oauthConfig
      }
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Service health check failed',
      error: error.message
    });
  }
});

// Comprehensive status endpoint for status page
app.get('/api/status', async (req, res) => {
  try {
    const statusData = {
      timestamp: new Date().toISOString(),
      overall: 'operational',
      services: {}
    };

    // 1. BeautyCita API (Backend API Status)
    try {
      const dbTest = await query('SELECT 1 as test');
      const redisStatus = await redisClient.ping();
      statusData.services['BeautyCita API'] = {
        status: (dbTest.rows[0].test === 1 && redisStatus === 'PONG') ? 'operational' : 'degraded',
        message: (dbTest.rows[0].test === 1 && redisStatus === 'PONG') ? 'All systems operational' : 'Some services degraded',
        uptime: process.uptime()
      };
    } catch (error) {
      statusData.services['BeautyCita API'] = {
        status: 'outage',
        message: 'API services unavailable',
        error: error.message
      };
      statusData.overall = 'outage';
    }

    // 2. Memory in use (instead of Payment processing)
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    statusData.services['Memory in use'] = {
      status: memUsageMB < 500 ? 'operational' : memUsageMB < 800 ? 'degraded' : 'outage',
      message: `${memUsageMB} MB`,
      value: memUsageMB,
      unit: 'MB'
    };

    // 3. Aphrodite (OpenAI API Status)
    try {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey || !openaiKey.startsWith('sk-')) {
        statusData.services['Aphrodite'] = {
          status: 'maintenance',
          message: 'API key not configured'
        };
      } else {
        // Test OpenAI connection using the lazy initialization from chatRoutes
        try {
          const { OpenAI } = require('openai');
          const openai = new OpenAI({ apiKey: openaiKey });

          // Simple test - list models (lightweight call)
          const models = await openai.models.list();
          statusData.services['Aphrodite'] = {
            status: models.data && models.data.length > 0 ? 'operational' : 'degraded',
            message: models.data && models.data.length > 0 ? 'AI services available' : 'AI services limited',
            modelCount: models.data ? models.data.length : 0
          };
        } catch (apiError) {
          statusData.services['Aphrodite'] = {
            status: 'degraded',
            message: 'AI service connection limited',
            error: apiError.message
          };
        }
      }
    } catch (error) {
      statusData.services['Aphrodite'] = {
        status: 'outage',
        message: 'AI services unavailable',
        error: error.message
      };
    }

    // 4. Secure Payment Processor (Stripe Status) - REMOVED per user request

    // 5. Nodejs Server (Web Application Status)
    try {
      // Check if we can reach the frontend
      const serverStartTime = Date.now() - (process.uptime() * 1000);
      const uptime = process.uptime();
      const uptimeHours = Math.floor(uptime / 3600);
      const uptimeMinutes = Math.floor((uptime % 3600) / 60);

      statusData.services['Nodejs Server'] = {
        status: uptime > 0 ? 'operational' : 'outage',
        message: `Server running ${uptimeHours}h ${uptimeMinutes}m`,
        uptime: uptime,
        pid: process.pid,
        nodeVersion: process.version
      };
    } catch (error) {
      statusData.services['Nodejs Server'] = {
        status: 'outage',
        message: 'Server unavailable',
        error: error.message
      };
      statusData.overall = 'outage';
    }

    // Determine overall status
    const serviceStatuses = Object.values(statusData.services).map(s => s.status);
    if (serviceStatuses.includes('outage')) {
      statusData.overall = 'outage';
    } else if (serviceStatuses.includes('degraded')) {
      statusData.overall = 'degraded';
    } else if (serviceStatuses.includes('maintenance')) {
      statusData.overall = 'maintenance';
    }

    res.json(statusData);
  } catch (error) {
    logger.error('Status check failed', { error: error.message });
    res.status(500).json({
      timestamp: new Date().toISOString(),
      overall: 'outage',
      message: 'Status check failed',
      error: error.message
    });
  }
});

// ==================== PROMETHEUS METRICS ENDPOINTS ====================
// Main metrics endpoint for Prometheus scraping
app.get('/api/metrics', async (req, res) => {
  try {
    // Set content type for Prometheus
    res.set('Content-Type', register.contentType);

    // Get all metrics
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    logger.error('Metrics endpoint error', { error: error.message });
    res.status(500).end(error.message);
  }
});

// Business metrics endpoint with detailed statistics
app.get('/api/metrics/business', async (req, res) => {
  try {
    const businessMetrics = {};

    // Get total users by role
    const usersQuery = await query(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `);
    businessMetrics.users = {};
    usersQuery.rows.forEach(row => {
      businessMetrics.users[row.role.toLowerCase()] = parseInt(row.count);
      activeUsers.set({ role: row.role }, parseInt(row.count));
    });

    // Get booking statistics
    const bookingsQuery = await query(`
      SELECT
        status,
        COUNT(*) as count,
        SUM(total_price) as revenue
      FROM bookings
      GROUP BY status
    `);
    businessMetrics.bookings = {
      by_status: {}
    };
    bookingsQuery.rows.forEach(row => {
      businessMetrics.bookings.by_status[row.status.toLowerCase()] = {
        count: parseInt(row.count),
        revenue: parseFloat(row.revenue || 0)
      };
    });

    // Get today's bookings
    const todayBookings = await query(`
      SELECT COUNT(*) as count
      FROM bookings
      WHERE DATE(created_at) = CURRENT_DATE
    `);
    businessMetrics.bookings.today = parseInt(todayBookings.rows[0].count);

    // Get total revenue
    const revenueQuery = await query(`
      SELECT
        SUM(total_price) as total_revenue,
        COUNT(*) as completed_bookings
      FROM bookings
      WHERE status = 'COMPLETED'
    `);
    businessMetrics.revenue = {
      total: parseFloat(revenueQuery.rows[0].total_revenue || 0),
      completed_bookings: parseInt(revenueQuery.rows[0].completed_bookings || 0)
    };

    // Get active sessions (last 24 hours) - optional if table exists
    try {
      const activeSessionsQuery = await query(`
        SELECT COUNT(DISTINCT user_id) as count
        FROM user_sessions
        WHERE last_activity > NOW() - INTERVAL '24 hours'
      `);
      businessMetrics.active_sessions_24h = parseInt(activeSessionsQuery.rows[0]?.count || 0);
    } catch (error) {
      // user_sessions table might not exist yet
      businessMetrics.active_sessions_24h = 0;
    }

    // Return metrics in both JSON and Prometheus format
    if (req.query.format === 'prometheus') {
      let promMetrics = '# HELP beautycita_business_users Number of users by role\n';
      promMetrics += '# TYPE beautycita_business_users gauge\n';
      Object.entries(businessMetrics.users).forEach(([role, count]) => {
        promMetrics += `beautycita_business_users{role="${role}"} ${count}\n`;
      });

      promMetrics += '\n# HELP beautycita_business_bookings Number of bookings by status\n';
      promMetrics += '# TYPE beautycita_business_bookings gauge\n';
      Object.entries(businessMetrics.bookings.by_status).forEach(([status, data]) => {
        promMetrics += `beautycita_business_bookings{status="${status}"} ${data.count}\n`;
      });

      promMetrics += '\n# HELP beautycita_business_revenue Total revenue by status\n';
      promMetrics += '# TYPE beautycita_business_revenue gauge\n';
      Object.entries(businessMetrics.bookings.by_status).forEach(([status, data]) => {
        promMetrics += `beautycita_business_revenue{status="${status}"} ${data.revenue}\n`;
      });

      promMetrics += '\n# HELP beautycita_business_active_sessions_24h Active sessions in last 24 hours\n';
      promMetrics += '# TYPE beautycita_business_active_sessions_24h gauge\n';
      promMetrics += `beautycita_business_active_sessions_24h ${businessMetrics.active_sessions_24h}\n`;

      res.set('Content-Type', 'text/plain; version=0.0.4');
      res.send(promMetrics);
    } else {
      res.json({
        timestamp: new Date().toISOString(),
        metrics: businessMetrics
      });
    }
  } catch (error) {
    logger.error('Business metrics endpoint error', { error: error.message });
    res.status(500).json({
      error: 'Failed to fetch business metrics',
      message: error.message
    });
  }
});

// Test environment endpoint
app.get('/api/env-test', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development'
  });
});

// OAuth configuration debug endpoint (development/staging only)
app.get('/api/auth/debug', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Not found' });
  }

  res.json({
    oauth: {
      callbackUrl: process.env.GOOGLE_CALLBACK_URL,
      sessionCookieName: 'beautycita.session',
      sessionConfig: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax'
      }
    },
    session: {
      sessionId: req.sessionID,
      isAuthenticated: !!req.user,
      user: req.user ? {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      } : null
    },
    redis: {
      connected: redisClient.isReady
    }
  });
});

// Session debug endpoint for troubleshooting authentication
app.get('/api/auth/session-debug', (req, res) => {
  logger.info('Session Debug Request', {
    sessionId: req.sessionID,
    isAuthenticated: !!req.user,
    userId: req.user?.id,
    userEmail: req.user?.email,
    cookies: req.headers.cookie ? '[PRESENT]' : '[MISSING]',
    ip: req.ip
  });

  res.json({
    sessionId: req.sessionID,
    isAuthenticated: !!req.user,
    user: req.user ? {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      provider: req.user.provider
    } : null,
    timestamp: new Date().toISOString()
  });
});

// app.use('/api/disputes', validateJWT, disputeRoutes);

const creditRoutes = require('./creditRoutes');
app.use('/api/credits', validateJWT, creditRoutes);

// Finance routes (user wallet, transactions, disputes)
const financeRoutes = require('./routes/finance');
app.use('/api/finance', financeRoutes);

// Import additional route modules
const stylistRoutes = require('./stylistRoutes');
const availabilityRoutes = require('./availabilityRoutes');
const bookingRoutes = require('./bookingRoutes');
const locationRoutes = require('./routes/locationRoutes');
const paymentRoutes = require('./paymentRoutes');

// Register route handlers
app.use('/api/stylists', stylistRoutes);
// GDPR public routes (must be before validateJWT middleware)
const gdprPublic = require("./routes/gdpr-public");
app.use("/api", gdprPublic);
app.use('/api/availability', availabilityRoutes);

// Services routes (public and stylist service management) - MUST be before /api middleware
const servicesRoutes = require('./routes/services');
app.use('/api/services', servicesRoutes);

app.use('/api/bookings', validateJWT, bookingRoutes);
app.use('/api/location', locationRoutes);
app.use('/api', validateJWT, paymentRoutes);

// Admin routes (require authentication and admin privileges)
const adminRoutes = require('./routes/admin');
app.use('/api/admin', validateJWT, adminRoutes);

// System monitoring routes (superadmin only)
const systemRoutes = require('./routes/systemRoutes');
app.use('/api/admin/system', validateJWT, systemRoutes);

// Issue tracking routes (require authentication and admin privileges)
const issueRoutes = require('./issueRoutes');
app.use('/api/issues', validateJWT, issueRoutes);

// Stylist-specific routes (self-management only)
const stylistProfileRoutes = require('./routes/stylist-profile');
app.use('/api/stylist', validateJWT, stylistProfileRoutes);

// Client-specific routes (self-management only)
const clientProfileRoutes = require('./routes/client-profile');
app.use('/api/client', validateJWT, clientProfileRoutes);

// Stylist self-management routes
const stylistSelfRoutes = require('./routes/stylist-self');
app.use('/api/stylist', validateJWT, stylistSelfRoutes);

// Stylist upgrade routes (allow clients to become stylists)
const stylistUpgradeRoutes = require('./routes/stylist-upgrade');
app.use('/api/stylist', validateJWT, stylistUpgradeRoutes);

// Stylist locations management (multi-location support)
const stylistLocationsRoutes = require('./routes/stylist-locations');
app.use('/api/stylist', validateJWT, stylistLocationsRoutes);

// Booking ETA tracking and directions
const bookingEtaRoutes = require('./routes/booking-eta');
app.use('/api/bookings', validateJWT, bookingEtaRoutes);

// Booking mitigation actions (late client handling)
const bookingMitigationRoutes = require('./routes/booking-mitigation');
app.use('/api/bookings', validateJWT, bookingMitigationRoutes);

// Stylist booking management routes
const stylistBookingRoutes = require('./stylistBookingRoutes');
app.use('/api/stylist', validateJWT, stylistBookingRoutes);

// Client self-management routes
const clientSelfRoutes = require('./routes/client-self');
app.use('/api/client', validateJWT, clientSelfRoutes);

// Dashboard routes (authenticated users - stylists and clients) - use JWT authentication
app.use('/api/dashboard', validateJWT, dashboardRoutes);

// Analytics routes (admin and stylists)
const analyticsRoutes = require('./routes/analytics');
app.use('/api/analytics', validateJWT, analyticsRoutes);

// System settings routes (admin only)
const systemSettingsRoutes = require('./routes/systemSettings');
app.use('/api/admin/system-settings', validateJWT, systemSettingsRoutes);

// User profile routes (all authenticated users)
const userProfileRoutes = require('./routes/user-profile');
app.use('/api/user', validateJWT, userProfileRoutes);

// Username availability check (public, for onboarding)
app.post('/api/users/check-username', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        available: false,
        message: 'Username is required'
      });
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.json({
        success: false,
        available: false,
        message: 'Username must be 3-20 characters (letters, numbers, underscores only)'
      });
    }

    // Check if username exists
    const result = await query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1)',
      [username]
    );

    const available = result.rows.length === 0;

    res.json({
      success: true,
      available,
      message: available ? 'Username available' : 'Username already taken'
    });

  } catch (error) {
    logger.error('Error checking username:', error);
    res.status(500).json({
      success: false,
      available: false,
      message: 'Failed to check username availability'
    });
  }
});

// Update user profile (authenticated, for onboarding)

// GET /api/users/profile-completion
// Get user's profile completion status
app.get('/api/users/profile-completion', validateJWT, async (req, res) => {
  try {
    const userId = req.userId;

    // Get user data
    const userResult = await query(
      `SELECT email_verified, phone_verified, profile_picture_url, bio FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get client preferences if client
    const clientResult = await query(
      `SELECT preferences FROM clients WHERE user_id = $1`,
      [userId]
    );

    const client = clientResult.rows.length > 0 ? clientResult.rows[0] : null;
    const preferences = client?.preferences || {};

    // Calculate completion items
    const completion = {
      email_verified: user.email_verified || false,
      phone_verified: user.phone_verified || false,
      location_set: !!(preferences.location?.city && preferences.location?.zip),
      profile_picture: !!user.profile_picture_url,
      bio_complete: !!(user.bio && user.bio.length > 20),
      preferences_set: !!(preferences.favoriteServices && preferences.favoriteServices.length > 0)
    };

    res.json(completion);
  } catch (error) {
    console.error('Profile completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile completion'
    });
  }
});
app.post('/api/users/update-profile', validateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, email_verified, profile_picture_url } = req.body;

    const updateFields = [];
    const updateParams = [];
    let paramCounter = 1;

    if (username !== undefined) {
      // Check if username is taken by another user
      const usernameCheck = await query(
        'SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id != $2',
        [username, userId]
      );
      if (usernameCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
      updateFields.push(`username = $${paramCounter}`);
      updateParams.push(username);
      paramCounter++;
    }

    if (email !== undefined) {
      // Check if email is taken by another user
      const emailCheck = await query(
        'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2',
        [email, userId]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email already taken'
        });
      }
      updateFields.push(`email = $${paramCounter}`);
      updateParams.push(email);
      paramCounter++;
    }

    if (email_verified !== undefined) {
      updateFields.push(`email_verified = $${paramCounter}`);
      updateParams.push(email_verified);
      paramCounter++;
    }

    if (profile_picture_url !== undefined) {
      updateFields.push(`profile_picture_url = $${paramCounter}`);
      updateParams.push(profile_picture_url);
      paramCounter++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateFields.push('updated_at = NOW()');
    updateParams.push(userId);

    await query(`
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCounter}
    `, updateParams);

    // Fetch updated user
    const userResult = await query(
      'SELECT id, username, email, email_verified, phone, phone_verified, role, profile_picture_url, profile_complete FROM users WHERE id = $1',
      [userId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userResult.rows[0]
    });

  } catch (error) {
    logger.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// BTCPay wallet request endpoint (for onboarding)
app.post('/api/payments/btcpay/request-wallet', validateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    logger.info('BTCPay wallet requested', { userId });

    // For now, just log the request and return success
    // In production, this would integrate with BTCPay Server API
    res.json({
      success: true,
      message: 'BTCPay wallet request received. You will receive setup instructions via email.'
    });

  } catch (error) {
    logger.error('Error requesting BTCPay wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request BTCPay wallet'
    });
  }
});

// Stylist application status endpoint
app.get('/api/stylist-application/status', validateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if there's an application for this user
    const result = await query(
      'SELECT * FROM stylist_applications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        application: null
      });
    }

    const application = result.rows[0];
    res.json({
      success: true,
      application: {
        status: application.status,
        progress: application.progress || 0,
        currentStep: application.current_step || 0
      }
    });

  } catch (error) {
    logger.error('Error getting stylist application status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get application status'
    });
  }
});

// Update stylist application progress
app.post('/api/stylist-application/progress', validateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentStep, progress, status } = req.body;

    // Upsert application record
    await query(`
      INSERT INTO stylist_applications (user_id, current_step, progress, status, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET current_step = $2, progress = $3, status = $4, updated_at = NOW()
    `, [userId, currentStep, progress, status || 'in_progress']);

    res.json({
      success: true,
      message: 'Progress updated'
    });

  } catch (error) {
    logger.error('Error updating stylist application progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress'
    });
  }
});

// Submit stylist application
app.post('/api/stylist-application/submit', validateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const applicationData = req.body;

    // Store application data
    await query(`
      INSERT INTO stylist_applications (user_id, current_step, progress, status, data, submitted_at, updated_at)
      VALUES ($1, 7, 100, 'submitted', $2, NOW(), NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET current_step = 7, progress = 100, status = 'submitted', data = $2, submitted_at = NOW(), updated_at = NOW()
    `, [userId, JSON.stringify(applicationData)]);

    logger.info('Stylist application submitted', { userId });

    res.json({
      success: true,
      message: 'Application submitted successfully'
    });

  } catch (error) {
    logger.error('Error submitting stylist application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application'
    });
  }
});

// Debug routes (development/testing)
const debugRoutes = require('./routes/debug');
app.use('/api/debug', debugRoutes);

// Bitcoin payment routes
const bitcoinRoutes = require('./routes/bitcoin');
app.use('/api/bitcoin', validateJWT, bitcoinRoutes);

// Reviews routes (public endpoints for viewing reviews)
const reviewsPublicRoutes = require('./routes/reviews-public');
app.use('/api/reviews-public', reviewsPublicRoutes);

// Reviews routes (protected endpoints for creating/managing reviews)
const reviewsRoutes = require('./routes/reviews');
app.use('/api/reviews', validateJWT, reviewsRoutes);

// Blog routes (timeline feed with engagement-based sorting)
const blogRoutes = require('./routes/blog');
app.use('/api/blog', blogRoutes);

// Portfolio routes (before/after gallery)
const portfolioRoutes = require('./routes/portfolio');
app.use('/api/portfolio', portfolioRoutes);

// Portfolio upload routes (with Cloudinary)
const portfolioUploadRoutes = require('./routes/portfolio-upload');
app.use('/api/portfolio', validateJWT, portfolioUploadRoutes);

// Aphrodite AI routes
const aphroditeRoutes = require('./routes/aphrodite');
app.use('/api/aphrodite', aphroditeRoutes);

// Blog comments routes
const commentsRoutes = require('./routes/comments');
app.use('/api/comments', commentsRoutes);

// Geolocation routes (public - for language detection)
const geolocationRoutes = require('./routes/geolocation');
app.use('/api/geolocation', geolocationRoutes);

// Disputes routes (authenticated users only)
const disputesRoutes = require('./routes/disputes');
app.use('/api/disputes', disputesRoutes);

// Messaging routes (authenticated users only)
const messagingRoutes = require('./routes/messaging');
app.use('/api/messages', messagingRoutes);

// Messaging enhancements (rate limiting and contact detection)
const { router: messagingEnhancementsRoutes } = require('./routes/messagingEnhancements');
app.use('/api/messaging', validateJWT, messagingEnhancementsRoutes);

// Video consultation routes (authenticated users only)
const videoRoutes = require('./routes/video');
app.use('/api/video', videoRoutes);

// BTCPay webhooks (no auth required - validated by signature)
const btcpayWebhooksRoutes = require('./routes/btcpay-webhooks');
app.use('/api/webhooks', btcpayWebhooksRoutes);

// Notifications routes
const notificationsRoutes = require('./routes/notifications');
app.use('/api/notifications', validateJWT, notificationsRoutes);

// Stripe Connect routes (for stylist payouts)
const stripeConnectRoutes = require('./routes/stripeConnect');
app.use('/api/stripe-connect', stripeConnectRoutes);

// Schedule routes (stylist availability management)
const scheduleRoutes = require('./routes/schedule');
app.use('/api/schedule', validateJWT, scheduleRoutes);

// Frontend logs - no auth required for logging (authenticated in logs route itself)
const logsRoutes = require('./routes/logs');
app.use('/api/logs', logsRoutes);

// App downloads - Admin/Superadmin only
const appDownloadsRoutes = require('./routes/appDownloads');
app.use('/api/app-downloads', appDownloadsRoutes);

// Work status routes
const workStatusRoutes = require('./routes/work-status');
app.use('/api/work-status', workStatusRoutes);

// Booking request routes
const bookingRequestsRoutes = require('./routes/booking-requests');
app.use('/api/booking-requests', validateJWT, bookingRequestsRoutes);

// Admin routes - heavily secured
app.post('/api/admin/verify-username', async (req, res) => {
  try {
    const { username } = req.body;

    // Validate input
    if (!username || typeof username !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    // Normalize username (convert to lowercase, trim)
    const normalizedUsername = username.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Query database for admin user
    const queryText = `
      SELECT id, email, role, name, is_active, email_verified
      FROM users
      WHERE LOWER(email) = $1
      AND role IN ('ADMIN', 'SUPERADMIN')
      AND is_active = true
      AND email_verified = true
    `;

    const result = await query(queryText, [normalizedUsername]);

    if (result.rows.length > 0) {
      const adminUser = result.rows[0];

      // Log the verification attempt (for security auditing)
      console.log(`Admin username verification: ${normalizedUsername} - FOUND`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        adminUserId: adminUser.id
      });

      return res.json({
        success: true,
        exists: true,
        message: 'Admin user found'
      });
    } else {
      // Log failed verification attempt
      console.log(`Admin username verification: ${normalizedUsername} - NOT FOUND`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });

      return res.json({
        success: true,
        exists: false,
        message: 'Admin user not found'
      });
    }

  } catch (error) {
    console.error('Error in admin username verification:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error during username verification'
    });
  }
});

// Newsletter subscription endpoint
app.post('/api/newsletter/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Check if email already exists
    const existingSubscriber = await query(`
      SELECT id, status FROM newsletter_subscribers WHERE email = $1
    `, [email.toLowerCase()]);

    if (existingSubscriber.rows.length > 0) {
      const subscriber = existingSubscriber.rows[0];

      if (subscriber.status === 'active') {
        return res.status(409).json({
          success: false,
          message: 'Email is already subscribed to our newsletter'
        });
      }

      // If previously unsubscribed, reactivate
      await query(`
        UPDATE newsletter_subscribers
        SET status = 'active', unsubscribed_at = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [subscriber.id]);

      return res.json({
        success: true,
        message: 'Successfully resubscribed to our newsletter!'
      });
    }

    // Insert new subscription
    await query(`
      INSERT INTO newsletter_subscribers (email, status, source)
      VALUES ($1, 'active', 'footer_signup')
    `, [email.toLowerCase()]);

    logger.info('Newsletter subscription', { email, source: 'footer_signup' });

    res.json({
      success: true,
      message: '¡Gracias! Te has suscrito exitosamente a nuestro newsletter.'
    });

  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    logger.error('Newsletter subscription error', { error: error.message, stack: error.stack });

    res.status(500).json({
      success: false,
      message: 'There was an error processing your subscription. Please try again.'
    });
  }
});

// Import RSS content enhancer
const rssEnhancer = require('./rssContentEnhancer');

// Simple blog content translation helper
const translateBlogContent = (content, language) => {
  // Return original English content if language is English
  if (language !== 'es') {
    return content;
  }

  // For Spanish language, create beauty-focused Spanish content
  // This is a simplified approach - in production, you'd use proper translation services
  const spanishBeautyPosts = {
    'fashion-progress-emissions-stalling': {
      title: '¡Descubre las Tendencias de Belleza 2024 que Están Revolucionando el Mundo! 💄✨',
      excerpt: 'Las últimas tendencias en belleza que todas las it-girls están siguiendo este año. Desde looks naturales hasta maquillaje dramático.',
      content: `
        <h2>💖 Las Tendencias Más Hot del 2024</h2>

        <p>¡Hola bellezas! Este año está siendo INCREÍBLE para la industria de la belleza. Como expertas en BeautyCita, hemos estado siguiendo de cerca todas las tendencias que están marcando la pauta mundial.</p>

        <h3>✨ Maquillaje Glowy y Natural</h3>
        <p>El look "glass skin" sigue siendo el favorito de todas. Esa piel luminosa y perfecta que parece de porcelana está en su mejor momento. Nuestros estilistas recomiendan usar bases ligeras con acabado natural y mucho highlighter estratégicamente aplicado.</p>

        <h3>🌈 Colores Vibrantes en los Ojos</h3>
        <p>Los tonos neón y metálicos están dominando las redes sociales. Desde azules eléctricos hasta rosas fucsia, este año es perfecto para experimentar con colores atrevidos que expresen tu personalidad única.</p>

        <h3>💅 Nail Art Minimalista</h3>
        <p>Las uñas francesas han evolucionado. Ahora vemos versiones modernas con líneas de colores, formas geométricas y acabados mate que le dan un toque sofisticado a cualquier look.</p>

        <p><strong>En BeautyCita</strong> tenemos los mejores estilistas especializados en estas tendencias. ¡Reserva tu cita y únete al movimiento beauty del 2024!</p>
      `
    },
    'dirt-decay-fashion': {
      title: 'Rutina de Skincare Coreana: El Secreto de la Piel Perfecta 🌸',
      excerpt: 'Descubre los pasos esenciales del K-Beauty que están transformando la piel de millones de mujeres alrededor del mundo.',
      content: `
        <h2>🌟 El Poder del K-Beauty</h2>

        <p>La rutina coreana de skincare no es solo una moda, ¡es una revolución! En BeautyCita hemos visto cómo nuestras clientas transforman completamente su piel siguiendo estos métodos milenarios adaptados a la vida moderna.</p>

        <h3>✨ Los 7 Pasos Esenciales</h3>
        <p><strong>1. Limpiador a base de aceite:</strong> Perfecto para remover maquillaje y protector solar sin maltratar la piel.</p>
        <p><strong>2. Limpiador acuoso:</strong> Completa la limpieza eliminando impurezas restantes.</p>
        <p><strong>3. Tónico:</strong> Equilibra el pH y prepara la piel para los siguientes pasos.</p>
        <p><strong>4. Esencia:</strong> El secreto mejor guardado para una hidratación profunda.</p>
        <p><strong>5. Serum:</strong> Tratamiento concentrado para necesidades específicas.</p>
        <p><strong>6. Mascarilla:</strong> 2-3 veces por semana para nutrición extra.</p>
        <p><strong>7. Crema hidratante:</strong> Sella todos los beneficios anteriores.</p>

        <p>Nuestros especialistas en BeautyCita pueden ayudarte a crear la rutina perfecta para tu tipo de piel. ¡La piel de porcelana que siempre soñaste está a tu alcance!</p>
      `
    }
  };

  // Simple mapping based on common patterns in English titles
  const normalizedSlug = content.slug || '';

  if (spanishBeautyPosts[normalizedSlug]) {
    return {
      ...content,
      ...spanishBeautyPosts[normalizedSlug]
    };
  }

  // Default Spanish beauty transformation for any post
  return {
    ...content,
    author: 'BeautyCita',
    title: content.title.includes('Fashion') ?
      `Tendencias de Belleza Inspiradas en la Moda 2024 ✨` :
      `Consejos de Belleza Profesional 💖`,
    excerpt: 'Descubre los secretos de belleza que están transformando vidas. Tips exclusivos de nuestros expertos estilistas.',
    content: `
      <h2>💄 Consejos de Belleza BeautyCita</h2>

      <p>En BeautyCita creemos que cada mujer es única y merece sentirse espectacular todos los días. Nuestro equipo de estilistas profesionales ha creado esta guía especial para ti.</p>

      <h3>✨ Tendencias Actuales</h3>
      <p>Este año está marcado por la naturalidad y la expresión personal. Los looks que están dominando las redes sociales combinan técnicas clásicas con toques modernos que resaltan tu belleza natural.</p>

      <h3>🌟 Tips Profesionales</h3>
      <p>• Invierte en productos de calidad que cuiden tu piel a largo plazo</p>
      <p>• Experimenta con colores que complementen tu tono de piel</p>
      <p>• No olvides la importancia de una buena base: skincare es clave</p>
      <p>• Mantén tus herramientas limpias para mejores resultados</p>

      <p><strong>¿Lista para tu transformación?</strong> Reserva una cita con nuestros expertos y descubre tu mejor versión. En BeautyCita hacemos que cada día sea especial para ti. 💖</p>
    `
  };
};

// Blog posts endpoints
app.get('/api/blog/posts', async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'published', lang = 'en' } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(`
      SELECT id, title, slug, excerpt, author, published_at, created_at,
             source_feed, enhancement_date
      FROM blog_posts
      WHERE status = $1
      ORDER BY published_at DESC
      LIMIT $2 OFFSET $3
    `, [status, limit, offset]);

    // Translate content based on language
    const translatedPosts = result.rows.map(post => translateBlogContent(post, lang));

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) FROM blog_posts WHERE status = $1',
      [status]
    );

    res.json({
      success: true,
      posts: translatedPosts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch blog posts' });
  }
});

// Get single blog post
app.get('/api/blog/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { lang = 'en' } = req.query;

    const result = await query(`
      SELECT id, title, slug, content, excerpt, author, published_at,
             created_at, original_source_url, source_feed, enhancement_date
      FROM blog_posts
      WHERE slug = $1 AND status = 'published'
    `, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Translate content based on language
    const translatedPost = translateBlogContent(result.rows[0], lang);

    res.json({
      success: true,
      post: translatedPost
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch blog post' });
  }
});

// Trigger RSS processing (manual trigger for testing)
app.post('/api/admin/process-rss', async (req, res) => {
  try {
    console.log('Manual RSS processing triggered');
    const result = await rssEnhancer.processAllFeeds();

    res.json({
      success: true,
      message: `RSS processing completed. ${result.totalProcessed} articles enhanced.`,
      result
    });
  } catch (error) {
    console.error('Error in manual RSS processing:', error);
    res.status(500).json({
      success: false,
      message: 'RSS processing failed',
      error: error.message
    });
  }
});

// Get RSS processing status
app.get('/api/admin/rss-status', async (req, res) => {
  try {
    const status = rssEnhancer.getStatus();

    // Get feed tracking info
    const trackingResult = await query(`
      SELECT feed_name, feed_url, last_check, last_processed_item_date,
             total_processed, status
      FROM rss_feed_tracking
      ORDER BY feed_name
    `);

    res.json({
      success: true,
      processingStatus: status,
      feeds: trackingResult.rows
    });
  } catch (error) {
    console.error('Error getting RSS status:', error);
    res.status(500).json({ success: false, message: 'Failed to get RSS status' });
  }
});

// Get user profile (JWT-based authentication)
app.get('/api/auth/profile', validateJWT, async (req, res) => {
  try {
    // Get user data
    const userResult = await query(`
      SELECT id, first_name, last_name, name, email, phone, role,
             profile_picture_url, email_verified, phone_verified,
             is_active, created_at
      FROM users
      WHERE id = $1
    `, [req.userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];
    let roleData = null;

    // Get role-specific data
    if (user.role === 'STYLIST') {
      const stylistResult = await query('SELECT * FROM stylists WHERE user_id = $1', [user.id]);
      roleData = stylistResult.rows[0] || null;
    } else if (user.role === 'CLIENT') {
      const clientResult = await query('SELECT * FROM clients WHERE user_id = $1', [user.id]);
      roleData = clientResult.rows[0] || null;
    }

    const responseData = {
      user: user,
      [user.role.toLowerCase()]: roleData
    };

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Get current user (session-based authentication for backward compatibility)
app.get('/api/auth/user', (req, res) => {
  try {
    if (!!req.user) {
      console.log('Authenticated user request:', req.user?.email);
      res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        profile_picture_url: req.user.profile_picture_url
      });
    } else {
      console.log('Unauthenticated user request');
      res.status(401).json({ message: 'Not authenticated' });
    }
  } catch (error) {
    console.error('Error checking user authentication:', error);
    res.status(500).json({ message: 'Authentication check failed' });
  }
});

// Logout user
app.post('/api/auth/logout', (req, res) => {
  try {
    const userEmail = req.user?.email;
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      console.log('User logged out successfully:', userEmail);
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
        }
        res.clearCookie('beautycita.session');
        res.json({ message: 'Logged out successfully' });
      });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
});

// ==================== STYLIST ROUTES ====================

// Get all stylists (public)
app.get('/api/stylists', async (req, res) => {
  try {
    const { city, specialties, pricing_tier, limit = 20, offset = 0 } = req.query;
    
    // Generate cache key from query parameters
    const cacheKey = "stylists:" + JSON.stringify({ city, specialties, pricing_tier, limit, offset });
    
    // Try to get from cache first
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        logger.info("Returning cached stylists data", { cacheKey });
        return res.json(JSON.parse(cachedData));
      }
    } catch (cacheError) {
      logger.warn("Cache read error, falling back to database", { error: cacheError.message });
    }

    let query_text = `
      SELECT s.*, u.name, u.profile_picture_url, u.email
      FROM stylists s
      JOIN users u ON s.user_id = u.id
      WHERE s.is_verified = true AND u.is_active = true
    `;
    const params = [];
    let paramCount = 1;

    if (city) {
      query_text += ` AND LOWER(s.location_city) = LOWER($${paramCount})`;
      params.push(city);
      paramCount++;
    }

    if (specialties) {
      const specialtyArray = specialties.split(',');
      query_text += ` AND s.specialties && $${paramCount}`;
      params.push(specialtyArray);
      paramCount++;
    }

    if (pricing_tier) {
      query_text += ` AND s.pricing_tier = $${paramCount}`;
      params.push(pricing_tier);
      paramCount++;
    }

    query_text += ` ORDER BY s.rating_average DESC, s.rating_count DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(query_text, params);
    logger.info('Stylists query successful', { count: result.rows.length });
    
    // Cache the result for 5 minutes (300 seconds)
    try {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(result.rows));
      logger.info("Cached stylists data", { cacheKey, ttl: 300 });
    } catch (cacheError) {
      logger.warn("Cache write error", { error: cacheError.message });
    }
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stylists:', error);
    console.error('Error details:', error.message);
    console.error('Query was:', query_text);
    console.error('Params were:', params);
    res.status(500).json({ message: 'Failed to fetch stylists' });
  }
});

// Get specific stylist
app.get('/api/stylists/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT s.*, u.name, u.profile_picture_url, u.email
      FROM stylists s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1 AND s.is_verified = true AND u.is_active = true
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Stylist not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching stylist:', error);
    res.status(500).json({ message: 'Failed to fetch stylist' });
  }
});

// Get stylist services
app.get('/api/stylists/:id/services', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT * FROM services
      WHERE stylist_id = $1 AND is_active = true
      ORDER BY category, name
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stylist services:', error);
    res.status(500).json({ message: 'Failed to fetch services' });
  }
});

// ==================== BOOKING ROUTES ====================

// Create new booking
app.post('/api/bookings', validateJWT, async (req, res) => {
  // Check if user is CLIENT
  if (req.userRole !== 'CLIENT') {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
  try {
    const { stylist_id, service_id, booking_date, booking_time, notes } = req.body;
    const client_id = req.userId;

    // Validate input
    if (!stylist_id || !service_id || !booking_date || !booking_time) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get service details
    const service = await query('SELECT * FROM services WHERE id = $1 AND stylist_id = $2', [service_id, stylist_id]);
    if (service.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const serviceData = service.rows[0];

    // Check if time slot is available (simplified check)
    const existingBooking = await query(`
      SELECT id FROM bookings
      WHERE stylist_id = $1 AND booking_date = $2 AND booking_time = $3
      AND status NOT IN ('CANCELLED', 'NO_SHOW')
    `, [stylist_id, booking_date, booking_time]);

    if (existingBooking.rows.length > 0) {
      return res.status(409).json({ message: 'Time slot not available' });
    }

    // Create booking
    const booking = await query(`
      INSERT INTO bookings (client_id, stylist_id, service_id, booking_date, booking_time, duration_minutes, total_price, notes, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
      RETURNING *
    `, [client_id, stylist_id, service_id, booking_date, booking_time, serviceData.duration_minutes, serviceData.price, notes || '']);

    res.status(201).json({
      message: 'Booking created successfully',
      booking: booking.rows[0]
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Failed to create booking' });
  }
});

// Get user's bookings
app.get('/api/bookings', validateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { status } = req.query;

    let query_text = `
      SELECT b.*, s.name as service_name, s.category as service_category,
             st.business_name, st.location_address, st.location_city,
             u.name as stylist_name, u.profile_picture_url as stylist_picture
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN stylists st ON b.stylist_id = st.id
      JOIN users u ON st.user_id = u.id
    `;

    const params = [userId];

    if (req.userRole === 'CLIENT') {
      query_text += ' WHERE b.client_id = $1';
    } else if (req.userRole === 'STYLIST') {
      query_text += ' WHERE st.user_id = $1';
    }

    if (status) {
      query_text += ' AND b.status = $2';
      params.push(status);
    }

    query_text += ' ORDER BY b.booking_date DESC, b.booking_time DESC';

    const result = await query(query_text, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

// Get available time slots for a stylist on a specific date
app.get('/api/stylists/:stylistId/availability', async (req, res) => {
  try {
    const { stylistId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date parameter is required' });
    }

    // Verify stylist exists and is active
    const stylistCheck = await query(`
      SELECT u.id, s.id as stylist_id
      FROM users u
      JOIN stylists s ON u.id = s.user_id
      WHERE s.id = $1 AND u.role = 'STYLIST' AND u.is_active = true
    `, [stylistId]);

    if (stylistCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Stylist not found or inactive' });
    }

    // Get existing bookings for this stylist on this date
    const existingBookings = await query(`
      SELECT booking_time, duration_minutes
      FROM bookings
      WHERE stylist_id = $1
        AND booking_date = $2
        AND status IN ('PENDING', 'CONFIRMED')
      ORDER BY booking_time
    `, [stylistId, date]);

    // Generate all possible time slots (9:00 AM to 6:00 PM in 30-minute intervals)
    const allSlots = [];
    const startHour = 9; // 9 AM
    const endHour = 18; // 6 PM

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minutes = 0; minutes < 60; minutes += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        allSlots.push(timeStr);
      }
    }

    // Filter out booked slots
    const bookedSlots = new Set();

    existingBookings.rows.forEach(booking => {
      const bookingTime = booking.booking_time;
      const duration = booking.duration_minutes || 60; // Default 60 minutes if not specified

      // Calculate how many 30-minute slots this booking occupies
      const slotsNeeded = Math.ceil(duration / 30);

      // Find the index of the booking time
      const bookingIndex = allSlots.indexOf(bookingTime);

      if (bookingIndex !== -1) {
        // Mark this slot and subsequent slots as booked
        for (let i = 0; i < slotsNeeded && (bookingIndex + i) < allSlots.length; i++) {
          bookedSlots.add(allSlots[bookingIndex + i]);
        }
      }
    });

    // Return available slots (excluding booked ones)
    const availableSlots = allSlots.filter(slot => !bookedSlots.has(slot));

    // If the requested date is today, filter out past time slots
    const requestedDate = new Date(date);
    const today = new Date();

    let finalSlots = availableSlots;

    if (requestedDate.toDateString() === today.toDateString()) {
      const currentHour = today.getHours();
      const currentMinutes = today.getMinutes();

      finalSlots = availableSlots.filter(slot => {
        const [slotHour, slotMinutes] = slot.split(':').map(Number);
        const slotTotalMinutes = slotHour * 60 + slotMinutes;
        const currentTotalMinutes = currentHour * 60 + currentMinutes;

        // Only show slots that are at least 1 hour in the future
        return slotTotalMinutes > currentTotalMinutes + 60;
      });
    }

    res.json({
      success: true,
      data: finalSlots
    });

  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available slots',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ==================== PORTFOLIO ROUTES ====================

// Username availability check
app.get('/api/username/check/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const result = await query('SELECT is_username_available($1) as available', [username]);
    const isAvailable = result.rows[0].available;

    res.json({
      username,
      available: isAvailable
    });
  } catch (error) {
    console.error('Error checking username availability:', error);
    res.status(500).json({ message: 'Failed to check username availability' });
  }
});

// Generate username suggestions
app.post('/api/username/suggestions', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const result = await query('SELECT generate_username_suggestions($1) as suggestions', [name]);
    const suggestions = result.rows[0].suggestions;

    res.json({ suggestions });
  } catch (error) {
    console.error('Error generating username suggestions:', error);
    res.status(500).json({ message: 'Failed to generate username suggestions' });
  }
});

// Check username availability
app.get('/api/portfolio/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const result = await query('SELECT is_username_available($1) as available', [username]);
    const isAvailable = result.rows[0].available;

    res.json({
      available: isAvailable,
      username: username
    });
  } catch (error) {
    console.error('Error checking username availability:', error);
    res.status(500).json({ message: 'Failed to check username availability' });
  }
});

// Get current user's portfolio profile
app.get('/api/portfolio/profile', validateJWT, requireRole(['STYLIST']), async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT u.username, u.profile_visibility, s.*
      FROM users u
      JOIN stylists s ON u.id = s.user_id
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Stylist profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching portfolio profile:', error);
    res.status(500).json({ message: 'Failed to fetch portfolio profile' });
  }
});

// Update portfolio profile
app.put('/api/portfolio/profile', validateJWT, requireRole(['STYLIST']), async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      username,
      profile_visibility,
      brand_story,
      signature_styles,
      portfolio_theme,
      custom_sections,
      portfolio_published
    } = req.body;

    // Validate username if provided
    if (username) {
      const availabilityCheck = await query('SELECT is_username_available($1) as available', [username]);
      if (!availabilityCheck.rows[0].available) {
        // Check if it's the current user's username
        const currentUser = await query('SELECT username FROM users WHERE id = $1', [userId]);
        if (currentUser.rows[0].username !== username) {
          return res.status(400).json({ message: 'Username is not available' });
        }
      }
    }

    // Start transaction
    await query('BEGIN');

    try {
      // Update users table
      const userFields = [];
      const userValues = [];
      let userParamCount = 1;

      if (username !== undefined) {
        userFields.push(`username = $${userParamCount++}`);
        userValues.push(username);
      }

      if (profile_visibility !== undefined) {
        userFields.push(`profile_visibility = $${userParamCount++}`);
        userValues.push(profile_visibility);
      }

      if (userFields.length > 0) {
        userValues.push(userId);
        await query(`
          UPDATE users
          SET ${userFields.join(', ')}
          WHERE id = $${userParamCount}
        `, userValues);
      }

      // Update stylists table
      const stylistFields = [];
      const stylistValues = [];
      let stylistParamCount = 1;

      if (brand_story !== undefined) {
        stylistFields.push(`brand_story = $${stylistParamCount++}`);
        stylistValues.push(brand_story);
      }

      if (signature_styles !== undefined) {
        stylistFields.push(`signature_styles = $${stylistParamCount++}`);
        stylistValues.push(signature_styles);
      }

      if (portfolio_theme !== undefined) {
        stylistFields.push(`portfolio_theme = $${stylistParamCount++}`);
        stylistValues.push(portfolio_theme);
      }

      if (custom_sections !== undefined) {
        stylistFields.push(`custom_sections = $${stylistParamCount++}`);
        stylistValues.push(JSON.stringify(custom_sections));
      }

      if (portfolio_published !== undefined) {
        stylistFields.push(`portfolio_published = $${stylistParamCount++}`);
        stylistValues.push(portfolio_published);
      }

      if (stylistFields.length > 0) {
        stylistValues.push(userId);
        await query(`
          UPDATE stylists
          SET ${stylistFields.join(', ')}
          WHERE user_id = $${stylistParamCount}
        `, stylistValues);
      }

      await query('COMMIT');

      // Fetch updated profile
      const updatedProfile = await query(`
        SELECT u.username, u.profile_visibility, s.*
        FROM users u
        JOIN stylists s ON u.id = s.user_id
        WHERE u.id = $1
      `, [userId]);

      res.json({
        message: 'Portfolio profile updated successfully',
        profile: updatedProfile.rows[0]
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error updating portfolio profile:', error);
    res.status(500).json({ message: 'Failed to update portfolio profile' });
  }
});

// Get work samples for current stylist
app.get('/api/portfolio/work-samples', validateJWT, requireRole(['STYLIST']), async (req, res) => {
  try {
    const userId = req.user.id;

    // Get stylist ID
    const stylistResult = await query('SELECT id FROM stylists WHERE user_id = $1', [userId]);
    if (stylistResult.rows.length === 0) {
      return res.status(404).json({ message: 'Stylist profile not found' });
    }

    const stylistId = stylistResult.rows[0].id;

    const result = await query(`
      SELECT * FROM stylist_work_samples
      WHERE stylist_id = $1
      ORDER BY is_featured DESC, display_order ASC, created_at DESC
    `, [stylistId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching work samples:', error);
    res.status(500).json({ message: 'Failed to fetch work samples' });
  }
});

// Add new work sample
app.post('/api/portfolio/work-samples', validateJWT, requireRole(['STYLIST']), async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      service_category,
      before_images,
      after_images,
      techniques_used,
      products_used,
      client_hair_type,
      time_investment,
      difficulty_level,
      is_featured,
      display_order
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Get stylist ID
    const stylistResult = await query('SELECT id FROM stylists WHERE user_id = $1', [userId]);
    if (stylistResult.rows.length === 0) {
      return res.status(404).json({ message: 'Stylist profile not found' });
    }

    const stylistId = stylistResult.rows[0].id;

    const result = await query(`
      INSERT INTO stylist_work_samples (
        stylist_id, title, description, service_category, before_images, after_images,
        techniques_used, products_used, client_hair_type, time_investment,
        difficulty_level, is_featured, display_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      stylistId, title, description, service_category, before_images || [],
      after_images || [], techniques_used || [], products_used || [],
      client_hair_type, time_investment, difficulty_level,
      is_featured || false, display_order || 0
    ]);

    res.status(201).json({
      message: 'Work sample added successfully',
      workSample: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding work sample:', error);
    res.status(500).json({ message: 'Failed to add work sample' });
  }
});

// Update work sample
app.put('/api/portfolio/work-samples/:id', validateJWT, requireRole(['STYLIST']), async (req, res) => {
  try {
    const userId = req.user.id;
    const workSampleId = req.params.id;
    const updateFields = req.body;

    // Get stylist ID and verify ownership
    const stylistResult = await query('SELECT id FROM stylists WHERE user_id = $1', [userId]);
    if (stylistResult.rows.length === 0) {
      return res.status(404).json({ message: 'Stylist profile not found' });
    }

    const stylistId = stylistResult.rows[0].id;

    // Verify work sample ownership
    const ownershipCheck = await query(
      'SELECT id FROM stylist_work_samples WHERE id = $1 AND stylist_id = $2',
      [workSampleId, stylistId]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Work sample not found' });
    }

    // Build dynamic update query
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateFields).forEach(field => {
      if (['title', 'description', 'service_category', 'before_images', 'after_images',
           'techniques_used', 'products_used', 'client_hair_type', 'time_investment',
           'difficulty_level', 'is_featured', 'display_order', 'is_visible'].includes(field)) {
        fields.push(`${field} = $${paramCount++}`);
        values.push(updateFields[field]);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    values.push(workSampleId);

    const result = await query(`
      UPDATE stylist_work_samples
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    res.json({
      message: 'Work sample updated successfully',
      workSample: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating work sample:', error);
    res.status(500).json({ message: 'Failed to update work sample' });
  }
});

// Delete work sample
app.delete('/api/portfolio/work-samples/:id', validateJWT, requireRole(['STYLIST']), async (req, res) => {
  try {
    const userId = req.user.id;
    const workSampleId = req.params.id;

    // Get stylist ID and verify ownership
    const stylistResult = await query('SELECT id FROM stylists WHERE user_id = $1', [userId]);
    if (stylistResult.rows.length === 0) {
      return res.status(404).json({ message: 'Stylist profile not found' });
    }

    const stylistId = stylistResult.rows[0].id;

    const result = await query(
      'DELETE FROM stylist_work_samples WHERE id = $1 AND stylist_id = $2 RETURNING id',
      [workSampleId, stylistId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Work sample not found' });
    }

    res.json({ message: 'Work sample deleted successfully' });
  } catch (error) {
    console.error('Error deleting work sample:', error);
    res.status(500).json({ message: 'Failed to delete work sample' });
  }
});

// PUBLIC PORTFOLIO ROUTES (no authentication required)

// Get public portfolio by username
app.get('/api/portfolio/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const result = await query(`
      SELECT
        u.username, u.name, u.profile_picture_url,
        s.business_name, s.bio, s.brand_story, s.specialties, s.experience_years,
        s.location_city, s.location_state, s.pricing_tier, s.base_price_range,
        s.portfolio_images, s.social_media_links, s.certifications, s.working_hours,
        s.portfolio_theme, s.custom_sections, s.rating_average, s.rating_count
      FROM users u
      JOIN stylists s ON u.id = s.user_id
      WHERE u.username = $1
        AND u.profile_visibility = 'public'
        AND s.portfolio_published = true
        AND u.is_active = true
    `, [username]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    const portfolio = result.rows[0];

    // Get work samples
    const workSamplesResult = await query(`
      SELECT
        id, title, description, service_category, before_images, after_images,
        techniques_used, products_used, client_hair_type, difficulty_level,
        is_featured, display_order
      FROM stylist_work_samples
      WHERE stylist_id = (SELECT id FROM stylists WHERE user_id = (SELECT id FROM users WHERE username = $1))
        AND is_visible = true
      ORDER BY is_featured DESC, display_order ASC, created_at DESC
    `, [username]);

    portfolio.work_samples = workSamplesResult.rows;

    // Get services
    const servicesResult = await query(`
      SELECT id, name, description, category, duration_minutes, price
      FROM services
      WHERE stylist_id = (SELECT id FROM stylists WHERE user_id = (SELECT id FROM users WHERE username = $1))
        AND is_active = true
      ORDER BY category, name
    `, [username]);

    portfolio.services = servicesResult.rows;

    // Track portfolio view (async, don't wait)
    const stylistId = await query('SELECT id FROM stylists WHERE user_id = (SELECT id FROM users WHERE username = $1)', [username]);
    if (stylistId.rows.length > 0) {
      query(`
        UPDATE stylists SET portfolio_views = portfolio_views + 1
        WHERE id = $1
      `, [stylistId.rows[0].id]).catch(err =>
        console.error('Error updating portfolio views:', err)
      );
    }

    res.json(portfolio);
  } catch (error) {
    console.error('Error fetching public portfolio:', error);
    res.status(500).json({ message: 'Failed to fetch portfolio' });
  }
});

// Dashboard API Endpoints

// Get stylist dashboard statistics
app.get('/api/dashboard/stylist/stats', validateJWT, requireRole(['STYLIST']), async (req, res) => {
  try {
    const userId = req.user.id;

    // Get stylist ID
    const stylistResult = await query('SELECT id FROM stylists WHERE user_id = $1', [userId]);
    if (stylistResult.rows.length === 0) {
      return res.status(404).json({ message: 'Stylist profile not found' });
    }
    const stylistId = stylistResult.rows[0].id;

    // Get statistics
    const stats = await query(`
      SELECT
        COUNT(b.id) FILTER (WHERE b.status = 'confirmed' AND b.appointment_date >= CURRENT_DATE) as upcoming_bookings,
        COUNT(b.id) FILTER (WHERE b.status = 'completed') as total_bookings,
        COALESCE(SUM(b.total_amount), 0) FILTER (WHERE b.status = 'completed') as total_revenue,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as total_reviews,
        (SELECT COUNT(*) FROM stylist_followers sf WHERE sf.stylist_id = $1) as followers_count
      FROM bookings b
      LEFT JOIN reviews r ON b.id = r.booking_id
      WHERE b.stylist_id = $1
    `, [stylistId]);

    // Get profile completion data
    const profileResult = await query(`
      SELECT
        u.first_name, u.last_name, u.email, u.phone, u.profile_picture_url,
        s.business_name, s.bio, s.specialties, s.location_address, s.location_city,
        s.location_state, s.instagram_handle, s.portfolio_published
      FROM users u
      JOIN stylists s ON u.id = s.user_id
      WHERE u.id = $1
    `, [userId]);

    const profile = profileResult.rows[0];
    let profileCompleteness = 0;
    const totalFields = 10;

    if (profile.first_name) profileCompleteness++;
    if (profile.last_name) profileCompleteness++;
    if (profile.email) profileCompleteness++;
    if (profile.phone) profileCompleteness++;
    if (profile.business_name) profileCompleteness++;
    if (profile.bio) profileCompleteness++;
    if (profile.specialties && profile.specialties.length > 0) profileCompleteness++;
    if (profile.location_address) profileCompleteness++;
    if (profile.location_city) profileCompleteness++;
    if (profile.instagram_handle) profileCompleteness++;

    const profilePercentage = Math.round((profileCompleteness / totalFields) * 100);

    res.json({
      upcomingBookings: parseInt(stats.rows[0].upcoming_bookings) || 0,
      totalBookings: parseInt(stats.rows[0].total_bookings) || 0,
      totalRevenue: parseFloat(stats.rows[0].total_revenue) || 0,
      averageRating: parseFloat(stats.rows[0].average_rating) || 0,
      totalReviews: parseInt(stats.rows[0].total_reviews) || 0,
      followersCount: parseInt(stats.rows[0].followers_count) || 0,
      profileCompleteness: profilePercentage
    });

  } catch (error) {
    console.error('Error fetching stylist dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

// Get client dashboard statistics
app.get('/api/dashboard/client/stats', validateJWT, requireRole(['CLIENT']), async (req, res) => {
  try {
    const userId = req.user.id;

    // Get statistics
    const stats = await query(`
      SELECT
        COUNT(b.id) FILTER (WHERE b.status IN ('confirmed', 'pending') AND b.appointment_date >= CURRENT_DATE) as upcoming_bookings,
        COUNT(b.id) FILTER (WHERE b.status = 'completed') as total_bookings,
        COALESCE(SUM(b.total_amount), 0) FILTER (WHERE b.status = 'completed') as total_spent,
        (SELECT COUNT(DISTINCT sf.stylist_id) FROM stylist_followers sf WHERE sf.user_id = $1) as favorite_stylists
      FROM bookings b
      WHERE b.user_id = $1
    `, [userId]);

    res.json({
      upcomingBookings: parseInt(stats.rows[0].upcoming_bookings) || 0,
      totalBookings: parseInt(stats.rows[0].total_bookings) || 0,
      totalSpent: parseFloat(stats.rows[0].total_spent) || 0,
      favoriteStylists: parseInt(stats.rows[0].favorite_stylists) || 0
    });

  } catch (error) {
    console.error('Error fetching client dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

// Get stylist recent activity
app.get('/api/dashboard/stylist/activity', validateJWT, requireRole(['STYLIST']), async (req, res) => {
  try {
    const userId = req.user.id;

    // Get stylist ID
    const stylistResult = await query('SELECT id FROM stylists WHERE user_id = $1', [userId]);
    if (stylistResult.rows.length === 0) {
      return res.status(404).json({ message: 'Stylist profile not found' });
    }
    const stylistId = stylistResult.rows[0].id;

    // Get recent bookings
    const recentBookings = await query(`
      SELECT
        b.id, b.appointment_date, b.appointment_time, b.status, b.total_amount,
        u.first_name, u.last_name, u.email,
        s.name as service_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      LEFT JOIN services s ON b.service_id = s.id
      WHERE b.stylist_id = $1
      ORDER BY b.created_at DESC
      LIMIT 5
    `, [stylistId]);

    // Get recent reviews
    const recentReviews = await query(`
      SELECT
        r.id, r.rating, r.comment, r.created_at,
        u.first_name, u.last_name,
        s.name as service_name
      FROM reviews r
      JOIN bookings b ON r.booking_id = b.id
      JOIN users u ON b.user_id = u.id
      LEFT JOIN services s ON b.service_id = s.id
      WHERE b.stylist_id = $1
      ORDER BY r.created_at DESC
      LIMIT 3
    `, [stylistId]);

    res.json({
      recentBookings: recentBookings.rows,
      recentReviews: recentReviews.rows
    });

  } catch (error) {
    console.error('Error fetching stylist activity:', error);
    res.status(500).json({ message: 'Failed to fetch recent activity' });
  }
});

// Get client recent activity
app.get('/api/dashboard/client/activity', validateJWT, requireRole(['CLIENT']), async (req, res) => {
  try {
    const userId = req.user.id;

    // Get upcoming bookings
    const upcomingBookings = await query(`
      SELECT
        b.id, b.appointment_date, b.appointment_time, b.status, b.total_amount,
        s.business_name as stylist_name, s.location_address,
        srv.name as service_name
      FROM bookings b
      JOIN stylists s ON b.stylist_id = s.id
      LEFT JOIN services srv ON b.service_id = srv.id
      WHERE b.user_id = $1
        AND b.status IN ('confirmed', 'pending')
        AND b.appointment_date >= CURRENT_DATE
      ORDER BY b.appointment_date ASC, b.appointment_time ASC
      LIMIT 3
    `, [userId]);

    // Get recent completed bookings
    const recentBookings = await query(`
      SELECT
        b.id, b.appointment_date, b.appointment_time, b.status, b.total_amount,
        s.business_name as stylist_name,
        srv.name as service_name,
        r.rating, r.id as review_id
      FROM bookings b
      JOIN stylists s ON b.stylist_id = s.id
      LEFT JOIN services srv ON b.service_id = srv.id
      LEFT JOIN reviews r ON b.id = r.booking_id
      WHERE b.user_id = $1
        AND b.status = 'completed'
      ORDER BY b.appointment_date DESC
      LIMIT 5
    `, [userId]);

    res.json({
      upcomingBookings: upcomingBookings.rows,
      recentBookings: recentBookings.rows
    });

  } catch (error) {
    console.error('Error fetching client activity:', error);
    res.status(500).json({ message: 'Failed to fetch recent activity' });
  }
});

// Get enhanced user profile data
app.get('/api/dashboard/profile', validateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user basic data
    const userResult = await query(`
      SELECT u.*,
        CASE
          WHEN u.role = 'STYLIST' THEN s.id
          WHEN u.role = 'CLIENT' THEN c.id
          ELSE NULL
        END as profile_id
      FROM users u
      LEFT JOIN stylists s ON u.id = s.user_id AND u.role = 'STYLIST'
      LEFT JOIN clients c ON u.id = c.user_id AND u.role = 'CLIENT'
      WHERE u.id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get role-specific data
    let roleData = null;
    if (user.role === 'STYLIST') {
      const stylistResult = await query(`
        SELECT * FROM stylists WHERE user_id = $1
      `, [userId]);
      roleData = stylistResult.rows[0];
    } else if (user.role === 'CLIENT') {
      const clientResult = await query(`
        SELECT * FROM clients WHERE user_id = $1
      `, [userId]);
      roleData = clientResult.rows[0];
    }

    res.json({
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile_picture_url: user.profile_picture_url,
        created_at: user.created_at
      },
      [user.role.toLowerCase()]: roleData
    });

  } catch (error) {
    console.error('Error fetching profile data:', error);
    res.status(500).json({ message: 'Failed to fetch profile data' });
  }
});

// Security monitoring routes
const securityRoutes = require('./securityRoutes');
// Contact form routes
const contactRoutes = require('./routes/contact');
app.use('/api/contact', contactRoutes);
const gdprRoutes = require("./routes/gdpr");
const calendarRoutes = require("./routes/calendar");
app.use("/api/users", gdprRoutes);
app.use("/api", calendarRoutes);

app.use('/api', securityRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, '../../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// SPA routing - serve index.html for all non-API routes
app.get(/^(?!\/api).*/, (req, res) => {
  // Serve index.html for all non-API routes (SPA routing)
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Initialize Booking Expiration Service
const bookingExpirationService = require('./bookingExpiration');

// Initialize notification scheduler
const NotificationScheduler = require('./services/EnhancedNotificationScheduler');
const notificationScheduler = new NotificationScheduler();

// Import appointment reminder service
const appointmentReminderService = require('./appointmentReminderService');

// Import Aphrodite pattern learning
const { initPatternDB, updatePatternsFromDB } = require('./utils/aphroditePatterns');

// Start server with Socket.io support (skip in test mode)
if (process.env.NODE_ENV !== 'test') {
httpServer.listen(PORT, async () => {
  console.log(`🌸 BeautyCita server running on port ${PORT}`);
  console.log(`🚀 Socket.io enabled for real-time features`);
  console.log(`Environment: ${process.env.NODE_ENV}`);

  // Initialize Aphrodite AI pattern database
  await initPatternDB();
  console.log('🤖 Aphrodite AI pattern database initialized');

  // Initialize modern architecture (GraphQL, BFF, Message Queues)
  try {
    await initializeModernArchitecture(app);
  } catch (error) {
    console.error('❌ Failed to initialize modern architecture:', error);
  }

  // Start booking expiration service in production
  if (process.env.NODE_ENV === 'production') {
    bookingExpirationService.start(1); // Check every 1 minute
    console.log('📅 Booking expiration service started');

    // Start appointment reminder service
    appointmentReminderService.start();
    console.log('📱 Appointment reminder service started');

    // Start Aphrodite pattern learning (update every hour)
    setInterval(async () => {
      try {
        const stats = await updatePatternsFromDB();
        console.log(`🧠 Aphrodite patterns updated: ${stats.highConfidenceAreaCodes}/${stats.totalAreaCodes} area codes at 95%+ confidence`);
      } catch (error) {
        console.error('❌ Failed to update Aphrodite patterns:', error);
      }
    }, 3600000); // 1 hour

    // Initial pattern update
    setTimeout(async () => {
      try {
        await updatePatternsFromDB();
        console.log('🧠 Initial Aphrodite pattern update complete');
      } catch (error) {
        console.error('❌ Initial pattern update failed:', error);
      }
    }, 5000); // 5 seconds after startup

    // Start notification scheduler
    notificationScheduler.start();
    console.log('📱 Notification scheduler started');
}
});
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  bookingExpirationService.stop();
  appointmentReminderService.stop();
  notificationScheduler.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  bookingExpirationService.stop();
  appointmentReminderService.stop();
  notificationScheduler.stop();
  process.exit(0);
});


// Export app for testing
module.exports = app;
