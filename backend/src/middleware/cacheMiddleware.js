const cacheService = require('../services/cacheService');

/**
 * Cache Middleware for Express Routes
 * Provides automatic caching for API responses
 */

/**
 * Generic cache middleware
 * Usage: router.get('/path', cacheMiddleware(300), handler)
 */
function cacheMiddleware(ttl = 300) {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if user is authenticated (personalized data)
    // Can be customized based on your auth strategy
    const skipCache = req.headers['x-no-cache'] === 'true';
    if (skipCache) {
      return next();
    }

    try {
      // Generate cache key from URL and query params
      const cacheKey = generateCacheKey(req);

      // Try to get cached response
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return res.json({
          ...cached,
          _cached: true,
          _cachedAt: cached._timestamp
        });
      }

      console.log(`❌ Cache MISS: ${cacheKey}`);

      // Store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = function(data) {
        // Don't cache error responses
        if (res.statusCode >= 400) {
          return originalJson(data);
        }

        // Cache the response
        const cacheData = {
          ...data,
          _timestamp: new Date().toISOString()
        };

        cacheService.set(cacheKey, cacheData, ttl).catch(err => {
          console.error('❌ Failed to cache response:', err.message);
        });

        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('❌ Cache middleware error:', error.message);
      next(); // Continue without caching on error
    }
  };
}

/**
 * Cache middleware with custom key generator
 */
function cacheMiddlewareWithKey(keyGenerator, ttl = 300) {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const cacheKey = keyGenerator(req);
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return res.json({
          ...cached,
          _cached: true
        });
      }

      console.log(`❌ Cache MISS: ${cacheKey}`);

      const originalJson = res.json.bind(res);
      res.json = function(data) {
        if (res.statusCode >= 400) {
          return originalJson(data);
        }

        cacheService.set(cacheKey, data, ttl).catch(err => {
          console.error('❌ Failed to cache response:', err.message);
        });

        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('❌ Cache middleware error:', error.message);
      next();
    }
  };
}

/**
 * Cache invalidation middleware
 * Clears cache entries matching pattern after successful mutation
 */
function invalidateCacheMiddleware(pattern) {
  return async (req, res, next) => {
    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json to invalidate cache after successful response
    res.json = function(data) {
      // Only invalidate on successful responses (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheService.delPattern(pattern).catch(err => {
          console.error('❌ Failed to invalidate cache:', err.message);
        });
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Generate cache key from request
 */
function generateCacheKey(req) {
  const path = req.path;
  const query = JSON.stringify(req.query);
  const userId = req.userId || req.user?.id || 'anonymous';

  // Create unique key: path + query + userId
  const keyString = `${path}:${query}:${userId}`;
  const key = `bc:route:${Buffer.from(keyString).toString('base64').substring(0, 64)}`;

  return key;
}

/**
 * User-specific cache middleware
 * Caches per-user data
 */
function userCacheMiddleware(ttl = 300) {
  return async (req, res, next) => {
    if (req.method !== 'GET' || !req.userId) {
      return next();
    }

    try {
      const cacheKey = `bc:user:${req.userId}:${req.path}:${JSON.stringify(req.query)}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        console.log(`✅ User cache HIT: ${cacheKey}`);
        return res.json({
          ...cached,
          _cached: true
        });
      }

      console.log(`❌ User cache MISS: ${cacheKey}`);

      const originalJson = res.json.bind(res);
      res.json = function(data) {
        if (res.statusCode >= 400) {
          return originalJson(data);
        }

        cacheService.set(cacheKey, data, ttl).catch(err => {
          console.error('❌ Failed to cache user response:', err.message);
        });

        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('❌ User cache middleware error:', error.message);
      next();
    }
  };
}

/**
 * Rate limiting middleware using Redis
 */
function rateLimitMiddleware(maxAttempts = 100, windowSeconds = 60) {
  return async (req, res, next) => {
    try {
      const identifier = req.ip || req.connection.remoteAddress;
      const result = await cacheService.incrementRateLimit(identifier, maxAttempts, windowSeconds);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxAttempts);
      res.setHeader('X-RateLimit-Remaining', result.remaining);

      if (!result.allowed) {
        res.setHeader('X-RateLimit-Retry-After', result.retryAfter);
        return res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later',
          retryAfter: result.retryAfter
        });
      }

      next();
    } catch (error) {
      console.error('❌ Rate limit middleware error:', error.message);
      next(); // Allow request on error
    }
  };
}

/**
 * API-specific rate limiter with stricter limits
 */
function apiRateLimitMiddleware(maxAttempts = 10, windowSeconds = 60) {
  return rateLimitMiddleware(maxAttempts, windowSeconds);
}

/**
 * Authentication rate limiter (login attempts)
 */
function authRateLimitMiddleware(maxAttempts = 5, windowSeconds = 300) {
  return async (req, res, next) => {
    try {
      // Use email or phone as identifier for auth attempts
      const identifier = req.body.email || req.body.phone || req.ip;
      const result = await cacheService.incrementRateLimit(
        `auth:${identifier}`,
        maxAttempts,
        windowSeconds
      );

      res.setHeader('X-RateLimit-Limit', maxAttempts);
      res.setHeader('X-RateLimit-Remaining', result.remaining);

      if (!result.allowed) {
        res.setHeader('X-RateLimit-Retry-After', result.retryAfter);
        return res.status(429).json({
          success: false,
          message: `Too many login attempts. Please try again in ${Math.ceil(result.retryAfter / 60)} minutes`,
          retryAfter: result.retryAfter
        });
      }

      next();
    } catch (error) {
      console.error('❌ Auth rate limit error:', error.message);
      next();
    }
  };
}

module.exports = {
  cacheMiddleware,
  cacheMiddlewareWithKey,
  invalidateCacheMiddleware,
  userCacheMiddleware,
  rateLimitMiddleware,
  apiRateLimitMiddleware,
  authRateLimitMiddleware,
  generateCacheKey
};
