import express from 'express';
import { body, param, query as queryValidator } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import { requireRole } from '../middleware/auth.js';
import { query } from '../services/database.js';
import {
  checkAvailability,
  getAvailableSlots,
  createBooking,
  updateBookingStatus,
  getUserBookings
} from '../services/booking.js';

const router = express.Router();

// Validation schemas
const createBookingValidation = [
  body('stylistId')
    .isUUID()
    .withMessage('Valid stylist ID is required'),
  body('serviceId')
    .isUUID()
    .withMessage('Valid service ID is required'),
  body('appointmentDate')
    .isISO8601()
    .toDate()
    .withMessage('Valid appointment date is required'),
  body('appointmentTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid appointment time is required (HH:MM format)'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  body('specialRequests')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Special requests must not exceed 500 characters')
];

const updateBookingValidation = [
  param('id')
    .isUUID()
    .withMessage('Valid booking ID is required'),
  body('status')
    .isIn(['CONFIRMED', 'CANCELLED', 'COMPLETED', 'IN_PROGRESS', 'NO_SHOW'])
    .withMessage('Valid status is required')
];

// Check availability for a specific time slot
router.get('/availability/:stylistId/:date/:time/:duration',
  param('stylistId').isUUID().withMessage('Valid stylist ID is required'),
  param('date').isISO8601().withMessage('Valid date is required'),
  param('time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time is required'),
  param('duration').isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes'),
  validateRequest,
  async (req, res, next) => {
    try {
      const { stylistId, date, time, duration } = req.params;

      const availability = await checkAvailability(
        stylistId,
        date,
        time + ':00',
        parseInt(duration)
      );

      res.json(availability);

    } catch (error) {
      next(error);
    }
  }
);

// Get available time slots for a stylist on a specific date
router.get('/slots/:stylistId/:date',
  param('stylistId').isUUID().withMessage('Valid stylist ID is required'),
  param('date').isISO8601().withMessage('Valid date is required'),
  queryValidator('duration').optional().isInt({ min: 15, max: 480 }),
  validateRequest,
  async (req, res, next) => {
    try {
      const { stylistId, date } = req.params;
      const duration = parseInt(req.query.duration) || 60;

      const slots = await getAvailableSlots(stylistId, date, duration);

      res.json({
        date,
        stylistId,
        serviceDuration: duration,
        availableSlots: slots
      });

    } catch (error) {
      next(error);
    }
  }
);

// Create a new booking (clients only)
router.post('/',
  requireRole('CLIENT'),
  createBookingValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const { stylistId, serviceId, appointmentDate, appointmentTime, notes, specialRequests } = req.body;

      // Get client ID from user
      const clientResult = await query(`
        SELECT id FROM clients WHERE user_id = $1
      `, [req.user.id]);

      if (clientResult.rows.length === 0) {
        return res.status(400).json({
          error: 'Client profile not found',
          code: 'CLIENT_NOT_FOUND'
        });
      }

      const clientId = clientResult.rows[0].id;

      const booking = await createBooking({
        clientId,
        stylistId,
        serviceId,
        appointmentDate,
        appointmentTime: appointmentTime + ':00',
        notes,
        specialRequests
      });

      res.status(201).json({
        message: 'Booking created successfully',
        booking
      });

    } catch (error) {
      if (error.message.includes('not available')) {
        return res.status(409).json({
          error: error.message,
          code: 'TIME_NOT_AVAILABLE'
        });
      }
      next(error);
    }
  }
);

// Get user's bookings
router.get('/',
  queryValidator('status').optional().isIn(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  queryValidator('startDate').optional().isISO8601(),
  queryValidator('endDate').optional().isISO8601(),
  validateRequest,
  async (req, res, next) => {
    try {
      const filters = {
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const bookings = await getUserBookings(req.user.id, req.user.role, filters);

      res.json({
        bookings,
        count: bookings.length
      });

    } catch (error) {
      next(error);
    }
  }
);

// Get specific booking
router.get('/:id',
  param('id').isUUID().withMessage('Valid booking ID is required'),
  validateRequest,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Get booking with permission check
      let whereClause = 'WHERE b.id = $1';
      let params = [id];

      if (req.user.role === 'CLIENT') {
        whereClause += ' AND c.user_id = $2';
        params.push(req.user.id);
      } else if (req.user.role === 'STYLIST') {
        whereClause += ' AND s.user_id = $2';
        params.push(req.user.id);
      }

      const result = await query(`
        SELECT
          b.*,
          srv.name as service_name,
          srv.name_es as service_name_es,
          srv.duration_minutes,
          srv.price,
          cu.first_name as client_first_name,
          cu.last_name as client_last_name,
          cu.email as client_email,
          cu.phone as client_phone,
          su.first_name as stylist_first_name,
          su.last_name as stylist_last_name,
          st.business_name as stylist_business_name,
          st.location_address as stylist_address,
          st.location_city as stylist_city
        FROM bookings b
        LEFT JOIN clients c ON b.client_id = c.id
        LEFT JOIN users cu ON c.user_id = cu.id
        LEFT JOIN stylists st ON b.stylist_id = st.id
        LEFT JOIN users su ON st.user_id = su.id
        LEFT JOIN services srv ON b.service_id = srv.id
        ${whereClause}
      `, params);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        });
      }

      res.json(result.rows[0]);

    } catch (error) {
      next(error);
    }
  }
);

// Update booking status
router.patch('/:id/status',
  updateBookingValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const booking = await updateBookingStatus(id, status, req.user.id, req.user.role);

      res.json({
        message: 'Booking status updated successfully',
        booking
      });

    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: error.message,
          code: 'BOOKING_NOT_FOUND'
        });
      }
      if (error.message.includes('Insufficient permissions')) {
        return res.status(403).json({
          error: error.message,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
      next(error);
    }
  }
);

// Cancel booking
router.patch('/:id/cancel',
  param('id').isUUID().withMessage('Valid booking ID is required'),
  body('reason').optional().trim().isLength({ max: 500 }),
  validateRequest,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      // Update booking with cancellation reason
      const result = await query(`
        UPDATE bookings
        SET status = 'CANCELLED',
            cancellation_reason = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        AND (
          (SELECT user_id FROM clients WHERE id = client_id) = $3
          OR (SELECT user_id FROM stylists WHERE id = stylist_id) = $3
          OR $4 = 'ADMIN'
        )
        RETURNING *
      `, [id, reason, req.user.id, req.user.role]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Booking not found or insufficient permissions',
          code: 'BOOKING_NOT_FOUND'
        });
      }

      res.json({
        message: 'Booking cancelled successfully',
        booking: result.rows[0]
      });

    } catch (error) {
      next(error);
    }
  }
);

export default router;