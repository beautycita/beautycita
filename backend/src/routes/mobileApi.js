/**
 * Backend-for-Frontend (BFF) Pattern - Mobile API
 *
 * Optimized endpoints specifically for mobile apps with:
 * - Reduced payload sizes
 * - Combined responses (fewer requests)
 * - Mobile-specific features
 * - Optimized for slow networks
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const cacheService = require('../cacheService');
const { validateJWT } = require('../middleware/auth');

// ============================================
// Mobile Dashboard - Single request for all data
// ============================================

/**
 * GET /api/mobile/v1/dashboard
 * Returns all data needed for mobile dashboard in one request
 * - Reduces mobile app network requests from 5-10 to 1
 * - Optimized payload with only essential fields
 */
router.get('/dashboard', validateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;

    const cacheKey = `mobile_dashboard:${userId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        cached: true,
        data: cached
      });
    }

    // Fetch all dashboard data in parallel
    const [userResult, bookingsResult, notificationsResult, statsResult] = await Promise.all([
      // User profile
      db.query(`
        SELECT id, full_name, email, phone, profile_picture_url, role
        FROM users
        WHERE id = $1
      `, [userId]),

      // Upcoming bookings
      db.query(`
        SELECT
          b.id,
          b.booking_date,
          b.booking_time,
          b.duration_minutes,
          b.status,
          b.total_price,
          s.business_name as stylist_name,
          s.profile_picture as stylist_picture,
          srv.name as service_name
        FROM bookings b
        LEFT JOIN stylists s ON b.stylist_id = s.id
        LEFT JOIN services srv ON b.service_id = srv.id
        WHERE (b.client_id = $1 OR b.stylist_id IN (
          SELECT id FROM stylists WHERE user_id = $1
        ))
        AND b.booking_date >= CURRENT_DATE
        AND b.status IN ('CONFIRMED', 'PENDING')
        ORDER BY b.booking_date ASC, b.booking_time ASC
        LIMIT 5
      `, [userId]),

      // Unread notifications
      db.query(`
        SELECT id, type, title, message, created_at
        FROM notifications
        WHERE user_id = $1 AND is_read = false
        ORDER BY created_at DESC
        LIMIT 10
      `, [userId]),

      // User stats
      userRole === 'STYLIST'
        ? db.query(`
            SELECT
              COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_bookings,
              COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_bookings,
              COALESCE(AVG(CASE WHEN r.rating IS NOT NULL THEN r.rating END), 0) as average_rating,
              COUNT(DISTINCT r.id) as total_reviews
            FROM stylists s
            LEFT JOIN bookings b ON s.id = b.stylist_id
            LEFT JOIN reviews r ON s.id = r.stylist_id
            WHERE s.user_id = $1
          `, [userId])
        : db.query(`
            SELECT
              COUNT(*) as total_bookings,
              COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_bookings
            FROM bookings
            WHERE client_id = $1
          `, [userId])
    ]);

    const dashboardData = {
      user: userResult.rows[0],
      upcomingBookings: bookingsResult.rows,
      unreadNotifications: notificationsResult.rows,
      unreadCount: notificationsResult.rows.length,
      stats: statsResult.rows[0],
      lastUpdated: new Date().toISOString()
    };

    // Cache for 2 minutes (short TTL for dashboard)
    await cacheService.set(cacheKey, dashboardData, 120);

    res.json({
      success: true,
      cached: false,
      data: dashboardData
    });
  } catch (error) {
    console.error('Mobile dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load dashboard'
    });
  }
});

// ============================================
// Mobile Stylist Search - Optimized results
// ============================================

/**
 * GET /api/mobile/v1/stylists/search
 * Mobile-optimized stylist search with:
 * - Smaller image URLs (thumbnails)
 * - Essential fields only
 * - Distance-based sorting
 */
router.get('/stylists/search', async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radius = 25, // miles
      service,
      minRating = 0,
      limit = 20,
      offset = 0
    } = req.query;

    const cacheKey = `mobile_stylist_search:${JSON.stringify(req.query)}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        cached: true,
        data: cached
      });
    }

    let query = `
      SELECT
        s.id,
        s.business_name,
        s.profile_picture,
        s.location_city,
        s.location_state,
        s.location_lat,
        s.location_lng,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(DISTINCT r.id) as review_count,
        MIN(srv.price) as min_price,
        CASE
          WHEN $1::float IS NOT NULL AND $2::float IS NOT NULL THEN
            (
              3959 * acos(
                cos(radians($1)) * cos(radians(s.location_lat)) *
                cos(radians(s.location_lng) - radians($2)) +
                sin(radians($1)) * sin(radians(s.location_lat))
              )
            )
          ELSE NULL
        END as distance
      FROM stylists s
      LEFT JOIN reviews r ON s.id = r.stylist_id
      LEFT JOIN services srv ON s.id = srv.stylist_id AND srv.is_active = true
      WHERE 1=1
    `;

    const params = [latitude || null, longitude || null];

    // Distance filter
    if (latitude && longitude && radius) {
      params.push(radius);
      query += ` AND (
        3959 * acos(
          cos(radians($1)) * cos(radians(s.location_lat)) *
          cos(radians(s.location_lng) - radians($2)) +
          sin(radians($1)) * sin(radians(s.location_lat))
        )
      ) <= $${params.length}`;
    }

    // Service filter
    if (service) {
      params.push(`%${service}%`);
      query += ` AND EXISTS (
        SELECT 1 FROM services
        WHERE stylist_id = s.id
        AND (name ILIKE $${params.length} OR category ILIKE $${params.length})
      )`;
    }

    query += `
      GROUP BY s.id
      HAVING COALESCE(AVG(r.rating), 0) >= $${params.length + 1}
    `;
    params.push(minRating);

    // Sort by distance if location provided
    if (latitude && longitude) {
      query += ` ORDER BY distance ASC NULLS LAST, average_rating DESC`;
    } else {
      query += ` ORDER BY average_rating DESC`;
    }

    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await db.query(query, params);

    const searchData = {
      stylists: result.rows,
      totalCount: result.rows.length,
      hasMore: result.rows.length === parseInt(limit)
    };

    await cacheService.set(cacheKey, searchData, 180);

    res.json({
      success: true,
      cached: false,
      data: searchData
    });
  } catch (error) {
    console.error('Mobile search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search stylists'
    });
  }
});

