const express = require('express');
const router = express.Router();
const { query } = require('./db');
const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: '/var/www/beautycita.com/backend/logs/dashboard.log' }),
    new winston.transports.Console()
  ]
});

// Note: Authentication is now handled by validateJWT middleware in server.js
// req.user is guaranteed to exist at this point

// Middleware to ensure user is a stylist
const requireStylist = async (req, res, next) => {
  try {
    if (req.user.role !== 'STYLIST' && req.user.role !== 'ADMIN' && req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ success: false, message: 'Stylist access required' });
    }

    // Get stylist ID
    const stylistResult = await query(
      'SELECT id FROM stylists WHERE user_id = $1',
      [req.user.id]
    );

    if (stylistResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Stylist profile not found' });
    }

    req.stylistId = stylistResult.rows[0].id;
    next();
  } catch (error) {
    logger.error('Error in requireStylist middleware:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/dashboard/stylist/stats
 * Get stylist dashboard statistics
 */
router.get('/stylist/stats', requireStylist, async (req, res) => {
  try {
    const stylistId = req.stylistId;

    // Get total bookings
    const totalBookingsResult = await query(
      'SELECT COUNT(*) as count FROM bookings WHERE stylist_id = $1',
      [stylistId]
    );
    const totalBookings = parseInt(totalBookingsResult.rows[0].count);

    // Get upcoming bookings (future bookings that are confirmed or pending)
    const upcomingBookingsResult = await query(
      `SELECT COUNT(*) as count FROM bookings
       WHERE stylist_id = $1
       AND booking_date >= CURRENT_DATE
       AND status IN ('CONFIRMED', 'PENDING')`,
      [stylistId]
    );
    const upcomingBookings = parseInt(upcomingBookingsResult.rows[0].count);

    // Get total revenue (completed bookings)
    const revenueResult = await query(
      `SELECT COALESCE(SUM(total_price), 0) as total
       FROM bookings
       WHERE stylist_id = $1 AND status = 'COMPLETED'`,
      [stylistId]
    );
    const totalRevenue = parseFloat(revenueResult.rows[0].total);

    // Get average rating and total reviews
    const ratingsResult = await query(
      `SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as total_reviews
       FROM reviews
       WHERE stylist_id = $1`,
      [stylistId]
    );
    const averageRating = parseFloat(ratingsResult.rows[0].avg_rating);
    const totalReviews = parseInt(ratingsResult.rows[0].total_reviews);

    // Get unique clients count
    const clientsResult = await query(
      `SELECT COUNT(DISTINCT client_id) as count
       FROM bookings
       WHERE stylist_id = $1`,
      [stylistId]
    );
    const totalClients = parseInt(clientsResult.rows[0].count);

    // Calculate profile completeness
    const stylistResult = await query(
      'SELECT * FROM stylists WHERE id = $1',
      [stylistId]
    );
    const stylist = stylistResult.rows[0];

    let completed = 0;
    const total = 10;

    if (stylist.business_name) completed++;
    if (stylist.bio) completed++;
    if (stylist.specialties && stylist.specialties.length > 0) completed++;
    if (stylist.experience_years) completed++;
    if (stylist.location_address) completed++;
    if (stylist.portfolio_images && stylist.portfolio_images.length > 0) completed++;
    if (stylist.social_media_links) completed++;
    if (stylist.working_hours) completed++;
    if (stylist.certifications && stylist.certifications.length > 0) completed++;
    if (stylist.signature_styles && stylist.signature_styles.length > 0) completed++;

    const profileCompleteness = Math.round((completed / total) * 100);

    res.json({
      success: true,
      data: {
        totalBookings,
        upcomingBookings,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalReviews,
        totalClients,
        followersCount: totalClients, // Map totalClients to followersCount for frontend compatibility
        profileCompleteness
      }
    });

    logger.info('Stylist stats fetched successfully', { stylistId, userId: req.user.id });
  } catch (error) {
    logger.error('Error fetching stylist stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics' });
  }
});

/**
 * GET /api/dashboard/stylist/activity
 * Get recent bookings and reviews for stylist
 */
router.get('/stylist/activity', requireStylist, async (req, res) => {
  try {
    const stylistId = req.stylistId;

    // Get recent bookings (last 10)
    const bookingsResult = await query(
      `SELECT
        b.id,
        b.booking_date,
        b.booking_time,
        b.status,
        b.total_price,
        COALESCE(u.first_name, SPLIT_PART(u.name, ' ', 1)) as first_name,
        COALESCE(u.last_name, SPLIT_PART(u.name, ' ', 2)) as last_name,
        u.email,
        s.name as service_name
       FROM bookings b
       JOIN users u ON b.client_id = u.id
       LEFT JOIN services s ON b.service_id = s.id
       WHERE b.stylist_id = $1
       ORDER BY b.booking_date DESC, b.booking_time DESC
       LIMIT 10`,
      [stylistId]
    );

    // Get recent reviews (last 10)
    const reviewsResult = await query(
      `SELECT
        r.id,
        r.rating,
        r.review_text as comment,
        r.created_at,
        COALESCE(u.first_name, SPLIT_PART(u.name, ' ', 1)) as first_name,
        COALESCE(u.last_name, SPLIT_PART(u.name, ' ', 2)) as last_name,
        b.id as booking_id
       FROM reviews r
       JOIN users u ON r.client_id = u.id
       JOIN bookings b ON r.booking_id = b.id
       WHERE r.stylist_id = $1
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [stylistId]
    );

    res.json({
      success: true,
      data: {
        recentBookings: bookingsResult.rows,
        recentReviews: reviewsResult.rows
      }
    });

    logger.info('Stylist activity fetched successfully', { stylistId, userId: req.user.id });
  } catch (error) {
    logger.error('Error fetching stylist activity:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity data' });
  }
});

/**
 * GET /api/dashboard/stylist/revenue
 * Get detailed revenue analytics for stylist
 */
router.get('/stylist/revenue', requireStylist, async (req, res) => {
  try {
    const stylistId = req.stylistId;
    const { period = 'month' } = req.query; // month, week, year

    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = "AND booking_date >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'year':
        dateFilter = "AND booking_date >= CURRENT_DATE - INTERVAL '1 year'";
        break;
      case 'month':
      default:
        dateFilter = "AND booking_date >= CURRENT_DATE - INTERVAL '30 days'";
        break;
    }

    // Get revenue by day for the period
    const revenueByDayResult = await query(
      `SELECT
        DATE(booking_date) as date,
        COUNT(*) as booking_count,
        SUM(total_price) as revenue
       FROM bookings
       WHERE stylist_id = $1 AND status = 'COMPLETED' ${dateFilter}
       GROUP BY DATE(booking_date)
       ORDER BY date ASC`,
      [stylistId]
    );

    // Get revenue by service
    const revenueByServiceResult = await query(
      `SELECT
        COALESCE(s.name, 'No Service') as service_name,
        COUNT(*) as booking_count,
        SUM(b.total_price) as revenue
       FROM bookings b
       LEFT JOIN services s ON b.service_id = s.id
       WHERE b.stylist_id = $1 AND b.status = 'COMPLETED' ${dateFilter}
       GROUP BY s.name
       ORDER BY revenue DESC`,
      [stylistId]
    );

    // Get total revenue for period
    const totalRevenueResult = await query(
      `SELECT
        COALESCE(SUM(total_price), 0) as total,
        COUNT(*) as booking_count
       FROM bookings
       WHERE stylist_id = $1 AND status = 'COMPLETED' ${dateFilter}`,
      [stylistId]
    );

    // Get pending revenue (confirmed but not completed bookings)
    const pendingRevenueResult = await query(
      `SELECT COALESCE(SUM(total_price), 0) as total
       FROM bookings
       WHERE stylist_id = $1 AND status IN ('CONFIRMED', 'PENDING')`,
      [stylistId]
    );

    res.json({
      success: true,
      data: {
        period,
        totalRevenue: parseFloat(totalRevenueResult.rows[0].total).toFixed(2),
        totalBookings: parseInt(totalRevenueResult.rows[0].booking_count),
        pendingRevenue: parseFloat(pendingRevenueResult.rows[0].total).toFixed(2),
        revenueByDay: revenueByDayResult.rows.map(row => ({
          date: row.date,
          revenue: parseFloat(row.revenue).toFixed(2),
          bookingCount: parseInt(row.booking_count)
        })),
        revenueByService: revenueByServiceResult.rows.map(row => ({
          serviceName: row.service_name,
          revenue: parseFloat(row.revenue).toFixed(2),
          bookingCount: parseInt(row.booking_count)
        }))
      }
    });

    logger.info('Stylist revenue analytics fetched successfully', { stylistId, period });
  } catch (error) {
    logger.error('Error fetching revenue analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch revenue data' });
  }
});

/**
 * GET /api/dashboard/profile
 * Get complete profile data for dashboard
 */
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user data
    const userResult = await query(
      'SELECT id, first_name, last_name, name, email, phone, role, profile_picture_url, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];
    const profileData = { user };

    // Get stylist data if user is a stylist
    if (user.role === 'STYLIST' || user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
      const stylistResult = await query(
        'SELECT * FROM stylists WHERE user_id = $1',
        [userId]
      );

      if (stylistResult.rows.length > 0) {
        profileData.stylist = stylistResult.rows[0];
      }
    }

    // Get client data if user is a client
    if (user.role === 'CLIENT') {
      const clientResult = await query(
        'SELECT * FROM clients WHERE user_id = $1',
        [userId]
      );

      if (clientResult.rows.length > 0) {
        profileData.client = clientResult.rows[0];
      }
    }

    res.json({
      success: true,
      data: profileData
    });

    logger.info('Profile data fetched successfully', { userId });
  } catch (error) {
    logger.error('Error fetching profile data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile data' });
  }
});

/**
 * GET /api/dashboard/reminder-stats
 * Get SMS reminder statistics
 */
router.get('/reminder-stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const statsQuery = `
      SELECT
        DATE(scheduled_for) as date,
        COUNT(*) as total_scheduled,
        COUNT(CASE WHEN status = 'SENT' THEN 1 END) as sent,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled
      FROM scheduled_sms
      WHERE message_type = 'REMINDER'
        AND scheduled_for BETWEEN $1 AND $2
      GROUP BY DATE(scheduled_for)
      ORDER BY date DESC
    `;

    const result = await query(statsQuery, [start, end]);

    res.json({
      success: true,
      data: {
        period: { start, end },
        stats: result.rows
      }
    });

    logger.info('Reminder stats fetched successfully', { userId: req.user.id });
  } catch (error) {
    logger.error('Error fetching reminder stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reminder statistics' });
  }
});

module.exports = router;