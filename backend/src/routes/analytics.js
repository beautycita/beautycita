const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Role-based access control middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.userRole;
    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient privileges'
      });
    }

    next();
  };
};

// Get analytics data for admin dashboards
router.get('/', requireRole(['SUPERADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get revenue data
    const revenueQuery = `
      SELECT
        COALESCE(SUM(CASE WHEN created_at >= $1 THEN amount ELSE 0 END), 0) as current_revenue,
        COALESCE(SUM(CASE WHEN created_at < $1 AND created_at >= $2 THEN amount ELSE 0 END), 0) as previous_revenue
      FROM payments
      WHERE status = 'completed'
    `;
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const revenueResult = await query(revenueQuery, [startDate, prevStartDate]);
    const currentRevenue = parseFloat(revenueResult.rows[0].current_revenue);
    const previousRevenue = parseFloat(revenueResult.rows[0].previous_revenue);
    const revenueGrowth = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    // Get bookings data
    const bookingsQuery = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM bookings
      WHERE created_at >= $1
    `;
    const bookingsResult = await query(bookingsQuery, [startDate]);
    const bookingsData = bookingsResult.rows[0];
    const conversionRate = bookingsData.total > 0
      ? (bookingsData.completed / bookingsData.total) * 100
      : 0;

    // Get clients data
    const clientsQuery = `
      SELECT
        COUNT(DISTINCT client_id) as total,
        COUNT(DISTINCT CASE WHEN created_at >= $1 THEN client_id END) as new_clients,
        COUNT(DISTINCT CASE WHEN booking_count > 1 THEN client_id END) as returning
      FROM (
        SELECT client_id, created_at, COUNT(*) OVER (PARTITION BY client_id) as booking_count
        FROM bookings
      ) subquery
    `;
    const clientsResult = await query(clientsQuery, [startDate]);
    const clientsData = clientsResult.rows[0];
    const retentionRate = clientsData.total > 0
      ? (clientsData.returning / clientsData.total) * 100
      : 0;

    // Get stylists data with average rating from stylists table
    const stylistsQuery = `
      SELECT
        COUNT(u.*) as total,
        COUNT(CASE WHEN u.is_active = true THEN 1 END) as active,
        COALESCE(AVG(s.rating_average), 0) as average_rating
      FROM users u
      LEFT JOIN stylists s ON u.id = s.user_id
      WHERE u.role = 'STYLIST'
    `;
    const stylistsResult = await query(stylistsQuery);
    const stylistsData = stylistsResult.rows[0];

    // Get top performer
    const topPerformerQuery = `
      SELECT u.name, COUNT(b.id) as booking_count
      FROM users u
      LEFT JOIN bookings b ON u.id = b.stylist_id AND b.created_at >= $1
      WHERE u.role = 'STYLIST'
      GROUP BY u.id, u.name
      ORDER BY booking_count DESC
      LIMIT 1
    `;
    const topPerformerResult = await query(topPerformerQuery, [startDate]);
    const topPerformer = topPerformerResult.rows[0]?.name || 'N/A';

    res.json({
      success: true,
      data: {
        revenue: {
          thisMonth: currentRevenue,
          lastMonth: previousRevenue,
          growth: revenueGrowth
        },
        bookings: {
          total: parseInt(bookingsData.total),
          completed: parseInt(bookingsData.completed),
          cancelled: parseInt(bookingsData.cancelled),
          conversionRate: parseFloat(conversionRate.toFixed(1))
        },
        clients: {
          total: parseInt(clientsData.total),
          newThisMonth: parseInt(clientsData.new_clients),
          returning: parseInt(clientsData.returning),
          retentionRate: parseFloat(retentionRate.toFixed(1))
        },
        stylists: {
          total: parseInt(stylistsData.total),
          active: parseInt(stylistsData.active),
          topPerformer: topPerformer,
          averageRating: parseFloat(parseFloat(stylistsData.average_rating).toFixed(1))
        }
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics data'
    });
  }
});

// Get dashboard stats for specific role
router.get('/dashboard/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const userId = req.user.id;

    let stats = {};

    switch (role) {
      case 'SUPERADMIN':
      case 'ADMIN':
        // Total system stats with growth calculations
        const usersCount = await query('SELECT COUNT(*) as count FROM users');
        const lastMonthUsersCount = await query("SELECT COUNT(*) as count FROM users WHERE created_at < NOW() - INTERVAL '30 days'");
        const totalUsers = parseInt(usersCount.rows[0].count);
        const lastMonthUsers = parseInt(lastMonthUsersCount.rows[0].count);
        const usersGrowth = lastMonthUsers > 0 ? (((totalUsers - lastMonthUsers) / lastMonthUsers) * 100).toFixed(1) : 0;

        const stylistsCount = await query("SELECT COUNT(*) as count FROM users WHERE role = 'STYLIST'");
        const clientsCount = await query("SELECT COUNT(*) as count FROM users WHERE role = 'CLIENT'");

        const monthlyBookings = await query("SELECT COUNT(*) as count FROM bookings WHERE created_at >= NOW() - INTERVAL '30 days'");
        const prevMonthBookings = await query("SELECT COUNT(*) as count FROM bookings WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'");
        const currentBookings = parseInt(monthlyBookings.rows[0].count);
        const previousBookings = parseInt(prevMonthBookings.rows[0].count);
        const bookingsGrowth = previousBookings > 0 ? (((currentBookings - previousBookings) / previousBookings) * 100).toFixed(1) : 0;

        const monthlyRevenue = await query("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '30 days'");
        const prevMonthRevenue = await query("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'");
        const currentRevenue = parseFloat(monthlyRevenue.rows[0].total);
        const previousRevenue = parseFloat(prevMonthRevenue.rows[0].total);
        const revenueGrowth = previousRevenue > 0 ? (((currentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1) : 0;

        const activeUsers = await query("SELECT COUNT(*) as count FROM users WHERE is_active = true");
        const pendingVerifications = await query("SELECT COUNT(*) as count FROM users WHERE email_verified = false OR (role = 'STYLIST' AND id NOT IN (SELECT user_id FROM stylists WHERE is_verified = true))");

        // Calculate progress percentages based on totals
        const totalStylists = parseInt(stylistsCount.rows[0].count);
        const totalClients = parseInt(clientsCount.rows[0].count);
        const stylistsPercentage = totalUsers > 0 ? ((totalStylists / totalUsers) * 100).toFixed(0) : 0;
        const clientsPercentage = totalUsers > 0 ? ((totalClients / totalUsers) * 100).toFixed(0) : 0;

        stats = {
          totalUsers,
          totalStylists,
          totalClients,
          monthlyRevenue: currentRevenue,
          monthlyBookings: currentBookings,
          activeUsers: parseInt(activeUsers.rows[0].count),
          pendingVerifications: parseInt(pendingVerifications.rows[0].count),
          systemHealth: 98.5, // This could be calculated from various health checks
          usersGrowth: parseFloat(usersGrowth),
          revenueGrowth: parseFloat(revenueGrowth),
          bookingsGrowth: parseFloat(bookingsGrowth),
          stylistsPercentage: parseInt(stylistsPercentage),
          clientsPercentage: parseInt(clientsPercentage)
        };
        break;

      case 'STYLIST':
        // Stylist-specific stats
        const todayBookings = await query(
          "SELECT COUNT(*) as count FROM bookings WHERE stylist_id = $1 AND DATE(scheduled_at) = CURRENT_DATE",
          [userId]
        );
        const weekRevenue = await query(
          "SELECT COALESCE(SUM(p.amount), 0) as total FROM payments p JOIN bookings b ON p.booking_id = b.id WHERE b.stylist_id = $1 AND p.status = 'completed' AND p.created_at >= NOW() - INTERVAL '7 days'",
          [userId]
        );
        const monthRevenue = await query(
          "SELECT COALESCE(SUM(p.amount), 0) as total FROM payments p JOIN bookings b ON p.booking_id = b.id WHERE b.stylist_id = $1 AND p.status = 'completed' AND p.created_at >= NOW() - INTERVAL '30 days'",
          [userId]
        );
        const clientsServed = await query(
          "SELECT COUNT(DISTINCT user_id) as count FROM bookings WHERE stylist_id = $1 AND status = 'completed'",
          [userId]
        );
        const userRating = await query(
          "SELECT COALESCE(rating, 0) as rating FROM users WHERE id = $1",
          [userId]
        );

        stats = {
          todayAppointments: parseInt(todayBookings.rows[0].count),
          weeklyRevenue: parseFloat(weekRevenue.rows[0].total),
          monthlyRevenue: parseFloat(monthRevenue.rows[0].total),
          clientsServed: parseInt(clientsServed.rows[0].count),
          rating: parseFloat(userRating.rows[0].rating)
        };
        break;

      case 'CLIENT':
        // Client-specific stats
        const upcomingBookings = await query(
          "SELECT COUNT(*) as count FROM bookings WHERE user_id = $1 AND scheduled_at >= NOW() AND status NOT IN ('cancelled', 'completed')",
          [userId]
        );
        const completedBookings = await query(
          "SELECT COUNT(*) as count FROM bookings WHERE user_id = $1 AND status = 'completed'",
          [userId]
        );
        const favoriteStylists = await query(
          "SELECT COUNT(*) as count FROM favorites WHERE user_id = $1",
          [userId]
        );

        stats = {
          upcomingBookings: parseInt(upcomingBookings.rows[0].count),
          completedBookings: parseInt(completedBookings.rows[0].count),
          favoriteStylists: parseInt(favoriteStylists.rows[0].count)
        };
        break;
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats'
    });
  }
});

module.exports = router;