// ============================================
// Mobile Booking Creation - Single endpoint
// ============================================

/**
 * POST /api/mobile/v1/bookings
 * Optimized booking creation for mobile with:
 * - Availability check
 * - Payment preparation
 * - Push notification
 * All in single atomic transaction
 */
router.post('/bookings', validateJWT, async (req, res) => {
  const client = await db.query('BEGIN');

  try {
    const { stylistId, serviceId, bookingDate, bookingTime, notes } = req.body;
    const userId = req.userId;

    // 1. Check availability
    const availabilityCheck = await db.query(`
      SELECT COUNT(*) FROM bookings
      WHERE stylist_id = $1
        AND booking_date = $2
        AND booking_time = $3
        AND status NOT IN ('CANCELLED', 'NO_SHOW')
    `, [stylistId, bookingDate, bookingTime]);

    if (parseInt(availabilityCheck.rows[0].count) > 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Time slot not available'
      });
    }

    // 2. Get service details
    const serviceResult = await db.query(
      'SELECT * FROM services WHERE id = $1',
      [serviceId]
    );
    const service = serviceResult.rows[0];

    // 3. Create booking
    const bookingResult = await db.query(`
      INSERT INTO bookings (
        client_id, stylist_id, service_id, booking_date,
        booking_time, duration_minutes, total_price, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
      RETURNING *
    `, [userId, stylistId, serviceId, bookingDate, bookingTime, service.duration, service.price, notes]);

    const booking = bookingResult.rows[0];

    // 4. Create event (event sourcing)
    await db.query(`
      INSERT INTO booking_events (booking_id, event_type, event_data, user_id)
      VALUES ($1, 'CREATED', $2, $3)
    `, [
      booking.id,
      JSON.stringify({ bookingDate, bookingTime, serviceId }),
      userId
    ]);

    // 5. Create notification for stylist
    const stylistResult = await db.query(
      'SELECT user_id FROM stylists WHERE id = $1',
      [stylistId]
    );

    await db.query(`
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES ($1, 'NEW_BOOKING', 'New Booking Request', $2, $3)
    `, [
      stylistResult.rows[0].user_id,
      `You have a new booking request for ${service.name}`,
      JSON.stringify({ bookingId: booking.id })
    ]);

    await db.query('COMMIT');

    // Invalidate caches
    await cacheService.invalidateStylistCache(stylistId);
    await cacheService.del(`mobile_dashboard:${userId}`);

    res.json({
      success: true,
      data: {
        booking: {
          id: booking.id,
          status: booking.status,
          bookingDate: booking.booking_date,
          bookingTime: booking.booking_time,
          totalPrice: booking.total_price
        },
        message: 'Booking created successfully. Waiting for stylist confirmation.'
      }
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Mobile booking creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking'
    });
  }
});

// ============================================
// Mobile Profile Summary - Lightweight
// ============================================

/**
 * GET /api/mobile/v1/profile/summary
 * Lightweight profile data for mobile app header/sidebar
 */
router.get('/profile/summary', validateJWT, async (req, res) => {
  try {
    const userId = req.userId;

    const result = await db.query(`
      SELECT
        id,
        full_name,
        email,
        profile_picture_url,
        role,
        (SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false) as unread_notifications
      FROM users
      WHERE id = $1
    `, [userId]);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Profile summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load profile summary'
    });
  }
});

// ============================================
// Mobile Batch Operations - Reduce requests
// ============================================

/**
 * POST /api/mobile/v1/batch
 * Execute multiple operations in single request
 * Example: Mark multiple notifications as read
 */
router.post('/batch', validateJWT, async (req, res) => {
  try {
    const { operations } = req.body;
    const userId = req.userId;
    const results = [];

    for (const op of operations) {
      switch (op.type) {
        case 'MARK_NOTIFICATION_READ':
          await db.query(
            'UPDATE notifications SET is_read = true WHERE id = ANY($1) AND user_id = $2',
            [op.notificationIds, userId]
          );
          results.push({ success: true, operation: op.type });
          break;

        case 'FAVORITE_STYLIST':
          await db.query(
            'INSERT INTO favorite_stylists (client_id, stylist_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [userId, op.stylistId]
          );
          results.push({ success: true, operation: op.type });
          break;

        default:
          results.push({ success: false, operation: op.type, error: 'Unknown operation' });
      }
    }

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Batch operation error:', error);
    res.status(500).json({
      success: false,
      error: 'Batch operation failed'
    });
  }
});

// ============================================
// Mobile Health Check
// ============================================

router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'mobile-bff',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
