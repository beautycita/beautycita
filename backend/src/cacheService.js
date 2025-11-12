const redisClient = require('./redis');
const db = require('./db');

/**
 * BeautyCita Cache Service
 * Provides Redis caching for frequently accessed data
 */

class CacheService {
  constructor() {
    this.TTL = {
      POPULAR_STYLISTS: 300, // 5 minutes
      SERVICE_CATEGORIES: 600, // 10 minutes
      USER_PROFILE: 300, // 5 minutes
      STYLIST_SEARCH: 180, // 3 minutes
      REVIEWS: 300, // 5 minutes
      PORTFOLIO: 600, // 10 minutes
    };
  }

  /**
   * Generic get from cache
   */
  async get(key) {
    try {
      const cached = await redisClient.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Generic set to cache
   */
  async set(key, value, ttl = 300) {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete from cache
   */
  async del(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return false;
    }
  }

  /**
   * Get or fetch popular stylists
   */
  async getPopularStylists(limit = 20, location = null) {
    const cacheKey = `popular_stylists:${limit}:${location || 'all'}`;

    // Try cache first
    const cached = await this.get(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT: Popular stylists');
      return cached;
    }

    console.log('❌ Cache MISS: Popular stylists - fetching from DB');

    // Fetch from database
    let query = `
      SELECT
        u.id,
        u.full_name,
        st.business_name,
        u.profile_picture_url,
        st.location_city,
        st.location_state,
        MIN((st.location_coordinates)[0]) as location_lat,
        MIN((st.location_coordinates)[1]) as location_lng,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(DISTINCT r.id) as total_reviews,
        COUNT(DISTINCT b.id) as total_bookings,
        MIN(s.price) as min_price,
        MAX(s.price) as max_price
      FROM users u
      INNER JOIN stylists st ON u.id = st.user_id
      LEFT JOIN reviews r ON u.id = r.stylist_id
      LEFT JOIN bookings b ON u.id = b.stylist_id AND b.status = 'COMPLETED'
      LEFT JOIN services s ON u.id = s.stylist_id
      WHERE u.role = 'STYLIST'
        AND u.is_active = true
    `;

    const params = [];

    if (location) {
      params.push(location);
      query += ` AND (st.location_city ILIKE $${params.length} OR st.location_state ILIKE $${params.length})`;
    }

    query += `
      GROUP BY u.id, u.full_name, st.business_name, u.profile_picture_url, st.location_city, st.location_state
      ORDER BY total_bookings DESC, average_rating DESC
      LIMIT $${params.length + 1}
    `;

    params.push(limit);

    const result = await db.query(query, params);

    // Cache the result
    await this.set(cacheKey, result.rows, this.TTL.POPULAR_STYLISTS);

    return result.rows;
  }

  /**
   * Get or fetch service categories
   */
  async getServiceCategories() {
    const cacheKey = 'service_categories';

    const cached = await this.get(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT: Service categories');
      return cached;
    }

    console.log('❌ Cache MISS: Service categories - fetching from DB');

    const result = await db.query(`
      SELECT
        category,
        COUNT(*) as service_count,
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(duration) as avg_duration
      FROM services
      WHERE is_active = true
      GROUP BY category
      ORDER BY service_count DESC
    `);

    await this.set(cacheKey, result.rows, this.TTL.SERVICE_CATEGORIES);

    return result.rows;
  }

  /**
   * Get or fetch user profile
   */
  async getUserProfile(userId) {
    const cacheKey = `user_profile:${userId}`;

    const cached = await this.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache HIT: User profile ${userId}`);
      return cached;
    }

    console.log(`❌ Cache MISS: User profile ${userId} - fetching from DB`);

    const result = await db.query(`
      SELECT
        u.*,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(DISTINCT r.id) as total_reviews
      FROM users u
      LEFT JOIN reviews r ON u.id = r.stylist_id
      WHERE u.id = $1
      GROUP BY u.id
    `, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    // Don't cache sensitive data
    const profileData = { ...result.rows[0] };
    delete profileData.password_hash;
    delete profileData.google_calendar_access_token;
    delete profileData.google_calendar_refresh_token;

    await this.set(cacheKey, profileData, this.TTL.USER_PROFILE);

    return profileData;
  }

  /**
   * Get or fetch stylist search results
   */
  async searchStylists(filters) {
    const {
      city,
      state,
      service,
      minRating = 0,
      maxPrice,
      sortBy = 'rating',
      limit = 50
    } = filters;

    const cacheKey = `stylist_search:${JSON.stringify(filters)}`;

    const cached = await this.get(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT: Stylist search');
      return cached;
    }

    console.log('❌ Cache MISS: Stylist search - fetching from DB');

    let query = `
      SELECT
        u.id,
        u.full_name,
        st.business_name,
        u.profile_picture_url,
        st.location_city,
        st.location_state,
        MIN((st.location_coordinates)[0]) as location_lat,
        MIN((st.location_coordinates)[1]) as location_lng,
        st.location_address,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(DISTINCT r.id) as total_reviews,
        MIN(s.price) as min_price,
        MAX(s.price) as max_price
      FROM users u
      INNER JOIN stylists st ON u.id = st.user_id
      LEFT JOIN reviews r ON u.id = r.stylist_id
      LEFT JOIN services s ON u.id = s.stylist_id
      WHERE u.role = 'STYLIST'
        AND u.is_active = true
    `;

    const params = [];

    if (city) {
      params.push(city);
      query += ` AND st.location_city ILIKE $${params.length}`;
    }

    if (state) {
      params.push(state);
      query += ` AND st.location_state ILIKE $${params.length}`;
    }

    if (service) {
      params.push(`%${service}%`);
      query += ` AND EXISTS (
        SELECT 1 FROM services
        WHERE stylist_id = u.id
          AND (name ILIKE $${params.length} OR category ILIKE $${params.length})
      )`;
    }

    query += `
      GROUP BY u.id, u.full_name, st.business_name, u.profile_picture_url, st.location_city, st.location_state, st.location_address
      HAVING COALESCE(AVG(r.rating), 0) >= $${params.length + 1}
    `;
    params.push(minRating);

    if (maxPrice) {
      query += ` AND MIN(s.price) <= $${params.length + 1}`;
      params.push(maxPrice);
    }

    // Sorting
    const sortOptions = {
      rating: 'average_rating DESC',
      reviews: 'total_reviews DESC',
      price_low: 'min_price ASC',
      price_high: 'max_price DESC'
    };
    query += ` ORDER BY ${sortOptions[sortBy] || sortOptions.rating}`;

    params.push(limit);
    query += ` LIMIT $${params.length}`;

    const result = await db.query(query, params);

    await this.set(cacheKey, result.rows, this.TTL.STYLIST_SEARCH);

    return result.rows;
  }

  /**
   * Get or fetch stylist reviews
   */
  async getStylistReviews(stylistId, limit = 10) {
    const cacheKey = `stylist_reviews:${stylistId}:${limit}`;

    const cached = await this.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache HIT: Stylist reviews ${stylistId}`);
      return cached;
    }

    console.log(`❌ Cache MISS: Stylist reviews ${stylistId} - fetching from DB`);

    const result = await db.query(`
      SELECT
        r.*,
        u.full_name as client_name,
        u.profile_picture_url as client_avatar
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.stylist_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2
    `, [stylistId, limit]);

    await this.set(cacheKey, result.rows, this.TTL.REVIEWS);

    return result.rows;
  }

