import express from 'express';
import { body, param, query as queryValidator } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import { requireRole } from '../middleware/auth.js';
import { query } from '../services/database.js';

const router = express.Router();

// All admin routes require ADMIN role
router.use(requireRole('ADMIN'));

// Dashboard statistics
router.get('/dashboard', async (req, res, next) => {
  try {
    // Get various statistics
    const stats = await Promise.all([
      // User statistics
      query(`
        SELECT
          COUNT(*) FILTER (WHERE role = 'CLIENT') as total_clients,
          COUNT(*) FILTER (WHERE role = 'STYLIST') as total_stylists,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_30d,
          COUNT(*) FILTER (WHERE last_login_at >= NOW() - INTERVAL '24 hours') as active_users_24h
        FROM users
        WHERE is_active = true
      `),

      // Booking statistics
      query(`
        SELECT
          COUNT(*) as total_bookings,
          COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_bookings,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as bookings_30d,
          AVG(total_price) FILTER (WHERE status = 'COMPLETED') as avg_booking_value,
          SUM(total_price) FILTER (WHERE status = 'COMPLETED' AND created_at >= NOW() - INTERVAL '30 days') as revenue_30d
        FROM bookings
      `),

      // Stylist statistics
      query(`
        SELECT
          COUNT(*) FILTER (WHERE is_verified = true) as verified_stylists,
          COUNT(*) FILTER (WHERE is_accepting_bookings = true) as active_stylists,
          AVG(rating_average) as avg_rating,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_stylists_30d
        FROM stylists
      `),

      // Payment statistics
      query(`
        SELECT
          COUNT(*) as total_payments,
          COUNT(*) FILTER (WHERE status = 'SUCCEEDED') as successful_payments,
          SUM(amount) FILTER (WHERE status = 'SUCCEEDED') as total_revenue,
          SUM(amount) FILTER (WHERE status = 'SUCCEEDED' AND created_at >= NOW() - INTERVAL '30 days') as revenue_30d
        FROM payments
      `)
    ]);

    const [userStats, bookingStats, stylistStats, paymentStats] = stats.map(result => result.rows[0]);

    res.json({
      users: {
        totalClients: parseInt(userStats.total_clients),
        totalStylists: parseInt(userStats.total_stylists),
        newUsers30d: parseInt(userStats.new_users_30d),
        activeUsers24h: parseInt(userStats.active_users_24h)
      },
      bookings: {
        total: parseInt(bookingStats.total_bookings),
        completed: parseInt(bookingStats.completed_bookings),
        bookings30d: parseInt(bookingStats.bookings_30d),
        avgValue: parseFloat(bookingStats.avg_booking_value) || 0,
        revenue30d: parseFloat(bookingStats.revenue_30d) || 0
      },
      stylists: {
        verified: parseInt(stylistStats.verified_stylists),
        active: parseInt(stylistStats.active_stylists),
        avgRating: parseFloat(stylistStats.avg_rating) || 0,
        newStylists30d: parseInt(stylistStats.new_stylists_30d)
      },
      payments: {
        total: parseInt(paymentStats.total_payments),
        successful: parseInt(paymentStats.successful_payments),
        totalRevenue: parseFloat(paymentStats.total_revenue) || 0,
        revenue30d: parseFloat(paymentStats.revenue_30d) || 0
      }
    });

  } catch (error) {
    next(error);
  }
});

