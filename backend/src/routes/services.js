const express = require('express');
const router = express.Router();
const { query } = require('../db');
const winston = require('winston');
const cacheService = require('../services/cacheService');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: '/var/www/beautycita.com/backend/logs/services.log' }),
    new winston.transports.Console()
  ]
});

// Middleware to ensure user is a stylist
const requireStylist = async (req, res, next) => {
  try {
    // NULL CHECK: Ensure req.user exists before accessing properties
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

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

// ============================================================================
// PUBLIC ROUTES (NO AUTH REQUIRED) - Must come BEFORE parameterized routes
// ============================================================================

/**
 * GET /api/services
 * Public endpoint to get all active services with optional filters
 * CACHED for 30 minutes
 */
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;

    // Try to get from cache first
    const cached = await cacheService.getServices();
    if (cached && !category) {
      logger.info('✅ Services fetched from cache', { count: cached.length });
      return res.json({ success: true, data: cached, _cached: true });
    }

    let queryText = `
      SELECT
        s.id,
        s.name,
        s.description,
        s.price::text as price,
        s.duration_minutes,
        s.category,
        COALESCE(st.location_city, 'Mexico City') as location_city,
        COALESCE(st.location_state, 'CDMX') as location_state,
        COUNT(DISTINCT s.id) as stylist_count
      FROM services s
      LEFT JOIN stylists st ON s.stylist_id = st.id
      WHERE s.is_active = true
    `;
    const params = [];
    let paramCount = 1;

    // Add category filter if provided
    if (category) {
      queryText += ` AND s.category ILIKE $${paramCount++}`;
      params.push(`%${category}%`);
    }

    queryText += `
      GROUP BY s.id, s.name, s.description, s.price, s.duration_minutes, s.category,
               st.location_city, st.location_state
      ORDER BY stylist_count DESC, s.name
      LIMIT 100
    `;

    const result = await query(queryText, params);

    // Cache only non-filtered results
    if (!category) {
      await cacheService.cacheServices(result.rows);
      logger.info('📦 Services cached for 30 minutes');
    }

    res.json({ success: true, data: result.rows });

    logger.info('Public services fetched from DB', {
      count: result.rows.length,
      category: category || 'all'
    });
  } catch (error) {
    logger.error('Error fetching public services:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
});

/**
 * GET /api/services/categories/list
 * Get all service categories with localized names (PUBLIC)
 */
router.get('/categories/list', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, name_es, description, description_es, icon, sort_order as display_order, is_active
       FROM service_categories
       WHERE is_active = true
       ORDER BY sort_order, name`
    );

    res.json({
      success: true,
      data: result.rows
    });

    logger.info('Service categories fetched', { count: result.rows.length });
  } catch (error) {
    logger.error('Error fetching service categories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch service categories' });
  }
});

/**
 * GET /api/services/categories
 * Alias for /categories/list for backwards compatibility (PUBLIC)
 */
router.get('/categories', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, name_es, description, description_es, icon, sort_order as display_order, is_active
       FROM service_categories
       WHERE is_active = true
       ORDER BY sort_order, name`
    );

    res.json({
      success: true,
      data: result.rows
    });

    logger.info('Service categories fetched (via /categories)', { count: result.rows.length });
  } catch (error) {
    logger.error('Error fetching service categories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch service categories' });
  }
});

/**
 * GET /api/services/templates/browse
 * Get service templates (popular services to avoid duplication) (PUBLIC)
 */
