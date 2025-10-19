// Location tracking routes for BeautyCita
const express = require('express')
const { query } = require('../db')
const { validateJWT: auth } = require('../middleware/auth')
const rateLimit = require('express-rate-limit')

const router = express.Router()

// Rate limiting for location updates
const locationUpdateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: { error: 'Too many location updates. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
})

const bookingTrackingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute during booking tracking
  message: { error: 'Too many location updates. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
})

// Update user's current location
router.post('/update', auth, locationUpdateLimiter, async (req, res) => {
  try {
    const { latitude, longitude, timestamp, accuracy } = req.body
    const userId = req.user.id

    // Validate coordinates
    if (!latitude || !longitude ||
        typeof latitude !== 'number' || typeof longitude !== 'number' ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.'
      })
    }

    // Update user's last known location
    await query(`
      INSERT INTO user_locations (user_id, latitude, longitude, accuracy, timestamp, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        accuracy = EXCLUDED.accuracy,
        timestamp = EXCLUDED.timestamp,
        updated_at = NOW()
    `, [userId, latitude, longitude, accuracy || null, timestamp || new Date().toISOString()])

    console.log(`📍 Updated location for user ${userId}: ${latitude}, ${longitude}`)

    res.json({
      success: true,
      message: 'Location updated successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error updating location:', error)
    res.status(500).json({ error: 'Failed to update location' })
  }
})

