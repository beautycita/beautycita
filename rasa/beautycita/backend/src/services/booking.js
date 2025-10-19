import { query, withTransaction } from './database.js';
import { v4 as uuidv4 } from 'uuid';

// Check stylist availability for a specific date and time
export async function checkAvailability(stylistId, date, startTime, durationMinutes) {
  const endTime = addMinutes(startTime, durationMinutes);

  // Check regular availability
  const dayOfWeek = new Date(date).getDay();

  const availabilityResult = await query(`
    SELECT * FROM availability
    WHERE stylist_id = $1
    AND day_of_week = $2
    AND is_active = true
    AND start_time <= $3
    AND end_time >= $4
  `, [stylistId, dayOfWeek, startTime, endTime]);

  if (availabilityResult.rows.length === 0) {
    return { available: false, reason: 'Outside working hours' };
  }

  // Check for exceptions (holidays, time off, etc.)
  const exceptionResult = await query(`
    SELECT * FROM availability_exceptions
    WHERE stylist_id = $1
    AND date = $2
  `, [stylistId, date]);

  if (exceptionResult.rows.length > 0) {
    const exception = exceptionResult.rows[0];
    if (!exception.is_available) {
      return { available: false, reason: 'Stylist unavailable on this date' };
    }

    // Check if the time falls within special availability
    if (exception.start_time && exception.end_time) {
      if (startTime < exception.start_time || endTime > exception.end_time) {
        return { available: false, reason: 'Outside special availability hours' };
      }
    }
  }

  // Check for conflicting bookings
  const bookingResult = await query(`
    SELECT b.*, s.duration_minutes, s.preparation_time_minutes, s.cleanup_time_minutes
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.stylist_id = $1
    AND b.appointment_date = $2
    AND b.status IN ('CONFIRMED', 'IN_PROGRESS')
    AND (
      (b.appointment_time, b.appointment_time + (s.duration_minutes + COALESCE(s.preparation_time_minutes, 0) + COALESCE(s.cleanup_time_minutes, 0)) * interval '1 minute')
      OVERLAPS
      ($3::time, $3::time + $4 * interval '1 minute')
    )
  `, [stylistId, date, startTime, durationMinutes]);

  if (bookingResult.rows.length > 0) {
    return { available: false, reason: 'Time slot already booked' };
  }

  return { available: true };
}

// Get available time slots for a stylist on a specific date
export async function getAvailableSlots(stylistId, date, serviceDuration = 60) {
  const dayOfWeek = new Date(date).getDay();

  // Get regular availability
  const availabilityResult = await query(`
    SELECT start_time, end_time FROM availability
    WHERE stylist_id = $1
    AND day_of_week = $2
    AND is_active = true
    ORDER BY start_time
  `, [stylistId, dayOfWeek]);

  if (availabilityResult.rows.length === 0) {
    return [];
  }

  // Check for exceptions
  const exceptionResult = await query(`
    SELECT * FROM availability_exceptions
    WHERE stylist_id = $1
    AND date = $2
  `, [stylistId, date]);

  let workingHours = availabilityResult.rows;

  if (exceptionResult.rows.length > 0) {
    const exception = exceptionResult.rows[0];
    if (!exception.is_available) {
      return [];
    }

    if (exception.start_time && exception.end_time) {
      workingHours = [{
        start_time: exception.start_time,
        end_time: exception.end_time
      }];
    }
  }

  // Get existing bookings
  const bookingsResult = await query(`
    SELECT b.appointment_time,
           s.duration_minutes + COALESCE(s.preparation_time_minutes, 0) + COALESCE(s.cleanup_time_minutes, 0) as total_duration
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.stylist_id = $1
    AND b.appointment_date = $2
    AND b.status IN ('CONFIRMED', 'IN_PROGRESS')
    ORDER BY b.appointment_time
  `, [stylistId, date]);

  const bookedSlots = bookingsResult.rows.map(booking => ({
    start: booking.appointment_time,
    end: addMinutes(booking.appointment_time, booking.total_duration)
  }));

  // Generate available slots
  const slots = [];

  for (const period of workingHours) {
    let currentTime = period.start_time;
    const endTime = period.end_time;

    while (addMinutes(currentTime, serviceDuration) <= endTime) {
      const slotEnd = addMinutes(currentTime, serviceDuration);

      // Check if this slot conflicts with any booking
      const hasConflict = bookedSlots.some(booking =>
        timeOverlaps(currentTime, slotEnd, booking.start, booking.end)
      );

      if (!hasConflict) {
        slots.push({
          time: currentTime,
          available: true
        });
      }

      // Move to next 30-minute slot
      currentTime = addMinutes(currentTime, 30);
    }
  }

  return slots;
}

