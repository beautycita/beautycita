import express from 'express';
import { body, param, query as queryValidator } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import { requireRole, optionalAuth } from '../middleware/auth.js';
import { query } from '../services/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get service categories
router.get('/categories',
  optionalAuth,
  async (req, res, next) => {
    try {
      const result = await query(`
        SELECT
          id, name, name_es, description, description_es,
          icon, sort_order,
          (
            SELECT COUNT(*) FROM services s
            JOIN stylists st ON s.stylist_id = st.id
            WHERE s.category_id = sc.id
            AND s.is_active = true
            AND st.is_verified = true
            AND st.is_accepting_bookings = true
          ) as active_services_count
        FROM service_categories sc
        WHERE is_active = true
        ORDER BY sort_order, name
      `);

      res.json(result.rows);

    } catch (error) {
      next(error);
    }
  }
);

// Search services
router.get('/',
  queryValidator('category').optional().isUUID(),
  queryValidator('city').optional().trim(),
  queryValidator('minPrice').optional().isFloat({ min: 0 }),
  queryValidator('maxPrice').optional().isFloat({ min: 0 }),
  queryValidator('search').optional().trim(),
  queryValidator('sortBy').optional().isIn(['price', 'rating', 'popularity']),
  queryValidator('page').optional().isInt({ min: 1 }),
  queryValidator('limit').optional().isInt({ min: 1, max: 50 }),
  validateRequest,
  optionalAuth,
  async (req, res, next) => {
    try {
      const {
        category, city, minPrice, maxPrice, search,
        sortBy = 'rating', page = 1, limit = 20
      } = req.query;

      const offset = (page - 1) * limit;
      const conditions = ['s.is_active = true', 'st.is_verified = true', 'st.is_accepting_bookings = true'];
      const params = [];
      let paramIndex = 1;

      // Build WHERE conditions
      if (category) {
        conditions.push(`s.category_id = $${paramIndex++}`);
        params.push(category);
      }

      if (city) {
        conditions.push(`LOWER(st.location_city) LIKE LOWER($${paramIndex++})`);
        params.push(`%${city}%`);
      }

      if (minPrice) {
        conditions.push(`s.price >= $${paramIndex++}`);
        params.push(minPrice);
      }

      if (maxPrice) {
        conditions.push(`s.price <= $${paramIndex++}`);
        params.push(maxPrice);
      }

      if (search) {
        conditions.push(`(
          LOWER(s.name) LIKE LOWER($${paramIndex++}) OR
          LOWER(s.name_es) LIKE LOWER($${paramIndex}) OR
          LOWER(s.description) LIKE LOWER($${paramIndex}) OR
          LOWER(s.description_es) LIKE LOWER($${paramIndex}) OR
          LOWER(st.business_name) LIKE LOWER($${paramIndex})
        )`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Build ORDER BY clause
      let orderBy = 'ORDER BY ';
      switch (sortBy) {
        case 'price':
          orderBy += 's.price ASC';
          break;
        case 'popularity':
          orderBy += 'st.total_bookings DESC, st.rating_average DESC';
          break;
        default:
          orderBy += 'st.rating_average DESC, st.rating_count DESC';
      }

      // Add pagination parameters
      params.push(limit, offset);

      const result = await query(`
        SELECT
          s.id,
          s.name,
          s.name_es,
          s.description,
          s.description_es,
          s.duration_minutes,
          s.price,
          s.is_addon,
          s.requires_consultation,
          sc.name as category_name,
          sc.name_es as category_name_es,
          sc.icon as category_icon,
          st.id as stylist_id,
          st.business_name,
          st.location_city,
          st.location_state,
          st.pricing_tier,
          st.rating_average,
          st.rating_count,
          u.first_name as stylist_first_name,
          u.last_name as stylist_last_name,
          u.profile_picture_url as stylist_photo
        FROM services s
        JOIN service_categories sc ON s.category_id = sc.id
        JOIN stylists st ON s.stylist_id = st.id
        JOIN users u ON st.user_id = u.id
        WHERE ${conditions.join(' AND ')}
        ${orderBy}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `, params);

      // Get total count for pagination
      const countResult = await query(`
        SELECT COUNT(*) as total
        FROM services s
        JOIN stylists st ON s.stylist_id = st.id
        WHERE ${conditions.join(' AND ')}
      `, params.slice(0, -2)); // Remove limit and offset from params

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      res.json({
        services: result.rows,
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

// Get stylist's services (for stylist dashboard)
router.get('/my-services',
  requireRole('STYLIST'),
  async (req, res, next) => {
    try {
      const result = await query(`
        SELECT
          s.*,
          sc.name as category_name,
          sc.name_es as category_name_es,
          sc.icon as category_icon,
          (
            SELECT COUNT(*) FROM bookings b
            WHERE b.service_id = s.id
            AND b.status = 'COMPLETED'
          ) as total_bookings
        FROM services s
        JOIN service_categories sc ON s.category_id = sc.id
        JOIN stylists st ON s.stylist_id = st.id
        WHERE st.user_id = $1
        ORDER BY s.created_at DESC
      `, [req.user.id]);

      res.json(result.rows);

    } catch (error) {
      next(error);
    }
  }
);

// Create new service (stylists only)
router.post('/',
  requireRole('STYLIST'),
  body('categoryId').isUUID().withMessage('Valid category ID is required'),
  body('name').trim().isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters'),
  body('nameEs').trim().isLength({ min: 2, max: 255 }).withMessage('Spanish name must be between 2 and 255 characters'),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('descriptionEs').optional().trim().isLength({ max: 1000 }),
  body('durationMinutes').isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes'),
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  body('isAddon').optional().isBoolean(),
  body('requiresConsultation').optional().isBoolean(),
  body('preparationTimeMinutes').optional().isInt({ min: 0, max: 60 }),
  body('cleanupTimeMinutes').optional().isInt({ min: 0, max: 60 }),
  validateRequest,
  async (req, res, next) => {
    try {
      const {
        categoryId, name, nameEs, description, descriptionEs,
        durationMinutes, price, isAddon, requiresConsultation,
        preparationTimeMinutes, cleanupTimeMinutes
      } = req.body;

      // Get stylist ID
      const stylistResult = await query(`
        SELECT id FROM stylists WHERE user_id = $1
      `, [req.user.id]);

      if (stylistResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Stylist profile not found',
          code: 'STYLIST_NOT_FOUND'
        });
      }

      const stylistId = stylistResult.rows[0].id;

      // Verify category exists
      const categoryResult = await query(`
        SELECT id FROM service_categories WHERE id = $1 AND is_active = true
      `, [categoryId]);

      if (categoryResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Service category not found',
          code: 'CATEGORY_NOT_FOUND'
        });
      }

      // Create service
      const serviceId = uuidv4();
      const result = await query(`
        INSERT INTO services (
          id, stylist_id, category_id, name, name_es,
          description, description_es, duration_minutes, price,
          is_addon, requires_consultation, preparation_time_minutes,
          cleanup_time_minutes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        serviceId, stylistId, categoryId, name, nameEs,
        description, descriptionEs, durationMinutes, price,
        isAddon || false, requiresConsultation || false,
        preparationTimeMinutes || 0, cleanupTimeMinutes || 0
      ]);

      res.status(201).json({
        message: 'Service created successfully',
        service: result.rows[0]
      });

    } catch (error) {
      next(error);
    }
  }
);

// Update service (stylists only)
router.patch('/:id',
  requireRole('STYLIST'),
  param('id').isUUID().withMessage('Valid service ID is required'),
  body('categoryId').optional().isUUID(),
  body('name').optional().trim().isLength({ min: 2, max: 255 }),
  body('nameEs').optional().trim().isLength({ min: 2, max: 255 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('descriptionEs').optional().trim().isLength({ max: 1000 }),
  body('durationMinutes').optional().isInt({ min: 15, max: 480 }),
  body('price').optional().isFloat({ min: 0.01 }),
  body('isAddon').optional().isBoolean(),
  body('requiresConsultation').optional().isBoolean(),
  body('preparationTimeMinutes').optional().isInt({ min: 0, max: 60 }),
  body('cleanupTimeMinutes').optional().isInt({ min: 0, max: 60 }),
  body('isActive').optional().isBoolean(),
  validateRequest,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        categoryId, name, nameEs, description, descriptionEs,
        durationMinutes, price, isAddon, requiresConsultation,
        preparationTimeMinutes, cleanupTimeMinutes, isActive
      } = req.body;

      // Verify service belongs to the stylist
      const serviceResult = await query(`
        SELECT s.*, st.user_id
        FROM services s
        JOIN stylists st ON s.stylist_id = st.id
        WHERE s.id = $1
      `, [id]);

      if (serviceResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Service not found',
          code: 'SERVICE_NOT_FOUND'
        });
      }

      if (serviceResult.rows[0].user_id !== req.user.id) {
        return res.status(403).json({
          error: 'Not authorized to update this service',
          code: 'UNAUTHORIZED'
        });
      }

      // Build update query
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (categoryId !== undefined) {
        updates.push(`category_id = $${paramIndex++}`);
        values.push(categoryId);
      }
      if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      if (nameEs !== undefined) {
        updates.push(`name_es = $${paramIndex++}`);
        values.push(nameEs);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
      }
      if (descriptionEs !== undefined) {
        updates.push(`description_es = $${paramIndex++}`);
        values.push(descriptionEs);
      }
      if (durationMinutes !== undefined) {
        updates.push(`duration_minutes = $${paramIndex++}`);
        values.push(durationMinutes);
      }
      if (price !== undefined) {
        updates.push(`price = $${paramIndex++}`);
        values.push(price);
      }
      if (isAddon !== undefined) {
        updates.push(`is_addon = $${paramIndex++}`);
        values.push(isAddon);
      }
      if (requiresConsultation !== undefined) {
        updates.push(`requires_consultation = $${paramIndex++}`);
        values.push(requiresConsultation);
      }
      if (preparationTimeMinutes !== undefined) {
        updates.push(`preparation_time_minutes = $${paramIndex++}`);
        values.push(preparationTimeMinutes);
      }
      if (cleanupTimeMinutes !== undefined) {
        updates.push(`cleanup_time_minutes = $${paramIndex++}`);
        values.push(cleanupTimeMinutes);
      }
      if (isActive !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        values.push(isActive);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update',
          code: 'NO_UPDATES'
        });
      }

      values.push(id);

      const result = await query(`
        UPDATE services
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);

      res.json({
        message: 'Service updated successfully',
        service: result.rows[0]
      });

    } catch (error) {
      next(error);
    }
  }
);

// Delete service (stylists only)
router.delete('/:id',
  requireRole('STYLIST'),
  param('id').isUUID().withMessage('Valid service ID is required'),
  validateRequest,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Verify service belongs to the stylist and check for active bookings
      const serviceResult = await query(`
        SELECT s.*, st.user_id,
        (
          SELECT COUNT(*) FROM bookings b
          WHERE b.service_id = s.id
          AND b.status IN ('PENDING', 'CONFIRMED')
        ) as active_bookings
        FROM services s
        JOIN stylists st ON s.stylist_id = st.id
        WHERE s.id = $1
      `, [id]);

      if (serviceResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Service not found',
          code: 'SERVICE_NOT_FOUND'
        });
      }

      const service = serviceResult.rows[0];

      if (service.user_id !== req.user.id) {
        return res.status(403).json({
          error: 'Not authorized to delete this service',
          code: 'UNAUTHORIZED'
        });
      }

      if (service.active_bookings > 0) {
        return res.status(409).json({
          error: 'Cannot delete service with active bookings',
          code: 'HAS_ACTIVE_BOOKINGS'
        });
      }

      // Soft delete (deactivate instead of hard delete)
      await query(`
        UPDATE services
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [id]);

      res.json({
        message: 'Service deleted successfully'
      });

    } catch (error) {
      next(error);
    }
  }
);

export default router;