// Track location during booking window (high frequency)
router.post('/booking-track', auth, bookingTrackingLimiter, async (req, res) => {
  try {
    const { latitude, longitude, timestamp, bookingId, accuracy } = req.body
    const userId = req.user.id

    // Validate required fields
    if (!latitude || !longitude || !bookingId) {
      return res.status(400).json({ error: 'Missing required fields: latitude, longitude, bookingId' })
    }

    // Validate coordinates
    if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' })
    }

    // Verify the booking belongs to the user
    const booking = await query(`
      SELECT id, stylist_id, appointment_date, appointment_time, status
      FROM bookings
      WHERE id = $1 AND user_id = $2
    `, [bookingId, userId])

    if (booking.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or access denied' })
    }

    if (booking.rows[0].status !== 'CONFIRMED') {
      return res.status(400).json({ error: 'Booking is not confirmed' })
    }

    // Update booking location tracking
    await query(`
      INSERT INTO booking_location_tracking
      (booking_id, user_id, latitude, longitude, accuracy, timestamp, updated_at, is_active, continuous_tracking, last_latitude, last_longitude, last_update)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), true, true, $3, $4, NOW())
      ON CONFLICT (booking_id)
      DO UPDATE SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        accuracy = EXCLUDED.accuracy,
        timestamp = EXCLUDED.timestamp,
        updated_at = NOW(),
        last_latitude = EXCLUDED.latitude,
        last_longitude = EXCLUDED.longitude,
        last_update = NOW(),
        is_active = true,
        continuous_tracking = true
    `, [bookingId, userId, latitude, longitude, accuracy || null, timestamp || new Date().toISOString()])

    // Also update general user location
    await query(`
      INSERT INTO user_locations (user_id, latitude, longitude, accuracy, timestamp, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        accuracy = EXCLUDED.accuracy,
        timestamp = EXCLUDED.timestamp,
        updated_at = NOW()
    `, [userId, latitude, longitude, accuracy || null, timestamp || new Date().toISOString()])

    console.log(`📍 Updated booking tracking for booking ${bookingId}, user ${userId}: ${latitude}, ${longitude}`)

    res.json({
      success: true,
      message: 'Booking location updated successfully',
      bookingId: bookingId,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error updating booking location:', error)
    res.status(500).json({ error: 'Failed to update booking location' })
  }
})

// Get nearby clients for stylists (proximity notifications)
router.get('/stylist-proximity', auth, async (req, res) => {
  try {
    const userId = req.user.id

    // Verify user is a stylist
    const stylist = await query(`
      SELECT id, business_name, location_latitude, location_longitude
      FROM stylists
      WHERE user_id = $1
    `, [userId])

    if (stylist.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied. Stylist account required.' })
    }

    const stylistData = stylist.rows[0]

    if (!stylistData.location_latitude || !stylistData.location_longitude) {
      return res.status(400).json({ error: 'Stylist location not set' })
    }

    // Get clients with active booking tracking for today
    const clients = await query(`
      SELECT
        bt.booking_id, bt.user_id, bt.last_latitude, bt.last_longitude, bt.last_update,
        bt.estimated_arrival_minutes, bt.last_eta_check,
        b.appointment_time, b.appointment_date,
        u.first_name, u.last_name,
        s.name as service_name, s.duration_minutes
      FROM booking_location_tracking bt
      JOIN bookings b ON bt.booking_id = b.id
      JOIN services s ON b.service_id = s.id
      JOIN users u ON bt.user_id = u.id
      WHERE b.stylist_id = $1
      AND bt.is_active = true
      AND bt.continuous_tracking = true
      AND bt.last_latitude IS NOT NULL
      AND bt.last_longitude IS NOT NULL
      AND b.appointment_date = CURRENT_DATE
      AND b.status = 'CONFIRMED'
      AND bt.last_update > NOW() - INTERVAL '10 minutes'
      ORDER BY b.appointment_time ASC
    `, [stylistData.id])

    // Calculate distances for each client
    const clientsWithDistance = clients.rows.map(client => {
      const distance = calculateHaversineDistance(
        { lat: stylistData.location_latitude, lng: stylistData.location_longitude },
        { lat: client.last_latitude, lng: client.last_longitude }
      )

      return {
        bookingId: client.booking_id,
        clientName: `${client.first_name} ${client.last_name}`,
        appointmentTime: client.appointment_time,
        serviceName: client.service_name,
        serviceDuration: client.duration_minutes,
        lastUpdate: client.last_update,
        estimatedArrivalMinutes: client.estimated_arrival_minutes,
        lastEtaCheck: client.last_eta_check,
        distance: {
          meters: distance.distance_meters,
          text: distance.distance_text,
          estimatedMinutes: distance.estimated_minutes
        },
        isNear: distance.estimated_minutes <= 15
      }
    })

    res.json({
      success: true,
      stylistLocation: {
        latitude: stylistData.location_latitude,
        longitude: stylistData.location_longitude,
        businessName: stylistData.business_name
      },
      clients: clientsWithDistance,
      totalClients: clientsWithDistance.length,
      nearbyClients: clientsWithDistance.filter(c => c.isNear).length,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error getting stylist proximity data:', error)
    res.status(500).json({ error: 'Failed to get proximity data' })
  }
})

// Get user's current location
router.get('/current', auth, async (req, res) => {
  try {
    const userId = req.user.id

    const location = await query(`
      SELECT latitude, longitude, accuracy, timestamp, updated_at
      FROM user_locations
      WHERE user_id = $1
    `, [userId])

    if (location.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' })
    }

    res.json({
      success: true,
      location: location.rows[0]
    })

  } catch (error) {
    console.error('❌ Error getting current location:', error)
    res.status(500).json({ error: 'Failed to get current location' })
  }
})

// Start tracking for a specific booking
router.post('/start-tracking/:bookingId', auth, async (req, res) => {
  try {
    const { bookingId } = req.params
    const userId = req.user.id

    // Verify the booking belongs to the user
    const booking = await query(`
      SELECT id, stylist_id, appointment_date, appointment_time, status
      FROM bookings
      WHERE id = $1 AND user_id = $2
    `, [bookingId, userId])

    if (booking.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or access denied' })
    }

    // Start or update tracking
    await query(`
      INSERT INTO booking_location_tracking (booking_id, user_id, tracking_started_at, is_active, continuous_tracking)
      VALUES ($1, $2, NOW(), true, true)
      ON CONFLICT (booking_id)
      DO UPDATE SET
        is_active = true,
        continuous_tracking = true,
        tracking_started_at = CASE
          WHEN booking_location_tracking.tracking_started_at IS NULL
          THEN NOW()
          ELSE booking_location_tracking.tracking_started_at
        END
    `, [bookingId, userId])

    console.log(`🎯 Started tracking for booking ${bookingId}, user ${userId}`)

    res.json({
      success: true,
      message: 'Tracking started successfully',
      bookingId: bookingId,
      trackingStarted: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error starting tracking:', error)
    res.status(500).json({ error: 'Failed to start tracking' })
  }
})

// Stop tracking for a specific booking
router.post('/stop-tracking/:bookingId', auth, async (req, res) => {
  try {
    const { bookingId } = req.params
    const userId = req.user.id

    await query(`
      UPDATE booking_location_tracking
      SET is_active = false, continuous_tracking = false, tracking_ended_at = NOW()
      WHERE booking_id = $1 AND user_id = $2
    `, [bookingId, userId])

    console.log(`🛑 Stopped tracking for booking ${bookingId}, user ${userId}`)

    res.json({
      success: true,
      message: 'Tracking stopped successfully',
      bookingId: bookingId,
      trackingStopped: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error stopping tracking:', error)
    res.status(500).json({ error: 'Failed to stop tracking' })
  }
})

// Utility function for distance calculation
function calculateHaversineDistance(origin, destination) {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(destination.lat - origin.lat)
  const dLng = toRadians(destination.lng - origin.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(origin.lat)) * Math.cos(toRadians(destination.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance_km = R * c

  // Rough estimate: 1 km = 1.5 minutes driving in city traffic
  const estimated_minutes = Math.round(distance_km * 1.5)

  return {
    distance_meters: distance_km * 1000,
    distance_text: `${distance_km.toFixed(1)} km`,
    estimated_minutes: estimated_minutes
  }
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180)
}

module.exports = router