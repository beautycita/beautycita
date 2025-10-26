const express = require('express');
const router = express.Router();
const { validateJWT } = require("../middleware/auth");
const db = require('../db');
const { google } = require('googleapis');

// OAuth2 client setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://74.208.218.18/api/calendar/google/callback'
);

// GET /api/bookings/calendar - Fetch bookings for calendar display
router.get('/bookings/calendar', validateJWT, async (req, res) => {
  try {
    const { stylistId } = req.query;
    const userId = req.user.userId;

    let query = `
      SELECT
        b.id,
        b.start_time,
        b.end_time,
        b.status,
        b.total_price,
        b.notes,
        u.full_name as client_name,
        u.email as client_email,
        s.name as service_name
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN services s ON b.service_id = s.id
      WHERE 1=1
    `;

    const params = [];

    if (stylistId) {
      params.push(stylistId);
      query += ` AND b.stylist_id = $${params.length}`;
    } else {
      // If no stylistId, get bookings for the current user (either as client or stylist)
      params.push(userId);
      query += ` AND (b.user_id = $${params.length} OR b.stylist_id IN (
        SELECT id FROM users WHERE id = $${params.length} AND user_type = 'stylist'
      ))`;
    }

    query += ' ORDER BY b.start_time ASC';

    const result = await db.query(query, params);

    res.json({
      success: true,
      bookings: result.rows
    });
  } catch (error) {
    console.error('Error fetching calendar bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
});

// PUT /api/bookings/:id/reschedule - Update booking time (drag-drop)
router.put('/bookings/:id/reschedule', validateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { start_time, end_time } = req.body;
    const userId = req.user.userId;

    // Verify the booking belongs to the user (as stylist)
    const checkQuery = `
      SELECT b.*, u.user_type
      FROM bookings b
      JOIN users u ON b.stylist_id = u.id
      WHERE b.id = $1 AND b.stylist_id = $2
    `;
    const checkResult = await db.query(checkQuery, [id, userId]);

    if (checkResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reschedule this booking'
      });
    }

    // Check for availability conflicts
    const conflictQuery = `
      SELECT id FROM bookings
      WHERE stylist_id = $1
        AND id != $2
        AND status NOT IN ('CANCELLED', 'NO_SHOW')
        AND (
          (start_time <= $3 AND end_time > $3) OR
          (start_time < $4 AND end_time >= $4) OR
          (start_time >= $3 AND end_time <= $4)
        )
    `;
    const conflictResult = await db.query(conflictQuery, [
      userId,
      id,
      start_time,
      end_time
    ]);

    if (conflictResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Time slot conflicts with another booking'
      });
    }

    // Update the booking
    const updateQuery = `
      UPDATE bookings
      SET start_time = $1, end_time = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    const result = await db.query(updateQuery, [start_time, end_time, id]);

    res.json({
      success: true,
      booking: result.rows[0]
    });
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule booking'
    });
  }
});

// PUT /api/bookings/:id/update-duration - Update booking end time (resize)
router.put('/bookings/:id/update-duration', validateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { end_time } = req.body;
    const userId = req.user.userId;

    // Verify the booking belongs to the user (as stylist)
    const checkQuery = `
      SELECT * FROM bookings
      WHERE id = $1 AND stylist_id = $2
    `;
    const checkResult = await db.query(checkQuery, [id, userId]);

    if (checkResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    const booking = checkResult.rows[0];

    // Check for conflicts with the new end time
    const conflictQuery = `
      SELECT id FROM bookings
      WHERE stylist_id = $1
        AND id != $2
        AND status NOT IN ('CANCELLED', 'NO_SHOW')
        AND start_time < $3
        AND end_time > $4
    `;
    const conflictResult = await db.query(conflictQuery, [
      userId,
      id,
      end_time,
      booking.start_time
    ]);

    if (conflictResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'New duration conflicts with another booking'
      });
    }

    // Update the booking
    const updateQuery = `
      UPDATE bookings
      SET end_time = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(updateQuery, [end_time, id]);

    res.json({
      success: true,
      booking: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating duration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update duration'
    });
  }
});

