import express from 'express';
import { body, param, query as queryValidator } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import { requireRole, optionalAuth } from '../middleware/auth.js';
import { query, withTransaction } from '../services/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Create review (clients only, after completed booking)
router.post('/',
  requireRole('CLIENT'),
  body('bookingId').isUUID().withMessage('Valid booking ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment must not exceed 1000 characters'),
  body('isAnonymous').optional().isBoolean(),
  validateRequest,
  async (req, res, next) => {
    try {
      const { bookingId, rating, comment, isAnonymous = false } = req.body;

      await withTransaction(async (client) => {
        // Verify booking belongs to client and is completed
        const bookingResult = await client.query(`
          SELECT b.*, c.user_id as client_user_id, b.stylist_id
          FROM bookings b
          JOIN clients c ON b.client_id = c.id
          WHERE b.id = $1 AND c.user_id = $2 AND b.status = 'COMPLETED'
        `, [bookingId, req.user.id]);

        if (bookingResult.rows.length === 0) {
          throw new Error('Booking not found or not eligible for review');
        }

        const booking = bookingResult.rows[0];

        // Check if review already exists
        const existingReview = await client.query(`
          SELECT id FROM reviews WHERE booking_id = $1
        `, [bookingId]);

        if (existingReview.rows.length > 0) {
          throw new Error('Review already exists for this booking');
        }

        // Create review
        const reviewId = uuidv4();
        const reviewResult = await client.query(`
          INSERT INTO reviews (
            id, booking_id, client_id, stylist_id,
            rating, comment, is_anonymous
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [reviewId, bookingId, booking.client_id, booking.stylist_id, rating, comment, isAnonymous]);

        // Update stylist rating
        const ratingUpdate = await client.query(`
          UPDATE stylists
          SET
            rating_average = (
              SELECT AVG(rating)::numeric(3,2)
              FROM reviews
              WHERE stylist_id = $1
            ),
            rating_count = (
              SELECT COUNT(*)
              FROM reviews
              WHERE stylist_id = $1
            )
          WHERE id = $1
          RETURNING rating_average, rating_count
        `, [booking.stylist_id]);

        return {
          review: reviewResult.rows[0],
          updatedRating: ratingUpdate.rows[0]
        };
      });

      res.status(201).json({
        message: 'Review submitted successfully'
      });

    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('not eligible')) {
        return res.status(404).json({
          error: error.message,
          code: 'BOOKING_NOT_FOUND'
        });
      }
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          error: error.message,
          code: 'REVIEW_EXISTS'
        });
      }
      next(error);
    }
  }
);

// Get reviews (with filters)
router.get('/',
  queryValidator('stylistId').optional().isUUID(),
  queryValidator('clientId').optional().isUUID(),
  queryValidator('rating').optional().isInt({ min: 1, max: 5 }),
  queryValidator('page').optional().isInt({ min: 1 }),
  queryValidator('limit').optional().isInt({ min: 1, max: 50 }),
  validateRequest,
  optionalAuth,
  async (req, res, next) => {
    try {
      const {
        stylistId, clientId, rating,
        page = 1, limit = 20
      } = req.query;

      const offset = (page - 1) * limit;
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      if (stylistId) {
        conditions.push(`r.stylist_id = $${paramIndex++}`);
        params.push(stylistId);
      }

      if (clientId) {
        conditions.push(`r.client_id = $${paramIndex++}`);
        params.push(clientId);
      }

      if (rating) {
        conditions.push(`r.rating = $${paramIndex++}`);
        params.push(rating);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Add pagination parameters
      params.push(limit, offset);

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
            ELSE CONCAT(cu.first_name, ' ', SUBSTRING(cu.last_name, 1, 1), '.')
          END as client_name,
          st.business_name as stylist_business_name,
          CONCAT(su.first_name, ' ', su.last_name) as stylist_name,
          srv.name as service_name,
          srv.name_es as service_name_es
        FROM reviews r
        LEFT JOIN clients c ON r.client_id = c.id
        LEFT JOIN users cu ON c.user_id = cu.id
        LEFT JOIN stylists st ON r.stylist_id = st.id
        LEFT JOIN users su ON st.user_id = su.id
        LEFT JOIN bookings b ON r.booking_id = b.id
        LEFT JOIN services srv ON b.service_id = srv.id
        ${whereClause}
        ORDER BY r.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `, params);

      res.json({
        reviews: result.rows,
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

// Update review (clients can edit their own reviews)
router.patch('/:id',
  requireRole('CLIENT'),
  param('id').isUUID().withMessage('Valid review ID is required'),
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('comment').optional().trim().isLength({ max: 1000 }),
  body('isAnonymous').optional().isBoolean(),
  validateRequest,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { rating, comment, isAnonymous } = req.body;

      await withTransaction(async (client) => {
        // Verify review belongs to client
        const reviewResult = await client.query(`
          SELECT r.*, c.user_id as client_user_id
          FROM reviews r
          JOIN clients c ON r.client_id = c.id
          WHERE r.id = $1
        `, [id]);

        if (reviewResult.rows.length === 0) {
          throw new Error('Review not found');
        }

        const review = reviewResult.rows[0];

        if (review.client_user_id !== req.user.id) {
          throw new Error('Not authorized to update this review');
        }

        // Build update query
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (rating !== undefined) {
          updates.push(`rating = $${paramIndex++}`);
          values.push(rating);
        }
        if (comment !== undefined) {
          updates.push(`comment = $${paramIndex++}`);
          values.push(comment);
        }
        if (isAnonymous !== undefined) {
          updates.push(`is_anonymous = $${paramIndex++}`);
          values.push(isAnonymous);
        }

        if (updates.length === 0) {
          throw new Error('No valid fields to update');
        }

        values.push(id);

        await client.query(`
          UPDATE reviews
          SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $${paramIndex}
        `, values);

        // Update stylist rating if rating changed
        if (rating !== undefined) {
          await client.query(`
            UPDATE stylists
            SET
              rating_average = (
                SELECT AVG(rating)::numeric(3,2)
                FROM reviews
                WHERE stylist_id = $1
              ),
              rating_count = (
                SELECT COUNT(*)
                FROM reviews
                WHERE stylist_id = $1
              )
            WHERE id = $1
          `, [review.stylist_id]);
        }
      });

      res.json({
        message: 'Review updated successfully'
      });

    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: error.message,
          code: 'REVIEW_NOT_FOUND'
        });
      }
      if (error.message.includes('Not authorized')) {
        return res.status(403).json({
          error: error.message,
          code: 'UNAUTHORIZED'
        });
      }
      if (error.message.includes('No valid fields')) {
        return res.status(400).json({
          error: error.message,
          code: 'NO_UPDATES'
        });
      }
      next(error);
    }
  }
);

// Stylist response to review
router.patch('/:id/response',
  requireRole('STYLIST'),
  param('id').isUUID().withMessage('Valid review ID is required'),
  body('response').trim().isLength({ min: 1, max: 500 }).withMessage('Response must be between 1 and 500 characters'),
  validateRequest,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { response } = req.body;

      // Verify review belongs to stylist
      const reviewResult = await query(`
        SELECT r.*, s.user_id as stylist_user_id
        FROM reviews r
        JOIN stylists s ON r.stylist_id = s.id
        WHERE r.id = $1
      `, [id]);

      if (reviewResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Review not found',
          code: 'REVIEW_NOT_FOUND'
        });
      }

      if (reviewResult.rows[0].stylist_user_id !== req.user.id) {
        return res.status(403).json({
          error: 'Not authorized to respond to this review',
          code: 'UNAUTHORIZED'
        });
      }

      await query(`
        UPDATE reviews
        SET response_from_stylist = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [response, id]);

      res.json({
        message: 'Response added successfully'
      });

    } catch (error) {
      next(error);
    }
  }
);

// Delete review (clients can delete their own reviews)
router.delete('/:id',
  requireRole('CLIENT'),
  param('id').isUUID().withMessage('Valid review ID is required'),
  validateRequest,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      await withTransaction(async (client) => {
        // Verify review belongs to client
        const reviewResult = await client.query(`
          SELECT r.*, c.user_id as client_user_id
          FROM reviews r
          JOIN clients c ON r.client_id = c.id
          WHERE r.id = $1
        `, [id]);

        if (reviewResult.rows.length === 0) {
          throw new Error('Review not found');
        }

        const review = reviewResult.rows[0];

        if (review.client_user_id !== req.user.id) {
          throw new Error('Not authorized to delete this review');
        }

        // Delete review
        await client.query(`DELETE FROM reviews WHERE id = $1`, [id]);

        // Update stylist rating
        await client.query(`
          UPDATE stylists
          SET
            rating_average = COALESCE(
              (SELECT AVG(rating)::numeric(3,2) FROM reviews WHERE stylist_id = $1),
              0.00
            ),
            rating_count = (
              SELECT COUNT(*) FROM reviews WHERE stylist_id = $1
            )
          WHERE id = $1
        `, [review.stylist_id]);
      });

      res.json({
        message: 'Review deleted successfully'
      });

    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: error.message,
          code: 'REVIEW_NOT_FOUND'
        });
      }
      if (error.message.includes('Not authorized')) {
        return res.status(403).json({
          error: error.message,
          code: 'UNAUTHORIZED'
        });
      }
      next(error);
    }
  }
);

export default router;