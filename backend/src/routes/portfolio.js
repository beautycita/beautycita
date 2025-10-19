const express = require('express');
const router = express.Router();
const { query } = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for portfolio photo uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/portfolio');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const prefix = file.fieldname === 'before_photo' ? 'before' : 'after';
    cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
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
 * POST /api/portfolio
 * Create a new portfolio item (stylist only)
 */
router.post('/', upload.fields([
  { name: 'before_photo', maxCount: 1 },
  { name: 'after_photo', maxCount: 1 }
]), async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, service_category, service_id, tags } = req.body;

    if (!req.files?.before_photo || !req.files?.after_photo) {
      return res.status(400).json({
        success: false,
        message: 'Both before and after photos are required'
      });
    }

    // Get stylist ID from user ID
    const stylistCheck = await query(`
      SELECT id FROM stylists WHERE user_id = $1
    `, [userId]);

    if (stylistCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only stylists can create portfolio items'
      });
    }

    const stylistId = stylistCheck.rows[0].id;
    const beforePhotoUrl = `/uploads/portfolio/${req.files.before_photo[0].filename}`;
    const afterPhotoUrl = `/uploads/portfolio/${req.files.after_photo[0].filename}`;

    // Create portfolio item
    const result = await query(`
      INSERT INTO portfolio_items (
        stylist_id, before_photo_url, after_photo_url,
        title, description, service_category, service_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      stylistId, beforePhotoUrl, afterPhotoUrl,
      title || null, description || null,
      service_category || null, service_id || null
    ]);

    const portfolioItem = result.rows[0];

    // Add tags if provided
    if (tags) {
      const tagArray = typeof tags === 'string' ? tags.split(',') : tags;
      const tagPromises = tagArray.map(tag =>
        query(`
          INSERT INTO portfolio_tags (portfolio_item_id, tag)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [portfolioItem.id, tag.trim().toLowerCase()])
      );
      await Promise.all(tagPromises);
    }

    res.status(201).json({
      success: true,
      data: portfolioItem,
      message: 'Portfolio item created successfully'
    });
  } catch (error) {
    console.error('Error creating portfolio item:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating portfolio item'
    });
  }
});

/**
 * GET /api/portfolio/stylist/:stylistId
 * Get all portfolio items for a stylist (public)
 */
