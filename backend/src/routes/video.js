const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { validateJWT } = require('../middleware/auth');
const twilio = require('twilio');

// Initialize Twilio client (lazy initialization to avoid startup errors)
let twilioClient = null;

const getTwilioClient = () => {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    if (!accountSid.startsWith('AC')) {
      throw new Error('Invalid Twilio Account SID. Must start with AC. Check your environment variables.');
    }

    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
};

// All routes require authentication
router.use(validateJWT);

/**
 * Create a video consultation room
 * POST /api/video/consultations
 */
router.post('/consultations', async (req, res) => {
  try {
    const { client_id, scheduled_at, booking_id } = req.body;
    const host_id = req.userId;

    // Validate required fields
    if (!client_id || !scheduled_at) {
      return res.status(400).json({
        success: false,
        message: 'client_id and scheduled_at are required'
      });
    }

    // Verify client exists
    const clientCheck = await query(
      'SELECT id FROM users WHERE id = $1 AND role = $2',
      [client_id, 'CLIENT']
    );

    if (clientCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Create unique room name
    const roomName = `consultation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Create Twilio room
      const client = getTwilioClient();
      const room = await client.video.v1.rooms.create({
        uniqueName: roomName,
        type: 'group',
        maxParticipants: 10,
        recordParticipantsOnConnect: false,
        statusCallback: `${process.env.API_URL}/api/video/webhooks/room-status`
      });

      // Save consultation to database
      const consultationResult = await query(`
        INSERT INTO video_consultations (
          booking_id, host_id, client_id, twilio_room_sid,
          room_name, scheduled_at, status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'SCHEDULED')
        RETURNING *
      `, [
        booking_id,
        host_id,
        client_id,
        room.sid,
        roomName,
        scheduled_at
      ]);

      // Send notification to client
      const emitNotification = req.app.get('emitNotification');
      if (emitNotification) {
        emitNotification(client_id, {
          type: 'VIDEO_CONSULTATION_SCHEDULED',
          title: 'Video Consultation Scheduled',
          message: 'A video consultation has been scheduled with you',
          consultation_id: consultationResult.rows[0].id,
          scheduled_at: scheduled_at,
          created_at: new Date()
        });
      }

      res.status(201).json({
        success: true,
        message: 'Video consultation created successfully',
        consultation: consultationResult.rows[0]
      });

    } catch (twilioError) {
      console.error('Twilio room creation error:', twilioError);
      res.status(500).json({
        success: false,
        message: 'Failed to create video room',
        error: twilioError.message
      });
    }

  } catch (error) {
    console.error('Create video consultation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create video consultation'
    });
  }
});

/**
 * Get access token for joining a video room
 * POST /api/video/consultations/:id/token
 */
router.post('/consultations/:id/token', async (req, res) => {
  try {
    const consultationId = req.params.id;
    const userId = req.userId;

    // Get consultation details
    const consultationResult = await query(`
      SELECT vc.*, u1.name as host_name, u2.name as client_name
      FROM video_consultations vc
      INNER JOIN users u1 ON vc.host_id = u1.id
      INNER JOIN users u2 ON vc.client_id = u2.id
      WHERE vc.id = $1
    `, [consultationId]);

    if (consultationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    const consultation = consultationResult.rows[0];

    // Verify user is authorized to join
    if (consultation.host_id !== userId && consultation.client_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Generate Twilio access token
    const { AccessToken } = twilio.jwt;
    const { VideoGrant } = AccessToken;

    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY || process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_SECRET || process.env.TWILIO_AUTH_TOKEN
    );

    // Set token identity
    token.identity = `user-${userId}`;

    // Grant video access
    const videoGrant = new VideoGrant({
      room: consultation.room_name
    });

    token.addGrant(videoGrant);

    // Update consultation status if starting
    if (consultation.status === 'SCHEDULED') {
      await query(`
        UPDATE video_consultations
        SET status = 'IN_PROGRESS', started_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [consultationId]);
    }

    // Track participant join
    await query(`
      INSERT INTO video_participants (
        consultation_id, user_id, twilio_identity, joined_at
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (consultation_id, user_id)
      DO UPDATE SET joined_at = CURRENT_TIMESTAMP, left_at = NULL
    `, [consultationId, userId, `user-${userId}`]);

    res.json({
      success: true,
      token: token.toJwt(),
      roomName: consultation.room_name,
      identity: `user-${userId}`,
      consultation: consultation
    });

  } catch (error) {
    console.error('Get video token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate video token'
    });
  }
});

/**
 * End a video consultation
 * POST /api/video/consultations/:id/end
 */
