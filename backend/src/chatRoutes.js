const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');
const { OpenAI } = require('openai');
require('dotenv').config();

// Initialize logger
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'beautycita-chat' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: '/var/www/beautycita.com/backend/logs/chat.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Also log to the main combined log
    new winston.transports.File({
      filename: '/var/www/beautycita.com/backend/logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// RASA configuration
const RASA_SERVER_URL = process.env.RASA_SERVER_URL || 'http://localhost:5005';
const RASA_API_URL = process.env.RASA_API_URL || 'http://localhost:5555';

// OpenAI configuration - lazy initialization to ensure env vars are loaded
let openai = null;
const getOpenAIClient = () => {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
};

// Athenas Assistant ID
const ATHENAS_ASSISTANT_ID = 'asst_jvHVc2MxrwblkS1KL8wSf9Em';

/**
 * OpenAI Assistant Service for BeautyCita
 * Manages threads and runs for persistent conversations with Athenas
 */
class OpenAIAssistantService {
  constructor() {
    this.assistantId = ATHENAS_ASSISTANT_ID;
  }

  /**
   * Create a new thread for conversation
   */
  async createThread() {
    try {
      const thread = await getOpenAIClient().beta.threads.create();
      logger.info('Created new OpenAI thread', { threadId: thread.id });
      return thread;
    } catch (error) {
      logger.error('Error creating OpenAI thread:', error);
      throw error;
    }
  }

  /**
   * Get or create thread for conversation
   */
  async getOrCreateThread(conversationId, threadId = null) {
    try {
      if (threadId) {
        // Try to retrieve existing thread
        try {
          const thread = await getOpenAIClient().beta.threads.retrieve(threadId);
          return thread;
        } catch (error) {
          logger.warn('Thread not found, creating new one', { threadId, conversationId });
        }
      }

      // Create new thread
      return await this.createThread();
    } catch (error) {
      logger.error('Error getting/creating thread:', error);
      throw error;
    }
  }

  /**
   * Add message to thread and create run
   */
  async sendMessage(threadId, message, language = 'es') {
    try {
      // Create language-specific context instructions
      const languageInstructions = {
        'es': 'Responde SIEMPRE en español (México). Eres Aphrodite, la asistente de belleza de BeautyCita. Tu personalidad es amigable, experta y profesional. Ayudas a los clientes con servicios de belleza, citas, y consejos.',
        'en': 'Respond ALWAYS in English (US). You are Aphrodite, BeautyCita\'s beauty assistant. Your personality is friendly, expert, and professional. You help clients with beauty services, appointments, and advice.'
      };

      // Add language instruction as a system-like message first
      await getOpenAIClient().beta.threads.messages.create(threadId, {
        role: 'user',
        content: `[SYSTEM INSTRUCTION: ${languageInstructions[language] || languageInstructions['es']}]`
      });

      // Add user message to thread
      await getOpenAIClient().beta.threads.messages.create(threadId, {
        role: 'user',
        content: message
      });

      // Create and run
      const run = await getOpenAIClient().beta.threads.runs.create(threadId, {
        assistant_id: this.assistantId
      });

      logger.info('Created OpenAI run', { threadId, runId: run.id, language });
      return run;
    } catch (error) {
      logger.error('Error sending message to OpenAI:', error);
      throw error;
    }
  }

  /**
   * Poll run status until completion
   */
  async pollRunStatus(threadId, runId, maxAttempts = 30, interval = 1000) {
    if (!threadId || !runId) {
      throw new Error(`Missing required parameters: threadId=${threadId}, runId=${runId}`);
    }

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const run = await getOpenAIClient().beta.threads.runs.retrieve(runId, { thread_id: threadId });

        logger.debug('Polling run status', { threadId, runId, status: run.status, attempt });

        if (run.status === 'completed') {
          return run;
        } else if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
          throw new Error(`Run ${run.status}: ${run.last_error?.message || 'Unknown error'}`);
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        logger.error('Error polling run status:', error);
        throw error;
      }
    }

    throw new Error('Run polling timeout');
  }

  /**
   * Get latest messages from thread
   */
  async getLatestMessages(threadId, limit = 1) {
    try {
      const messages = await getOpenAIClient().beta.threads.messages.list(threadId, {
        order: 'desc',
        limit: limit
      });

      return messages.data;
    } catch (error) {
      logger.error('Error getting thread messages:', error);
      throw error;
    }
  }

  /**
   * Main method to get response from Athenas Assistant
   */
  async getAssistantResponse(message, threadId = null, language = 'es') {
    try {
      // Get or create thread
      const thread = await this.getOrCreateThread('temp', threadId);

      // Send message and create run
      const run = await this.sendMessage(thread.id, message, language);

      // Poll until completion
      const completedRun = await this.pollRunStatus(thread.id, run.id);

      // Get the latest assistant message
      const messages = await this.getLatestMessages(thread.id, 1);

      if (messages.length === 0) {
        throw new Error('No response from assistant');
      }

      const assistantMessage = messages[0];
      const textContent = assistantMessage.content.find(content => content.type === 'text');

      if (!textContent) {
        throw new Error('No text content in assistant response');
      }

      return {
        text: textContent.text.value,
        threadId: thread.id,
        runId: completedRun.id
      };

    } catch (error) {
      logger.error('Error getting assistant response:', error);
      throw error;
    }
  }
}

