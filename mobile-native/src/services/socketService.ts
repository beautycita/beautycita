/**
 * Socket Service
 * Manages Socket.IO connection for real-time chat
 * Handles message sending, receiving, and connection state
 */

import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: number;
  receiverId: number;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: number[];
  lastMessage?: ChatMessage;
  unreadCount: number;
}

export interface TypingStatus {
  conversationId: string;
  userId: number;
  isTyping: boolean;
}

type MessageCallback = (message: ChatMessage) => void;
type TypingCallback = (status: TypingStatus) => void;
type ConversationCallback = (conversation: Conversation) => void;
type ConnectionCallback = () => void;

/**
 * Socket Service Class
 * Singleton pattern for socket connection management
 */
class SocketService {
  private socket: Socket | null = null;
  private messageCallbacks: Set<MessageCallback> = new Set();
  private typingCallbacks: Set<TypingCallback> = new Set();
  private conversationCallbacks: Set<ConversationCallback> = new Set();
  private connectCallbacks: Set<ConnectionCallback> = new Set();
  private disconnectCallbacks: Set<ConnectionCallback> = new Set();
  private userId: number | null = null;

  /**
   * Initialize socket connection
   */
  public connect(userId: number, token: string): void {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.userId = userId;

    // Create socket connection
    this.socket = io(API_URL, {
      auth: {
        token,
        userId,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Setup event listeners
    this.setupListeners();

    console.log('Socket connecting...');
  }

  /**
   * Disconnect socket
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
      console.log('Socket disconnected');
    }
  }

  /**
   * Check if socket is connected
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Setup socket event listeners
   */
  private setupListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.connectCallbacks.forEach((cb) => cb());
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.disconnectCallbacks.forEach((cb) => cb());
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Chat events
    this.socket.on('message:received', (message: ChatMessage) => {
      console.log('Message received:', message);
      this.messageCallbacks.forEach((cb) => cb(message));
    });

    this.socket.on('typing:status', (status: TypingStatus) => {
      console.log('Typing status:', status);
      this.typingCallbacks.forEach((cb) => cb(status));
    });

    this.socket.on('conversation:updated', (conversation: Conversation) => {
      console.log('Conversation updated:', conversation);
      this.conversationCallbacks.forEach((cb) => cb(conversation));
    });
  }

  /**
   * Send a message
   */
  public sendMessage(
    conversationId: string,
    receiverId: number,
    message: string
  ): void {
    if (!this.socket || !this.userId) {
      console.error('Socket not connected or user ID not set');
      return;
    }

    const messageData = {
      conversationId,
      senderId: this.userId,
      receiverId,
      message,
      timestamp: new Date().toISOString(),
    };

    this.socket.emit('message:send', messageData);
    console.log('Message sent:', messageData);
  }

  /**
   * Send typing indicator
   */
  public sendTyping(conversationId: string, isTyping: boolean): void {
    if (!this.socket || !this.userId) {
      console.error('Socket not connected or user ID not set');
      return;
    }

    this.socket.emit('typing:update', {
      conversationId,
      userId: this.userId,
      isTyping,
    });
  }

  /**
   * Mark message as read
   */
  public markMessageRead(messageId: string): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('message:read', { messageId });
  }

  /**
   * Mark all messages in conversation as read
   */
  public markConversationRead(conversationId: string): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('conversation:read', { conversationId });
  }

  /**
   * Join a conversation room
   */
  public joinConversation(conversationId: string): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('conversation:join', { conversationId });
    console.log('Joined conversation:', conversationId);
  }

  /**
   * Leave a conversation room
   */
  public leaveConversation(conversationId: string): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('conversation:leave', { conversationId });
    console.log('Left conversation:', conversationId);
  }

  /**
   * Register callback for new messages
   */
  public onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.add(callback);
    // Return unsubscribe function
    return () => {
      this.messageCallbacks.delete(callback);
    };
  }

  /**
   * Register callback for typing status
   */
  public onTyping(callback: TypingCallback): () => void {
    this.typingCallbacks.add(callback);
    return () => {
      this.typingCallbacks.delete(callback);
    };
  }

  /**
   * Register callback for conversation updates
   */
  public onConversationUpdate(callback: ConversationCallback): () => void {
    this.conversationCallbacks.add(callback);
    return () => {
      this.conversationCallbacks.delete(callback);
    };
  }

  /**
   * Register callback for connection
   */
  public onConnect(callback: ConnectionCallback): () => void {
    this.connectCallbacks.add(callback);
    return () => {
      this.connectCallbacks.delete(callback);
    };
  }

  /**
   * Register callback for disconnection
   */
  public onDisconnect(callback: ConnectionCallback): () => void {
    this.disconnectCallbacks.add(callback);
    return () => {
      this.disconnectCallbacks.delete(callback);
    };
  }

  /**
   * Clear all callbacks
   */
  public clearCallbacks(): void {
    this.messageCallbacks.clear();
    this.typingCallbacks.clear();
    this.conversationCallbacks.clear();
    this.connectCallbacks.clear();
    this.disconnectCallbacks.clear();
  }
}

// Export singleton instance
export const socketService = new SocketService();

export default socketService;