router.post('/consultations/:id/end', async (req, res) => {
  try {
    const consultationId = req.params.id;
    const userId = req.userId;
    const { consultation_notes } = req.body;

    // Get consultation
    const consultationResult = await query(
      'SELECT * FROM video_consultations WHERE id = $1',
      [consultationId]
    );

    if (consultationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    const consultation = consultationResult.rows[0];

    // Verify user is host or client
    if (consultation.host_id !== userId && consultation.client_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Complete the Twilio room
    try {
      const client = getTwilioClient();
      await client.video.v1.rooms(consultation.twilio_room_sid)
        .update({ status: 'completed' });
    } catch (twilioError) {
      console.error('Twilio room completion error:', twilioError);
      // Continue even if Twilio fails
    }

    // Calculate duration
    const duration = consultation.started_at
      ? Math.floor((new Date() - new Date(consultation.started_at)) / 60000)
      : 0;

    // Update consultation
    await query(`
      UPDATE video_consultations
      SET status = 'COMPLETED',
          ended_at = CURRENT_TIMESTAMP,
          duration_minutes = $1,
          consultation_notes = $2
      WHERE id = $3
    `, [duration, consultation_notes, consultationId]);

    // Update participant left_at
    await query(`
      UPDATE video_participants
      SET left_at = CURRENT_TIMESTAMP
      WHERE consultation_id = $1 AND user_id = $2 AND left_at IS NULL
    `, [consultationId, userId]);

    res.json({
      success: true,
      message: 'Video consultation ended successfully',
      duration_minutes: duration
    });

  } catch (error) {
    console.error('End video consultation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end video consultation'
    });
  }
});

/**
 * Get all video consultations for current user
 * GET /api/video/consultations
 */
router.get('/consultations', async (req, res) => {
  try {
    const userId = req.userId;
    const { status } = req.query;

    let queryText = `
      SELECT vc.*,
             u_host.name as host_name,
             u_client.name as client_name,
             b.booking_date, b.booking_time
      FROM video_consultations vc
      INNER JOIN users u_host ON vc.host_id = u_host.id
      INNER JOIN users u_client ON vc.client_id = u_client.id
      LEFT JOIN bookings b ON vc.booking_id = b.id
      WHERE (vc.host_id = $1 OR vc.client_id = $1)
    `;

    const params = [userId];

    if (status) {
      queryText += ' AND vc.status = $2';
      params.push(status);
    }

    queryText += ' ORDER BY vc.scheduled_at DESC';

    const result = await query(queryText, params);

    res.json({
      success: true,
      consultations: result.rows
    });

  } catch (error) {
    console.error('Get video consultations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch video consultations'
    });
  }
});

/**
 * Get specific video consultation details
 * GET /api/video/consultations/:id
 */
router.get('/consultations/:id', async (req, res) => {
  try {
    const consultationId = req.params.id;
    const userId = req.userId;

    const consultationResult = await query(`
      SELECT vc.*,
             u_host.name as host_name, u_host.email as host_email,
             u_client.name as client_name, u_client.email as client_email,
             b.booking_date, b.booking_time
      FROM video_consultations vc
      INNER JOIN users u_host ON vc.host_id = u_host.id
      INNER JOIN users u_client ON vc.client_id = u_client.id
      LEFT JOIN bookings b ON vc.booking_id = b.id
      WHERE vc.id = $1
    `, [consultationId]);

    if (consultationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    const consultation = consultationResult.rows[0];

    // Verify access
    if (consultation.host_id !== userId && consultation.client_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get participants
    const participantsResult = await query(`
      SELECT vp.*, u.name as user_name
      FROM video_participants vp
      INNER JOIN users u ON vp.user_id = u.id
      WHERE vp.consultation_id = $1
      ORDER BY vp.joined_at ASC
    `, [consultationId]);

    consultation.participants = participantsResult.rows;

    res.json({
      success: true,
      consultation: consultation
    });

  } catch (error) {
    console.error('Get consultation details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consultation details'
    });
  }
});

/**
 * Webhook endpoint for Twilio room status updates
 * POST /api/video/webhooks/room-status
 *
 * Twilio sends callbacks for these events:
 * - room-created: Room was created
 * - participant-connected: Participant joined
 * - participant-disconnected: Participant left
 * - room-ended: Room was ended
 */
router.post('/webhooks/room-status', async (req, res) => {
  try {
    const {
      StatusCallbackEvent,
      RoomSid,
      RoomName,
      RoomStatus,
      RoomType,
      ParticipantSid,
      ParticipantIdentity,
      ParticipantStatus,
      Timestamp
    } = req.body;

    console.log('📹 Twilio Video Webhook:', {
      event: StatusCallbackEvent,
      roomSid: RoomSid,
      roomName: RoomName,
      roomStatus: RoomStatus,
      participantIdentity: ParticipantIdentity,
      participantStatus: ParticipantStatus,
      timestamp: Timestamp
    });

    // Handle different webhook events
    switch (StatusCallbackEvent) {
      case 'room-created':
        await query(`
          UPDATE video_consultations
          SET status = 'IN_PROGRESS', started_at = CURRENT_TIMESTAMP
          WHERE twilio_room_sid = $1
        `, [RoomSid]);
        break;

      case 'participant-connected':
        console.log(`✅ Participant ${ParticipantIdentity} joined room ${RoomName}`);
        // Track participant connection if needed
        break;

      case 'participant-disconnected':
        console.log(`❌ Participant ${ParticipantIdentity} left room ${RoomName}`);
        // Track participant disconnection if needed
        break;

      case 'room-ended':
        await query(`
          UPDATE video_consultations
          SET status = 'COMPLETED', ended_at = CURRENT_TIMESTAMP
          WHERE twilio_room_sid = $1 AND status != 'COMPLETED'
        `, [RoomSid]);
        console.log(`🏁 Room ${RoomName} (${RoomSid}) ended`);
        break;

      default:
        console.log(`⚠️ Unknown Twilio event: ${StatusCallbackEvent}`);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ success: true });

  } catch (error) {
    console.error('❌ Twilio webhook error:', error);
    // Still return 200 to prevent Twilio from retrying
    res.status(200).json({ success: false, error: error.message });
  }
});

module.exports = router;
