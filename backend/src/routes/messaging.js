const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { validateJWT } = require('../middleware/auth');

// All routes require authentication
router.use(validateJWT);

/**
 * Get all conversations for current user
 * GET /api/messages/conversations
 */
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.userId;

    const result = await query(`
      SELECT
        c.id,
        c.conversation_type,
        c.title,
        c.created_at,
        c.updated_at,
        c.related_booking_id,
        -- Get other participant info (for direct messages)
        CASE
          WHEN c.conversation_type = 'DIRECT' THEN (
            SELECT jsonb_build_object(
              'id', u.id,
              'name', u.name,
              'email', u.email,
              'profile_picture_url', u.profile_picture_url,
              'role', u.role
            )
            FROM conversation_participants cp2
            INNER JOIN users u ON cp2.user_id = u.id
            WHERE cp2.conversation_id = c.id AND cp2.user_id != $1
            LIMIT 1
          )
          ELSE NULL
        END as other_participant,
        -- Get last message
        (
          SELECT jsonb_build_object(
            'id', m.id,
            'content', m.content,
            'message_type', m.message_type,
            'created_at', m.created_at,
            'sender_id', m.sender_id
          )
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message,
        -- Get unread count
        get_unread_message_count($1, c.id) as unread_count
      FROM conversations c
      INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE cp.user_id = $1
        AND c.is_active = TRUE
        AND cp.left_at IS NULL
      ORDER BY c.updated_at DESC
    `, [userId]);

    res.json({
      success: true,
      conversations: result.rows
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
});

/**
 * Get or create direct conversation with another user
 * POST /api/messages/conversations/direct
 */
router.post('/conversations/direct', async (req, res) => {
  try {
    const userId = req.userId;
    const { other_user_id } = req.body;

    if (!other_user_id) {
      return res.status(400).json({
        success: false,
        message: 'other_user_id is required'
      });
    }

    // Verify other user exists
    const userCheck = await query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [other_user_id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get or create conversation
    const conversationResult = await query(
      'SELECT get_or_create_direct_conversation($1, $2) as conversation_id',
      [userId, other_user_id]
    );

    const conversationId = conversationResult.rows[0].conversation_id;

    // Get conversation details
    const conversationDetails = await query(`
      SELECT c.*,
             jsonb_build_object(
               'id', u.id,
               'name', u.name,
               'email', u.email,
               'profile_picture_url', u.profile_picture_url
             ) as other_participant
      FROM conversations c
      CROSS JOIN users u
      WHERE c.id = $1 AND u.id = $2
    `, [conversationId, other_user_id]);

    res.json({
      success: true,
      conversation: conversationDetails.rows[0]
    });

  } catch (error) {
    console.error('Get/create direct conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation'
    });
  }
});

/**
 * Get messages for a conversation
 * GET /api/messages/conversations/:id/messages
 */
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.userId;
    const { limit = 50, before_id } = req.query;

    // Verify user is participant
    const participantCheck = await query(
      'SELECT id FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (participantCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build query
    let queryText = `
      SELECT m.*,
             u.name as sender_name,
             u.profile_picture_url as sender_picture
      FROM messages m
      INNER JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1 AND m.is_deleted = FALSE
    `;
    const params = [conversationId];
    let paramCount = 2;

    if (before_id) {
      queryText += ` AND m.id < $${paramCount++}`;
      params.push(before_id);
    }

    queryText += ` ORDER BY m.created_at DESC LIMIT $${paramCount}`;
    params.push(limit);

    const result = await query(queryText, params);

    // Mark messages as read
    await query(
      'SELECT mark_messages_read($1, $2)',
      [userId, conversationId]
    );

    res.json({
      success: true,
      messages: result.rows.reverse() // Return in chronological order
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

/**
 * Send a message in a conversation
 * POST /api/messages/conversations/:id/messages
 */
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.userId;
    const { content, message_type = 'TEXT', attachments, reply_to_message_id } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Verify user is participant
    const participantCheck = await query(
      'SELECT id FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (participantCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Insert message
    const messageResult = await query(`
      INSERT INTO messages (
        conversation_id, sender_id, content, message_type, attachments, reply_to_message_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      conversationId,
      userId,
      content,
      message_type,
      JSON.stringify(attachments || []),
      reply_to_message_id
    ]);

    // Update conversation updated_at
    await query(
      'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [conversationId]
    );

    const message = messageResult.rows[0];

    // Get sender info
    const senderInfo = await query(
      'SELECT name, profile_picture_url FROM users WHERE id = $1',
      [userId]
    );

    const messageWithSender = {
      ...message,
      sender_name: senderInfo.rows[0].name,
      sender_picture: senderInfo.rows[0].profile_picture_url
    };

    // Emit real-time message via Socket.io
    const emitChatMessage = req.app.get('emitChatMessage');
    if (emitChatMessage) {
      emitChatMessage(conversationId, messageWithSender);
    }

    // Get other participants to notify
    const participants = await query(`
      SELECT user_id FROM conversation_participants
      WHERE conversation_id = $1 AND user_id != $2
    `, [conversationId, userId]);

    const emitNotification = req.app.get('emitNotification');
    if (emitNotification) {
      participants.rows.forEach(participant => {
        emitNotification(participant.user_id, {
          type: 'NEW_MESSAGE',
          title: 'New Message',
          message: `${senderInfo.rows[0].name} sent you a message`,
          conversation_id: conversationId,
          created_at: new Date()
        });
      });
    }

    res.status(201).json({
      success: true,
      message: messageWithSender
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

/**
 * Edit a message
 * PUT /api/messages/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.userId;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    // Verify message ownership
    const messageCheck = await query(
      'SELECT sender_id, conversation_id FROM messages WHERE id = $1',
      [messageId]
    );

    if (messageCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (messageCheck.rows[0].sender_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update message
    const result = await query(`
      UPDATE messages
      SET content = $1, is_edited = TRUE, edited_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [content, messageId]);

    res.json({
      success: true,
      message: result.rows[0]
    });

  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to edit message'
    });
  }
});

/**
 * Delete a message
 * DELETE /api/messages/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.userId;

    // Verify message ownership
    const messageCheck = await query(
      'SELECT sender_id FROM messages WHERE id = $1',
      [messageId]
    );

    if (messageCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (messageCheck.rows[0].sender_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Soft delete message
    await query(`
      UPDATE messages
      SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [messageId]);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
});

/**
 * Add reaction to message
 * POST /api/messages/:id/reactions
 */
router.post('/:id/reactions', async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.userId;
    const { reaction_type } = req.body;

    if (!reaction_type) {
      return res.status(400).json({
        success: false,
        message: 'reaction_type is required'
      });
    }

    // Add or update reaction
    const result = await query(`
      INSERT INTO message_reactions (message_id, user_id, reaction_type)
      VALUES ($1, $2, $3)
      ON CONFLICT (message_id, user_id, reaction_type)
      DO UPDATE SET created_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [messageId, userId, reaction_type]);

    res.json({
      success: true,
      reaction: result.rows[0]
    });

  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reaction'
    });
  }
});

/**
 * Remove reaction from message
 * DELETE /api/messages/:id/reactions/:reaction_type
 */
router.delete('/:id/reactions/:reaction_type', async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.userId;
    const { reaction_type } = req.params;

    await query(`
      DELETE FROM message_reactions
      WHERE message_id = $1 AND user_id = $2 AND reaction_type = $3
    `, [messageId, userId, reaction_type]);

    res.json({
      success: true,
      message: 'Reaction removed successfully'
    });

  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove reaction'
    });
  }
});

module.exports = router;
