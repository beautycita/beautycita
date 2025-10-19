const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { query } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'beautycita-secret-key-2024';

let io;

const initializeSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'https://beautycita.com',
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.userEmail = decoded.email;
      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  });

  // Main connection handler
  io.on('connection', async (socket) => {
    console.log(`✅ User connected: ${socket.userId} (${socket.userRole})`);

    // Join user's personal room for direct messaging
    socket.join(`user:${socket.userId}`);

    // Update stylist availability (if user is a stylist)
    if (socket.userRole === 'STYLIST' || socket.userRole === 'SUPERADMIN') {
      try {
        // Mark stylist as available when they connect
        await query(`
          UPDATE stylists
          SET is_available = true,
              last_seen = NOW()
          WHERE user_id = $1
        `, [socket.userId]);

        console.log(`🟢 Stylist ${socket.userId} is now available`);

        // Emit availability status to all clients searching for stylists
        io.emit('stylist_availability_changed', {
          userId: socket.userId,
          isAvailable: true
        });
      } catch (error) {
        console.error('Error updating stylist availability:', error);
      }
    }

    // Send connection confirmation
    socket.emit('connected', {
      userId: socket.userId,
      role: socket.userRole,
      timestamp: new Date()
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.userId}`);

      // Update stylist availability on disconnect
      if (socket.userRole === 'STYLIST' || socket.userRole === 'SUPERADMIN') {
        try {
          // Mark stylist as unavailable when they disconnect
          await query(`
            UPDATE stylists
            SET is_available = false,
                last_seen = NOW()
            WHERE user_id = $1
          `, [socket.userId]);

          console.log(`🔴 Stylist ${socket.userId} is now unavailable`);

          // Emit availability status
          io.emit('stylist_availability_changed', {
            userId: socket.userId,
            isAvailable: false
          });
        } catch (error) {
          console.error('Error updating stylist availability:', error);
        }
      }
    });
  });

  // Chat namespace
  const chatNamespace = io.of('/chat');
  chatNamespace.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  chatNamespace.on('connection', (socket) => {
    console.log(`💬 Chat connected: ${socket.userId}`);

    // Join conversation rooms
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    // Leave conversation rooms
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
        userId: socket.userId,
        conversationId: data.conversationId
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(`conversation:${data.conversationId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        conversationId: data.conversationId
      });
    });

    // Handle new messages (received from backend API, not directly from client)
    socket.on('message_sent', (data) => {
      // Broadcast to other users in the conversation
      socket.to(`conversation:${data.conversationId}`).emit('new_message', data);
    });

    socket.on('disconnect', () => {
      console.log(`💬 Chat disconnected: ${socket.userId}`);
    });
  });

  // Notifications namespace
  const notificationsNamespace = io.of('/notifications');
  notificationsNamespace.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  notificationsNamespace.on('connection', (socket) => {
    console.log(`🔔 Notifications connected: ${socket.userId}`);
    socket.join(`user:${socket.userId}`);
  });

  // Video namespace for signaling
  const videoNamespace = io.of('/video');
  videoNamespace.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  videoNamespace.on('connection', (socket) => {
    console.log(`📹 Video connected: ${socket.userId}`);

    socket.on('join_room', (roomId) => {
      socket.join(`video:${roomId}`);
      socket.to(`video:${roomId}`).emit('user_joined', {
        userId: socket.userId,
        role: socket.userRole
      });
    });

    socket.on('leave_room', (roomId) => {
      socket.to(`video:${roomId}`).emit('user_left', {
        userId: socket.userId
      });
      socket.leave(`video:${roomId}`);
    });
  });

  console.log('🚀 Socket.io server initialized with namespaces: /, /chat, /notifications, /video');
  return io;
};

// Helper function to emit to specific users
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

// Helper function to emit notifications
const emitNotification = (userId, notification) => {
  if (io) {
    io.of('/notifications').to(`user:${userId}`).emit('notification', notification);
  }
};

// Helper function to emit chat messages
const emitChatMessage = (conversationId, message) => {
  if (io) {
    io.of('/chat').to(`conversation:${conversationId}`).emit('new_message', message);
  }
};

module.exports = {
  initializeSocketServer,
  emitToUser,
  emitNotification,
  emitChatMessage,
  getIO: () => io
};
