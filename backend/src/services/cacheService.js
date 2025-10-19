const redis = require('redis');

/**
 * Redis Cache Service
 * Provides caching layer for frequently accessed data
 * Implements cache-aside pattern
 * Uses Redis v5 with native promises
 */
class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 300; // 5 minutes default

    // TTL configurations for different data types (in seconds)
    this.ttlConfig = {
      USER_SESSION: 3600,        // 1 hour
      USER_PROFILE: 1800,        // 30 minutes
      STYLIST_PROFILE: 1800,     // 30 minutes
      STYLIST_LIST: 600,         // 10 minutes
      SERVICE_LIST: 1800,        // 30 minutes
      BOOKING_AVAILABILITY: 300, // 5 minutes
      SEARCH_RESULTS: 300,       // 5 minutes
      STATS: 600,                // 10 minutes
      VERIFICATION_CODE: 600,    // 10 minutes (email/phone codes)
      RATE_LIMIT: 60             // 1 minute
    };
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    if (this.isConnected) {
      return;
    }

    try {
      // Redis v5 creates a client with native promises
      this.client = redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('❌ Redis max retry attempts reached');
              return new Error('Max retry attempts reached');
            }
            // Exponential backoff
            return Math.min(retries * 100, 3000);
          }
        },
        password: process.env.REDIS_PASSWORD || undefined
      });

      this.client.on('connect', () => {
        console.log('📦 Redis cache connecting...');
      });

      this.client.on('ready', () => {
        console.log('📦 Redis cache connected and ready');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis cache error:', err.message);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('📦 Redis cache connection closed');
        this.isConnected = false;
      });

      // Connect to Redis
      await this.client.connect();

    } catch (error) {
      console.error('❌ Failed to initialize Redis cache:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Generate cache key with namespace
   */
  generateKey(namespace, identifier) {
    return `bc:${namespace}:${identifier}`;
  }

  /**
   * Get value from cache
   */
  async get(key) {
    if (!this.isConnected) {
      console.warn('⚠️ Redis not connected, skipping cache get');
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error(`❌ Redis GET error for key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key, value, ttl = null) {
    if (!this.isConnected) {
      console.warn('⚠️ Redis not connected, skipping cache set');
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      const expiry = ttl || this.defaultTTL;
      await this.client.setEx(key, expiry, serialized);
      return true;
    } catch (error) {
      console.error(`❌ Redis SET error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`❌ Redis DEL error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`🗑️ Deleted ${keys.length} keys matching pattern: ${pattern}`);
      }
      return true;
    } catch (error) {
      console.error(`❌ Redis DEL pattern error for ${pattern}:`, error.message);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`❌ Redis EXISTS error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Get or set cached data (cache-aside pattern)
   * If cache miss, execute fetchFunction and cache the result
   */
  async getOrSet(key, fetchFunction, ttl = null) {
    // Try to get from cache first
    const cached = await this.get(key);
    if (cached !== null) {
      return { data: cached, fromCache: true };
    }

    // Cache miss - fetch from source
    try {
      const data = await fetchFunction();
      if (data !== null && data !== undefined) {
        await this.set(key, data, ttl);
      }
      return { data, fromCache: false };
    } catch (error) {
      console.error('❌ Error in getOrSet fetch function:', error.message);
      throw error;
    }
  }

  // ============================================
  // SPECIALIZED CACHE METHODS
  // ============================================

  /**
   * Cache user session
   */
  async cacheUserSession(userId, sessionData) {
    const key = this.generateKey('session', userId);
    return await this.set(key, sessionData, this.ttlConfig.USER_SESSION);
  }

  /**
   * Get user session from cache
   */
  async getUserSession(userId) {
    const key = this.generateKey('session', userId);
    return await this.get(key);
  }

  /**
   * Invalidate user session
   */
  async invalidateUserSession(userId) {
    const key = this.generateKey('session', userId);
    return await this.del(key);
  }

  /**
   * Cache user profile
   */
  async cacheUserProfile(userId, profileData) {
    const key = this.generateKey('user', userId);
    return await this.set(key, profileData, this.ttlConfig.USER_PROFILE);
  }

  /**
   * Get user profile from cache
   */
  async getUserProfile(userId) {
    const key = this.generateKey('user', userId);
    return await this.get(key);
  }

  /**
   * Invalidate user profile cache
   */
  async invalidateUserProfile(userId) {
    const key = this.generateKey('user', userId);
    return await this.del(key);
  }

  /**
   * Cache stylist profile
   */
  async cacheStylistProfile(stylistId, profileData) {
    const key = this.generateKey('stylist', stylistId);
    return await this.set(key, profileData, this.ttlConfig.STYLIST_PROFILE);
  }

  /**
   * Get stylist profile from cache
   */
  async getStylistProfile(stylistId) {
    const key = this.generateKey('stylist', stylistId);
    return await this.get(key);
  }

  /**
   * Invalidate stylist profile cache
   */
  async invalidateStylistProfile(stylistId) {
    const key = this.generateKey('stylist', stylistId);
    // Also invalidate stylist list caches
    await this.delPattern('bc:stylists:*');
    return await this.del(key);
  }

  /**
   * Cache stylist list
   */
  async cacheStylistList(filters, stylistData) {
    const filterKey = JSON.stringify(filters);
    const key = this.generateKey('stylists', Buffer.from(filterKey).toString('base64'));
    return await this.set(key, stylistData, this.ttlConfig.STYLIST_LIST);
  }

  /**
   * Get stylist list from cache
   */
  async getStylistList(filters) {
    const filterKey = JSON.stringify(filters);
    const key = this.generateKey('stylists', Buffer.from(filterKey).toString('base64'));
    return await this.get(key);
  }

  /**
   * Cache services list
   */
  async cacheServices(services) {
    const key = this.generateKey('services', 'all');
    return await this.set(key, services, this.ttlConfig.SERVICE_LIST);
  }

  /**
   * Get services from cache
   */
  async getServices() {
    const key = this.generateKey('services', 'all');
    return await this.get(key);
  }

  /**
   * Invalidate services cache
   */
  async invalidateServices() {
    const key = this.generateKey('services', 'all');
    return await this.del(key);
  }

  /**
   * Cache booking availability
   */
  async cacheAvailability(stylistId, date, availability) {
    const key = this.generateKey('availability', `${stylistId}:${date}`);
    return await this.set(key, availability, this.ttlConfig.BOOKING_AVAILABILITY);
  }

  /**
   * Get booking availability from cache
   */
  async getAvailability(stylistId, date) {
    const key = this.generateKey('availability', `${stylistId}:${date}`);
    return await this.get(key);
  }

  /**
   * Invalidate availability cache for stylist
   */
  async invalidateAvailability(stylistId) {
    const pattern = this.generateKey('availability', `${stylistId}:*`);
    return await this.delPattern(pattern);
  }

  /**
   * Cache search results
   */
  async cacheSearchResults(query, results) {
    const key = this.generateKey('search', Buffer.from(query).toString('base64'));
    return await this.set(key, results, this.ttlConfig.SEARCH_RESULTS);
  }

  /**
   * Get search results from cache
   */
  async getSearchResults(query) {
    const key = this.generateKey('search', Buffer.from(query).toString('base64'));
    return await this.get(key);
  }

  /**
   * Cache verification code (email or phone)
   */
  async cacheVerificationCode(identifier, code, type = 'email') {
    const key = this.generateKey(`verify:${type}`, identifier);
    return await this.set(key, { code, createdAt: Date.now() }, this.ttlConfig.VERIFICATION_CODE);
  }

  /**
   * Get verification code from cache
   */
  async getVerificationCode(identifier, type = 'email') {
    const key = this.generateKey(`verify:${type}`, identifier);
    return await this.get(key);
  }

  /**
   * Delete verification code after use
   */
  async deleteVerificationCode(identifier, type = 'email') {
    const key = this.generateKey(`verify:${type}`, identifier);
    return await this.del(key);
  }

  /**
   * Rate limiting - increment counter
   */
  async incrementRateLimit(identifier, maxAttempts = 5, windowSeconds = 60) {
    if (!this.isConnected) {
      return { allowed: true, remaining: maxAttempts };
    }

    const key = this.generateKey('ratelimit', identifier);

    try {
      const current = await this.client.get(key);
      const count = current ? parseInt(current) : 0;

      if (count >= maxAttempts) {
        const ttl = await this.client.ttl(key);
        return {
          allowed: false,
          remaining: 0,
          retryAfter: ttl > 0 ? ttl : windowSeconds
        };
      }

      const newCount = count + 1;
      await this.client.setEx(key, windowSeconds, newCount.toString());

      return {
        allowed: true,
        remaining: maxAttempts - newCount,
        retryAfter: 0
      };
    } catch (error) {
      console.error('❌ Rate limit error:', error.message);
      return { allowed: true, remaining: maxAttempts };
    }
  }

  /**
   * Cache statistics/metrics
   */
  async cacheStats(statsType, data) {
    const key = this.generateKey('stats', statsType);
    return await this.set(key, data, this.ttlConfig.STATS);
  }

  /**
   * Get cached statistics
   */
  async getStats(statsType) {
    const key = this.generateKey('stats', statsType);
    return await this.get(key);
  }

  /**
   * Clear all cache
   */
  async clearAll() {
    if (!this.isConnected) {
      return false;
    }

    try {
      const keys = await this.client.keys('bc:*');
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`🗑️ Cleared ${keys.length} cache keys`);
      }
      return true;
    } catch (error) {
      console.error('❌ Error clearing cache:', error.message);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    if (!this.isConnected) {
      return null;
    }

    try {
      const keys = await this.client.keys('bc:*');
      const info = await this.client.info('stats');

      // Parse Redis info stats
      const stats = {};
      info.split('\r\n').forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          stats[key] = value;
        }
      });

      return {
        totalKeys: keys.length,
        connected: this.isConnected,
        totalCommands: parseInt(stats.total_commands_processed) || 0,
        keyspaceHits: parseInt(stats.keyspace_hits) || 0,
        keyspaceMisses: parseInt(stats.keyspace_misses) || 0,
        hitRate: stats.keyspace_hits && stats.keyspace_misses
          ? (parseInt(stats.keyspace_hits) / (parseInt(stats.keyspace_hits) + parseInt(stats.keyspace_misses)) * 100).toFixed(2)
          : 0
      };
    } catch (error) {
      console.error('❌ Error getting cache stats:', error.message);
      return null;
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect() {
    if (this.client) {
      this.client.quit();
      this.isConnected = false;
    }
  }
}

// Export singleton instance
module.exports = new CacheService();
