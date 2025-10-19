const express = require('express');
const router = express.Router();
const { query } = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for review photo uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/reviews');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `review-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP) are allowed'));
    }
  }
});

/**
 * POST /api/reviews
 * Create a new review (client only, verified booking)
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      booking_id,
      rating,
      title,
      comment,
      quality_rating,
      professionalism_rating,
      cleanliness_rating,
      value_rating
    } = req.body;

    // Validate required fields
    if (!booking_id || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Verify booking exists and belongs to user
    const bookingCheck = await query(`
      SELECT b.id, b.stylist_id, b.status
      FROM bookings b
      WHERE b.id = $1 AND b.client_id = $2
    `, [booking_id, userId]);

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or does not belong to you'
      });
    }

    const booking = bookingCheck.rows[0];

    // Check if booking is completed (status is stored in uppercase in database)
    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed bookings'
      });
    }

    // Check if review already exists
    const existingReview = await query(`
      SELECT id FROM reviews WHERE booking_id = $1
    `, [booking_id]);

    if (existingReview.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Review already exists for this booking'
      });
    }

    // Create review
    const result = await query(`
      INSERT INTO reviews (
        booking_id,
        client_id,
        stylist_id,
        rating,
        title,
        review_text,
        quality_rating,
        professionalism_rating,
        cleanliness_rating,
        value_rating,
        is_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
      RETURNING *
    `, [
      booking_id,
      userId,
      booking.stylist_id,
      rating,
      title || null,
      comment || null,
      quality_rating || null,
      professionalism_rating || null,
      cleanliness_rating || null,
      value_rating || null
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Review created successfully'
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review'
    });
  }
});

/**
 * POST /api/reviews/:id/photos
 * Upload photos for a review
 */
router.post('/:id/photos', upload.array('photos', 5), async (req, res) => {
  try {
    const userId = req.user.id;
    const reviewId = req.params.id;
    const photoType = req.body.photo_type || 'result'; // before, after, result

    // Verify review belongs to user
    const reviewCheck = await query(`
      SELECT id FROM reviews WHERE id = $1 AND client_id = $2
    `, [reviewId, userId]);

    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or does not belong to you'
      });
    }

    // Save photo records
    const photoPromises = req.files.map((file, index) => {
      const photoUrl = `/uploads/reviews/${file.filename}`;
      return query(`
        INSERT INTO review_photos (review_id, photo_url, photo_type, display_order)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [reviewId, photoUrl, photoType, index]);
    });

    const results = await Promise.all(photoPromises);
    const photos = results.map(r => r.rows[0]);

    res.json({
      success: true,
      data: photos,
      message: 'Photos uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading review photos:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading photos'
    });
  }
});

/**
 * GET /api/reviews/stylist/:stylistId
 * Get all reviews for a stylist (public)
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
        s.name as service_type,
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
 * GET /api/reviews/stylist/:stylistId/stats
 * Get rating statistics for a stylist
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

/**
 * POST /api/reviews/:id/response
 * Stylist responds to a review
 */
router.post('/:id/response', async (req, res) => {
  try {
    const userId = req.user.id;
    const reviewId = req.params.id;
    const { response_text } = req.body;

    if (!response_text || !response_text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Response text is required'
      });
    }

    // Verify review is for this stylist (userId is from users table, need to get stylist id)
    const reviewCheck = await query(`
      SELECT r.id
      FROM reviews r
      INNER JOIN stylists s ON r.stylist_id = s.id
      WHERE r.id = $1 AND s.user_id = $2
    `, [reviewId, userId]);

    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or does not belong to you'
      });
    }

    // Update review with response
    const result = await query(`
      UPDATE reviews
      SET stylist_response = $1, stylist_response_date = NOW()
      WHERE id = $2
      RETURNING *
    `, [response_text, reviewId]);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Response added successfully'
    });
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding response'
    });
  }
});

/**
 * POST /api/reviews/:id/helpful
 * Mark review as helpful/not helpful
 */
router.post('/:id/helpful', async (req, res) => {
  try {
    const userId = req.user.id;
    const reviewId = req.params.id;
    const { is_helpful } = req.body;

    if (typeof is_helpful !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'is_helpful must be true or false'
      });
    }

    // Check if user already voted
    const existingVote = await query(`
      SELECT id, is_helpful FROM review_helpful_votes
      WHERE review_id = $1 AND user_id = $2
    `, [reviewId, userId]);

    if (existingVote.rows.length > 0) {
      // Update existing vote
      await query(`
        UPDATE review_helpful_votes
        SET is_helpful = $1, voted_at = NOW()
        WHERE review_id = $2 AND user_id = $3
      `, [is_helpful, reviewId, userId]);
    } else {
      // Create new vote
      await query(`
        INSERT INTO review_helpful_votes (review_id, user_id, is_helpful)
        VALUES ($1, $2, $3)
      `, [reviewId, userId, is_helpful]);
    }

    res.json({
      success: true,
      message: 'Vote recorded successfully'
    });
  } catch (error) {
    console.error('Error recording helpful vote:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording vote'
    });
  }
});

/**
 * POST /api/reviews/:id/flag
 * Flag a review for moderation
 */
router.post('/:id/flag', async (req, res) => {
  try {
    const userId = req.user.id;
    const reviewId = req.params.id;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Flag reason is required'
      });
    }

    await query(`
      UPDATE reviews
      SET is_flagged = true, flag_reason = $1, flagged_at = NOW(), flagged_by = $2
      WHERE id = $3
    `, [reason, userId, reviewId]);

    res.json({
      success: true,
      message: 'Review flagged for moderation'
    });
  } catch (error) {
    console.error('Error flagging review:', error);
    res.status(500).json({
      success: false,
      message: 'Error flagging review'
    });
  }
});

/**
 * GET /api/reviews/my-reviews
 * Get current user's reviews (as client)
 */
router.get('/my-reviews', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT
        r.*,
        st.business_name as stylist_name,
        NULL as stylist_photo,
        s.name as service_type,
        b.booking_date as appointment_date
      FROM reviews r
      INNER JOIN stylists st ON r.stylist_id = st.id
      INNER JOIN users u ON st.user_id = u.id
      INNER JOIN bookings b ON r.booking_id = b.id
      INNER JOIN services s ON b.service_id = s.id
      WHERE r.client_id = $1
      ORDER BY r.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews'
    });
  }
});

module.exports = router;