import express from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import { optionalAuth } from '../middleware/auth.js';
import { query, withTransaction } from '../services/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Create or get chat conversation
router.post('/conversation',
  optionalAuth,
  body('sessionId').optional().isUUID(),
  validateRequest,
  async (req, res, next) => {
    try {
      const { sessionId } = req.body;
      const userId = req.user?.id || null;

      let conversationId;

      if (sessionId) {
        // Check if conversation exists
        const existingResult = await query(`
          SELECT id FROM chat_conversations
          WHERE session_id = $1
        `, [sessionId]);

        if (existingResult.rows.length > 0) {
          conversationId = existingResult.rows[0].id;
        }
      }

      if (!conversationId) {
        // Create new conversation
        conversationId = uuidv4();
        const newSessionId = sessionId || uuidv4();

        await query(`
          INSERT INTO chat_conversations (id, user_id, session_id)
          VALUES ($1, $2, $3)
        `, [conversationId, userId, newSessionId]);

        return res.status(201).json({
          conversationId,
          sessionId: newSessionId,
          isNew: true
        });
      }

      // Update last activity
      await query(`
        UPDATE chat_conversations
        SET last_activity = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [conversationId]);

      res.json({
        conversationId,
        sessionId,
        isNew: false
      });

    } catch (error) {
      next(error);
    }
  }
);

// Send message to RASA and store conversation
router.post('/message',
  optionalAuth,
  body('conversationId').isUUID().withMessage('Valid conversation ID is required'),
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1 and 1000 characters'),
  validateRequest,
  async (req, res, next) => {
    try {
      const { conversationId, message } = req.body;
      const userId = req.user?.id || null;

      const result = await withTransaction(async (client) => {
        // Verify conversation exists and belongs to user (if authenticated)
        const conversationResult = await client.query(`
          SELECT id, session_id, user_id FROM chat_conversations
          WHERE id = $1
        `, [conversationId]);

        if (conversationResult.rows.length === 0) {
          throw new Error('Conversation not found');
        }

        const conversation = conversationResult.rows[0];

        // If user is authenticated, ensure conversation belongs to them
        if (userId && conversation.user_id && conversation.user_id !== userId) {
          throw new Error('Unauthorized access to conversation');
        }

        // Store user message
        const userMessageId = uuidv4();
        await client.query(`
          INSERT INTO chat_messages (id, conversation_id, sender_type, message_text)
          VALUES ($1, $2, 'USER', $3)
        `, [userMessageId, conversationId, message]);

        // Send message to RASA
        try {
          const rasaResponse = await fetch(`${process.env.RASA_SERVER_URL || 'http://localhost:5005'}/webhooks/rest/webhook`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sender: conversation.session_id,
              message: message
            })
          });

          if (!rasaResponse.ok) {
            throw new Error('RASA server error');
          }

          const rasaData = await rasaResponse.json();

          // Store bot responses
          const botResponses = [];
          for (const response of rasaData) {
            const botMessageId = uuidv4();
            await client.query(`
              INSERT INTO chat_messages (id, conversation_id, sender_type, message_text, message_data)
              VALUES ($1, $2, 'BOT', $3, $4)
            `, [botMessageId, conversationId, response.text || '', JSON.stringify(response)]);

            botResponses.push({
              id: botMessageId,
              text: response.text,
              buttons: response.buttons,
              image: response.image,
              attachment: response.attachment,
              custom: response.custom
            });
          }

          // Update conversation stats
          await client.query(`
            UPDATE chat_conversations
            SET
              message_count = message_count + 1,
              last_activity = CURRENT_TIMESTAMP
            WHERE id = $1
          `, [conversationId]);

          return {
            userMessage: {
              id: userMessageId,
              text: message,
              timestamp: new Date().toISOString()
            },
            botResponses
          };

        } catch (rasaError) {
          console.error('RASA error:', rasaError);

          // Store fallback bot response
          const fallbackMessageId = uuidv4();
          await client.query(`
            INSERT INTO chat_messages (id, conversation_id, sender_type, message_text)
            VALUES ($1, $2, 'BOT', $3)
          `, [fallbackMessageId, conversationId, 'Lo siento, tengo problemas técnicos en este momento. Por favor, intenta de nuevo más tarde.']);

          return {
            userMessage: {
              id: userMessageId,
              text: message,
              timestamp: new Date().toISOString()
            },
            botResponses: [{
              id: fallbackMessageId,
              text: 'Lo siento, tengo problemas técnicos en este momento. Por favor, intenta de nuevo más tarde.'
            }]
          };
        }
      });

      res.json(result);

    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: error.message,
          code: 'CONVERSATION_NOT_FOUND'
        });
      }
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          error: error.message,
          code: 'UNAUTHORIZED'
        });
      }
      next(error);
    }
  }
);

// Get conversation history
router.get('/conversation/:id/messages',
  param('id').isUUID().withMessage('Valid conversation ID is required'),
  optionalAuth,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || null;

      // Verify conversation access
      const conversationResult = await query(`
        SELECT id, user_id FROM chat_conversations
        WHERE id = $1
      `, [id]);

      if (conversationResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Conversation not found',
          code: 'CONVERSATION_NOT_FOUND'
        });
      }

      const conversation = conversationResult.rows[0];

      // If user is authenticated, ensure conversation belongs to them
      if (userId && conversation.user_id && conversation.user_id !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to conversation',
          code: 'UNAUTHORIZED'
        });
      }

      // Get messages
      const messagesResult = await query(`
        SELECT
          id,
          sender_type,
          message_text,
          message_data,
          timestamp
        FROM chat_messages
        WHERE conversation_id = $1
        ORDER BY timestamp ASC
      `, [id]);

      res.json({
        conversationId: id,
        messages: messagesResult.rows.map(msg => ({
          id: msg.id,
          senderType: msg.sender_type,
          text: msg.message_text,
          data: msg.message_data,
          timestamp: msg.timestamp
        }))
      });

    } catch (error) {
      next(error);
    }
  }
);

// Get user's conversation list (authenticated users only)
router.get('/conversations',
  optionalAuth,
  async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const result = await query(`
        SELECT
          c.id,
          c.session_id,
          c.message_count,
          c.last_activity,
          c.created_at,
          -- Get last message
          (
            SELECT message_text
            FROM chat_messages
            WHERE conversation_id = c.id
            ORDER BY timestamp DESC
            LIMIT 1
          ) as last_message
        FROM chat_conversations c
        WHERE c.user_id = $1
        ORDER BY c.last_activity DESC
        LIMIT 50
      `, [req.user.id]);

      res.json({
        conversations: result.rows
      });

    } catch (error) {
      next(error);
    }
  }
);

// Health check for chat service
router.get('/health', async (req, res) => {
  try {
    // Check RASA server connectivity
    const rasaResponse = await fetch(`${process.env.RASA_SERVER_URL || 'http://localhost:5005'}/`, {
      method: 'GET',
      timeout: 5000
    });

    const rasaHealthy = rasaResponse.ok;

    res.json({
      service: 'chat',
      status: rasaHealthy ? 'healthy' : 'degraded',
      rasa: {
        status: rasaHealthy ? 'connected' : 'disconnected',
        url: process.env.RASA_SERVER_URL || 'http://localhost:5005'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      service: 'chat',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;