const express = require('express');
const router = express.Router();
const { query } = require('../db');
const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: '/var/www/beautycita.com/backend/logs/schedule.log' }),
    new winston.transports.Console()
  ]
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
 * GET /api/schedule/working-hours
 * Get stylist's working hours
 */
router.get('/working-hours', requireStylist, async (req, res) => {
  try {
    const stylistId = req.stylistId;

    const result = await query(
      'SELECT working_hours FROM stylists WHERE id = $1',
      [stylistId]
    );

    const workingHours = result.rows[0]?.working_hours || {
      monday: { open: '09:00', close: '17:00', isOpen: true },
      tuesday: { open: '09:00', close: '17:00', isOpen: true },
      wednesday: { open: '09:00', close: '17:00', isOpen: true },
      thursday: { open: '09:00', close: '17:00', isOpen: true },
      friday: { open: '09:00', close: '17:00', isOpen: true },
      saturday: { open: '10:00', close: '16:00', isOpen: true },
      sunday: { open: '10:00', close: '16:00', isOpen: false }
    };

    res.json({
      success: true,
      data: workingHours
    });
  } catch (error) {
    logger.error('Error fetching working hours:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch working hours' });
  }
});

/**
 * PUT /api/schedule/working-hours
 * Update stylist's working hours
 */
router.put('/working-hours', requireStylist, async (req, res) => {
  try {
    const stylistId = req.stylistId;
    const { workingHours } = req.body;

    if (!workingHours || typeof workingHours !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid working hours format'
      });
    }

    await query(
      'UPDATE stylists SET working_hours = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(workingHours), stylistId]
    );

    res.json({
      success: true,
      message: 'Working hours updated successfully',
      data: workingHours
    });

    logger.info('Working hours updated', { stylistId });
  } catch (error) {
    logger.error('Error updating working hours:', error);
    res.status(500).json({ success: false, message: 'Failed to update working hours' });
  }
});

/**
 * GET /api/schedule/time-off
 * Get all time-off periods for stylist
 */
router.get('/time-off', requireStylist, async (req, res) => {
  try {
    const stylistId = req.stylistId;

    const result = await query(
      `SELECT id, stylist_id, start_date, end_date, reason, created_at
       FROM time_off
       WHERE stylist_id = $1
       ORDER BY start_date DESC`,
      [stylistId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error fetching time-off:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch time-off periods' });
  }
});

/**
 * POST /api/schedule/time-off
 * Create a new time-off period
 */
router.post('/time-off', requireStylist, async (req, res) => {
  try {
    const stylistId = req.stylistId;
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    const result = await query(
      `INSERT INTO time_off (stylist_id, start_date, end_date, reason, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [stylistId, startDate, endDate, reason || '']
    );

    res.status(201).json({
      success: true,
      message: 'Time-off period created successfully',
      data: result.rows[0]
    });

    logger.info('Time-off created', { stylistId, startDate, endDate });
  } catch (error) {
    logger.error('Error creating time-off:', error);
    res.status(500).json({ success: false, message: 'Failed to create time-off period' });
  }
});

/**
 * DELETE /api/schedule/time-off/:id
 * Delete a time-off period
 */
router.delete('/time-off/:id', requireStylist, async (req, res) => {
  try {
    const { id } = req.params;
    const stylistId = req.stylistId;

    const result = await query(
      'DELETE FROM time_off WHERE id = $1 AND stylist_id = $2 RETURNING id',
      [id, stylistId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Time-off period not found' });
    }

    res.json({
      success: true,
      message: 'Time-off period deleted successfully'
    });

    logger.info('Time-off deleted', { stylistId, timeOffId: id });
  } catch (error) {
    logger.error('Error deleting time-off:', error);
    res.status(500).json({ success: false, message: 'Failed to delete time-off period' });
  }
});

/**
 * GET /api/schedule/availability/:date
 * Get available time slots for a specific date
 */
router.get('/availability/:date', requireStylist, async (req, res) => {
  try {
    const stylistId = req.stylistId;
    const { date } = req.params;

    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'lowercase' });

    // Get working hours
    const stylistResult = await query(
      'SELECT working_hours FROM stylists WHERE id = $1',
      [stylistId]
    );

    const workingHours = stylistResult.rows[0]?.working_hours || {};
    const dayHours = workingHours[dayOfWeek];

    if (!dayHours || !dayHours.isOpen) {
      return res.json({
        success: true,
        data: {
          isOpen: false,
          slots: []
        }
      });
    }

    // Check time-off
    const timeOffCheck = await query(
      `SELECT id FROM time_off
       WHERE stylist_id = $1
       AND $2::date BETWEEN start_date AND end_date`,
      [stylistId, date]
    );

    if (timeOffCheck.rows.length > 0) {
      return res.json({
        success: true,
        data: {
          isOpen: false,
          slots: [],
          reason: 'Time off'
        }
      });
    }

    // Get existing bookings for this date
    const bookingsResult = await query(
      `SELECT appointment_time, duration
       FROM bookings
       WHERE stylist_id = $1
       AND appointment_date = $2
       AND status IN ('PENDING', 'CONFIRMED')`,
      [stylistId, date]
    );

    // Generate time slots (30-minute intervals)
    const slots = [];
    const openTime = dayHours.open.split(':');
    const closeTime = dayHours.close.split(':');

    let currentHour = parseInt(openTime[0]);
    let currentMinute = parseInt(openTime[1]);
    const endHour = parseInt(closeTime[0]);
    const endMinute = parseInt(closeTime[1]);

    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const timeSlot = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

      // Check if slot is booked
      const isBooked = bookingsResult.rows.some(booking => {
        const bookingTime = booking.appointment_time.substring(0, 5);
        return bookingTime === timeSlot;
      });

      slots.push({
        time: timeSlot,
        available: !isBooked
      });

      // Increment by 30 minutes
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }
    }

    res.json({
      success: true,
      data: {
        isOpen: true,
        date,
        dayOfWeek,
        workingHours: dayHours,
        slots
      }
    });
  } catch (error) {
    logger.error('Error fetching availability:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch availability' });
  }
});

module.exports = router;