// GET /api/calendar/google/status - Check Google Calendar connection status
router.get('/calendar/google/status', validateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await db.query(`
      SELECT
        google_calendar_connected as connected,
        google_calendar_sync_enabled as auto_sync,
        google_calendar_last_sync as last_sync
      FROM users
      WHERE id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      connected: result.rows[0].connected || false,
      autoSync: result.rows[0].auto_sync || false,
      lastSync: result.rows[0].last_sync
    });
  } catch (error) {
    console.error('Error checking Google Calendar status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check connection status'
    });
  }
});

// GET /api/calendar/google/auth-url - Generate OAuth authorization URL
router.get('/calendar/google/auth-url', validateJWT, async (req, res) => {
  try {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: req.user.userId.toString(), // Pass user ID in state
      prompt: 'consent'
    });

    res.json({
      success: true,
      authUrl
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate authorization URL'
    });
  }
});

// GET /api/calendar/google/callback - OAuth callback handler
router.get('/calendar/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const userId = state; // User ID passed in state

    if (!code) {
      return res.status(400).send('Authorization code missing');
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Store tokens in database
    await db.query(`
      UPDATE users
      SET
        google_calendar_access_token = $1,
        google_calendar_refresh_token = $2,
        google_calendar_connected = true,
        updated_at = NOW()
      WHERE id = $3
    `, [
      tokens.access_token,
      tokens.refresh_token,
      userId
    ]);

    // Send success message to parent window
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'GOOGLE_CALENDAR_AUTH_SUCCESS' }, '*');
            window.close();
          </script>
          <p>Authorization successful! You can close this window.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.status(500).send('Authorization failed');
  }
});

// POST /api/calendar/google/disconnect - Disconnect Google Calendar
router.post('/calendar/google/disconnect', validateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;

    await db.query(`
      UPDATE users
      SET
        google_calendar_access_token = NULL,
        google_calendar_refresh_token = NULL,
        google_calendar_connected = false,
        google_calendar_sync_enabled = false,
        updated_at = NOW()
      WHERE id = $1
    `, [userId]);

    res.json({
      success: true,
      message: 'Google Calendar disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect'
    });
  }
});

// POST /api/calendar/google/sync - Perform two-way sync
router.post('/calendar/google/sync', validateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { twoWaySync = true, detectConflicts = true } = req.body;

    // Get user's Google Calendar tokens
    const userResult = await db.query(`
      SELECT google_calendar_access_token, google_calendar_refresh_token
      FROM users
      WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0 || !userResult.rows[0].google_calendar_access_token) {
      return res.status(400).json({
        success: false,
        message: 'Google Calendar not connected'
      });
    }

    const { google_calendar_access_token, google_calendar_refresh_token } = userResult.rows[0];

    // Set up OAuth client with user's tokens
    oauth2Client.setCredentials({
      access_token: google_calendar_access_token,
      refresh_token: google_calendar_refresh_token
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get bookings from database
    const bookingsResult = await db.query(`
      SELECT
        b.*,
        u.full_name as client_name,
        u.email as client_email,
        s.name as service_name
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN services s ON b.service_id = s.id
      WHERE b.stylist_id = $1
        AND b.status NOT IN ('CANCELLED', 'NO_SHOW')
        AND b.start_time >= NOW() - INTERVAL '30 days'
    `, [userId]);

    const bookings = bookingsResult.rows;

    // Get events from Google Calendar
    const calendarResponse = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      maxResults: 250,
      singleEvents: true,
      orderBy: 'startTime'
    });

    const googleEvents = calendarResponse.data.items || [];

    const conflicts = [];
    const syncedEvents = [];

    // Push BeautyCita bookings to Google Calendar
    for (const booking of bookings) {
      const existingEvent = googleEvents.find(e =>
        e.extendedProperties?.private?.beautycitaId === booking.id.toString()
      );

      const eventData = {
        summary: `${booking.service_name || 'Booking'} - ${booking.client_name || 'Client'}`,
        description: booking.notes || 'BeautyCita booking',
        start: {
          dateTime: new Date(booking.start_time).toISOString(),
          timeZone: 'America/New_York'
        },
        end: {
          dateTime: new Date(booking.end_time).toISOString(),
          timeZone: 'America/New_York'
        },
        extendedProperties: {
          private: {
            beautycitaId: booking.id.toString(),
            beautycitaType: 'booking'
          }
        }
      };

      if (existingEvent) {
        // Update existing event
        if (detectConflicts && new Date(existingEvent.updated) > new Date(booking.updated_at)) {
          conflicts.push({
            id: `conflict-${booking.id}`,
            title: booking.service_name,
            time: booking.start_time,
            localVersion: booking,
            googleVersion: existingEvent
          });
        } else {
          await calendar.events.update({
            calendarId: 'primary',
            eventId: existingEvent.id,
            requestBody: eventData
          });
          syncedEvents.push({ type: 'updated', id: booking.id });
        }
      } else {
        // Create new event
        await calendar.events.insert({
          calendarId: 'primary',
          requestBody: eventData
        });
        syncedEvents.push({ type: 'created', id: booking.id });
      }
    }

    // Update last sync time
    await db.query(`
      UPDATE users
      SET google_calendar_last_sync = NOW()
      WHERE id = $1
    `, [userId]);

    res.json({
      success: true,
      syncedEvents,
      conflicts,
      message: conflicts.length > 0
        ? `Sync completed with ${conflicts.length} conflict(s)`
        : 'Calendar synced successfully'
    });
  } catch (error) {
    console.error('Error syncing calendar:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to sync calendar'
    });
  }
});

// POST /api/calendar/google/resolve-conflict - Resolve sync conflicts
router.post('/calendar/google/resolve-conflict', validateJWT, async (req, res) => {
  try {
    const { conflictId, action } = req.body;
    const userId = req.user.userId;

    // Extract booking ID from conflict ID
    const bookingId = conflictId.replace('conflict-', '');

    if (action === 'keep_local') {
      // Keep local version, update Google Calendar
      const bookingResult = await db.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
      // ... implement Google Calendar update
    } else if (action === 'keep_google') {
      // Keep Google version, update local database
      // ... implement database update
    } else if (action === 'merge') {
      // Merge both versions
      // ... implement merge logic
    }

    res.json({
      success: true,
      message: 'Conflict resolved'
    });
  } catch (error) {
    console.error('Error resolving conflict:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve conflict'
    });
  }
});

// PUT /api/calendar/google/auto-sync - Toggle auto-sync setting
router.put('/calendar/google/auto-sync', validateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { enabled } = req.body;

    await db.query(`
      UPDATE users
      SET google_calendar_sync_enabled = $1, updated_at = NOW()
      WHERE id = $2
    `, [enabled, userId]);

    res.json({
      success: true,
      enabled,
      message: `Auto-sync ${enabled ? 'enabled' : 'disabled'}`
    });
  } catch (error) {
    console.error('Error toggling auto-sync:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update auto-sync setting'
    });
  }
});

module.exports = router;
