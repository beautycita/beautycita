import express from 'express';
import { query as queryValidator, param } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import { optionalAuth } from '../middleware/auth.js';
import { query } from '../services/database.js';

const router = express.Router();

// Search and discover stylists
router.get('/',
  queryValidator('city').optional().trim().isLength({ min: 2, max: 100 }),
  queryValidator('state').optional().trim().isLength({ min: 2, max: 50 }),
  queryValidator('specialty').optional().trim(),
  queryValidator('pricingTier').optional().isIn(['BUDGET', 'MID_RANGE', 'PREMIUM', 'LUXURY']),
  queryValidator('minRating').optional().isFloat({ min: 0, max: 5 }),
  queryValidator('sortBy').optional().isIn(['rating', 'price', 'distance', 'popularity']),
  queryValidator('page').optional().isInt({ min: 1 }),
  queryValidator('limit').optional().isInt({ min: 1, max: 50 }),
  validateRequest,
  optionalAuth, // Optional authentication for personalized results
  async (req, res, next) => {
    try {
      const {
        city, state, specialty, pricingTier, minRating,
        sortBy = 'rating', page = 1, limit = 20
      } = req.query;

      const offset = (page - 1) * limit;
      const conditions = ['s.is_verified = true', 's.is_accepting_bookings = true'];
      const params = [];
      let paramIndex = 1;

      // Build WHERE conditions
      if (city) {
        conditions.push(`LOWER(s.location_city) LIKE LOWER($${paramIndex++})`);
        params.push(`%${city}%`);
      }

      if (state) {
        conditions.push(`LOWER(s.location_state) LIKE LOWER($${paramIndex++})`);
        params.push(`%${state}%`);
      }

      if (specialty) {
        conditions.push(`$${paramIndex++} = ANY(s.specialties)`);
        params.push(specialty);
      }

      if (pricingTier) {
        conditions.push(`s.pricing_tier = $${paramIndex++}`);
        params.push(pricingTier);
      }

      if (minRating) {
        conditions.push(`s.rating_average >= $${paramIndex++}`);
        params.push(minRating);
      }

      // Build ORDER BY clause
      let orderBy = 'ORDER BY ';
      switch (sortBy) {
        case 'rating':
          orderBy += 's.rating_average DESC, s.rating_count DESC';
          break;
        case 'price':
          orderBy += 's.pricing_tier ASC';
          break;
        case 'popularity':
          orderBy += 's.total_bookings DESC, s.rating_average DESC';
          break;
        default:
          orderBy += 's.rating_average DESC';
      }

      // Add pagination parameters
      params.push(limit, offset);

      const result = await query(`
        SELECT
          s.id,
          s.business_name,
          s.bio,
          s.specialties,
          s.experience_years,
          s.location_city,
          s.location_state,
          s.pricing_tier,
          s.base_price_range,
          s.portfolio_images,
          s.social_media_links,
          s.rating_average,
          s.rating_count,
          s.total_bookings,
          u.first_name,
          u.last_name,
          u.profile_picture_url,
          -- Get minimum service price
          (
            SELECT MIN(price) FROM services
            WHERE stylist_id = s.id AND is_active = true
          ) as min_service_price,
          -- Count active services
          (
            SELECT COUNT(*) FROM services
            WHERE stylist_id = s.id AND is_active = true
          ) as service_count
        FROM stylists s
        JOIN users u ON s.user_id = u.id
        WHERE ${conditions.join(' AND ')}
        ${orderBy}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `, params);

      // Get total count for pagination
      const countResult = await query(`
        SELECT COUNT(*) as total
        FROM stylists s
        JOIN users u ON s.user_id = u.id
        WHERE ${conditions.join(' AND ')}
      `, params.slice(0, -2)); // Remove limit and offset from params

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      res.json({
        stylists: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalResults: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });

    } catch (error) {
      next(error);
    }
  }
);

