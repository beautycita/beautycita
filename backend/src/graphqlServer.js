const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { readFileSync } = require('fs');
const { join } = require('path');
const db = require('./db');
const cacheService = require('./cacheService');
const { validateJWT } = require('./middleware/auth');

// Load GraphQL schema
const typeDefs = readFileSync(join(__dirname, 'graphql', 'schema.graphql'), 'utf8');

// ============================================
// RESOLVERS
// ============================================

const resolvers = {
  // ============================================
  // Scalar Types
  // ============================================
  DateTime: {
    parseValue(value) {
      return new Date(value);
    },
    serialize(value) {
      return value.toISOString();
    },
    parseLiteral(ast) {
      return new Date(ast.value);
    }
  },

  // ============================================
  // Query Resolvers
  // ============================================
  Query: {
    // User queries
    me: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const cachedProfile = await cacheService.getUserProfile(user.userId);
      if (cachedProfile) return cachedProfile;

      const result = await db.query('SELECT * FROM users WHERE id = $1', [user.userId]);
      const userData = result.rows[0];

      await cacheService.set(`user_profile:${user.userId}`, userData, 300);
      return userData;
    },

    user: async (_, { id }) => {
      const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0];
    },

    // Stylist queries
    stylist: async (_, { id }) => {
      const cacheKey = `stylist_profile:${id}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;

      const result = await db.query(`
        SELECT
          s.*,
          u.full_name,
          COALESCE(AVG(r.rating), 0) as average_rating,
          COUNT(DISTINCT r.id) as total_reviews,
          MIN(srv.price) as min_price,
          MAX(srv.price) as max_price
        FROM stylists s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN reviews r ON s.id = r.stylist_id
        LEFT JOIN services srv ON s.id = srv.stylist_id
        WHERE s.id = $1
        GROUP BY s.id, u.full_name
      `, [id]);

      const stylist = result.rows[0];
      await cacheService.set(cacheKey, stylist, 600);
      return stylist;
    },

    searchStylists: async (_, { input }) => {
      const cacheKey = `stylist_search:${JSON.stringify(input)}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return {
          stylists: cached,
          totalCount: cached.length,
          hasMore: cached.length === (input.limit || 20)
        };
      }

      let query = `
        SELECT DISTINCT
          s.*,
          u.full_name,
          COALESCE(AVG(r.rating), 0) as average_rating,
          COUNT(DISTINCT r.id) as total_reviews,
          MIN(srv.price) as min_price,
          MAX(srv.price) as max_price
        FROM stylists s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN reviews r ON s.id = r.stylist_id
        LEFT JOIN services srv ON s.id = srv.stylist_id
        WHERE 1=1
      `;

      const params = [];

      if (input.city) {
        params.push(input.city);
        query += ` AND s.location_city ILIKE $${params.length}`;
      }

      if (input.state) {
        params.push(input.state);
        query += ` AND s.location_state ILIKE $${params.length}`;
      }

      if (input.query) {
        params.push(`%${input.query}%`);
        query += ` AND (s.business_name ILIKE $${params.length} OR u.full_name ILIKE $${params.length})`;
      }

      query += ` GROUP BY s.id, u.full_name`;

      if (input.minRating) {
        params.push(input.minRating);
        query += ` HAVING COALESCE(AVG(r.rating), 0) >= $${params.length}`;
      }

      // Sorting
      const sortMap = {
        RATING: 'average_rating DESC',
        REVIEWS: 'total_reviews DESC',
        PRICE_LOW: 'min_price ASC',
        PRICE_HIGH: 'max_price DESC',
        RECENT: 's.created_at DESC'
      };
      query += ` ORDER BY ${sortMap[input.sortBy] || sortMap.RATING}`;

      params.push(input.limit || 20);
      query += ` LIMIT $${params.length}`;

      if (input.offset) {
        params.push(input.offset);
        query += ` OFFSET $${params.length}`;
      }

      const result = await db.query(query, params);

      await cacheService.set(cacheKey, result.rows, 180);

      return {
        stylists: result.rows,
        totalCount: result.rows.length,
        hasMore: result.rows.length === (input.limit || 20)
      };
    },

    popularStylists: async (_, { limit = 10 }) => {
      return await cacheService.getPopularStylists(limit);
    },

    // Service queries
    services: async (_, { stylistId, category }) => {
      let query = 'SELECT * FROM services WHERE 1=1';
      const params = [];

      if (stylistId) {
        params.push(stylistId);
        query += ` AND stylist_id = $${params.length}`;
      }

      if (category) {
        params.push(category);
        query += ` AND category = $${params.length}`;
      }

      query += ' ORDER BY created_at DESC';

      const result = await db.query(query, params);
      return result.rows;
    },

    serviceCategories: async () => {
      return await cacheService.getServiceCategories();
    },

    // Booking queries
    booking: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const result = await db.query(`
        SELECT * FROM bookings
        WHERE id = $1 AND (client_id = $2 OR stylist_id IN (
          SELECT id FROM stylists WHERE user_id = $2
        ))
      `, [id, user.userId]);

      return result.rows[0];
    },

    myBookings: async (_, { status, limit = 20 }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      let query = `
        SELECT * FROM bookings
        WHERE client_id = $1 OR stylist_id IN (
          SELECT id FROM stylists WHERE user_id = $1
        )
      `;
      const params = [user.userId];

      if (status) {
        params.push(status);
        query += ` AND status = $${params.length}`;
      }

      params.push(limit);
      query += ` ORDER BY booking_date DESC, booking_time DESC LIMIT $${params.length}`;

      const result = await db.query(query, params);
      return result.rows;
    },

    upcomingBookings: async (_, { limit = 10 }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const result = await db.query(`
        SELECT * FROM bookings
        WHERE (client_id = $1 OR stylist_id IN (
          SELECT id FROM stylists WHERE user_id = $1
        ))
        AND booking_date >= CURRENT_DATE
        AND status IN ('CONFIRMED', 'PENDING')
        ORDER BY booking_date ASC, booking_time ASC
        LIMIT $2
      `, [user.userId, limit]);

      return result.rows;
    },

    // Event sourcing - booking events
    bookingEvents: async (_, { bookingId }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const result = await db.query(`
        SELECT * FROM booking_events
        WHERE booking_id = $1
        ORDER BY timestamp ASC
      `, [bookingId]);

      return result.rows;
    },

    // Notification queries
    myNotifications: async (_, { limit = 20, unreadOnly = false }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      let query = 'SELECT * FROM notifications WHERE user_id = $1';
      const params = [user.userId];

      if (unreadOnly) {
        query += ' AND is_read = false';
      }

      params.push(limit);
      query += ` ORDER BY created_at DESC LIMIT $${params.length}`;

      const result = await db.query(query, params);
      return result.rows;
    },

    unreadNotificationCount: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const result = await db.query(
        'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
        [user.userId]
      );

      return parseInt(result.rows[0].count);
    }
  },

  // ============================================
  // Mutation Resolvers
  // ============================================
  Mutation: {
    // Create booking with event sourcing
    createBooking: async (_, { input }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const client = await db.query('BEGIN');

      try {
        // Create booking
        const bookingResult = await db.query(`
          INSERT INTO bookings (client_id, stylist_id, service_id, booking_date, booking_time, notes, status)
          VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
          RETURNING *
        `, [user.userId, input.stylistId, input.serviceId, input.bookingDate, input.bookingTime, input.notes]);

        const booking = bookingResult.rows[0];

        // Create event (event sourcing)
        const eventResult = await db.query(`
          INSERT INTO booking_events (booking_id, event_type, event_data, user_id, timestamp, metadata)
          VALUES ($1, 'CREATED', $2, $3, NOW(), $4)
          RETURNING *
        `, [
          booking.id,
          JSON.stringify({
            bookingDate: input.bookingDate,
            bookingTime: input.bookingTime,
            serviceId: input.serviceId,
            notes: input.notes
          }),
          user.userId,
          JSON.stringify({ userAgent: user.userAgent, ipAddress: user.ipAddress })
        ]);

        await db.query('COMMIT');

        // Invalidate caches
        await cacheService.invalidateStylistCache(input.stylistId);

        return {
          booking,
          event: eventResult.rows[0]
        };
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
    },

    confirmBooking: async (_, { bookingId }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      await db.query('BEGIN');

      try {
        // Update booking
        const bookingResult = await db.query(`
          UPDATE bookings
          SET status = 'CONFIRMED', confirmed_at = NOW(), updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `, [bookingId]);

        const booking = bookingResult.rows[0];

        // Create event
        const eventResult = await db.query(`
          INSERT INTO booking_events (booking_id, event_type, event_data, user_id, timestamp)
          VALUES ($1, 'CONFIRMED', $2, $3, NOW())
          RETURNING *
        `, [bookingId, JSON.stringify({ confirmedAt: new Date() }), user.userId]);

        await db.query('COMMIT');

        return {
          booking,
          event: eventResult.rows[0]
        };
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
    },

    cancelBooking: async (_, { bookingId, reason }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      await db.query('BEGIN');

      try {
        const bookingResult = await db.query(`
          UPDATE bookings
          SET status = 'CANCELLED', cancellation_reason = $1, cancelled_by = $2, cancelled_at = NOW(), updated_at = NOW()
          WHERE id = $3
          RETURNING *
        `, [reason, user.userId, bookingId]);

        const booking = bookingResult.rows[0];

        // Create event
        const eventResult = await db.query(`
          INSERT INTO booking_events (booking_id, event_type, event_data, user_id, timestamp)
          VALUES ($1, 'CANCELLED', $2, $3, NOW())
          RETURNING *
        `, [bookingId, JSON.stringify({ reason, cancelledAt: new Date() }), user.userId]);

        await db.query('COMMIT');

        return {
          booking,
          event: eventResult.rows[0]
        };
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
    },

    // Review mutations
    createReview: async (_, { input }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const result = await db.query(`
        INSERT INTO reviews (booking_id, client_id, stylist_id, rating, comment)
        SELECT $1, $2, b.stylist_id, $3, $4
        FROM bookings b
        WHERE b.id = $1 AND b.client_id = $2
        RETURNING *
      `, [input.bookingId, user.userId, input.rating, input.comment]);

      const review = result.rows[0];

      // Invalidate stylist cache
      if (review) {
        await cacheService.invalidateStylistCache(review.stylist_id);
      }

      return { review };
    }
  },

  // ============================================
  // Field Resolvers (Nested data)
  // ============================================
  User: {
    stylistProfile: async (user) => {
      if (user.role !== 'STYLIST') return null;

      const result = await db.query(`
        SELECT s.*, COALESCE(AVG(r.rating), 0) as average_rating, COUNT(r.id) as total_reviews
        FROM stylists s
        LEFT JOIN reviews r ON s.id = r.stylist_id
        WHERE s.user_id = $1
        GROUP BY s.id
      `, [user.id]);

      return result.rows[0];
    },

    clientProfile: async (user) => {
      if (user.role !== 'CLIENT') return null;

      const bookingsResult = await db.query(
        'SELECT COUNT(*) as total_bookings FROM bookings WHERE client_id = $1',
        [user.id]
      );

      return {
        id: user.id,
        userId: user.id,
        totalBookings: parseInt(bookingsResult.rows[0].total_bookings)
      };
    }
  },

  StylistProfile: {
    services: async (stylist, { active }) => {
      let query = 'SELECT * FROM services WHERE stylist_id = $1';
      const params = [stylist.id];

      if (active !== undefined) {
        params.push(active);
        query += ` AND is_active = $${params.length}`;
      }

      const result = await db.query(query, params);
      return result.rows;
    },

    portfolio: async (stylist, { limit = 20 }) => {
      const result = await db.query(
        'SELECT * FROM portfolio WHERE stylist_id = $1 ORDER BY created_at DESC LIMIT $2',
        [stylist.id, limit]
      );
      return result.rows;
    },

    reviews: async (stylist, { limit = 10, offset = 0 }) => {
      const result = await db.query(`
        SELECT * FROM reviews
        WHERE stylist_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `, [stylist.id, limit, offset]);

      const countResult = await db.query(
        'SELECT COUNT(*) FROM reviews WHERE stylist_id = $1',
        [stylist.id]
      );

      return {
        edges: result.rows.map((review, index) => ({
          cursor: Buffer.from(`${offset + index}`).toString('base64'),
          node: review
        })),
        pageInfo: {
          hasNextPage: result.rows.length === limit,
          hasPreviousPage: offset > 0,
          startCursor: result.rows.length > 0 ? Buffer.from(`${offset}`).toString('base64') : null,
          endCursor: result.rows.length > 0 ? Buffer.from(`${offset + result.rows.length - 1}`).toString('base64') : null
        },
        totalCount: parseInt(countResult.rows[0].count)
      };
    },

    bookings: async (stylist, { status, limit = 20 }) => {
      let query = 'SELECT * FROM bookings WHERE stylist_id = $1';
      const params = [stylist.id];

      if (status) {
        params.push(status);
        query += ` AND status = $${params.length}`;
      }

      params.push(limit);
      query += ` ORDER BY booking_date DESC LIMIT $${params.length}`;

      const result = await db.query(query, params);
      return result.rows;
    }
  },

  Booking: {
    client: async (booking) => {
      const result = await db.query('SELECT * FROM users WHERE id = $1', [booking.client_id]);
      return result.rows[0];
    },

    stylist: async (booking) => {
      const result = await db.query(`
        SELECT s.*, u.full_name
        FROM stylists s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = $1
      `, [booking.stylist_id]);
      return result.rows[0];
    },

    service: async (booking) => {
      const result = await db.query('SELECT * FROM services WHERE id = $1', [booking.service_id]);
      return result.rows[0];
    },

    review: async (booking) => {
      const result = await db.query('SELECT * FROM reviews WHERE booking_id = $1', [booking.id]);
      return result.rows[0];
    },

    events: async (booking) => {
      const result = await db.query(`
        SELECT * FROM booking_events
        WHERE booking_id = $1
        ORDER BY timestamp ASC
      `, [booking.id]);
      return result.rows;
    }
  },

  Service: {
    stylist: async (service) => {
      const result = await db.query(`
        SELECT s.*, u.full_name
        FROM stylists s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = $1
      `, [service.stylist_id]);
      return result.rows[0];
    }
  }
};

// ============================================
// Create Apollo Server
// ============================================

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

async function createGraphQLServer(app) {
  const server = new ApolloServer({
    schema,
    context: async ({ req }) => {
      // Extract JWT token from header
      const token = req.headers.authorization?.replace('Bearer ', '');

      let user = null;
      if (token) {
        try {
          // Validate JWT and extract user info
          const decoded = validateJWT(token);
          user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip
          };
        } catch (error) {
          // Invalid token - user remains null (public access)
          console.log('Invalid JWT token:', error.message);
        }
      }

      return {
        user,
        db,
        cacheService
      };
    },
    formatError: (error) => {
      console.error('GraphQL Error:', error);
      return error;
    },
    introspection: process.env.NODE_ENV !== 'production',
    playground: process.env.NODE_ENV !== 'production'
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  console.log(`🚀 GraphQL server ready at /graphql`);

  return server;
}

module.exports = { createGraphQLServer, resolvers, schema };
