import { createClient } from 'redis';

// Redis client configuration
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  retry_strategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

redisClient.on('reconnecting', () => {
  console.log('Redis Client Reconnecting');
});

redisClient.on('ready', () => {
  console.log('Redis Client Ready');
});

// Connect to Redis
try {
  await redisClient.connect();
} catch (error) {
  console.error('Failed to connect to Redis:', error);
}

// Cache utility functions
export const cache = {
  // Get value from cache
  async get(key) {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache GET error:', error);
      return null;
    }
  },

  // Set value in cache with TTL
  async set(key, value, ttlSeconds = 3600) {
    try {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache SET error:', error);
      return false;
    }
  },

  // Delete key from cache
  async del(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Cache DELETE error:', error);
      return false;
    }
  },

  // Check if key exists
  async exists(key) {
    try {
      return await redisClient.exists(key);
    } catch (error) {
      console.error('Cache EXISTS error:', error);
      return false;
    }
  },

  // Set expiration on existing key
  async expire(key, ttlSeconds) {
    try {
      await redisClient.expire(key, ttlSeconds);
      return true;
    } catch (error) {
      console.error('Cache EXPIRE error:', error);
      return false;
    }
  },

  // Increment counter
  async incr(key) {
    try {
      return await redisClient.incr(key);
    } catch (error) {
      console.error('Cache INCR error:', error);
      return null;
    }
  },

  // Hash operations
  async hget(hash, field) {
    try {
      return await redisClient.hGet(hash, field);
    } catch (error) {
      console.error('Cache HGET error:', error);
      return null;
    }
  },

  async hset(hash, field, value) {
    try {
      await redisClient.hSet(hash, field, value);
      return true;
    } catch (error) {
      console.error('Cache HSET error:', error);
      return false;
    }
  },

  async hgetall(hash) {
    try {
      return await redisClient.hGetAll(hash);
    } catch (error) {
      console.error('Cache HGETALL error:', error);
      return {};
    }
  }
};

// Specialized caching functions for BeautyCita
export const cacheService = {
  // User session cache
  async setUserSession(userId, sessionData, ttlSeconds = 86400) {
    return await cache.set(`session:${userId}`, sessionData, ttlSeconds);
  },

  async getUserSession(userId) {
    return await cache.get(`session:${userId}`);
  },

  async deleteUserSession(userId) {
    return await cache.del(`session:${userId}`);
  },

  // Stylist availability cache
  async setStylistAvailability(stylistId, date, availableSlots, ttlSeconds = 3600) {
    const key = `availability:${stylistId}:${date}`;
    return await cache.set(key, availableSlots, ttlSeconds);
  },

  async getStylistAvailability(stylistId, date) {
    const key = `availability:${stylistId}:${date}`;
    return await cache.get(key);
  },

  async clearStylistAvailability(stylistId, date) {
    const key = `availability:${stylistId}:${date}`;
    return await cache.del(key);
  },

  // Search results cache
  async setSearchResults(searchKey, results, ttlSeconds = 1800) {
    const key = `search:${searchKey}`;
    return await cache.set(key, results, ttlSeconds);
  },

  async getSearchResults(searchKey) {
    const key = `search:${searchKey}`;
    return await cache.get(key);
  },

  // Rate limiting cache
  async incrementRateLimit(identifier, windowSeconds = 3600) {
    const key = `ratelimit:${identifier}`;
    const current = await cache.incr(key);

    if (current === 1) {
      await cache.expire(key, windowSeconds);
    }

    return current;
  },

  async getRateLimit(identifier) {
    const key = `ratelimit:${identifier}`;
    return await cache.get(key) || 0;
  },

  // Email verification codes
  async setVerificationCode(email, code, ttlSeconds = 900) {
    const key = `verify:${email}`;
    return await cache.set(key, code, ttlSeconds);
  },

  async getVerificationCode(email) {
    const key = `verify:${email}`;
    return await cache.get(key);
  },

  async deleteVerificationCode(email) {
    const key = `verify:${email}`;
    return await cache.del(key);
  },

  // Password reset tokens
  async setPasswordResetToken(email, token, ttlSeconds = 3600) {
    const key = `reset:${email}`;
    return await cache.set(key, token, ttlSeconds);
  },

  async getPasswordResetToken(email) {
    const key = `reset:${email}`;
    return await cache.get(key);
  },

  async deletePasswordResetToken(email) {
    const key = `reset:${email}`;
    return await cache.del(key);
  },

  // Booking locks (prevent double booking)
  async setBookingLock(stylistId, timeSlot, clientId, ttlSeconds = 300) {
    const key = `booking:lock:${stylistId}:${timeSlot}`;
    return await cache.set(key, clientId, ttlSeconds);
  },

  async getBookingLock(stylistId, timeSlot) {
    const key = `booking:lock:${stylistId}:${timeSlot}`;
    return await cache.get(key);
  },

  async deleteBookingLock(stylistId, timeSlot) {
    const key = `booking:lock:${stylistId}:${timeSlot}`;
    return await cache.del(key);
  },

  // Service categories cache
  async setServiceCategories(categories, ttlSeconds = 7200) {
    return await cache.set('service_categories', categories, ttlSeconds);
  },

  async getServiceCategories() {
    return await cache.get('service_categories');
  },

  // Featured stylists cache
  async setFeaturedStylists(stylists, ttlSeconds = 3600) {
    return await cache.set('featured_stylists', stylists, ttlSeconds);
  },

  async getFeaturedStylists() {
    return await cache.get('featured_stylists');
  },

  // Chat conversation cache
  async setChatSession(sessionId, conversationData, ttlSeconds = 3600) {
    const key = `chat:${sessionId}`;
    return await cache.set(key, conversationData, ttlSeconds);
  },

  async getChatSession(sessionId) {
    const key = `chat:${sessionId}`;
    return await cache.get(key);
  },

  async deleteChatSession(sessionId) {
    const key = `chat:${sessionId}`;
    return await cache.del(key);
  }
};

// Health check function
export async function checkRedisHealth() {
  try {
    const testKey = 'health_check';
    await redisClient.set(testKey, 'ok');
    const result = await redisClient.get(testKey);
    await redisClient.del(testKey);

    return {
      status: result === 'ok' ? 'healthy' : 'unhealthy',
      connected: redisClient.isOpen,
      message: result === 'ok' ? 'Redis is working properly' : 'Redis test failed'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      message: error.message
    };
  }
}

// Graceful shutdown
export async function closeRedis() {
  try {
    await redisClient.quit();
    console.log('Redis connection closed gracefully');
  } catch (error) {
    console.error('Error closing Redis connection:', error);
  }
}

export default redisClient;