// Initialize the assistant service
const assistantService = new OpenAIAssistantService();

// Log that chat routes are being loaded
logger.info('Chat routes module loaded', {
  timestamp: new Date().toISOString(),
  module: 'chatRoutes'
});

// Middleware to log all requests to chat routes
router.use((req, res, next) => {
  logger.info('Chat API request', {
    method: req.method,
    url: req.url,
    path: req.path,
    body: req.method === 'POST' ? req.body : undefined,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

async function getOpenAIFallbackResponse(message, conversationId = null, threadId = null, language = 'es') {
  try {
    const response = await assistantService.getAssistantResponse(message, threadId, language);

    // Update conversation with thread ID if provided
    if (conversationId && conversations.has(conversationId)) {
      const conversation = conversations.get(conversationId);
      conversation.openaiThreadId = response.threadId;
      conversations.set(conversationId, conversation);
    }

    return response.text;
  } catch (error) {
    logger.error('OpenAI Assistant fallback error:', error);

    // Language-specific fallback error messages
    const fallbackMessages = {
      'es': 'Disculpa, estoy teniendo problemas técnicos. ¿Podrías intentar de nuevo en un momento? 💄',
      'en': "Sorry, I'm having technical issues. Could you try again in a moment? 💄"
    };

    return fallbackMessages[language] || fallbackMessages['es'];
  }
}

// In-memory conversation storage (in production, use Redis or database)
const conversations = new Map();

// Middleware to check if user is authenticated (optional for chat)
const optionalAuth = (req, res, next) => {
  // Chat can work for anonymous users, but we can track sessions
  if (!req.sessionID) {
    req.sessionID = uuidv4();
  }
  next();
};

/**
 * POST /api/chat/conversation
 * Initialize a new conversation
 */
router.post('/conversation', optionalAuth, async (req, res) => {
  try {
    const { language = 'es' } = req.body; // Default to Spanish
    const conversationId = uuidv4();
    const sessionId = req.sessionID || req.user?.id || uuidv4();

    // Store conversation metadata
    const conversationData = {
      id: conversationId,
      sessionId: sessionId,
      userId: req.user?.id || null,
      language: language, // Store language preference
      createdAt: new Date(),
      lastActivity: new Date(),
      messageCount: 0,
      status: 'active',
      openaiThreadId: null // Will be set when first OpenAI interaction occurs
    };

    conversations.set(conversationId, conversationData);

    logger.info('New conversation created', {
      conversationId,
      sessionId,
      language,
      userId: req.user?.id || 'anonymous'
    });

    // Language-specific welcome messages
    const welcomeMessages = {
      'es': '¡Hola! Soy Aphrodite, tu asistente de belleza. ¿En qué puedo ayudarte hoy?',
      'en': "Hi! I'm Aphrodite, your beauty assistant. How can I help you today?"
    };

    res.json({
      success: true,
      data: {
        conversationId: conversationId,
        status: 'active',
        welcomeMessage: welcomeMessages[language] || welcomeMessages['es']
      }
    });

  } catch (error) {
    logger.error('Error creating conversation', {
      error: error.message,
      stack: error.stack
    });

    // Language-specific error messages
    const errorMessages = {
      'es': 'Error al inicializar la conversación',
      'en': 'Error initializing conversation'
    };

    res.status(500).json({
      success: false,
      error: errorMessages[req.body?.language || 'es']
    });
  }
});

/**
 * POST /api/chat/message
 * Send a message to RASA and get response
 */
router.post('/message', optionalAuth, async (req, res) => {
  try {
    const { conversationId, message, language = 'es' } = req.body;

    if (!conversationId || !message) {
      const errorMessages = {
        'es': 'conversationId y message son requeridos',
        'en': 'conversationId and message are required'
      };

      return res.status(400).json({
        success: false,
        error: errorMessages[language] || errorMessages['es']
      });
    }

    // Check if conversation exists
    const conversation = conversations.get(conversationId);
    if (!conversation) {
      const errorMessages = {
        'es': 'Conversación no encontrada',
        'en': 'Conversation not found'
      };

      return res.status(404).json({
        success: false,
        error: errorMessages[language] || errorMessages['es']
      });
    }

    // Update conversation activity and language preference
    conversation.lastActivity = new Date();
    conversation.messageCount += 1;
    conversation.language = language; // Update language in case it changed

    logger.info('Sending message to RASA', {
      conversationId,
      messageLength: message.length,
      userId: req.user?.id || 'anonymous'
    });

    // Prepare message for RASA
    const rasaMessage = {
      sender: conversationId,
      message: message,
      metadata: {
        userId: req.user?.id,
        timestamp: new Date().toISOString(),
        sessionId: conversation.sessionId
      }
    };

    // Try to send to RASA server
    let botResponses = [];
    try {
      const rasaResponse = await axios.post(
        `${RASA_SERVER_URL}/webhooks/rest/webhook`,
        rasaMessage,
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (rasaResponse.data && Array.isArray(rasaResponse.data)) {
        botResponses = rasaResponse.data.map(response => ({
          id: uuidv4(),
          text: response.text || response.message || 'Lo siento, no pude procesar tu mensaje.',
          buttons: response.buttons || null,
          image: response.image || null,
          attachment: response.attachment || null
        }));
      }
    } catch (rasaError) {
      logger.error('RASA server error', {
        error: rasaError.message,
        conversationId,
        rasaUrl: RASA_SERVER_URL
      });

      // Enhanced fallback with OpenAI when RASA is unavailable
      logger.info('Using OpenAI fallback for message:', { message });

      const openaiResponse = await getOpenAIFallbackResponse(
        message,
        conversationId,
        conversation.openaiThreadId,
        language
      );

      // Language-specific buttons
      const buttonLabels = {
        'es': [
          { title: 'Agendar Cita 📅', payload: '/book_appointment' },
          { title: 'Ver Servicios 💄', payload: '/services' },
          { title: 'Precios 💰', payload: '/prices' }
        ],
        'en': [
          { title: 'Book Appointment 📅', payload: '/book_appointment' },
          { title: 'View Services 💄', payload: '/services' },
          { title: 'Prices 💰', payload: '/prices' }
        ]
      };

      botResponses = [{
        id: uuidv4(),
        text: openaiResponse,
        buttons: buttonLabels[language] || buttonLabels['es']
      }];
    }

    // If no responses, use OpenAI as final fallback
    if (botResponses.length === 0) {
      logger.info('No RASA response, using OpenAI fallback');

      const openaiResponse = await getOpenAIFallbackResponse(
        message,
        conversationId,
        conversation.openaiThreadId,
        language
      );

      // Language-specific buttons
      const buttonLabels = {
        'es': [
          { title: 'Agendar Cita 📅', payload: '/book_appointment' },
          { title: 'Ver Servicios 💄', payload: '/services' },
          { title: 'Precios 💰', payload: '/prices' }
        ],
        'en': [
          { title: 'Book Appointment 📅', payload: '/book_appointment' },
          { title: 'View Services 💄', payload: '/services' },
          { title: 'Prices 💰', payload: '/prices' }
        ]
      };

      botResponses = [{
        id: uuidv4(),
        text: openaiResponse,
        buttons: buttonLabels[language] || buttonLabels['es']
      }];
    }

    logger.info('Chat response generated', {
      conversationId,
      responseCount: botResponses.length,
      userId: req.user?.id || 'anonymous'
    });

    res.json({
      success: true,
      data: {
        conversationId: conversationId,
        botResponses: botResponses,
        messageId: uuidv4(),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error processing chat message', {
      error: error.message,
      stack: error.stack,
      conversationId: req.body?.conversationId
    });

    // Language-specific error messages
    const errorMessages = {
      'es': 'Error al procesar el mensaje',
      'en': 'Error processing message'
    };

    res.status(500).json({
      success: false,
      error: errorMessages[req.body?.language || 'es']
    });
  }
});

/**
 * GET /api/chat/conversation/:conversationId
 * Get conversation history
 */
router.get('/conversation/:conversationId', optionalAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = conversations.get(conversationId);
    if (!conversation) {
      // Try to get language from query params if available
      const language = req.query.language || 'es';
      const errorMessages = {
        'es': 'Conversación no encontrada',
        'en': 'Conversation not found'
      };

      return res.status(404).json({
        success: false,
        error: errorMessages[language] || errorMessages['es']
      });
    }

    res.json({
      success: true,
      data: {
        conversationId: conversationId,
        status: conversation.status,
        messageCount: conversation.messageCount,
        createdAt: conversation.createdAt,
        lastActivity: conversation.lastActivity
      }
    });

  } catch (error) {
    logger.error('Error retrieving conversation', {
      error: error.message,
      conversationId: req.params.conversationId
    });

    // Language-specific error messages
    const language = req.query.language || 'es';
    const errorMessages = {
      'es': 'Error al obtener la conversación',
      'en': 'Error retrieving conversation'
    };

    res.status(500).json({
      success: false,
      error: errorMessages[language] || errorMessages['es']
    });
  }
});

/**
 * GET /api/chat/health
 * Check chat service health
 */
router.get('/health', async (req, res) => {
  try {
    let rasaHealth = 'unknown';
    try {
      const response = await axios.get(`${RASA_SERVER_URL}/`, { timeout: 5000 });
      rasaHealth = response.status === 200 ? 'healthy' : 'unhealthy';
    } catch (error) {
      rasaHealth = 'unhealthy';
    }

    res.json({
      success: true,
      data: {
        status: 'healthy',
        conversationsActive: conversations.size,
        rasaServer: rasaHealth,
        rasaUrl: RASA_SERVER_URL,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error checking chat health'
    });
  }
});

// Cleanup old conversations (run periodically)
setInterval(() => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  for (const [id, conversation] of conversations.entries()) {
    if (conversation.lastActivity < oneHourAgo) {
      conversations.delete(id);
      logger.info('Cleaned up inactive conversation', { conversationId: id });
    }
  }
}, 15 * 60 * 1000); // Run every 15 minutes

module.exports = router;