// Get stylist profile by ID
router.get('/:id',
  param('id').isUUID().withMessage('Valid stylist ID is required'),
  validateRequest,
  optionalAuth,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const result = await query(`
        SELECT
          s.*,
          u.first_name,
          u.last_name,
          u.email,
          u.profile_picture_url,
          u.created_at as user_created_at,
          -- Get services
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', srv.id,
                'name', srv.name,
                'name_es', srv.name_es,
                'description', srv.description,
                'description_es', srv.description_es,
                'duration_minutes', srv.duration_minutes,
                'price', srv.price,
                'category', jsonb_build_object(
                  'id', sc.id,
                  'name', sc.name,
                  'name_es', sc.name_es,
                  'icon', sc.icon
                )
              )
            ) FILTER (WHERE srv.id IS NOT NULL),
            '[]'
          ) as services,
          -- Get recent reviews
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', r.id,
                'rating', r.rating,
                'comment', r.comment,
                'is_anonymous', r.is_anonymous,
                'created_at', r.created_at,
                'client_name', CASE
                  WHEN r.is_anonymous THEN 'Cliente anónimo'
                  ELSE CONCAT(cu.first_name, ' ', SUBSTRING(cu.last_name, 1, 1), '.')
                END
              )
            ) FILTER (WHERE r.id IS NOT NULL),
            '[]'
          ) as recent_reviews
        FROM stylists s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN services srv ON s.id = srv.stylist_id AND srv.is_active = true
        LEFT JOIN service_categories sc ON srv.category_id = sc.id
        LEFT JOIN reviews r ON s.id = r.stylist_id AND r.created_at >= NOW() - INTERVAL '6 months'
        LEFT JOIN clients c ON r.client_id = c.id
        LEFT JOIN users cu ON c.user_id = cu.id
        WHERE s.id = $1
        GROUP BY s.id, u.id
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Stylist not found',
          code: 'STYLIST_NOT_FOUND'
        });
      }

      const stylist = result.rows[0];

      // Get availability for next 7 days
      const availabilityResult = await query(`
        SELECT day_of_week, start_time, end_time
        FROM availability
        WHERE stylist_id = $1 AND is_active = true
        ORDER BY day_of_week
      `, [id]);

      stylist.availability = availabilityResult.rows;

      res.json(stylist);

    } catch (error) {
      next(error);
    }
  }
);

// Get stylist availability for specific dates
router.get('/:id/availability',
  param('id').isUUID().withMessage('Valid stylist ID is required'),
  queryValidator('startDate').isISO8601().withMessage('Valid start date is required'),
  queryValidator('endDate').isISO8601().withMessage('Valid end date is required'),
  validateRequest,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      // Validate date range (max 30 days)
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = (end - start) / (1000 * 60 * 60 * 24);

      if (daysDiff > 30) {
        return res.status(400).json({
          error: 'Date range cannot exceed 30 days',
          code: 'INVALID_DATE_RANGE'
        });
      }

      // Get regular availability
      const availabilityResult = await query(`
        SELECT day_of_week, start_time, end_time
        FROM availability
        WHERE stylist_id = $1 AND is_active = true
      `, [id]);

      // Get exceptions for the date range
      const exceptionsResult = await query(`
        SELECT date, start_time, end_time, is_available, reason
        FROM availability_exceptions
        WHERE stylist_id = $1 AND date BETWEEN $2 AND $3
      `, [id, startDate, endDate]);

      // Get existing bookings for the date range
      const bookingsResult = await query(`
        SELECT
          b.appointment_date,
          b.appointment_time,
          s.duration_minutes + COALESCE(s.preparation_time_minutes, 0) + COALESCE(s.cleanup_time_minutes, 0) as total_duration
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        WHERE b.stylist_id = $1
        AND b.appointment_date BETWEEN $2 AND $3
        AND b.status IN ('CONFIRMED', 'IN_PROGRESS')
      `, [id, startDate, endDate]);

      res.json({
        stylistId: id,
        dateRange: { startDate, endDate },
        regularAvailability: availabilityResult.rows,
        exceptions: exceptionsResult.rows,
        existingBookings: bookingsResult.rows
      });

    } catch (error) {
      next(error);
    }
  }
);

// Get stylist reviews
router.get('/:id/reviews',
  param('id').isUUID().withMessage('Valid stylist ID is required'),
  queryValidator('page').optional().isInt({ min: 1 }),
  queryValidator('limit').optional().isInt({ min: 1, max: 50 }),
  queryValidator('rating').optional().isInt({ min: 1, max: 5 }),
  validateRequest,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20, rating } = req.query;
      const offset = (page - 1) * limit;

      let ratingCondition = '';
      const params = [id];

      if (rating) {
        ratingCondition = 'AND r.rating = $2';
        params.push(rating);
      }

      const result = await query(`
        SELECT
          r.id,
          r.rating,
          r.comment,
          r.is_anonymous,
          r.response_from_stylist,
          r.created_at,
          CASE
            WHEN r.is_anonymous THEN 'Cliente anónimo'
            ELSE CONCAT(u.first_name, ' ', SUBSTRING(u.last_name, 1, 1), '.')
          END as client_name,
          srv.name as service_name,
          srv.name_es as service_name_es
        FROM reviews r
        JOIN bookings b ON r.booking_id = b.id
        JOIN services srv ON b.service_id = srv.id
        LEFT JOIN clients c ON r.client_id = c.id
        LEFT JOIN users u ON c.user_id = u.id
        WHERE r.stylist_id = $1 ${ratingCondition}
        ORDER BY r.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `, params);

      // Get rating distribution
      const statsResult = await query(`
        SELECT
          rating,
          COUNT(*) as count
        FROM reviews
        WHERE stylist_id = $1
        GROUP BY rating
        ORDER BY rating DESC
      `, [id]);

      res.json({
        reviews: result.rows,
        stats: {
          ratingDistribution: statsResult.rows,
          currentPage: parseInt(page),
          hasMore: result.rows.length === parseInt(limit)
        }
      });

    } catch (error) {
      next(error);
    }
  }
);

export default router;