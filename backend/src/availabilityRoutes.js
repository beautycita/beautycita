const express = require('express');
const router = express.Router();

// Get stylist availability
router.get('/stylist/:stylistId', async (req, res) => {
  try {
    const { stylistId } = req.params;
    const { startDate, endDate } = req.query;

    const { query } = req.app.locals;

    // Get stylist availability for date range
    let availabilityQuery = `
      SELECT
        sa.*,
        s.user_id
      FROM stylist_availability sa
      JOIN stylists s ON sa.stylist_id = s.id
      WHERE sa.stylist_id = $1
    `;

    const params = [stylistId];

    if (startDate && endDate) {
      availabilityQuery += ` AND sa.date BETWEEN $2 AND $3`;
      params.push(startDate, endDate);
    } else if (startDate) {
      availabilityQuery += ` AND sa.date >= $2`;
      params.push(startDate);
    }

    availabilityQuery += ` ORDER BY sa.date, sa.start_time`;

    const availabilityResult = await query(availabilityQuery, params);

    // Also get bookings for the same period to show what's already booked
    let bookingsQuery = `
      SELECT
        b.id,
        b.service_id,
        b.booking_date,
        b.booking_time,
        b.status,
        s.duration_minutes,
        s.name as service_name,
        u.name as client_name
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.client_id = u.id
      WHERE s.stylist_id = $1
      AND b.status IN ('confirmed', 'pending')
    `;

    const bookingParams = [stylistId];

    if (startDate && endDate) {
      bookingsQuery += ` AND b.booking_date BETWEEN $2 AND $3`;
      bookingParams.push(startDate, endDate);
    } else if (startDate) {
      bookingsQuery += ` AND b.booking_date >= $2`;
      bookingParams.push(startDate);
    }

    bookingsQuery += ` ORDER BY b.booking_date, b.booking_time`;

    const bookingsResult = await query(bookingsQuery, bookingParams);

    res.json({
      success: true,
      availability: availabilityResult.rows,
      bookings: bookingsResult.rows
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch availability'
    });
  }
});

// Update availability
router.post('/update', async (req, res) => {
  try {
    const { stylistId, date, startTime, endTime, isAvailable, reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { query } = req.app.locals;

    // Verify the user owns this stylist account
    const ownerCheck = await query(
      'SELECT id FROM stylists WHERE id = $1 AND user_id = $2',
      [stylistId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this availability'
      });
    }

    // Check if availability exists for this date/time
    const existingCheck = await query(
      'SELECT id FROM stylist_availability WHERE stylist_id = $1 AND date = $2 AND start_time = $3',
      [stylistId, date, startTime]
    );

    let result;
    if (existingCheck.rows.length > 0) {
      // Update existing
      result = await query(
        `UPDATE stylist_availability
         SET end_time = $1, is_available = $2, reason = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [endTime, isAvailable, reason, existingCheck.rows[0].id]
      );
    } else {
      // Insert new
      result = await query(
        `INSERT INTO stylist_availability (stylist_id, date, start_time, end_time, is_available, reason)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [stylistId, date, startTime, endTime, isAvailable, reason]
      );
    }

    res.json({
      success: true,
      availability: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update availability'
    });
  }
});

