const express = require('express');
const { query } = require('./db');
const SMSService = require('./smsService');
const emailService = require('./emailService');
const { distributeBookingPayment } = require('./creditRoutes');
const EmailNotifications = require("./emailNotifications");
const { requirePhoneVerification } = require('./middleware/phoneVerification');

const router = express.Router();
const smsService = new SMSService();

// Create a new booking request (CLIENT → STYLIST)
router.post('/create', requirePhoneVerification, async (req, res) => {
  try {
    const {
      clientId,
      stylistId,
      serviceId,
      bookingDate,
      bookingTime,
      notes = '',
      clientLocation = {}
    } = req.body;

    // Validate required fields
    const errors = {};
    if (!clientId) errors.clientId = 'Client ID is required';
    if (!stylistId) errors.stylistId = 'Stylist ID is required';
    if (!serviceId) errors.serviceId = 'Service ID is required';
    if (!bookingDate) errors.bookingDate = 'Booking date is required';
    if (!bookingTime) errors.bookingTime = 'Booking time is required';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // Get service details for pricing
    const serviceResult = await query(`
      SELECT s.*, st.business_name, u.first_name as stylist_name
      FROM services s
      JOIN stylists st ON s.stylist_id = st.id
      JOIN users u ON st.user_id = u.id
      WHERE s.id = $1 AND s.is_active = true
    `, [serviceId]);

    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found or inactive' });
    }

    const service = serviceResult.rows[0];

    // Verify stylist exists and is active
    const stylistCheck = await query(`
      SELECT u.id, u.phone, u.first_name, s.business_name, s.id as stylist_id
      FROM users u
      JOIN stylists s ON u.id = s.user_id
      WHERE s.id = $1 AND u.role = 'STYLIST' AND u.is_active = true
    `, [stylistId]);

    if (stylistCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Stylist not found or inactive' });
    }

    // Verify client exists
    const clientCheck = await query(`
      SELECT id, phone, first_name, last_name
      FROM users
      WHERE id = $1 AND role = 'CLIENT' AND is_active = true
    `, [clientId]);

    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found or inactive' });
    }

    const client = clientCheck.rows[0];
    const stylist = stylistCheck.rows[0];

    // Calculate expiration times
    const now = new Date();
    const requestExpiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

    // Calculate total price (service price + any platform calculation)
    const totalPriceCents = Math.round(service.price * 100); // Convert to cents

    // Create booking in PENDING status
    const newBooking = await query(`
      INSERT INTO bookings (
        client_id, stylist_id, service_id, booking_date, booking_time,
        duration_minutes, status, total_price, notes,
        request_expires_at, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, status, request_expires_at, created_at
    `, [
      clientId,
      stylistId,
      serviceId,
      bookingDate,
      bookingTime,
      service.duration_minutes,
      'PENDING',
      service.price,
      notes,
      requestExpiresAt,
      now,
      now
    ]);

    const booking = newBooking.rows[0];

    // Send SMS notification to stylist about new booking request
    const serviceDetails = {
      service_name: service.name,
      appointment_date: `${bookingDate} at ${bookingTime}`,
      client_name: `${client.first_name} ${client.last_name}`,
      duration: service.duration_minutes,
      price: service.price
    };

    const smsResult = await smsService.sendBookingRequest(
      stylistId,
      clientId,
      booking.id,
      serviceDetails
    );

    // Log booking creation
    console.log(`Booking created: ID ${booking.id}, expires at ${requestExpiresAt}`);

    // Send email confirmation to client and stylist
    EmailNotifications.sendBookingConfirmation(booking.id).catch(err => {
      console.error('Failed to send booking confirmation emails:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Booking request sent to stylist',
      booking: {
        id: booking.id,
        status: booking.status,
        expiresAt: booking.request_expires_at,
        service: {
          name: service.name,
          duration: service.duration_minutes,
          price: service.price
        },
        stylist: {
          name: stylist.business_name || stylist.first_name,
          phone: stylist.phone
        }
      },
      smsDelivered: smsResult.success
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Stylist accepts booking request (PENDING → VERIFY_ACCEPTANCE)
router.post('/:bookingId/accept', requirePhoneVerification, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { stylistId } = req.body;

    if (!stylistId) {
      return res.status(400).json({ error: 'Stylist ID is required' });
    }

    // Get booking details and verify it's pending and not expired
    const bookingResult = await query(`
      SELECT b.*, s.name as service_name, s.price, s.duration_minutes,
             c.first_name as client_first_name, c.last_name as client_last_name, c.phone as client_phone,
             st.business_name, u.first_name as stylist_name
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users c ON b.client_id = c.id
      JOIN stylists st ON b.stylist_id = st.id
      JOIN users u ON st.user_id = u.id
      WHERE b.id = $1 AND b.stylist_id = $2
    `, [bookingId, stylistId]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or unauthorized' });
    }

    const booking = bookingResult.rows[0];

    // Check if booking is still pending and not expired
    if (booking.status !== 'PENDING') {
      return res.status(400).json({
        error: `Booking is ${booking.status.toLowerCase()}, cannot accept`
      });
    }

    const now = new Date();
    if (booking.request_expires_at && new Date(booking.request_expires_at) < now) {
      // Mark as expired
      await query(`
        UPDATE bookings
        SET status = 'EXPIRED', last_status_change = $1
        WHERE id = $2
      `, [now, bookingId]);

      return res.status(400).json({ error: 'Booking request has expired' });
    }

    // Update booking to VERIFY_ACCEPTANCE status with 10-minute client confirmation window
    const acceptanceExpiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

    await query(`
      UPDATE bookings
      SET status = 'VERIFY_ACCEPTANCE',
          acceptance_expires_at = $1,
          last_status_change = $2,
          updated_at = $3
      WHERE id = $4
    `, [acceptanceExpiresAt, now, now, bookingId]);

    // Send confirmation SMS to client
    const serviceDetails = {
      service_name: booking.service_name,
      appointment_date: `${booking.booking_date} at ${booking.booking_time}`,
      stylist_name: booking.business_name || booking.stylist_name
    };

    await smsService.sendBookingConfirmation(
      booking.client_id,
      stylistId,
      bookingId,
      serviceDetails
    );

    console.log(`Booking accepted: ID ${bookingId}, client has until ${acceptanceExpiresAt} to confirm`);

    res.json({
      success: true,
      message: 'Booking accepted! Client has 10 minutes to confirm payment.',
      booking: {
        id: bookingId,
        status: 'VERIFY_ACCEPTANCE',
        clientConfirmationExpiresAt: acceptanceExpiresAt,
        service: serviceDetails
      }
    });

  } catch (error) {
    console.error('Booking acceptance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Client confirms booking after payment (VERIFY_ACCEPTANCE → CONFIRMED)
router.post('/:bookingId/confirm', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { clientId, paymentIntentId } = req.body;

    if (!clientId || !paymentIntentId) {
      return res.status(400).json({ error: 'Client ID and payment intent ID are required' });
    }

    // Get booking details
    const bookingResult = await query(`
      SELECT b.*, s.name as service_name, s.price
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE b.id = $1 AND b.client_id = $2
    `, [bookingId, clientId]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or unauthorized' });
    }

    const booking = bookingResult.rows[0];

    // Check if booking is in correct status and not expired
    if (booking.status !== 'VERIFY_ACCEPTANCE') {
      return res.status(400).json({
        error: `Booking is ${booking.status.toLowerCase()}, cannot confirm`
      });
    }

    const now = new Date();
    if (booking.acceptance_expires_at && new Date(booking.acceptance_expires_at) < now) {
      // Mark as expired
      await query(`
        UPDATE bookings
        SET status = 'EXPIRED', last_status_change = $1
        WHERE id = $2
      `, [now, bookingId]);

      return res.status(400).json({ error: 'Booking confirmation window has expired' });
    }

    // Update booking to CONFIRMED status
    await query(`
      UPDATE bookings
      SET status = 'CONFIRMED',
          confirmed_at = $1,
          last_status_change = $2,
          updated_at = $3
      WHERE id = $4
    `, [now, now, now, bookingId]);

    // Create payment record
    await query(`
      INSERT INTO payments (
        booking_id, stripe_payment_intent_id, amount, platform_fee, stylist_payout,
        status, processed_at, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      bookingId,
      paymentIntentId,
      booking.total_price,
      booking.total_price * 0.03, // 3% platform fee
      booking.total_price * 0.97, // 97% to stylist
      'SUCCEEDED',
      now,
      now,
      now
    ]);

    console.log(`Booking confirmed: ID ${bookingId}, payment processed`);

    res.json({
      success: true,
      message: 'Booking confirmed and payment processed!',
      booking: {
        id: bookingId,
        status: 'CONFIRMED',
        confirmedAt: now,
        service: {
          name: booking.service_name,
          price: booking.total_price
        }
      }
    });

  } catch (error) {
    console.error('Booking confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user's bookings
router.get('/mine', async (req, res) => {
  try {
    const { userId, role } = req.query;

    if (!userId || !role) {
      return res.status(400).json({ error: 'User ID and role are required' });
    }

    let bookingsQuery;
    let queryParams = [userId];

    if (role === 'CLIENT') {
      bookingsQuery = `
        SELECT b.*, s.name as service_name, s.duration_minutes,
               st.business_name, u.first_name as stylist_name, u.phone as stylist_phone
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        JOIN stylists st ON b.stylist_id = st.id
        JOIN users u ON st.user_id = u.id
        WHERE b.client_id = $1
        ORDER BY b.created_at DESC
      `;
    } else if (role === 'STYLIST') {
      bookingsQuery = `
        SELECT b.*, s.name as service_name, s.duration_minutes,
               c.first_name as client_first_name, c.last_name as client_last_name, c.phone as client_phone
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        JOIN users c ON b.client_id = c.id
        WHERE b.stylist_id = $1
        ORDER BY b.created_at DESC
      `;
    } else {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const result = await query(bookingsQuery, queryParams);

    res.json({
      success: true,
      bookings: result.rows
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Cancel booking with time-based constraints
router.post('/:bookingId/cancel', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { userId, reason = 'Cancelled by user' } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get booking details with user roles
    const bookingResult = await query(`
      SELECT b.*,
             s.name as service_name,
             u_client.role as client_role,
             u_stylist.role as stylist_role
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      LEFT JOIN users u_client ON b.client_id = u_client.id
      LEFT JOIN stylists st ON b.stylist_id = st.id
      LEFT JOIN users u_stylist ON st.user_id = u_stylist.id
      WHERE b.id = $1 AND (b.client_id = $2 OR st.user_id = $3)
    `, [bookingId, userId, userId]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or unauthorized' });
    }

    const booking = bookingResult.rows[0];

    // Check if booking can be cancelled
    if (['CANCELLED', 'COMPLETED', 'EXPIRED'].includes(booking.status)) {
      return res.status(400).json({
        error: `Cannot cancel booking that is ${booking.status.toLowerCase()}`
      });
    }

    const now = new Date();

    // Calculate time until booking
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
    const hoursUntilBooking = (bookingDateTime - now) / (1000 * 60 * 60);

    // Determine if user is client or stylist
    const isClient = booking.client_id === parseInt(userId);
    const isStylist = !isClient;

    // Apply cancellation policy
    let canCancel = true;
    let policyMessage = '';

    if (isClient) {
      // Clients must cancel at least 12 hours before
      if (hoursUntilBooking < 12) {
        canCancel = false;
        policyMessage = 'Clients must cancel at least 12 hours before the appointment. Payment will be retained.';
      }
    } else if (isStylist) {
      // Stylists must cancel at least 3 hours before
      if (hoursUntilBooking < 3) {
        canCancel = false;
        policyMessage = 'Stylists must cancel at least 3 hours before the appointment.';
      }
    }

    // Allow cancellation override for admin users or special cases
    const forceCancel = req.body.forceCancel === true && req.user?.role === 'admin';

    if (!canCancel && !forceCancel) {
      return res.status(403).json({
        error: 'Cancellation not allowed',
        message: policyMessage,
        hoursUntilBooking: hoursUntilBooking.toFixed(1),
        bookingTime: bookingDateTime
      });
    }

    // Update booking status
    await query(`
      UPDATE bookings
      SET status = 'CANCELLED',
          cancellation_reason = $1,
          cancelled_by = $2,
          cancelled_at = $3,
          last_status_change = $4,
          updated_at = $5
      WHERE id = $6
    `, [reason, userId, now, now, now, bookingId]);

    // Handle payment and refund logic
    let refundStatus = null;
    if (booking.status === 'CONFIRMED') {
      // Check if payment exists
      const paymentResult = await query(`
        SELECT * FROM payments
        WHERE booking_id = $1 AND status = 'COMPLETED'
      `, [bookingId]);

      if (paymentResult.rows.length > 0) {
        const payment = paymentResult.rows[0];

        // Determine refund policy
        if (isClient && hoursUntilBooking < 12) {
          // Client cancelled late - payment retained, refund on request only
          await query(`
            UPDATE payments
            SET status = 'RETAINED',
                updated_at = $1
            WHERE id = $2
          `, [now, payment.id]);

          refundStatus = 'Payment retained - late cancellation. Refund available on request.';
        } else {
          // Eligible for automatic refund (stylist cancel or early client cancel)
          await query(`
            UPDATE payments
            SET status = 'PENDING_REFUND',
                refund_reason = $1,
                updated_at = $2
            WHERE id = $3
          `, [reason, now, payment.id]);

          refundStatus = 'Refund will be processed automatically within 3-5 business days.';
        }
      }
    }

    // Send cancellation notifications
    const otherUserId = booking.client_id === parseInt(userId) ? booking.stylist_id : booking.client_id;
    await smsService.sendCancellationNotification(
      otherUserId,
      bookingId,
      reason,
      booking.client_id === parseInt(userId) ? 'client' : 'stylist'
    );

    console.log(`Booking cancelled: ID ${bookingId} by user ${userId}`);

    // Send cancellation email to client and stylist
    EmailNotifications.sendCancellationNotice(bookingId, userId).catch(err => {
      console.error('Failed to send cancellation emails:', err);
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: {
        id: bookingId,
        status: 'CANCELLED',
        cancelledAt: now,
        reason: reason,
        refundStatus: refundStatus
      },
      cancellationPolicy: {
        wasLateCancel: isClient && hoursUntilBooking < 12,
        hoursBeforeBooking: hoursUntilBooking.toFixed(1)
      }
    });

  } catch (error) {
    console.error('Booking cancellation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get available time slots for a stylist on a specific date
router.get('/stylists/:stylistId/availability', async (req, res) => {
  try {
    const { stylistId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    // Verify stylist exists and is active
    const stylistCheck = await query(`
      SELECT u.id, s.id as stylist_id
      FROM users u
      JOIN stylists s ON u.id = s.user_id
      WHERE s.id = $1 AND u.role = 'STYLIST' AND u.is_active = true
    `, [stylistId]);

    if (stylistCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Stylist not found or inactive' });
    }

    // Get existing bookings for this stylist on this date
    const existingBookings = await query(`
      SELECT booking_time, duration_minutes
      FROM bookings
      WHERE stylist_id = $1
        AND booking_date = $2
        AND status IN ('PENDING', 'VERIFY_ACCEPTANCE', 'CONFIRMED')
      ORDER BY booking_time
    `, [stylistId, date]);

    // Generate all possible time slots (9:00 AM to 6:00 PM in 30-minute intervals)
    const allSlots = [];
    const startHour = 9; // 9 AM
    const endHour = 18; // 6 PM

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minutes = 0; minutes < 60; minutes += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        allSlots.push(timeStr);
      }
    }

    // Filter out booked slots
    const bookedSlots = new Set();

    existingBookings.rows.forEach(booking => {
      const bookingTime = booking.booking_time;
      const duration = booking.duration_minutes || 60; // Default 60 minutes if not specified

      // Calculate how many 30-minute slots this booking occupies
      const slotsNeeded = Math.ceil(duration / 30);

      // Find the index of the booking time
      const bookingIndex = allSlots.indexOf(bookingTime);

      if (bookingIndex !== -1) {
        // Mark this slot and subsequent slots as booked
        for (let i = 0; i < slotsNeeded && (bookingIndex + i) < allSlots.length; i++) {
          bookedSlots.add(allSlots[bookingIndex + i]);
        }
      }
    });

    // Return available slots (excluding booked ones)
    const availableSlots = allSlots.filter(slot => !bookedSlots.has(slot));

    // If the requested date is today, filter out past time slots
    const requestedDate = new Date(date);
    const today = new Date();

    let finalSlots = availableSlots;

    if (requestedDate.toDateString() === today.toDateString()) {
      const currentHour = today.getHours();
      const currentMinutes = today.getMinutes();

      finalSlots = availableSlots.filter(slot => {
        const [slotHour, slotMinutes] = slot.split(':').map(Number);
        const slotTotalMinutes = slotHour * 60 + slotMinutes;
        const currentTotalMinutes = currentHour * 60 + currentMinutes;

        // Only show slots that are at least 1 hour in the future
        return slotTotalMinutes > currentTotalMinutes + 60;
      });
    }

    // Get service price for slot pricing (if serviceId provided)
    let servicePrice = null;
    if (req.query.serviceId) {
      const serviceResult = await query('SELECT price FROM services WHERE id = $1', [req.query.serviceId]);
      if (serviceResult.rows.length > 0) {
        servicePrice = parseFloat(serviceResult.rows[0].price);
      }
    }

    // Transform to TimeSlotPicker expected format
    const formattedSlots = finalSlots.map(time => ({
      time,
      available: true,
      price: servicePrice
    }));

    res.json({
      success: true,
      slots: formattedSlots, // New format for frontend
      data: finalSlots,       // Keep old format for backward compatibility
      date: date,
      stylistId: stylistId,
      totalSlots: finalSlots.length
    });

  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available slots',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});
// Monthly availability heatmap for calendar
router.get('/stylists/:stylistId/availability/month', async (req, res) => {
  try {
    const { stylistId } = req.params;
    const { startDate, endDate, serviceId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate parameters are required'
      });
    }

    // Verify stylist exists and is active
    const stylistCheck = await query(`
      SELECT u.id, s.id as stylist_id
      FROM users u
      JOIN stylists s ON u.id = s.user_id
      WHERE s.id = $1 AND u.role = 'STYLIST' AND u.is_active = true
    `, [stylistId]);

    if (stylistCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stylist not found or inactive'
      });
    }

    // Get all bookings for this stylist in the date range
    const bookings = await query(`
      SELECT booking_date, booking_time, duration_minutes
      FROM bookings
      WHERE stylist_id = $1
        AND booking_date BETWEEN $2 AND $3
        AND status IN ('PENDING', 'VERIFY_ACCEPTANCE', 'CONFIRMED')
      ORDER BY booking_date, booking_time
    `, [stylistId, startDate, endDate]);

    // Generate all dates in the range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateAvailabilityMap = {};

    // Initialize all dates with empty bookings
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dateAvailabilityMap[dateStr] = {
        date: dateStr,
        availableSlots: 0,
        bookedSlots: 0,
        avgPrice: null
      };
    }

    // Count booked slots per day
    bookings.rows.forEach(booking => {
      const dateStr = booking.booking_date;
      const duration = booking.duration_minutes || 60;
      const slotsOccupied = Math.ceil(duration / 30);

      if (dateAvailabilityMap[dateStr]) {
        dateAvailabilityMap[dateStr].bookedSlots += slotsOccupied;
      }
    });

    // Calculate available slots (18 30-min slots per day: 9 AM to 6 PM)
    const totalSlotsPerDay = 18; // 9 hours * 2 slots per hour

    Object.keys(dateAvailabilityMap).forEach(dateStr => {
      const dayData = dateAvailabilityMap[dateStr];
      dayData.availableSlots = Math.max(0, totalSlotsPerDay - dayData.bookedSlots);
    });

    // Get service price if provided
    if (serviceId) {
      const serviceResult = await query('SELECT price FROM services WHERE id = $1', [serviceId]);
      if (serviceResult.rows.length > 0) {
        const price = parseFloat(serviceResult.rows[0].price);
        Object.keys(dateAvailabilityMap).forEach(dateStr => {
          dateAvailabilityMap[dateStr].avgPrice = price;
        });
      }
    }

    const availabilityArray = Object.values(dateAvailabilityMap);

    res.json({
      success: true,
      data: availabilityArray
    });

  } catch (error) {
    console.error('Get monthly availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monthly availability',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Time slots for specific date with enhanced metadata
router.get('/stylists/:stylistId/availability/slots', async (req, res) => {
  try {
    const { stylistId } = req.params;
    const { date, serviceId, duration } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    // Verify stylist exists and is active
    const stylistCheck = await query(`
      SELECT u.id, s.id as stylist_id
      FROM users u
      JOIN stylists s ON u.id = s.user_id
      WHERE s.id = $1 AND u.role = 'STYLIST' AND u.is_active = true
    `, [stylistId]);

    if (stylistCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stylist not found or inactive'
      });
    }

    // Get existing bookings for this stylist on this date
    const existingBookings = await query(`
      SELECT booking_time, duration_minutes
      FROM bookings
      WHERE stylist_id = $1
        AND booking_date = $2
        AND status IN ('PENDING', 'VERIFY_ACCEPTANCE', 'CONFIRMED')
      ORDER BY booking_time
    `, [stylistId, date]);

    // Get all bookings for this stylist to calculate popular times
    const allBookingsForStylist = await query(`
      SELECT booking_time, COUNT(*) as booking_count
      FROM bookings
      WHERE stylist_id = $1
        AND status IN ('COMPLETED', 'CONFIRMED')
        AND booking_date >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY booking_time
      ORDER BY booking_count DESC
    `, [stylistId]);

    // Identify popular time slots (top 20% most booked)
    const popularTimes = new Set();
    if (allBookingsForStylist.rows.length > 0) {
      const topCount = Math.ceil(allBookingsForStylist.rows.length * 0.2);
      allBookingsForStylist.rows.slice(0, topCount).forEach(row => {
        popularTimes.add(row.booking_time);
      });
    }

    // Generate all possible time slots (9:00 AM to 6:00 PM in 30-minute intervals)
    const allSlots = [];
    const startHour = 9; // 9 AM
    const endHour = 18; // 6 PM

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minutes = 0; minutes < 60; minutes += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        allSlots.push(timeStr);
      }
    }

    // Filter out booked slots
    const bookedSlots = new Set();

    existingBookings.rows.forEach(booking => {
      const bookingTime = booking.booking_time;
      const bookingDuration = booking.duration_minutes || 60;
      const slotsNeeded = Math.ceil(bookingDuration / 30);
      const bookingIndex = allSlots.indexOf(bookingTime);

      if (bookingIndex !== -1) {
        for (let i = 0; i < slotsNeeded && (bookingIndex + i) < allSlots.length; i++) {
          bookedSlots.add(allSlots[bookingIndex + i]);
        }
      }
    });

    // If the requested date is today, filter out past time slots
    const requestedDate = new Date(date);
    const today = new Date();
    const isToday = requestedDate.toDateString() === today.toDateString();

    // Get service price
    let servicePrice = null;
    if (serviceId) {
      const serviceResult = await query('SELECT price FROM services WHERE id = $1', [serviceId]);
      if (serviceResult.rows.length > 0) {
        servicePrice = parseFloat(serviceResult.rows[0].price);
      }
    }

    // Build time slot objects with metadata
    const formattedSlots = allSlots.map((time, index) => {
      const [slotHour, slotMinutes] = time.split(':').map(Number);
      const slotTotalMinutes = slotHour * 60 + slotMinutes;

      let available = !bookedSlots.has(time);

      // If today, exclude past slots
      if (isToday && available) {
        const currentHour = today.getHours();
        const currentMinutes = today.getMinutes();
        const currentTotalMinutes = currentHour * 60 + currentMinutes;

        // Must be at least 1 hour in the future
        if (slotTotalMinutes <= currentTotalMinutes + 60) {
          available = false;
        }
      }

      // Determine if slot is popular (historically high demand)
      const isPopular = popularTimes.has(time) && available;

      // Determine if slot is recommended (mid-day slots often preferred)
      const isRecommended = available && slotHour >= 11 && slotHour <= 14;

      return {
        time,
        available,
        price: servicePrice,
        popular: isPopular,
        recommended: isRecommended && !isPopular // Only mark as recommended if not already popular
      };
    });

    // Filter to only return available slots
    const availableSlots = formattedSlots.filter(slot => slot.available);

    res.json({
      success: true,
      data: availableSlots
    });

  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available slots',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ==================== DEPRECATED: NEW STYLIST APPROVAL WORKFLOW ====================
// NOTE: These endpoints use status values not in the database constraint.
// Use the endpoints above instead (/accept, /confirm)
// Kept for reference only - DO NOT USE

/* DEPRECATED - Uses invalid status 'STYLIST_ACCEPTED'
// Stylist accepts booking (PENDING_STYLIST_APPROVAL → STYLIST_ACCEPTED)
router.post('/:bookingId/stylist-accept', requirePhoneVerification, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId; // From JWT middleware

    // Get booking details and verify stylist authorization
    const bookingResult = await query(`
      SELECT b.*, s.name as service_name, s.price, s.duration,
             u_client.id as client_user_id, u_client.phone as client_phone,
             u_client.name as client_name,
             st.id as stylist_table_id, u_stylist.id as stylist_user_id
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u_client ON b.client_id = u_client.id
      JOIN stylists st ON b.stylist_id = st.id
      JOIN users u_stylist ON st.user_id = u_stylist.id
      WHERE b.id = $1 AND u_stylist.id = $2
    `, [bookingId, userId]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or unauthorized'
      });
    }

    const booking = bookingResult.rows[0];

    // Check if booking is in correct status
    if (booking.status !== 'PENDING_STYLIST_APPROVAL') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept booking with status: ${booking.status}`
      });
    }

    // Check if request has expired (5 minutes from creation)
    const now = new Date();
    if (booking.request_expires_at && new Date(booking.request_expires_at) < now) {
      // Expire the booking and process refund
      await query(`
        UPDATE bookings
        SET status = 'EXPIRED_STYLIST_RESPONSE', updated_at = $1
        WHERE id = $2
      `, [now, bookingId]);

      // Process refund to client (97%)
      await distributeBookingPayment(bookingId, booking.total_price, 'STYLIST_NO_RESPONSE');

      return res.status(400).json({
        success: false,
        message: 'Booking request has expired (5 minutes elapsed)'
      });
    }

    // Update booking status to accepted
    await query(`
      UPDATE bookings
      SET status = 'STYLIST_ACCEPTED', updated_at = $1
      WHERE id = $2
    `, [now, bookingId]);

    // Calculate remaining time for client confirmation (15 minutes total from original request)
    const originalRequestTime = new Date(booking.created_at);
    const finalExpiresAt = new Date(originalRequestTime.getTime() + 15 * 60 * 1000);
    const remainingMinutes = Math.max(0, Math.floor((finalExpiresAt - now) / (1000 * 60)));

    // Send SMS to client about stylist acceptance
    const serviceDetails = {
      service_name: booking.service_name,
      appointment_date: booking.appointment_date,
      appointment_time: booking.appointment_time
    };

    await smsService.sendStylistAcceptedNotification(
      booking.client_user_id,
      booking.stylist_user_id,
      bookingId,
      serviceDetails
    );

    console.log(`Stylist accepted booking ${bookingId}, client has ${remainingMinutes} minutes to confirm`);

    res.json({
      success: true,
      message: 'Booking accepted successfully',
      booking: {
        id: bookingId,
        status: 'STYLIST_ACCEPTED',
        client_confirmation_expires_at: finalExpiresAt,
        remaining_minutes: remainingMinutes
      }
    });

  } catch (error) {
    console.error('Stylist accept booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Stylist declines booking (PENDING_STYLIST_APPROVAL → STYLIST_DECLINED) */

/* DEPRECATED - Uses invalid status
router.post('/:bookingId/stylist-decline', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const userId = req.userId;

    // Get booking details
    const bookingResult = await query(`
      SELECT b.*, u_stylist.id as stylist_user_id
      FROM bookings b
      JOIN stylists st ON b.stylist_id = st.id
      JOIN users u_stylist ON st.user_id = u_stylist.id
      WHERE b.id = $1 AND u_stylist.id = $2
    `, [bookingId, userId]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or unauthorized'
      });
    }

    const booking = bookingResult.rows[0];

    if (booking.status !== 'PENDING_STYLIST_APPROVAL') {
      return res.status(400).json({
        success: false,
        message: `Cannot decline booking with status: ${booking.status}`
      });
    }

    const now = new Date();

    // Update booking status
    await query(`
      UPDATE bookings
      SET status = 'STYLIST_DECLINED', stylist_notes = $1, updated_at = $2
      WHERE id = $3
    `, [reason || 'Stylist declined booking', now, bookingId]);

    // Process refund to client (97%)
    await distributeBookingPayment(bookingId, booking.total_price, 'STYLIST_DECLINE');

    // Get additional booking details for SMS
    const fullBookingResult = await query(`
      SELECT b.*, s.name as service_name, u_client.id as client_user_id,
             u_stylist.id as stylist_user_id
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u_client ON b.client_id = u_client.id
      JOIN stylists st ON b.stylist_id = st.id
      JOIN users u_stylist ON st.user_id = u_stylist.id
      WHERE b.id = $1
    `, [bookingId]);

    if (fullBookingResult.rows.length > 0) {
      const fullBooking = fullBookingResult.rows[0];
      const serviceDetails = {
        service_name: fullBooking.service_name,
        appointment_date: fullBooking.appointment_date,
        appointment_time: fullBooking.appointment_time
      };

      await smsService.sendStylistDeclinedNotification(
        fullBooking.client_user_id,
        fullBooking.stylist_user_id,
        bookingId,
        reason,
        serviceDetails
      );
    }

    console.log(`Stylist declined booking ${bookingId}, client refunded 97%`);

    res.json({
      success: true,
      message: 'Booking declined successfully',
      booking: {
        id: bookingId,
        status: 'STYLIST_DECLINED'
      }
    });

  } catch (error) {
    console.error('Stylist decline booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}); */

/* DEPRECATED - Uses invalid status 'STYLIST_ACCEPTED'
// Client final confirmation (STYLIST_ACCEPTED → CONFIRMED)
router.post('/:bookingId/client-confirm', requirePhoneVerification, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;

    // Get booking details
    const bookingResult = await query(`
      SELECT b.*, u_client.id as client_user_id
      FROM bookings b
      JOIN users u_client ON b.client_id = u_client.id
      WHERE b.id = $1 AND u_client.id = $2
    `, [bookingId, userId]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or unauthorized'
      });
    }

    const booking = bookingResult.rows[0];

    if (booking.status !== 'STYLIST_ACCEPTED') {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm booking with status: ${booking.status}`
      });
    }

    // Check if final confirmation window has expired (15 minutes total)
    const now = new Date();
    if (booking.acceptance_expires_at && new Date(booking.acceptance_expires_at) < now) {
      // Expire the booking and process refund
      await query(`
        UPDATE bookings
        SET status = 'EXPIRED_CLIENT_CONFIRMATION', updated_at = $1
        WHERE id = $2
      `, [now, bookingId]);

      // Process refund to client (97%)
      await distributeBookingPayment(bookingId, booking.total_price, 'CLIENT_NO_CONFIRM');

      return res.status(400).json({
        success: false,
        message: 'Booking confirmation window has expired (15 minutes total)'
      });
    }

    const confirmedAt = now;

    // Update booking to confirmed status
    await query(`
      UPDATE bookings
      SET status = 'CONFIRMED', confirmed_at = $1, updated_at = $2
      WHERE id = $3
    `, [confirmedAt, now, bookingId]);

    console.log(`Client confirmed booking ${bookingId}, booking is now active`);

    // Send booking confirmation email
    try {
      // Get full booking details for email
      const fullBookingResult = await query(`
        SELECT
          b.*,
          u.email as client_email,
          u.first_name || ' ' || u.last_name as client_name,
          u_stylist.first_name || ' ' || u_stylist.last_name as stylist_name,
          s.name as service_name,
          TO_CHAR(b.booking_date, 'YYYY-MM-DD') as appointment_date,
          b.booking_time as appointment_time,
          b.total_price
        FROM bookings b
        JOIN users u ON b.client_id = u.id
        JOIN services srv ON b.service_id = srv.id
        JOIN stylists s ON b.stylist_id = s.id
        JOIN users u_stylist ON s.user_id = u_stylist.id
        WHERE b.id = $1
      `, [bookingId]);

      if (fullBookingResult.rows.length > 0) {
        await emailService.sendBookingConfirmationEmail(fullBookingResult.rows[0]);
        console.log(`Confirmation email sent for booking ${bookingId}`);
      }
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Booking confirmed successfully',
      booking: {
        id: bookingId,
        status: 'CONFIRMED',
        confirmed_at: confirmedAt
      }
    });

  } catch (error) {
    console.error('Client confirm booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}); */

// ==================== END DEPRECATED SECTION ====================

// Report no-show
router.post('/:bookingId/report-no-show', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reported_by, reason } = req.body; // 'CLIENT' or 'STYLIST'
    const userId = req.userId;

    // Get booking details with both user IDs
    const bookingResult = await query(`
      SELECT b.*,
             u_client.id as client_user_id,
             u_stylist.id as stylist_user_id
      FROM bookings b
      JOIN users u_client ON b.client_id = u_client.id
      JOIN stylists st ON b.stylist_id = st.id
      JOIN users u_stylist ON st.user_id = u_stylist.id
      WHERE b.id = $1 AND (u_client.id = $2 OR u_stylist.id = $2)
    `, [bookingId, userId]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or unauthorized'
      });
    }

    const booking = bookingResult.rows[0];

    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: 'Can only report no-show for confirmed bookings'
      });
    }

    const now = new Date();
    const noShowStatus = reported_by === 'CLIENT' ? 'NO_SHOW_STYLIST' : 'NO_SHOW_CLIENT';

    // Update booking status
    await query(`
      UPDATE bookings
      SET status = $1, stylist_notes = $2, updated_at = $3
      WHERE id = $4
    `, [noShowStatus, reason || `No-show reported by ${reported_by}`, now, bookingId]);

    // Process payment distribution based on who didn't show
    if (reported_by === 'CLIENT') {
      // Stylist no-show: 97% to client
      await distributeBookingPayment(bookingId, booking.total_price, 'STYLIST_NO_SHOW');
    } else {
      // Client no-show: 97% split 60/40
      await distributeBookingPayment(bookingId, booking.total_price, 'CLIENT_NO_SHOW');
    }

    // Get service details for SMS
    const serviceResult = await query(`
      SELECT s.name as service_name
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE b.id = $1
    `, [bookingId]);

    if (serviceResult.rows.length > 0) {
      const serviceDetails = {
        service_name: serviceResult.rows[0].service_name,
        appointment_date: booking.appointment_date,
        appointment_time: booking.appointment_time
      };

      // Send notification to the affected party
      if (reported_by === 'CLIENT') {
        // Stylist didn't show, notify client about refund
        await smsService.sendNoShowNotification(
          booking.client_user_id,
          bookingId,
          'STYLIST_NO_SHOW',
          serviceDetails
        );
      } else {
        // Client didn't show, notify both parties
        const remainingAmount = booking.total_price * 0.97 * 0.60; // 60% of 97%
        const compensationAmount = booking.total_price * 0.97 * 0.40; // 40% of 97%

        // Notify client about policy application
        await smsService.sendNoShowNotification(
          booking.client_user_id,
          bookingId,
          'CLIENT_NO_SHOW',
          serviceDetails,
          compensationAmount
        );

        // Send credit notification to stylist about compensation
        await smsService.sendCreditNotification(
          booking.stylist_user_id,
          compensationAmount,
          'AVAILABLE',
          `Compensación por no-show del cliente en ${serviceDetails.service_name}`
        );
      }
    }

    console.log(`No-show reported for booking ${bookingId}: ${noShowStatus}`);

    res.json({
      success: true,
      message: 'No-show reported successfully',
      booking: {
        id: bookingId,
        status: noShowStatus
      }
    });

  } catch (error) {
    console.error('Report no-show error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report no-show',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Mark booking as completed
router.post('/:bookingId/complete', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;

    // Get booking details (either stylist or client can mark as complete)
    const bookingResult = await query(`
      SELECT b.*,
             u_client.id as client_user_id,
             u_stylist.id as stylist_user_id
      FROM bookings b
      JOIN users u_client ON b.client_id = u_client.id
      JOIN stylists st ON b.stylist_id = st.id
      JOIN users u_stylist ON st.user_id = u_stylist.id
      WHERE b.id = $1 AND (u_client.id = $2 OR u_stylist.id = $2)
    `, [bookingId, userId]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or unauthorized'
      });
    }

    const booking = bookingResult.rows[0];

    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: 'Can only complete confirmed bookings'
      });
    }

    const now = new Date();

    // Update booking to completed
    await query(`
      UPDATE bookings
      SET status = 'COMPLETED', completed_at = $1, updated_at = $2
      WHERE id = $3
    `, [now, now, bookingId]);

    // Process payment to stylist (97%)
    await distributeBookingPayment(bookingId, booking.total_price, 'STYLIST_SUCCESS');

    console.log(`Booking ${bookingId} completed successfully, stylist credited 97%`);

    res.json({
      success: true,
      message: 'Booking completed successfully',
      booking: {
        id: bookingId,
        status: 'COMPLETED',
        completed_at: now
      }
    });

  } catch (error) {
    console.error('Complete booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get stylist appointments (for business calendar)
router.get('/stylist/appointments', async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required'
      });
    }

    // Get stylist ID from user ID
    const stylistResult = await query(
      'SELECT id FROM stylists WHERE user_id = $1',
      [userId]
    );

    if (stylistResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stylist profile not found'
      });
    }

    const stylistId = stylistResult.rows[0].id;

    // Fetch appointments for stylist in date range  
    const result = await query(`
      SELECT
        b.id,
        CONCAT(u.first_name, ' ', u.last_name) as client_name,
        u.email as client_email,
        s.name as service_name,
        b.booking_date || ' ' || b.booking_time as appointment_date,
        s.duration_minutes,
        b.total_price,
        b.status,
        b.notes
      FROM bookings b
      JOIN users u ON b.client_id = u.id
      JOIN services s ON b.service_id = s.id
      WHERE b.stylist_id = $1
        AND b.booking_date BETWEEN $2 AND $3
        AND b.status NOT IN ('CANCELLED', 'DECLINED')
      ORDER BY b.booking_date, b.booking_time
    `, [stylistId, new Date(startDate), new Date(endDate)]);

    res.json({
      success: true,
      appointments: result.rows
    });

  } catch (error) {
    console.error('Fetch stylist appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Reschedule a booking
router.put('/:bookingId/reschedule', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { newDate, newTime, reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!newDate || !newTime) {
      return res.status(400).json({ error: 'New date and time are required' });
    }

    // Get the existing booking
    const bookingResult = await query(`
      SELECT b.*, u.email as stylist_email, u.phone as stylist_phone, u.first_name as stylist_name,
             c.email as client_email, c.phone as client_phone, c.first_name as client_name
      FROM bookings b
      JOIN stylists s ON b.stylist_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN users c ON b.client_id = c.id
      WHERE b.id = $1
    `, [bookingId]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    // Verify user is either the client or stylist
    const isClient = booking.client_id === userId;
    const isStylist = booking.stylist_id === userId;

    if (!isClient && !isStylist) {
      return res.status(403).json({ error: 'Not authorized to reschedule this booking' });
    }

    // Check if booking is in a reschedulable state
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      return res.status(400).json({ error: 'Booking cannot be rescheduled in current status' });
    }

    // Check conflict at new time
    const conflictCheck = await query(`
      SELECT id FROM bookings
      WHERE stylist_id = $1
      AND booking_date = $2
      AND booking_time = $3
      AND status IN ('PENDING', 'CONFIRMED')
      AND id != $4
    `, [booking.stylist_id, newDate, newTime, bookingId]);

    if (conflictCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Time slot is already booked' });
    }

    // Update booking
    const updateResult = await query(`
      UPDATE bookings
      SET booking_date = $1,
          booking_time = $2,
          status = 'PENDING',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [newDate, newTime, bookingId]);

    // Log the reschedule
    await query(`
      INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by, reason, created_at)
      VALUES ($1, $2, 'PENDING', $3, $4, CURRENT_TIMESTAMP)
    `, [bookingId, booking.status, userId, reason || 'Rescheduled']);

    // Send notifications
    const notificationMessage = `Booking rescheduled to ${newDate} at ${newTime}`;

    if (isClient && booking.stylist_phone) {
      try {
        await smsService.send(booking.stylist_phone, notificationMessage);
      } catch (smsError) {
        console.error('SMS notification error:', smsError);
      }
    } else if (isStylist && booking.client_phone) {
      try {
        await smsService.send(booking.client_phone, notificationMessage);
      } catch (smsError) {
        console.error('SMS notification error:', smsError);
      }
    }

    res.json({
      success: true,
      booking: updateResult.rows[0],
      message: 'Booking rescheduled successfully'
    });

  } catch (error) {
    console.error('Reschedule booking error:', error);
    res.status(500).json({ error: 'Failed to reschedule booking' });
  }
});

// Check for booking conflicts
router.post('/check-conflict', async (req, res) => {
  try {
    const { stylistId, date, time, duration = 60, excludeBookingId } = req.body;

    if (!stylistId || !date || !time) {
      return res.status(400).json({
        error: 'Stylist ID, date, and time are required'
      });
    }

    // Calculate end time based on duration
    const endTimeQuery = `
      SELECT ($1::time + ($2 || ' minutes')::interval)::time as end_time
    `;
    const endTimeResult = await query(endTimeQuery, [time, duration]);
    const endTime = endTimeResult.rows[0].end_time;

    // Check for overlapping bookings
    let conflictQuery = `
      SELECT
        b.id,
        b.booking_time,
        (b.booking_time::time + (b.duration_minutes || ' minutes')::interval)::time as end_time,
        b.duration_minutes,
        u.first_name || ' ' || u.last_name as client_name
      FROM bookings b
      JOIN users u ON b.client_id = u.id
      WHERE b.stylist_id = $1
      AND b.booking_date = $2
      AND b.status IN ('PENDING', 'VERIFY_ACCEPTANCE', 'CONFIRMED')
      AND (
        (b.booking_time <= $3::time AND (b.booking_time::time + (b.duration_minutes || ' minutes')::interval)::time > $3::time)
        OR (b.booking_time < $4::time AND (b.booking_time::time + (b.duration_minutes || ' minutes')::interval)::time >= $4::time)
        OR (b.booking_time >= $3::time AND (b.booking_time::time + (b.duration_minutes || ' minutes')::interval)::time <= $4::time)
      )
    `;

    const params = [stylistId, date, time, endTime];

    if (excludeBookingId) {
      conflictQuery += ' AND b.id != $5';
      params.push(excludeBookingId);
    }

    const conflictResult = await query(conflictQuery, params);

    const hasConflict = conflictResult.rows.length > 0;

    res.json({
      success: true,
      hasConflict,
      conflicts: conflictResult.rows,
      message: hasConflict
        ? `${conflictResult.rows.length} conflicting booking(s) found`
        : 'No conflicts, slot is available'
    });

  } catch (error) {
    console.error('Conflict check error:', error);
    res.status(500).json({ error: 'Failed to check for conflicts' });
  }
});

// TEST ENDPOINT - Stylist appointments with different route name
router.get('/stylist/appointments-test', async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required'
      });
    }

    // Get stylist ID from user ID
    const stylistResult = await query(
      'SELECT id FROM stylists WHERE user_id = $1',
      [userId]
    );

    if (stylistResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stylist profile not found'
      });
    }

    const stylistId = stylistResult.rows[0].id;

    // Simple query with correct column names
    const result = await query(`
      SELECT b.id, b.booking_date, b.booking_time, b.status
      FROM bookings b
      WHERE b.stylist_id = $1
        AND b.booking_date BETWEEN $2 AND $3
      ORDER BY b.booking_date, b.booking_time
    `, [stylistId, new Date(startDate), new Date(endDate)]);

    res.json({
      success: true,
      test: true,
      appointments: result.rows
    });

  } catch (error) {
    console.error('TEST endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});


module.exports = router;
