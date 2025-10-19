const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * GET /api/reviews-public/stylist/:stylistId
 * Get all reviews for a stylist (public, no auth required)
 */
router.get('/stylist/:stylistId', async (req, res) => {
  try {
    const { stylistId } = req.params;
    const { page = 1, limit = 10, sort = 'recent' } = req.query;
    const offset = (page - 1) * limit;

    let orderBy = 'r.created_at DESC';
    if (sort === 'helpful') orderBy = 'r.helpful_count DESC';
    if (sort === 'rating_high') orderBy = 'r.rating DESC, r.created_at DESC';
    if (sort === 'rating_low') orderBy = 'r.rating ASC, r.created_at DESC';

    const result = await query(`
      SELECT
        r.*,
        u.name as client_name,
        NULL as client_photo,
        s.name as service_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', rp.id,
              'photo_url', rp.photo_url,
              'photo_type', rp.photo_type
            )
            ORDER BY rp.display_order
          ) FILTER (WHERE rp.id IS NOT NULL),
          '[]'
        ) as photos
      FROM reviews r
      INNER JOIN users u ON r.client_id = u.id
      INNER JOIN bookings b ON r.booking_id = b.id
      INNER JOIN services s ON b.service_id = s.id
      LEFT JOIN review_photos rp ON r.id = rp.review_id
      WHERE r.stylist_id = $1
        AND r.is_verified = true
        AND r.is_visible = true
        AND r.is_approved = true
      GROUP BY r.id, u.name, s.name
      ORDER BY ${orderBy}
      LIMIT $2 OFFSET $3
    `, [stylistId, limit, offset]);

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM reviews
      WHERE stylist_id = $1
        AND is_verified = true
        AND is_visible = true
        AND is_approved = true
    `, [stylistId]);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews'
    });
  }
});

/**
 * GET /api/reviews-public/stylist/:stylistId/stats
 * Get rating statistics for a stylist (public, no auth required)
 */
router.get('/stylist/:stylistId/stats', async (req, res) => {
  try {
    const { stylistId } = req.params;

    const result = await query(`
      SELECT * FROM stylist_ratings WHERE stylist_id = $1
    `, [stylistId]);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          total_reviews: 0,
          average_rating: 0,
          rating_5_star: 0,
          rating_4_star: 0,
          rating_3_star: 0,
          rating_2_star: 0,
          rating_1_star: 0
        }
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching rating stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stats'
    });
  }
});

module.exports = router;