// Get all users with filters
router.get('/users',
  queryValidator('role').optional().isIn(['CLIENT', 'STYLIST', 'ADMIN']),
  queryValidator('isActive').optional().isBoolean(),
  queryValidator('search').optional().trim(),
  queryValidator('page').optional().isInt({ min: 1 }),
  queryValidator('limit').optional().isInt({ min: 1, max: 100 }),
  validateRequest,
  async (req, res, next) => {
    try {
      const {
        role, isActive, search,
        page = 1, limit = 50
      } = req.query;

      const offset = (page - 1) * limit;
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      if (role) {
        conditions.push(`u.role = $${paramIndex++}`);
        params.push(role);
      }

      if (isActive !== undefined) {
        conditions.push(`u.is_active = $${paramIndex++}`);
        params.push(isActive === 'true');
      }

      if (search) {
        conditions.push(`(
          LOWER(u.first_name) LIKE LOWER($${paramIndex++}) OR
          LOWER(u.last_name) LIKE LOWER($${paramIndex - 1}) OR
          LOWER(u.email) LIKE LOWER($${paramIndex - 1})
        )`);
        params.push(`%${search}%`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      params.push(limit, offset);

      const result = await query(`
        SELECT
          u.id, u.email, u.first_name, u.last_name, u.role,
          u.phone, u.email_verified, u.is_active, u.created_at, u.last_login_at,
          CASE
            WHEN u.role = 'STYLIST' THEN json_build_object(
              'businessName', s.business_name,
              'isVerified', s.is_verified,
              'ratingAverage', s.rating_average,
              'totalBookings', s.total_bookings
            )
            ELSE NULL
          END as stylist_info
        FROM users u
        LEFT JOIN stylists s ON u.id = s.user_id AND u.role = 'STYLIST'
        ${whereClause}
        ORDER BY u.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `, params);

      res.json({
        users: result.rows,
        pagination: {
          currentPage: parseInt(page),
          hasMore: result.rows.length === parseInt(limit)
        }
      });

    } catch (error) {
      next(error);
    }
  }
);

// Update user status
router.patch('/users/:id/status',
  param('id').isUUID().withMessage('Valid user ID is required'),
  body('isActive').isBoolean().withMessage('Active status is required'),
  validateRequest,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const result = await query(`
        UPDATE users
        SET is_active = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, email, first_name, last_name, role, is_active
      `, [isActive, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      res.json({
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        user: result.rows[0]
      });

    } catch (error) {
      next(error);
    }
  }
);

// Verify stylist
router.patch('/stylists/:id/verify',
  param('id').isUUID().withMessage('Valid stylist ID is required'),
  body('isVerified').isBoolean().withMessage('Verification status is required'),
  validateRequest,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { isVerified } = req.body;

      const result = await query(`
        UPDATE stylists
        SET is_verified = $1, verification_date = CASE WHEN $1 THEN CURRENT_TIMESTAMP ELSE NULL END
        WHERE id = $2
        RETURNING id, business_name, is_verified, verification_date
      `, [isVerified, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Stylist not found',
          code: 'STYLIST_NOT_FOUND'
        });
      }

      res.json({
        message: `Stylist ${isVerified ? 'verified' : 'unverified'} successfully`,
        stylist: result.rows[0]
      });

    } catch (error) {
      next(error);
    }
  }
);

// Get all bookings with advanced filters
router.get('/bookings',
  queryValidator('status').optional().isIn(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  queryValidator('startDate').optional().isISO8601(),
  queryValidator('endDate').optional().isISO8601(),
  queryValidator('stylistId').optional().isUUID(),
  queryValidator('clientId').optional().isUUID(),
  queryValidator('page').optional().isInt({ min: 1 }),
  queryValidator('limit').optional().isInt({ min: 1, max: 100 }),
  validateRequest,
  async (req, res, next) => {
    try {
      const {
        status, startDate, endDate, stylistId, clientId,
        page = 1, limit = 50
      } = req.query;

      const offset = (page - 1) * limit;
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      if (status) {
        conditions.push(`b.status = $${paramIndex++}`);
        params.push(status);
      }

      if (startDate) {
        conditions.push(`b.appointment_date >= $${paramIndex++}`);
        params.push(startDate);
      }

      if (endDate) {
        conditions.push(`b.appointment_date <= $${paramIndex++}`);
        params.push(endDate);
      }

      if (stylistId) {
        conditions.push(`b.stylist_id = $${paramIndex++}`);
        params.push(stylistId);
      }

      if (clientId) {
        conditions.push(`b.client_id = $${paramIndex++}`);
        params.push(clientId);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      params.push(limit, offset);

      const result = await query(`
        SELECT
          b.*,
          srv.name as service_name,
          srv.name_es as service_name_es,
          srv.price as service_price,
          cu.first_name as client_first_name,
          cu.last_name as client_last_name,
          cu.email as client_email,
          su.first_name as stylist_first_name,
          su.last_name as stylist_last_name,
          st.business_name as stylist_business_name
        FROM bookings b
        LEFT JOIN services srv ON b.service_id = srv.id
        LEFT JOIN clients c ON b.client_id = c.id
        LEFT JOIN users cu ON c.user_id = cu.id
        LEFT JOIN stylists st ON b.stylist_id = st.id
        LEFT JOIN users su ON st.user_id = su.id
        ${whereClause}
        ORDER BY b.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `, params);

      res.json({
        bookings: result.rows,
        pagination: {
          currentPage: parseInt(page),
          hasMore: result.rows.length === parseInt(limit)
        }
      });

    } catch (error) {
      next(error);
    }
  }
);

// System settings management
router.get('/settings', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT key, value, description, updated_at
      FROM system_settings
      ORDER BY key
    `);

    res.json({
      settings: result.rows
    });

  } catch (error) {
    next(error);
  }
});

router.patch('/settings/:key',
  param('key').notEmpty().withMessage('Setting key is required'),
  body('value').notEmpty().withMessage('Setting value is required'),
  validateRequest,
  async (req, res, next) => {
    try {
      const { key } = req.params;
      const { value } = req.body;

      const result = await query(`
        UPDATE system_settings
        SET value = $1, updated_at = CURRENT_TIMESTAMP
        WHERE key = $2
        RETURNING *
      `, [value, key]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Setting not found',
          code: 'SETTING_NOT_FOUND'
        });
      }

      res.json({
        message: 'Setting updated successfully',
        setting: result.rows[0]
      });

    } catch (error) {
      next(error);
    }
  }
);

export default router;