// Create a new booking
export async function createBooking({
  clientId,
  stylistId,
  serviceId,
  appointmentDate,
  appointmentTime,
  notes,
  specialRequests
}) {
  return withTransaction(async (client) => {
    // Get service details
    const serviceResult = await client.query(`
      SELECT s.*, st.commission_rate
      FROM services s
      JOIN stylists st ON s.stylist_id = st.id
      WHERE s.id = $1 AND s.is_active = true
    `, [serviceId]);

    if (serviceResult.rows.length === 0) {
      throw new Error('Service not found or unavailable');
    }

    const service = serviceResult.rows[0];

    // Check availability
    const availability = await checkAvailability(
      stylistId,
      appointmentDate,
      appointmentTime,
      service.duration_minutes
    );

    if (!availability.available) {
      throw new Error(`Time slot not available: ${availability.reason}`);
    }

    // Calculate commission
    const commissionRate = service.commission_rate || 0.15;
    const commissionAmount = service.price * commissionRate;

    // Create booking
    const bookingId = uuidv4();
    const bookingResult = await client.query(`
      INSERT INTO bookings (
        id, client_id, stylist_id, service_id,
        appointment_date, appointment_time, duration_minutes,
        total_price, commission_rate, commission_amount,
        notes, special_requests, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      bookingId, clientId, stylistId, serviceId,
      appointmentDate, appointmentTime, service.duration_minutes,
      service.price, commissionRate, commissionAmount,
      notes, specialRequests, 'PENDING'
    ]);

    return bookingResult.rows[0];
  });
}

// Update booking status
export async function updateBookingStatus(bookingId, status, userId, userRole) {
  return withTransaction(async (client) => {
    // Verify user has permission to update this booking
    const bookingResult = await client.query(`
      SELECT b.*, c.user_id as client_user_id, s.user_id as stylist_user_id
      FROM bookings b
      LEFT JOIN clients c ON b.client_id = c.id
      LEFT JOIN stylists s ON b.stylist_id = s.id
      WHERE b.id = $1
    `, [bookingId]);

    if (bookingResult.rows.length === 0) {
      throw new Error('Booking not found');
    }

    const booking = bookingResult.rows[0];

    // Check permissions
    if (userRole !== 'ADMIN' &&
        userId !== booking.client_user_id &&
        userId !== booking.stylist_user_id) {
      throw new Error('Insufficient permissions to update this booking');
    }

    // Update booking
    const result = await client.query(`
      UPDATE bookings
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, bookingId]);

    // Update stylist statistics if booking is completed
    if (status === 'COMPLETED') {
      await client.query(`
        UPDATE stylists
        SET total_bookings = total_bookings + 1,
            total_revenue = total_revenue + $1
        WHERE id = $2
      `, [booking.total_price, booking.stylist_id]);
    }

    return result.rows[0];
  });
}

// Get bookings for a user
export async function getUserBookings(userId, userRole, filters = {}) {
  let whereClause = '';
  let joinClause = '';
  const params = [userId];

  if (userRole === 'CLIENT') {
    joinClause = 'JOIN clients c ON b.client_id = c.id';
    whereClause = 'WHERE c.user_id = $1';
  } else if (userRole === 'STYLIST') {
    joinClause = 'JOIN stylists s ON b.stylist_id = s.id';
    whereClause = 'WHERE s.user_id = $1';
  } else {
    throw new Error('Invalid user role for booking retrieval');
  }

  // Add status filter if provided
  if (filters.status) {
    whereClause += ` AND b.status = $${params.length + 1}`;
    params.push(filters.status);
  }

  // Add date range filter
  if (filters.startDate) {
    whereClause += ` AND b.appointment_date >= $${params.length + 1}`;
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    whereClause += ` AND b.appointment_date <= $${params.length + 1}`;
    params.push(filters.endDate);
  }

  const result = await query(`
    SELECT
      b.*,
      srv.name as service_name,
      srv.name_es as service_name_es,
      srv.duration_minutes,
      cu.first_name as client_first_name,
      cu.last_name as client_last_name,
      cu.email as client_email,
      cu.phone as client_phone,
      su.first_name as stylist_first_name,
      su.last_name as stylist_last_name,
      st.business_name as stylist_business_name,
      st.location_city as stylist_city
    FROM bookings b
    ${joinClause}
    LEFT JOIN services srv ON b.service_id = srv.id
    LEFT JOIN clients cl ON b.client_id = cl.id
    LEFT JOIN users cu ON cl.user_id = cu.id
    LEFT JOIN stylists st ON b.stylist_id = st.id
    LEFT JOIN users su ON st.user_id = su.id
    ${whereClause}
    ORDER BY b.appointment_date DESC, b.appointment_time DESC
    LIMIT $${params.length + 1}
  `, [...params, 50]);

  return result.rows;
}

// Helper functions
function addMinutes(time, minutes) {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}:00`;
}

function timeOverlaps(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}

export default {
  checkAvailability,
  getAvailableSlots,
  createBooking,
  updateBookingStatus,
  getUserBookings
};