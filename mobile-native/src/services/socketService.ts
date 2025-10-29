/**
 * BeautyCita Mobile App - Socket.IO Service
 *
 * Handles real-time communication via Socket.IO:
 * - Connection management
 * - Message events
 * - Booking updates
 * - Proximity alerts
 */

import {io, Socket} from 'socket.io-client';
import {API_BASE_URL} from './apiClient';
import {SocketMessage, SocketBookingUpdate, SocketProximityAlert} from '../types';

// ============================================================================
// Socket Service
// ============================================================================

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isManuallyDisconnected = false;

  /**
   * Connect to Socket.IO server
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('[Socket Service] Already connected');
      return;
    }

    console.log('[Socket Service] Connecting to server...');
    this.isManuallyDisconnected = false;

    this.socket = io(API_BASE_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers();
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('[Socket Service] Connected successfully');
      this.reconnectAttempts = 0;
      this.emit('connected', null);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('[Socket Service] Disconnected:', reason);
      this.emit('disconnected', reason);

      // Auto-reconnect if not manually disconnected
      if (!this.isManuallyDisconnected && reason === 'io server disconnect') {
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('[Socket Service] Connection error:', error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[Socket Service] Max reconnection attempts reached');
        this.emit('connection_failed', error);
      }
    });

    // Application events
    this.socket.on('message', (data: SocketMessage) => {
      console.log('[Socket Service] Message received:', data);
      this.emit('message', data);
    });

    this.socket.on('booking:update', (data: SocketBookingUpdate) => {
      console.log('[Socket Service] Booking update:', data);
      this.emit('booking_update', data);
    });

    this.socket.on('booking:new', (data: any) => {
      console.log('[Socket Service] New booking request:', data);
      this.emit('booking_new', data);
    });

    this.socket.on('booking:confirmed', (data: any) => {
      console.log('[Socket Service] Booking confirmed:', data);
      this.emit('booking_confirmed', data);
    });

    this.socket.on('booking:cancelled', (data: any) => {
      console.log('[Socket Service] Booking cancelled:', data);
      this.emit('booking_cancelled', data);
    });

    this.socket.on('proximity:alert', (data: SocketProximityAlert) => {
      console.log('[Socket Service] Proximity alert:', data);
      this.emit('proximity_alert', data);
    });

    this.socket.on('notification', (data: any) => {
      console.log('[Socket Service] Notification received:', data);
      this.emit('notification', data);
    });
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    if (!this.socket) {
      console.log('[Socket Service] Not connected');
      return;
    }

    console.log('[Socket Service] Disconnecting...');
    this.isManuallyDisconnected = true;
    this.socket.disconnect();
    this.socket = null;
    this.listeners.clear();
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Send a message
   */
  sendMessage(bookingId: number, message: string): void {
    if (!this.socket?.connected) {
      console.error('[Socket Service] Cannot send message: Not connected');
      throw new Error('Socket not connected');
    }

    this.socket.emit('message:send', {
      booking_id: bookingId,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Join a booking room (for receiving updates about specific booking)
   */
  joinBookingRoom(bookingId: number): void {
    if (!this.socket?.connected) {
      console.error('[Socket Service] Cannot join room: Not connected');
      return;
    }

    this.socket.emit('booking:join', {booking_id: bookingId});
    console.log(`[Socket Service] Joined booking room: ${bookingId}`);
  }

  /**
   * Leave a booking room
   */
  leaveBookingRoom(bookingId: number): void {
    if (!this.socket?.connected) {
      console.error('[Socket Service] Cannot leave room: Not connected');
      return;
    }

    this.socket.emit('booking:leave', {booking_id: bookingId});
    console.log(`[Socket Service] Left booking room: ${bookingId}`);
  }

  /**
   * Update location (for en route tracking)
   */
  updateLocation(bookingId: number, latitude: number, longitude: number): void {
    if (!this.socket?.connected) {
      console.error('[Socket Service] Cannot update location: Not connected');
      return;
    }

    this.socket.emit('location:update', {
      booking_id: bookingId,
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Mark as typing in chat
   */
  sendTypingIndicator(bookingId: number, isTyping: boolean): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('typing', {
      booking_id: bookingId,
      is_typing: isTyping,
    });
  }

  /**
   * Register event listener
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Emit event to registered listeners
   */
  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[Socket Service] Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Shorthand methods for common events
   */
  onMessage(callback: (data: SocketMessage) => void): void {
    this.on('message', callback);
  }

  onBookingUpdate(callback: (data: SocketBookingUpdate) => void): void {
    this.on('booking_update', callback);
  }

  onBookingNew(callback: (data: any) => void): void {
    this.on('booking_new', callback);
  }

  onBookingConfirmed(callback: (data: any) => void): void {
    this.on('booking_confirmed', callback);
  }

  onBookingCancelled(callback: (data: any) => void): void {
    this.on('booking_cancelled', callback);
  }

  onProximityAlert(callback: (data: SocketProximityAlert) => void): void {
    this.on('proximity_alert', callback);
  }

  onNotification(callback: (data: any) => void): void {
    this.on('notification', callback);
  }

  onConnected(callback: () => void): void {
    this.on('connected', callback);
  }

  onDisconnected(callback: (reason: string) => void): void {
    this.on('disconnected', callback);
  }

  onConnectionFailed(callback: (error: Error) => void): void {
    this.on('connection_failed', callback);
  }

  /**
   * Clear all callbacks (call on unmount/logout)
   */
  clearCallbacks(): void {
    this.listeners.clear();
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

const socketService = new SocketService();
export default socketService;
