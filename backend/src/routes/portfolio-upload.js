const express = require('express');
const router = express.Router();
const multer = require('multer');
const { query } = require('../db');
const { uploadImage, deleteImage } = require('../config/r2');
const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: '/var/www/beautycita.com/backend/logs/portfolio.log' }),
    new winston.transports.Console()
  ]
});

// Configure multer for memory storage (we'll upload to Cloudinary directly)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  }
});

// Middleware to ensure user is a stylist
const requireStylist = async (req, res, next) => {
  try {
    if (req.user.role !== 'STYLIST' && req.user.role !== 'ADMIN' && req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ success: false, message: 'Stylist access required' });
    }

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
 * GET /api/portfolio/my-images
 * Get all portfolio images for the authenticated stylist
 */
router.get('/my-images', requireStylist, async (req, res) => {
  try {
    const stylistId = req.stylistId;

    const result = await query(
      `SELECT id, image_url, title, description, service_category, is_featured,
              display_order, cloudinary_public_id, created_at
       FROM portfolio_items
       WHERE stylist_id = $1
       ORDER BY display_order ASC, created_at DESC`,
      [stylistId]
    );

    res.json({
      success: true,
      data: result.rows
    });

    logger.info('Portfolio images fetched', { stylistId, count: result.rows.length });
  } catch (error) {
    logger.error('Error fetching portfolio images:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch portfolio images' });
  }
});

/**
 * POST /api/portfolio/upload
 * Upload a new portfolio image
 */
router.post('/upload', requireStylist, upload.single('image'), async (req, res) => {
  try {
    const stylistId = req.stylistId;
    const { title, description, service_category, is_featured } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Convert buffer to base64 for Cloudinary
    const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Upload to Cloudinary
    const uploadResult = await uploadImage(
      fileBase64,
      `portfolio/stylist-${stylistId}`,
      null // Let Cloudinary generate public_id
    );

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image to cloud storage',
        error: uploadResult.error
      });
    }

    // Get current max display_order
    const orderResult = await query(
      'SELECT COALESCE(MAX(display_order), 0) as max_order FROM portfolio_items WHERE stylist_id = $1',
      [stylistId]
    );
    const nextOrder = parseInt(orderResult.rows[0].max_order) + 1;

    // Save to database
    const result = await query(
      `INSERT INTO portfolio_items
        (stylist_id, image_url, title, description, service_category, is_featured,
         display_order, cloudinary_public_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [
        stylistId,
        uploadResult.url,
        title || '',
        description || '',
        service_category || null,
        is_featured === 'true' || is_featured === true,
        nextOrder,
        uploadResult.publicId
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Portfolio image uploaded successfully',
      data: result.rows[0]
    });

    logger.info('Portfolio image uploaded', {
      stylistId,
      imageId: result.rows[0].id,
      cloudinaryId: uploadResult.publicId
    });
  } catch (error) {
    logger.error('Error uploading portfolio image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload portfolio image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PATCH /api/portfolio/:id
 * Update portfolio image details
 */
router.patch('/:id', requireStylist, async (req, res) => {
  try {
    const { id } = req.params;
    const stylistId = req.stylistId;
    const { title, description, service_category, is_featured, display_order } = req.body;

    // Check if portfolio item exists and belongs to this stylist
    const checkResult = await query(
      'SELECT id FROM portfolio_items WHERE id = $1 AND stylist_id = $2',
      [id, stylistId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (service_category !== undefined) {
      updates.push(`service_category = $${paramCount++}`);
      values.push(service_category);
    }
    if (is_featured !== undefined) {
      updates.push(`is_featured = $${paramCount++}`);
      values.push(is_featured);
    }
    if (display_order !== undefined) {
      updates.push(`display_order = $${paramCount++}`);
      values.push(parseInt(display_order));
    }

    updates.push(`updated_at = NOW()`);
    values.push(id, stylistId);

    const result = await query(
      `UPDATE portfolio_items SET ${updates.join(', ')}
       WHERE id = $${paramCount++} AND stylist_id = $${paramCount++}
       RETURNING *`,
      values
    );

    res.json({
      success: true,
      message: 'Portfolio image updated successfully',
      data: result.rows[0]
    });

    logger.info('Portfolio image updated', { stylistId, imageId: id });
  } catch (error) {
    logger.error('Error updating portfolio image:', error);
    res.status(500).json({ success: false, message: 'Failed to update portfolio image' });
  }
});

/**
 * DELETE /api/portfolio/:id
 * Delete a portfolio image
 */
router.delete('/:id', requireStylist, async (req, res) => {
  try {
    const { id } = req.params;
    const stylistId = req.stylistId;

    // Get portfolio item to delete from Cloudinary
    const itemResult = await query(
      'SELECT cloudinary_public_id FROM portfolio_items WHERE id = $1 AND stylist_id = $2',
      [id, stylistId]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' });
    }

    const cloudinaryPublicId = itemResult.rows[0].cloudinary_public_id;

    // Delete from Cloudinary if public_id exists
    if (cloudinaryPublicId) {
      const deleteResult = await deleteImage(cloudinaryPublicId);
      if (!deleteResult.success) {
        logger.warn('Failed to delete image from Cloudinary', {
          publicId: cloudinaryPublicId,
          error: deleteResult.error
        });
        // Continue with database deletion even if Cloudinary delete fails
      }
    }

    // Delete from database
    await query(
      'DELETE FROM portfolio_items WHERE id = $1 AND stylist_id = $2',
      [id, stylistId]
    );

    res.json({
      success: true,
      message: 'Portfolio image deleted successfully'
    });

    logger.info('Portfolio image deleted', { stylistId, imageId: id });
  } catch (error) {
    logger.error('Error deleting portfolio image:', error);
    res.status(500).json({ success: false, message: 'Failed to delete portfolio image' });
  }
});

/**
 * PATCH /api/portfolio/reorder
 * Reorder portfolio images
 */
router.patch('/reorder', requireStylist, async (req, res) => {
  try {
    const stylistId = req.stylistId;
    const { imageIds } = req.body; // Array of IDs in desired order

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image IDs array'
      });
    }

    // Update display_order for each image
    for (let i = 0; i < imageIds.length; i++) {
      await query(
        'UPDATE portfolio_items SET display_order = $1 WHERE id = $2 AND stylist_id = $3',
        [i + 1, imageIds[i], stylistId]
      );
    }

    res.json({
      success: true,
      message: 'Portfolio images reordered successfully'
    });

    logger.info('Portfolio images reordered', { stylistId, count: imageIds.length });
  } catch (error) {
    logger.error('Error reordering portfolio images:', error);
    res.status(500).json({ success: false, message: 'Failed to reorder portfolio images' });
  }
});

module.exports = router;
