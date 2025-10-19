const express = require('express');
const { query } = require('../db');
const router = express.Router();

// Get all notifications for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const result = await query(`
      SELECT
        n.*,
        b.booking_date,
        b.booking_time,
        b.status as booking_status,
        s.name as service_name
      FROM notifications n
      LEFT JOIN bookings b ON n.related_booking_id = b.id
      LEFT JOIN services s ON b.service_id = s.id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [userId]);

    res.json({
      success: true,
      notifications: result.rows,
      unreadCount: result.rows.filter(n => !n.is_read).length
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get unread count
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const result = await query(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND is_read = false
    `, [userId]);

    res.json({
      success: true,
      count: parseInt(result.rows[0].count)
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Mark notification as read
router.patch('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Verify notification belongs to user
    const checkResult = await query(
      'SELECT user_id FROM notifications WHERE id = $1',
      [notificationId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (checkResult.rows[0].user_id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    await query(
      'UPDATE notifications SET is_read = true WHERE id = $1',
      [notificationId]
    );

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Mark all notifications as read
router.patch('/read-all', async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    await query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete a notification
router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Verify notification belongs to user
    const checkResult = await query(
      'SELECT user_id FROM notifications WHERE id = $1',
      [notificationId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (checkResult.rows[0].user_id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    await query('DELETE FROM notifications WHERE id = $1', [notificationId]);

    res.json({
      success: true,
      message: 'Notification deleted'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create a notification (internal use by other services)
router.post('/', async (req, res) => {
  try {
    const { userId, type, title, message, relatedBookingId } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'userId, type, title, and message are required'
      });
    }

    const result = await query(`
      INSERT INTO notifications (user_id, type, title, message, related_booking_id, is_read, created_at)
      VALUES ($1, $2, $3, $4, $5, false, CURRENT_TIMESTAMP)
      RETURNING *
    `, [userId, type, title, message, relatedBookingId || null]);

    res.status(201).json({
      success: true,
      notification: result.rows[0]
    });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
