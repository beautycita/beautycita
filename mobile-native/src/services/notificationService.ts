/**
 * BeautyCita Mobile App - Notification Service
 *
 * Handles push notifications via OneSignal:
 * - Initialize OneSignal
 * - Register device
 * - Handle notification received
 * - Handle notification opened
 * - Manage notification permissions
 */

import OneSignal from 'react-native-onesignal';
import {Platform} from 'react-native';
import {Notification} from '../types';

// ============================================================================
// Configuration
// ============================================================================

// Replace with your actual OneSignal App ID
const ONESIGNAL_APP_ID = 'YOUR_ONESIGNAL_APP_ID';

// ============================================================================
// Notification Service
// ============================================================================

class NotificationService {
  private isInitialized = false;
  private notificationReceivedCallbacks: Set<Function> = new Set();
  private notificationOpenedCallbacks: Set<Function> = new Set();

  /**
   * Initialize OneSignal
   */
  async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) {
      console.log('[Notification Service] Already initialized');
      return;
    }

    try {
      console.log('[Notification Service] Initializing OneSignal...');

      // Initialize OneSignal
      OneSignal.setAppId(ONESIGNAL_APP_ID);

      // Set external user ID if provided
      if (userId) {
        OneSignal.setExternalUserId(userId);
      }

      // iOS: Prompt for push notification permission
      if (Platform.OS === 'ios') {
        OneSignal.promptForPushNotificationsWithUserResponse(response => {
          console.log('[Notification Service] iOS permission response:', response);
        });
      }

      // Setup event handlers
      this.setupEventHandlers();

      this.isInitialized = true;
      console.log('[Notification Service] Initialized successfully');
    } catch (error) {
      console.error('[Notification Service] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Setup OneSignal event handlers
   */
  private setupEventHandlers(): void {
    // Notification received (in-app)
    OneSignal.setNotificationWillShowInForegroundHandler(notificationReceivedEvent => {
      console.log('[Notification Service] Notification received:', notificationReceivedEvent);

      const notification = notificationReceivedEvent.getNotification();
      const data = notification.additionalData;

      // Create standardized notification object
      const formattedNotification: Notification = {
        id: notification.notificationId || '',
        type: data?.type || 'MESSAGE',
        title: notification.title || '',
        message: notification.body || '',
        data: data || {},
        read: false,
        created_at: new Date().toISOString(),
      };

      // Notify listeners
      this.notificationReceivedCallbacks.forEach(callback => {
        try {
          callback(formattedNotification);
        } catch (error) {
          console.error('[Notification Service] Error in received callback:', error);
        }
      });

      // Display the notification
      notificationReceivedEvent.complete(notification);
    });

    // Notification opened (user tapped)
    OneSignal.setNotificationOpenedHandler(openedEvent => {
      console.log('[Notification Service] Notification opened:', openedEvent);

      const notification = openedEvent.notification;
      const data = notification.additionalData;

      // Create standardized notification object
      const formattedNotification: Notification = {
        id: notification.notificationId || '',
        type: data?.type || 'MESSAGE',
        title: notification.title || '',
        message: notification.body || '',
        data: data || {},
        read: true,
        created_at: new Date().toISOString(),
      };

      // Notify listeners
      this.notificationOpenedCallbacks.forEach(callback => {
        try {
          callback(formattedNotification);
        } catch (error) {
          console.error('[Notification Service] Error in opened callback:', error);
        }
      });
    });
  }

  /**
   * Register device and set user ID
   */
  async registerDevice(userId: string): Promise<void> {
    try {
      console.log('[Notification Service] Registering device for user:', userId);
      OneSignal.setExternalUserId(userId);
      console.log('[Notification Service] Device registered successfully');
    } catch (error) {
      console.error('[Notification Service] Device registration error:', error);
      throw error;
    }
  }

  /**
   * Unregister device (on logout)
   */
  async unregisterDevice(): Promise<void> {
    try {
      console.log('[Notification Service] Unregistering device...');
      OneSignal.removeExternalUserId();
      console.log('[Notification Service] Device unregistered successfully');
    } catch (error) {
      console.error('[Notification Service] Device unregistration error:', error);
      throw error;
    }
  }

  /**
   * Get OneSignal player ID (device ID)
   */
  async getPlayerId(): Promise<string | null> {
    try {
      const deviceState = await OneSignal.getDeviceState();
      return deviceState?.userId || null;
    } catch (error) {
      console.error('[Notification Service] Get player ID error:', error);
      return null;
    }
  }

  /**
   * Check if user has granted push notification permission
   */
  async hasPermission(): Promise<boolean> {
    try {
      const deviceState = await OneSignal.getDeviceState();
      return deviceState?.hasNotificationPermission ?? false;
    } catch (error) {
      console.error('[Notification Service] Check permission error:', error);
      return false;
    }
  }

  /**
   * Request push notification permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        return new Promise(resolve => {
          OneSignal.promptForPushNotificationsWithUserResponse(response => {
            resolve(response);
          });
        });
      } else {
        // Android doesn't need explicit permission request in modern versions
        return true;
      }
    } catch (error) {
      console.error('[Notification Service] Request permission error:', error);
      return false;
    }
  }

  /**
   * Set notification categories (for iOS action buttons)
   */
  setNotificationCategories(): void {
    if (Platform.OS === 'ios') {
      // You can define custom action buttons here
      // Example: Accept/Decline for booking requests
    }
  }

  /**
   * Send tag to OneSignal (for user segmentation)
   */
  async sendTag(key: string, value: string): Promise<void> {
    try {
      OneSignal.sendTag(key, value);
      console.log(`[Notification Service] Tag sent: ${key}=${value}`);
    } catch (error) {
      console.error('[Notification Service] Send tag error:', error);
      throw error;
    }
  }

  /**
   * Send multiple tags
   */
  async sendTags(tags: Record<string, string>): Promise<void> {
    try {
      OneSignal.sendTags(tags);
      console.log('[Notification Service] Tags sent:', tags);
    } catch (error) {
      console.error('[Notification Service] Send tags error:', error);
      throw error;
    }
  }

  /**
   * Delete tag
   */
  async deleteTag(key: string): Promise<void> {
    try {
      OneSignal.deleteTag(key);
      console.log(`[Notification Service] Tag deleted: ${key}`);
    } catch (error) {
      console.error('[Notification Service] Delete tag error:', error);
      throw error;
    }
  }

  /**
   * Get user tags
   */
  async getTags(): Promise<Record<string, string>> {
    try {
      return new Promise((resolve, reject) => {
        OneSignal.getTags(tags => {
          if (tags) {
            resolve(tags);
          } else {
            reject(new Error('Failed to get tags'));
          }
        });
      });
    } catch (error) {
      console.error('[Notification Service] Get tags error:', error);
      throw error;
    }
  }

  /**
   * Set user language (for localized notifications)
   */
  setLanguage(languageCode: string): void {
    OneSignal.setLanguage(languageCode);
  }

  /**
   * Enable/disable in-app alerts
   */
  setInFocusDisplaying(displayOption: number): void {
    // 0 = None, 1 = InAppAlert, 2 = Notification
    OneSignal.setInFocusDisplaying(displayOption);
  }

  /**
   * Register callback for when notification is received
   */
  onNotificationReceived(callback: (notification: Notification) => void): void {
    this.notificationReceivedCallbacks.add(callback);
  }

  /**
   * Register callback for when notification is opened
   */
  onNotificationOpened(callback: (notification: Notification) => void): void {
    this.notificationOpenedCallbacks.add(callback);
  }

  /**
   * Remove notification received callback
   */
  offNotificationReceived(callback: Function): void {
    this.notificationReceivedCallbacks.delete(callback);
  }

  /**
   * Remove notification opened callback
   */
  offNotificationOpened(callback: Function): void {
    this.notificationOpenedCallbacks.delete(callback);
  }

  /**
   * Clear all callbacks
   */
  clearCallbacks(): void {
    this.notificationReceivedCallbacks.clear();
    this.notificationOpenedCallbacks.clear();
  }

  /**
   * Clear all notifications (iOS only)
   */
  clearNotifications(): void {
    if (Platform.OS === 'ios') {
      OneSignal.clearOneSignalNotifications();
    }
  }

  /**
   * Disable push notifications
   */
  disablePush(disable: boolean): void {
    OneSignal.disablePush(disable);
  }

  /**
   * Check if push notifications are disabled
   */
  async isPushDisabled(): Promise<boolean> {
    try {
      const deviceState = await OneSignal.getDeviceState();
      return !deviceState?.isPushDisabled ?? false;
    } catch (error) {
      console.error('[Notification Service] Check push disabled error:', error);
      return false;
    }
  }

  /**
   * Post a notification (for testing)
   */
  async postNotification(
    message: string,
    data?: Record<string, any>,
    buttons?: Array<{id: string; text: string}>,
  ): Promise<void> {
    try {
      const playerId = await this.getPlayerId();
      if (!playerId) {
        throw new Error('Player ID not available');
      }

      OneSignal.postNotification(
        message,
        data || {},
        playerId,
        buttons,
      );
    } catch (error) {
      console.error('[Notification Service] Post notification error:', error);
      throw error;
    }
  }

  /**
   * Set log level (for debugging)
   */
  setLogLevel(logLevel: number, visualLevel: number): void {
    OneSignal.setLogLevel(logLevel, visualLevel);
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

const notificationService = new NotificationService();
export default notificationService;

// Export log levels for convenience
export const OneSignalLogLevel = {
  NONE: 0,
  FATAL: 1,
  ERROR: 2,
  WARN: 3,
  INFO: 4,
  DEBUG: 5,
  VERBOSE: 6,
};