// Bulk update availability (for selecting multiple slots)
router.post('/bulk-update', async (req, res) => {
  try {
    const { stylistId, slots } = req.body; // slots is array of {date, startTime, endTime, isAvailable}
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { query } = req.app.locals;

    // Verify ownership
    const ownerCheck = await query(
      'SELECT id FROM stylists WHERE id = $1 AND user_id = $2',
      [stylistId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const results = [];

    for (const slot of slots) {
      const { date, startTime, endTime, isAvailable, reason } = slot;

      // Check if exists
      const existingCheck = await query(
        'SELECT id FROM stylist_availability WHERE stylist_id = $1 AND date = $2 AND start_time = $3',
        [stylistId, date, startTime]
      );

      let result;
      if (existingCheck.rows.length > 0) {
        result = await query(
          `UPDATE stylist_availability
           SET end_time = $1, is_available = $2, reason = $3, updated_at = CURRENT_TIMESTAMP
           WHERE id = $4
           RETURNING *`,
          [endTime, isAvailable, reason || null, existingCheck.rows[0].id]
        );
      } else {
        result = await query(
          `INSERT INTO stylist_availability (stylist_id, date, start_time, end_time, is_available, reason)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [stylistId, date, startTime, endTime, isAvailable, reason || null]
        );
      }

      results.push(result.rows[0]);
    }

    res.json({
      success: true,
      updated: results.length,
      availability: results
    });
  } catch (error) {
    console.error('Error bulk updating availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update availability'
    });
  }
});

// Delete availability
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { query } = req.app.locals;

    // Verify ownership
    const ownerCheck = await query(
      `SELECT sa.id
       FROM stylist_availability sa
       JOIN stylists s ON sa.stylist_id = s.id
       WHERE sa.id = $1 AND s.user_id = $2`,
      [id, userId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this availability'
      });
    }

    await query('DELETE FROM stylist_availability WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Availability deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete availability'
    });
  }
});

// Get weekly availability pattern (for recurring schedules)
router.get('/pattern/:stylistId', async (req, res) => {
  try {
    const { stylistId } = req.params;
    const { query } = req.app.locals;

    // Get the most common pattern from the last 4 weeks
    const patternQuery = `
      SELECT
        EXTRACT(DOW FROM date) as day_of_week,
        start_time,
        end_time,
        COUNT(*) as frequency
      FROM stylist_availability
      WHERE stylist_id = $1
      AND date >= CURRENT_DATE - INTERVAL '28 days'
      AND is_available = true
      GROUP BY EXTRACT(DOW FROM date), start_time, end_time
      ORDER BY day_of_week, start_time
    `;

    const result = await query(patternQuery, [stylistId]);

    // Group by day of week
    const pattern = {};
    result.rows.forEach(row => {
      const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][row.day_of_week];
      if (!pattern[day]) {
        pattern[day] = [];
      }
      pattern[day].push({
        startTime: row.start_time,
        endTime: row.end_time,
        frequency: row.frequency
      });
    });

    res.json({
      success: true,
      pattern
    });
  } catch (error) {
    console.error('Error fetching availability pattern:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch availability pattern'
    });
  }
});

// Get recurring weekly availability pattern for a stylist
router.get('/stylist/:stylistId/recurring', async (req, res) => {
  try {
    const { stylistId } = req.params;
    const { query } = req.app.locals;

    // Get recurring availability pattern (deduplicated by day_of_week and time)
    const recurringQuery = `
      SELECT
        EXTRACT(DOW FROM date)::integer as day_of_week,
        start_time,
        end_time,
        COUNT(*) as frequency
      FROM stylist_availability
      WHERE stylist_id = $1
      AND date >= CURRENT_DATE - INTERVAL '7 days'
      AND is_available = true
      GROUP BY EXTRACT(DOW FROM date), start_time, end_time
      HAVING COUNT(*) >= 1
      ORDER BY day_of_week, start_time
    `;

    const result = await query(recurringQuery, [stylistId]);

    res.json({
      success: true,
      availability: result.rows
    });
  } catch (error) {
    console.error('Error fetching recurring availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recurring availability'
    });
  }
});

// Set recurring weekly availability pattern
router.post('/stylist/:stylistId/recurring', async (req, res) => {
  try {
    const { stylistId } = req.params;
    const { availability } = req.body; // array of {day_of_week, start_time, end_time}
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { query } = req.app.locals;

    // Verify ownership
    const ownerCheck = await query(
      'SELECT id FROM stylists WHERE id = $1 AND user_id = $2',
      [stylistId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Generate availability slots for next 90 days based on recurring pattern
    const slots = [];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 90);

    for (const pattern of availability) {
      const { day_of_week, start_time, end_time, slot_duration = 30, buffer_time = 0 } = pattern;

      // Generate slots for each matching day in the next 90 days
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        if (date.getDay() === day_of_week) {
          const dateStr = date.toISOString().split('T')[0];

          // Check if slot already exists
          const existingCheck = await query(
            'SELECT id FROM stylist_availability WHERE stylist_id = $1 AND date = $2 AND start_time = $3',
            [stylistId, dateStr, start_time]
          );

          if (existingCheck.rows.length === 0) {
            await query(
              `INSERT INTO stylist_availability (stylist_id, date, start_time, end_time, is_available)
               VALUES ($1, $2, $3, $4, true)`,
              [stylistId, dateStr, start_time, end_time]
            );
            slots.push({ date: dateStr, start_time, end_time });
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Recurring availability set successfully',
      slotsCreated: slots.length
    });
  } catch (error) {
    console.error('Error setting recurring availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set recurring availability'
    });
  }
});

// Get time-off periods for a stylist
router.get('/stylist/:stylistId/time-off', async (req, res) => {
  try {
    const { stylistId } = req.params;
    const { query } = req.app.locals;

    const timeOffQuery = `
      SELECT id, start_date, end_date, reason, created_at
      FROM time_off
      WHERE stylist_id = $1
      AND end_date >= CURRENT_DATE
      ORDER BY start_date
    `;

    const result = await query(timeOffQuery, [stylistId]);

    res.json({
      success: true,
      timeOff: result.rows
    });
  } catch (error) {
    console.error('Error fetching time off:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch time off'
    });
  }
});

// Add time-off period
router.post('/stylist/:stylistId/time-off', async (req, res) => {
  try {
    const { stylistId } = req.params;
    const { start_date, end_date, reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Start and end dates are required' });
    }

    const { query } = req.app.locals;

    // Verify ownership
    const ownerCheck = await query(
      'SELECT id FROM stylists WHERE id = $1 AND user_id = $2',
      [stylistId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Insert time-off
    const result = await query(
      `INSERT INTO time_off (stylist_id, start_date, end_date, reason)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [stylistId, start_date, end_date, reason || null]
    );

    // Mark all availability slots in this range as unavailable
    await query(
      `UPDATE stylist_availability
       SET is_available = false, reason = $1
       WHERE stylist_id = $2
       AND date BETWEEN $3 AND $4`,
      [reason || 'Time Off', stylistId, start_date, end_date]
    );

    res.json({
      success: true,
      timeOff: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding time off:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add time off'
    });
  }
});

// Delete time-off period
router.delete('/stylist/:stylistId/time-off/:timeOffId', async (req, res) => {
  try {
    const { stylistId, timeOffId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { query } = req.app.locals;

    // Verify ownership
    const ownerCheck = await query(
      `SELECT t.id, t.start_date, t.end_date
       FROM time_off t
       JOIN stylists s ON t.stylist_id = s.id
       WHERE t.id = $1 AND s.id = $2 AND s.user_id = $3`,
      [timeOffId, stylistId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const timeOff = ownerCheck.rows[0];

    // Delete time-off
    await query('DELETE FROM time_off WHERE id = $1', [timeOffId]);

    // Re-enable availability slots in this range (if they were blocked due to this time-off)
    await query(
      `UPDATE stylist_availability
       SET is_available = true, reason = null
       WHERE stylist_id = $1
       AND date BETWEEN $2 AND $3
       AND reason = 'Time Off'`,
      [stylistId, timeOff.start_date, timeOff.end_date]
    );

    res.json({
      success: true,
      message: 'Time off deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting time off:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete time off'
    });
  }
});

module.exports = router;