router.get('/stylist/:stylistId', async (req, res) => {
  try {
    const { stylistId } = req.params;
    const { page = 1, limit = 12, category, featured } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE p.stylist_id = $1 AND p.is_visible = true';
    const params = [stylistId, limit, offset];
    let paramCount = 3;

    if (category) {
      paramCount++;
      whereClause += ` AND p.service_category = $${paramCount}`;
      params.splice(paramCount - 1, 0, category);
    }

    if (featured === 'true') {
      whereClause += ' AND p.is_featured = true';
    }

    const result = await query(`
      SELECT
        p.*,
        COALESCE(
          json_agg(
            DISTINCT pt.tag
          ) FILTER (WHERE pt.tag IS NOT NULL),
          '[]'
        ) as tags
      FROM portfolio_items p
      LEFT JOIN portfolio_tags pt ON p.id = pt.portfolio_item_id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.is_featured DESC, p.display_order DESC, p.created_at DESC
      LIMIT $2 OFFSET $3
    `, params);

    // Get total count
    const countParams = category ? [stylistId, category] : [stylistId];
    const countWhere = category
      ? 'WHERE stylist_id = $1 AND is_visible = true AND service_category = $2'
      : 'WHERE stylist_id = $1 AND is_visible = true';

    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM portfolio_items
      ${countWhere}
    `, countParams);

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
    console.error('Error fetching portfolio items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching portfolio items'
    });
  }
});

/**
 * GET /api/portfolio/my-portfolio
 * Get current stylist's portfolio items
 */
router.get('/my-portfolio', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get stylist ID
    const stylistCheck = await query(`
      SELECT id FROM stylists WHERE user_id = $1
    `, [userId]);

    if (stylistCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only stylists can access portfolio'
      });
    }

    const stylistId = stylistCheck.rows[0].id;

    const result = await query(`
      SELECT
        p.*,
        COALESCE(
          json_agg(
            DISTINCT pt.tag
          ) FILTER (WHERE pt.tag IS NOT NULL),
          '[]'
        ) as tags
      FROM portfolio_items p
      LEFT JOIN portfolio_tags pt ON p.id = pt.portfolio_item_id
      WHERE p.stylist_id = $1
      GROUP BY p.id
      ORDER BY p.display_order DESC, p.created_at DESC
    `, [stylistId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching portfolio'
    });
  }
});

/**
 * PUT /api/portfolio/:id
 * Update portfolio item (stylist only, own items)
 */
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const portfolioId = req.params.id;
    const { title, description, service_category, service_id, is_featured, is_visible, display_order, tags } = req.body;

    // Get stylist ID and verify ownership
    const ownerCheck = await query(`
      SELECT p.id, p.stylist_id
      FROM portfolio_items p
      INNER JOIN stylists s ON p.stylist_id = s.id
      WHERE p.id = $1 AND s.user_id = $2
    `, [portfolioId, userId]);

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio item not found or does not belong to you'
      });
    }

    // Update portfolio item
    const result = await query(`
      UPDATE portfolio_items
      SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        service_category = COALESCE($3, service_category),
        service_id = COALESCE($4, service_id),
        is_featured = COALESCE($5, is_featured),
        is_visible = COALESCE($6, is_visible),
        display_order = COALESCE($7, display_order)
      WHERE id = $8
      RETURNING *
    `, [title, description, service_category, service_id, is_featured, is_visible, display_order, portfolioId]);

    // Update tags if provided
    if (tags !== undefined) {
      // Delete existing tags
      await query('DELETE FROM portfolio_tags WHERE portfolio_item_id = $1', [portfolioId]);

      // Add new tags
      if (tags && tags.length > 0) {
        const tagArray = typeof tags === 'string' ? tags.split(',') : tags;
        const tagPromises = tagArray.map(tag =>
          query(`
            INSERT INTO portfolio_tags (portfolio_item_id, tag)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `, [portfolioId, tag.trim().toLowerCase()])
        );
        await Promise.all(tagPromises);
      }
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Portfolio item updated successfully'
    });
  } catch (error) {
    console.error('Error updating portfolio item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating portfolio item'
    });
  }
});

/**
 * DELETE /api/portfolio/:id
 * Delete portfolio item (stylist only, own items)
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const portfolioId = req.params.id;

    // Verify ownership and get file paths
    const ownerCheck = await query(`
      SELECT p.id, p.before_photo_url, p.after_photo_url
      FROM portfolio_items p
      INNER JOIN stylists s ON p.stylist_id = s.id
      WHERE p.id = $1 AND s.user_id = $2
    `, [portfolioId, userId]);

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio item not found or does not belong to you'
      });
    }

    const item = ownerCheck.rows[0];

    // Delete from database (cascade will handle tags and likes)
    await query('DELETE FROM portfolio_items WHERE id = $1', [portfolioId]);

    // Delete photo files
    try {
      const beforePath = path.join(__dirname, '../..', item.before_photo_url);
      const afterPath = path.join(__dirname, '../..', item.after_photo_url);
      await Promise.all([
        fs.unlink(beforePath).catch(() => {}),
        fs.unlink(afterPath).catch(() => {})
      ]);
    } catch (fileError) {
      console.error('Error deleting files:', fileError);
    }

    res.json({
      success: true,
      message: 'Portfolio item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting portfolio item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting portfolio item'
    });
  }
});

/**
 * POST /api/portfolio/:id/like
 * Like/unlike a portfolio item
 */
router.post('/:id/like', async (req, res) => {
  try {
    const userId = req.user.id;
    const portfolioId = req.params.id;

    // Check if already liked
    const existingLike = await query(`
      SELECT id FROM portfolio_likes
      WHERE portfolio_item_id = $1 AND user_id = $2
    `, [portfolioId, userId]);

    if (existingLike.rows.length > 0) {
      // Unlike
      await query(`
        DELETE FROM portfolio_likes
        WHERE portfolio_item_id = $1 AND user_id = $2
      `, [portfolioId, userId]);

      res.json({
        success: true,
        liked: false,
        message: 'Portfolio item unliked'
      });
    } else {
      // Like
      await query(`
        INSERT INTO portfolio_likes (portfolio_item_id, user_id)
        VALUES ($1, $2)
      `, [portfolioId, userId]);

      res.json({
        success: true,
        liked: true,
        message: 'Portfolio item liked'
      });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling like'
    });
  }
});

/**
 * POST /api/portfolio/:id/view
 * Increment view count (public)
 */
router.post('/:id/view', async (req, res) => {
  try {
    const portfolioId = req.params.id;

    await query(`
      UPDATE portfolio_items
      SET view_count = view_count + 1
      WHERE id = $1
    `, [portfolioId]);

    res.json({
      success: true,
      message: 'View recorded'
    });
  } catch (error) {
    console.error('Error recording view:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording view'
    });
  }
});

/**
 * GET /api/portfolio/public/:username
 * Get full stylist portfolio by username (public endpoint)
 */
router.get('/public/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // Get stylist data with user info
    const stylistResult = await query(`
      SELECT
        u.username,
        u.first_name,
        u.last_name,
        u.profile_picture_url,
        s.id as stylist_id,
        s.business_name,
        s.bio,
        s.brand_story,
        s.specialties,
        s.signature_styles,
        s.experience_years,
        s.location_city,
        s.location_state,
        s.location_address,
        s.portfolio_images,
        s.portfolio_theme,
        s.portfolio_published,
        s.social_media_links,
        s.rating_average,
        s.rating_count,
        s.total_bookings,
        s.is_verified,
        s.salon_phone
      FROM users u
      INNER JOIN stylists s ON u.id = s.user_id
      WHERE u.username = $1 AND u.role = 'STYLIST'
    `, [username]);

    if (stylistResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stylist not found'
      });
    }

    const stylist = stylistResult.rows[0];

    // Check if portfolio is published
    if (!stylist.portfolio_published) {
      return res.status(403).json({
        success: false,
        message: 'Portfolio is not published'
      });
    }

    // Increment portfolio views
    await query(`
      UPDATE stylists
      SET portfolio_views = portfolio_views + 1
      WHERE id = $1
    `, [stylist.stylist_id]);

    // Get services
    const servicesResult = await query(`
      SELECT id, name, description, duration_minutes as duration, price
      FROM services
      WHERE stylist_id = $1 AND is_active = true
      ORDER BY name
    `, [stylist.stylist_id]);

    // Get recent reviews (top 6)
    const reviewsResult = await query(`
      SELECT
        r.id,
        u.first_name || ' ' || LEFT(u.last_name, 1) || '.' as client_name,
        r.rating,
        r.review_text as comment,
        r.created_at
      FROM reviews r
      INNER JOIN users u ON r.client_id = u.id
      WHERE r.stylist_id = $1 AND r.is_approved = true AND r.is_visible = true
      ORDER BY r.created_at DESC
      LIMIT 6
    `, [stylist.stylist_id]);

    // Format response
    const portfolio = {
      username: stylist.username,
      firstName: stylist.first_name,
      lastName: stylist.last_name,
      profilePicture: stylist.profile_picture_url,
      businessName: stylist.business_name,
      bio: stylist.bio,
      brandStory: stylist.brand_story,
      specialties: stylist.specialties || [],
      signatureStyles: stylist.signature_styles || [],
      experienceYears: stylist.experience_years || 0,
      locationCity: stylist.location_city,
      locationState: stylist.location_state,
      locationAddress: stylist.location_address,
      portfolioImages: stylist.portfolio_images || [],
      portfolioTheme: stylist.portfolio_theme || 'minimal',
      portfolioPublished: stylist.portfolio_published,
      socialMediaLinks: stylist.social_media_links || {},
      ratingAverage: parseFloat(stylist.rating_average) || 0,
      ratingCount: stylist.rating_count || 0,
      totalBookings: stylist.total_bookings || 0,
      isVerified: stylist.is_verified || false,
      salonPhone: stylist.salon_phone,
      services: servicesResult.rows,
      recentReviews: reviewsResult.rows
    };

    res.json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    console.error('Error fetching public portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching portfolio'
    });
  }
});

module.exports = router;