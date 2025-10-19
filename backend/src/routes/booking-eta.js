const express = require('express');
const router = express.Router();
const { query } = require('../db');
const axios = require('axios');

/**
 * BOOKING ETA & TRACKING API
 * Real-time client location tracking and ETA calculations
 */

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

/**
 * POST /api/bookings/:booking_id/start-journey
 * Client indicates they've started their journey to the appointment
 */
router.post('/:booking_id/start-journey', async (req, res) => {
  try {
    const { user } = req;
    const { booking_id } = req.params;
    const { latitude, longitude } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify booking ownership
    const booking = await query(
      `SELECT b.*, sl.latitude as dest_lat, sl.longitude as dest_long, sl.address as dest_address
       FROM bookings b
       LEFT JOIN stylist_locations sl ON b.location_id = sl.id
       WHERE b.id = $1 AND b.client_id = $2`,
      [booking_id, user.id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    const bookingData = booking.rows[0];

    // Get ETA from Google Maps Distance Matrix API
    const eta = await calculateETA(
      latitude,
      longitude,
      bookingData.dest_lat,
      bookingData.dest_long
    );

    // Create or update location tracking
    const existingTracking = await query(
      'SELECT id FROM booking_location_tracking WHERE booking_id = $1',
      [booking_id]
    );

    if (existingTracking.rows.length > 0) {
      // Update existing
      await query(
        `UPDATE booking_location_tracking
         SET current_latitude = $1,
             current_longitude = $2,
             estimated_arrival_time = $3,
             distance_meters = $4,
             duration_seconds = $5,
             traffic_condition = $6,
             is_en_route = true,
             client_started_journey = true,
             journey_started_at = NOW(),
             last_location_update = NOW(),
             updated_at = NOW()
         WHERE booking_id = $7`,
        [
          latitude,
          longitude,
          eta.estimated_arrival_time,
          eta.distance_meters,
          eta.duration_seconds,
          eta.traffic_condition,
          booking_id
        ]
      );
    } else {
      // Insert new
      await query(
        `INSERT INTO booking_location_tracking (
          booking_id, current_latitude, current_longitude, estimated_arrival_time,
          distance_meters, duration_seconds, traffic_condition, is_en_route,
          client_started_journey, journey_started_at, last_location_update,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, true, NOW(), NOW(), NOW(), NOW())`,
        [
          booking_id,
          latitude,
          longitude,
          eta.estimated_arrival_time,
          eta.distance_meters,
          eta.duration_seconds,
          eta.traffic_condition
        ]
      );
    }

    // Notify stylist that client is en route
    // TODO: Send push notification / SMS to stylist

    return res.json({
      success: true,
      message: 'Journey started successfully',
      data: {
        eta: eta.estimated_arrival_time,
        distance_meters: eta.distance_meters,
        duration_minutes: Math.ceil(eta.duration_seconds / 60)
      }
    });

  } catch (error) {
    console.error('Error starting journey:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


/**
 * POST /api/bookings/:booking_id/update-location
 * Update client's current location (real-time tracking)
 */
router.post('/:booking_id/update-location', async (req, res) => {
  try {
    const { user } = req;
    const { booking_id } = req.params;
    const { latitude, longitude } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify booking ownership
    const booking = await query(
      `SELECT b.*, sl.latitude as dest_lat, sl.longitude as dest_long,
              bt.alerts_sent
       FROM bookings b
       LEFT JOIN stylist_locations sl ON b.location_id = sl.id
       LEFT JOIN booking_location_tracking bt ON b.id = bt.booking_id
       WHERE b.id = $1 AND b.client_id = $2`,
      [booking_id, user.id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    const bookingData = booking.rows[0];

    // Calculate new ETA
    const eta = await calculateETA(
      latitude,
      longitude,
      bookingData.dest_lat,
      bookingData.dest_long
    );

    // Update location
    await query(
      `UPDATE booking_location_tracking
       SET current_latitude = $1,
           current_longitude = $2,
           estimated_arrival_time = $3,
           distance_meters = $4,
           duration_seconds = $5,
           traffic_condition = $6,
           last_location_update = NOW(),
           updated_at = NOW()
       WHERE booking_id = $7`,
      [
        latitude,
        longitude,
        eta.estimated_arrival_time,
        eta.distance_meters,
        eta.duration_seconds,
        eta.traffic_condition,
        booking_id
      ]
    );

    // Check if we need to send proximity alerts
    const alertsSent = bookingData.alerts_sent || [];
    const minutesAway = Math.ceil(eta.duration_seconds / 60);

    if (minutesAway <= 10 && !alertsSent.includes('10_min_away')) {
      // Send 10 min alert
      await sendProximityAlert(booking_id, bookingData.stylist_id, '10_min_away', minutesAway);
      await query(
        `UPDATE booking_location_tracking
         SET alerts_sent = alerts_sent || '["10_min_away"]'::jsonb
         WHERE booking_id = $1`,
        [booking_id]
      );
    }

    if (minutesAway <= 5 && !alertsSent.includes('5_min_away')) {
      // Send 5 min alert
      await sendProximityAlert(booking_id, bookingData.stylist_id, '5_min_away', minutesAway);
      await query(
        `UPDATE booking_location_tracking
         SET alerts_sent = alerts_sent || '["5_min_away"]'::jsonb
         WHERE booking_id = $1`,
        [booking_id]
      );
    }

    if (minutesAway <= 1 && !alertsSent.includes('arrived')) {
      // Send arrived alert
      await sendProximityAlert(booking_id, bookingData.stylist_id, 'arrived', minutesAway);
      await query(
        `UPDATE booking_location_tracking
         SET alerts_sent = alerts_sent || '["arrived"]'::jsonb
         WHERE booking_id = $1`,
        [booking_id]
      );
    }

    return res.json({
      success: true,
      data: {
        eta: eta.estimated_arrival_time,
        distance_meters: eta.distance_meters,
        duration_minutes: minutesAway
      }
    });

  } catch (error) {
    console.error('Error updating location:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


/**
 * GET /api/bookings/:booking_id/tracking
 * Get current tracking status (for stylist)
 */
router.get('/:booking_id/tracking', async (req, res) => {
  try {
    const { user } = req;
    const { booking_id } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify stylist owns this booking
    const booking = await query(
      `SELECT b.*, bt.*
       FROM bookings b
       LEFT JOIN booking_location_tracking bt ON b.id = bt.booking_id
       INNER JOIN stylists s ON b.stylist_id = s.id
       WHERE b.id = $1 AND s.user_id = $2`,
      [booking_id, user.id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    return res.json({
      success: true,
      data: booking.rows[0]
    });

  } catch (error) {
    console.error('Error fetching tracking:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


/**
 * GET /api/bookings/:booking_id/directions
 * Get directions to appointment location (for client)
 */
router.get('/:booking_id/directions', async (req, res) => {
  try {
    const { user } = req;
    const { booking_id } = req.params;
    const { origin_lat, origin_lng } = req.query;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify booking ownership
    const booking = await query(
      `SELECT b.*, sl.latitude as dest_lat, sl.longitude as dest_lng, sl.address as dest_address
       FROM bookings b
       LEFT JOIN stylist_locations sl ON b.location_id = sl.id
       WHERE b.id = $1 AND b.client_id = $2`,
      [booking_id, user.id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    const bookingData = booking.rows[0];

    // Get directions from Google Maps Directions API
    const directions = await getDirections(
      origin_lat,
      origin_lng,
      bookingData.dest_lat,
      bookingData.dest_lng
    );

    // Store directions request
    await query(
      `INSERT INTO booking_directions (
        booking_id, client_id, origin_latitude, origin_longitude,
        destination_address, destination_latitude, destination_longitude,
        route_polyline, distance_meters, duration_seconds, duration_in_traffic_seconds,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
      [
        booking_id,
        user.id,
        origin_lat,
        origin_lng,
        bookingData.dest_address,
        bookingData.dest_lat,
        bookingData.dest_lng,
        directions.polyline,
        directions.distance_meters,
        directions.duration_seconds,
        directions.duration_in_traffic_seconds
      ]
    );

    return res.json({
      success: true,
      data: directions
    });

  } catch (error) {
    console.error('Error getting directions:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


/**
 * Helper: Calculate ETA using Google Maps Distance Matrix API
 */
async function calculateETA(originLat, originLng, destLat, destLng) {
  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&departure_time=now&traffic_model=best_guess&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await axios.get(url);

    if (response.data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${response.data.status}`);
    }

    const element = response.data.rows[0].elements[0];

    if (element.status !== 'OK') {
      throw new Error(`Route calculation error: ${element.status}`);
    }

    const durationInTraffic = element.duration_in_traffic || element.duration;
    const now = new Date();
    const estimatedArrival = new Date(now.getTime() + (durationInTraffic.value * 1000));

    // Determine traffic condition
    let trafficCondition = 'light';
    if (durationInTraffic.value > element.duration.value * 1.5) {
      trafficCondition = 'heavy';
    } else if (durationInTraffic.value > element.duration.value * 1.2) {
      trafficCondition = 'moderate';
    }

    return {
      distance_meters: element.distance.value,
      duration_seconds: durationInTraffic.value,
      estimated_arrival_time: estimatedArrival,
      traffic_condition: trafficCondition
    };
  } catch (error) {
    console.error('Error calculating ETA:', error);
    throw error;
  }
}


/**
 * Helper: Get directions using Google Maps Directions API
 */
async function getDirections(originLat, originLng, destLat, destLng) {
  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&departure_time=now&traffic_model=best_guess&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await axios.get(url);

    if (response.data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${response.data.status}`);
    }

    const route = response.data.routes[0];
    const leg = route.legs[0];

    return {
      polyline: route.overview_polyline.points,
      distance_meters: leg.distance.value,
      duration_seconds: leg.duration.value,
      duration_in_traffic_seconds: leg.duration_in_traffic ? leg.duration_in_traffic.value : leg.duration.value,
      steps: leg.steps,
      start_address: leg.start_address,
      end_address: leg.end_address
    };
  } catch (error) {
    console.error('Error getting directions:', error);
    throw error;
  }
}


/**
 * Helper: Send proximity alert to stylist
 */
async function sendProximityAlert(bookingId, stylistId, alertType, minutesAway) {
  try {
    // TODO: Implement actual push notification / SMS
    console.log(`Proximity alert: ${alertType} - ${minutesAway} minutes away for booking ${bookingId}`);

    // Get stylist's ETA preferences
    const prefs = await query(
      'SELECT * FROM stylist_eta_preferences WHERE stylist_id = $1',
      [stylistId]
    );

    if (prefs.rows.length > 0) {
      const preferences = prefs.rows[0];

      // Check if this alert is enabled
      if (preferences.enable_eta_alerts) {
        // Send notification based on preferences
        if (preferences.notify_sms) {
          // TODO: Send SMS via Twilio
        }
        if (preferences.notify_push) {
          // TODO: Send push notification
        }
        if (preferences.notify_email) {
          // TODO: Send email
        }
      }
    }
  } catch (error) {
    console.error('Error sending proximity alert:', error);
  }
}


module.exports = router;