router.get('/templates/browse', async (req, res) => {
  try {
    const { category, popular_only } = req.query;

    let queryText = `
      SELECT
        id, category, name, name_es, description, description_es,
        typical_duration_min, typical_duration_max,
        typical_price_min, typical_price_max,
        is_popular, usage_count
      FROM service_templates
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (category) {
      queryText += ` AND category = $${paramCount++}`;
      params.push(category);
    }

    if (popular_only === 'true') {
      queryText += ` AND is_popular = true`;
    }

    queryText += ` ORDER BY is_popular DESC, usage_count DESC, name_es`;

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows
    });

    logger.info('Service templates fetched', {
      count: result.rows.length,
      category: category || 'all'
    });
  } catch (error) {
    logger.error('Error fetching service templates:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch service templates' });
  }
});

// ============================================================================
// AUTHENTICATED ROUTES (REQUIRE STYLIST AUTH)
// ============================================================================

/**
 * GET /api/services/my-services
 * Get all services for the authenticated stylist
 */
router.get('/my-services', requireStylist, async (req, res) => {
  try {
    const stylistId = req.stylistId;

    const result = await query(
      `SELECT
        id, stylist_id, name, description, price, duration_minutes, category,
        is_active, created_at, updated_at
       FROM services
       WHERE stylist_id = $1
       ORDER BY category, name`,
      [stylistId]
    );

    res.json({
      success: true,
      data: result.rows
    });

    logger.info('Services fetched successfully', { stylistId, count: result.rows.length });
  } catch (error) {
    logger.error('Error fetching services:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
});

/**
 * POST /api/services
 * Create a new service (supports price ranges and consultation pricing)
 * Invalidates services cache
 */
router.post('/', requireStylist, async (req, res) => {
  try {
    const stylistId = req.stylistId;
    const {
      name,
      description,
      price,
      price_min,
      price_max,
      price_type = 'fixed',
      requires_consultation = false,
      duration_minutes,
      category,
      custom_category_name
    } = req.body;

    // Validation
    if (!name || !duration_minutes) {
      return res.status(400).json({
        success: false,
        message: 'Name and duration are required'
      });
    }

    // Validate pricing based on type
    if (price_type === 'fixed' && !price) {
      return res.status(400).json({
        success: false,
        message: 'Fixed price is required for fixed pricing type'
      });
    }

    if (price_type === 'range' && (!price_min || !price_max)) {
      return res.status(400).json({
        success: false,
        message: 'Price range (min and max) is required for range pricing type'
      });
    }

    if (price_type === 'range' && price_min > price_max) {
      return res.status(400).json({
        success: false,
        message: 'Minimum price cannot be greater than maximum price'
      });
    }

    if (duration_minutes < 0) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be a positive number'
      });
    }

    // Validate custom category if "Other" is selected
    if (category === 'Other' && !custom_category_name) {
      return res.status(400).json({
        success: false,
        message: 'Custom category name is required when category is "Other"'
      });
    }

    // Set pricing fields based on type
    let finalPrice = price || null;
    let finalPriceMin = price_min || null;
    let finalPriceMax = price_max || null;

    if (price_type === 'fixed' && price) {
      finalPriceMin = price;
      finalPriceMax = price;
    }

    // Set custom category status to pending if it's a custom category
    const customCategoryStatus = (category === 'Other' && custom_category_name) ? 'pending' : 'approved';

    const result = await query(
      `INSERT INTO services
        (stylist_id, name, description, price, price_min, price_max, price_type,
         requires_consultation, duration_minutes, category, custom_category_name,
         custom_category_status, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, NOW(), NOW())
       RETURNING *`,
      [stylistId, name, description || '', finalPrice, finalPriceMin, finalPriceMax,
       price_type, requires_consultation, duration_minutes, category || 'Otro',
       custom_category_name || null, customCategoryStatus]
    );

    // Invalidate services cache
    await cacheService.invalidateServices();
    logger.info('🗑️ Services cache invalidated after creation');

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: result.rows[0]
    });

    logger.info('Service created', {
      stylistId,
      serviceId: result.rows[0].id,
      name,
      priceType: price_type
    });
  } catch (error) {
    logger.error('Error creating service:', error);
    res.status(500).json({ success: false, message: 'Failed to create service' });
  }
});

/**
 * POST /api/services/from-template/:templateId
 * Create a service from a template
 */
router.post('/from-template/:templateId', requireStylist, async (req, res) => {
  try {
    const stylistId = req.stylistId;
    const { templateId } = req.params;
    const { price_min, price_max, duration_minutes, custom_description } = req.body;

    // Get template
    const templateResult = await query(
      'SELECT * FROM service_templates WHERE id = $1',
      [templateId]
    );

    if (templateResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const template = templateResult.rows[0];

    // Use template values or custom values
    const finalPriceMin = price_min || template.typical_price_min;
    const finalPriceMax = price_max || template.typical_price_max;
    const finalDuration = duration_minutes || template.typical_duration_min;
    const finalDescription = custom_description || template.description_es;

    // Determine price type
    const priceType = finalPriceMin === finalPriceMax ? 'fixed' : 'range';
    const price = priceType === 'fixed' ? finalPriceMin : null;

    // Create service
    const result = await query(
      `INSERT INTO services
        (stylist_id, name, description, price, price_min, price_max, price_type,
         duration_minutes, category, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
       RETURNING *`,
      [stylistId, template.name_es, finalDescription, price, finalPriceMin,
       finalPriceMax, priceType, finalDuration, template.category]
    );

    // Increment usage count on template
    await query(
      'UPDATE service_templates SET usage_count = usage_count + 1 WHERE id = $1',
      [templateId]
    );

    res.status(201).json({
      success: true,
      message: 'Service created from template successfully',
      data: result.rows[0]
    });

    logger.info('Service created from template', {
      stylistId,
      templateId,
      serviceId: result.rows[0].id
    });
  } catch (error) {
    logger.error('Error creating service from template:', error);
    res.status(500).json({ success: false, message: 'Failed to create service from template' });
  }
});

/**
 * PATCH /api/services/:id
 * Update an existing service
 */
router.patch('/:id', requireStylist, async (req, res) => {
  try {
    const { id } = req.params;
    const stylistId = req.stylistId;
    const { name, description, price, duration_minutes, category, custom_category_name, is_active } = req.body;

    // Check if service exists and belongs to this stylist
    const checkResult = await query(
      'SELECT id FROM services WHERE id = $1 AND stylist_id = $2',
      [id, stylistId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Validate custom category if "Other" is selected
    if (category === 'Other' && !custom_category_name) {
      return res.status(400).json({
        success: false,
        message: 'Custom category name is required when category is "Other"'
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (price !== undefined) {
      if (price < 0) {
        return res.status(400).json({ success: false, message: 'Price must be positive' });
      }
      updates.push(`price = $${paramCount++}`);
      values.push(price);
    }
    if (duration_minutes !== undefined) {
      if (duration_minutes < 0) {
        return res.status(400).json({ success: false, message: 'Duration must be positive' });
      }
      updates.push(`duration_minutes = $${paramCount++}`);
      values.push(duration_minutes);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);

      // Handle custom category changes
      if (category === 'Other' && custom_category_name) {
        updates.push(`custom_category_name = $${paramCount++}`);
        values.push(custom_category_name);
        updates.push(`custom_category_status = $${paramCount++}`);
        values.push('pending');
      } else {
        // Clear custom category if switching away from "Other"
        updates.push(`custom_category_name = NULL`);
        updates.push(`custom_category_status = $${paramCount++}`);
        values.push('approved');
      }
    } else if (custom_category_name !== undefined) {
      // If only custom_category_name is updated
      updates.push(`custom_category_name = $${paramCount++}`);
      values.push(custom_category_name);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id, stylistId);

    const result = await query(
      `UPDATE services SET ${updates.join(', ')}
       WHERE id = $${paramCount++} AND stylist_id = $${paramCount++}
       RETURNING *`,
      values
    );

    // Invalidate services cache
    await cacheService.invalidateServices();
    logger.info('🗑️ Services cache invalidated after update');

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: result.rows[0]
    });

    logger.info('Service updated', { stylistId, serviceId: id });
  } catch (error) {
    logger.error('Error updating service:', error);
    res.status(500).json({ success: false, message: 'Failed to update service' });
  }
});

/**
 * PUT /api/services/:id
 * Update a service (same as PATCH for compatibility)
 */
router.put('/:id', requireStylist, async (req, res) => {
  try {
    const { id } = req.params;
    const stylistId = req.stylistId;
    const { name, description, price, duration_minutes, category, custom_category_name, price_type, is_active } = req.body;

    // Check if service exists and belongs to this stylist
    const checkResult = await query(
      'SELECT id FROM services WHERE id = $1 AND stylist_id = $2',
      [id, stylistId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Validate custom category if "Other" is selected
    if (category === 'Other' && !custom_category_name) {
      return res.status(400).json({
        success: false,
        message: 'Custom category name is required when category is "Other"'
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (price !== undefined) {
      if (price < 0) {
        return res.status(400).json({ success: false, message: 'Price must be positive' });
      }
      updates.push(`price = $${paramCount++}`);
      values.push(price);
    }
    if (duration_minutes !== undefined) {
      if (duration_minutes < 0) {
        return res.status(400).json({ success: false, message: 'Duration must be positive' });
      }
      updates.push(`duration_minutes = $${paramCount++}`);
      values.push(duration_minutes);
    }
    if (price_type !== undefined) {
      updates.push(`price_type = $${paramCount++}`);
      values.push(price_type);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);

      // Handle custom category changes
      if (category === 'Other' && custom_category_name) {
        updates.push(`custom_category_name = $${paramCount++}`);
        values.push(custom_category_name);
        updates.push(`custom_category_status = $${paramCount++}`);
        values.push('pending');
      } else {
        // Clear custom category if switching away from "Other"
        updates.push(`custom_category_name = NULL`);
        updates.push(`custom_category_status = $${paramCount++}`);
        values.push('approved');
      }
    } else if (custom_category_name !== undefined) {
      // If only custom_category_name is updated
      updates.push(`custom_category_name = $${paramCount++}`);
      values.push(custom_category_name);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id, stylistId);

    const result = await query(
      `UPDATE services SET ${updates.join(', ')}
       WHERE id = $${paramCount++} AND stylist_id = $${paramCount++}
       RETURNING *`,
      values
    );

    // Invalidate services cache
    await cacheService.invalidateServices();
    logger.info('🗑️ Services cache invalidated after update');

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: result.rows[0]
    });

    logger.info('Service updated via PUT', { stylistId, serviceId: id });
  } catch (error) {
    logger.error('Error updating service via PUT:', error);
    res.status(500).json({ success: false, message: 'Failed to update service' });
  }
});

/**
 * DELETE /api/services/:id
 * Delete a service
 */
router.delete('/:id', requireStylist, async (req, res) => {
  try {
    const { id } = req.params;
    const stylistId = req.stylistId;

    // Check if service has any bookings
    const bookingsCheck = await query(
      'SELECT COUNT(*) as count FROM bookings WHERE service_id = $1',
      [id]
    );

    const bookingCount = parseInt(bookingsCheck.rows[0].count);

    if (bookingCount > 0) {
      // Don't delete, just deactivate
      await query(
        'UPDATE services SET is_active = false, updated_at = NOW() WHERE id = $1 AND stylist_id = $2',
        [id, stylistId]
      );

      return res.json({
        success: true,
        message: 'Service deactivated (has existing bookings)',
        deactivated: true
      });
    }

    // No bookings, safe to delete
    const result = await query(
      'DELETE FROM services WHERE id = $1 AND stylist_id = $2 RETURNING id',
      [id, stylistId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Invalidate services cache
    await cacheService.invalidateServices();
    logger.info('🗑️ Services cache invalidated after deletion');

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });

    logger.info('Service deleted', { stylistId, serviceId: id });
  } catch (error) {
    logger.error('Error deleting service:', error);
    res.status(500).json({ success: false, message: 'Failed to delete service' });
  }
});

// ============================================================================
// PARAMETERIZED ROUTES (MUST come LAST - catches /:id as last resort)
// ============================================================================

/**
 * GET /api/services/:id
 * Get a specific service by ID (requires auth)
 */
router.get('/:id', requireStylist, async (req, res) => {
  try {
    const { id } = req.params;
    const stylistId = req.stylistId;

    const result = await query(
      `SELECT * FROM services WHERE id = $1 AND stylist_id = $2`,
      [id, stylistId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error fetching service:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch service' });
  }
});

module.exports = router;