  /**
   * Get or fetch stylist portfolio
   */
  async getStylistPortfolio(stylistId) {
    const cacheKey = `stylist_portfolio:${stylistId}`;

    const cached = await this.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache HIT: Stylist portfolio ${stylistId}`);
      return cached;
    }

    console.log(`❌ Cache MISS: Stylist portfolio ${stylistId} - fetching from DB`);

    const result = await db.query(`
      SELECT
        p.*,
        COUNT(l.id) as like_count
      FROM portfolio p
      LEFT JOIN portfolio_likes l ON p.id = l.portfolio_id
      WHERE p.stylist_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [stylistId]);

    await this.set(cacheKey, result.rows, this.TTL.PORTFOLIO);

    return result.rows;
  }

  /**
   * Invalidate user-related caches
   */
  async invalidateUserCache(userId) {
    await this.del(`user_profile:${userId}`);
    await this.delPattern(`stylist_search:*`);
    await this.delPattern('popular_stylists:*');
    console.log(`🔄 Invalidated cache for user ${userId}`);
  }

  /**
   * Invalidate stylist-related caches
   */
  async invalidateStylistCache(stylistId) {
    await this.del(`user_profile:${stylistId}`);
    await this.del(`stylist_reviews:${stylistId}:*`);
    await this.del(`stylist_portfolio:${stylistId}`);
    await this.delPattern(`stylist_search:*`);
    await this.delPattern('popular_stylists:*');
    console.log(`🔄 Invalidated cache for stylist ${stylistId}`);
  }

  /**
   * Invalidate service caches
   */
  async invalidateServiceCache() {
    await this.del('service_categories');
    await this.delPattern(`stylist_search:*`);
    console.log('🔄 Invalidated service caches');
  }

  /**
   * Get cache stats
   */
  async getStats() {
    try {
      const info = await redisClient.info('stats');
      const keyspace = await redisClient.info('keyspace');

      return {
        info,
        keyspace,
        connected: redisClient.isOpen
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }
}

module.exports = new CacheService();
