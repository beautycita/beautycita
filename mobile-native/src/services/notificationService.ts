/**
 * Notification Service
 * Manages push notifications via OneSignal
 * Handles registration, permission requests, and notification handling
 */

import OneSignal, {
  NotificationReceivedEvent,
  NotificationClickEvent,
  DeviceState,
} from 'react-native-onesignal';
import { Platform } from 'react-native';

// OneSignal App ID (from environment or config)
const ONESIGNAL_APP_ID = 'YOUR_ONESIGNAL_APP_ID'; // TODO: Replace with actual app ID

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface NotificationAction {
  type: 'booking' | 'message' | 'review' | 'payment' | 'general';
  id?: string;
  [key: string]: any;
}

type NotificationReceivedCallback = (payload: NotificationPayload) => void;
type NotificationClickedCallback = (action: NotificationAction) => void;

/**
 * Notification Service Class
 */
class NotificationService {
  private initialized = false;
  private userId: string | null = null;
  private receivedCallbacks: Set<NotificationReceivedCallback> = new Set();
  private clickedCallbacks: Set<NotificationClickedCallback> = new Set();

  /**
   * Initialize OneSignal
   * Call this once at app startup
   */
  public initialize(): void {
    if (this.initialized) {
      console.log('OneSignal already initialized');
      return;
    }

    try {
      // Initialize OneSignal
      OneSignal.setAppId(ONESIGNAL_APP_ID);

      // Setup notification event handlers
      this.setupHandlers();

      // Prompt for push permission (iOS)
      if (Platform.OS === 'ios') {
        OneSignal.promptForPushNotificationsWithUserResponse((response) => {
          console.log('Push notification permission:', response);
        });
      }

      this.initialized = true;
      console.log('OneSignal initialized successfully');
    } catch (error) {
      console.error('Error initializing OneSignal:', error);
    }
  }

  /**
   * Setup notification handlers
   */
  private setupHandlers(): void {
    // Handle notification received (foreground)
    OneSignal.setNotificationWillShowInForegroundHandler(
      (event: NotificationReceivedEvent) => {
        console.log('Notification received:', event);

        const notification = event.getNotification();
        const payload: NotificationPayload = {
          title: notification.title || '',
          body: notification.body || '',
          data: notification.additionalData,
        };

        // Notify all registered callbacks
        this.receivedCallbacks.forEach((callback) => callback(payload));

        // Complete with notification to display it
        event.complete(notification);
      }
    );

    // Handle notification clicked/opened
    OneSignal.setNotificationOpenedHandler((event: NotificationClickEvent) => {
      console.log('Notification clicked:', event);

      const notification = event.notification;
      const data = notification.additionalData || {};

      const action: NotificationAction = {
        type: data.type || 'general',
        id: data.id,
        ...data,
      };

      // Notify all registered callbacks
      this.clickedCallbacks.forEach((callback) => callback(action));
    });
  }

  /**
   * Set user ID for targeted notifications
   */
  public async setUser(userId: string): Promise<void> {
    try {
      this.userId = userId;
      await OneSignal.setExternalUserId(userId);
      console.log('OneSignal user ID set:', userId);
    } catch (error) {
      console.error('Error setting OneSignal user ID:', error);
    }
  }

  /**
   * Remove user ID
   */
  public async removeUser(): Promise<void> {
    try {
      await OneSignal.removeExternalUserId();
      this.userId = null;
      console.log('OneSignal user ID removed');
    } catch (error) {
      console.error('Error removing OneSignal user ID:', error);
    }
  }

  /**
   * Get device state (includes subscription status, player ID, etc.)
   */
  public async getDeviceState(): Promise<DeviceState | null> {
    try {
      const deviceState = await OneSignal.getDeviceState();
      return deviceState;
    } catch (error) {
      console.error('Error getting device state:', error);
      return null;
    }
  }

  /**
   * Check if user is subscribed to push notifications
   */
  public async isSubscribed(): Promise<boolean> {
    try {
      const deviceState = await OneSignal.getDeviceState();
      return deviceState?.isSubscribed || false;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  /**
   * Get player ID (OneSignal device identifier)
   */
  public async getPlayerId(): Promise<string | null> {
    try {
      const deviceState = await OneSignal.getDeviceState();
      return deviceState?.userId || null;
    } catch (error) {
      console.error('Error getting player ID:', error);
      return null;
    }
  }

  /**
   * Add tags to user for segmentation
   */
  public async addTags(tags: Record<string, string>): Promise<void> {
    try {
      await OneSignal.sendTags(tags);
      console.log('Tags added:', tags);
    } catch (error) {
      console.error('Error adding tags:', error);
    }
  }

  /**
   * Remove tags from user
   */
  public async removeTags(tagKeys: string[]): Promise<void> {
    try {
      await OneSignal.deleteTags(tagKeys);
      console.log('Tags removed:', tagKeys);
    } catch (error) {
      console.error('Error removing tags:', error);
    }
  }

  /**
   * Set notification permission state
   */
  public setNotificationPermission(enabled: boolean): void {
    OneSignal.disablePush(!enabled);
    console.log('Push notifications', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Prompt user for push notification permission
   */
  public async promptForPushPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return new Promise((resolve) => {
        OneSignal.promptForPushNotificationsWithUserResponse((response) => {
          console.log('Push permission response:', response);
          resolve(response);
        });
      });
    }

    // Android doesn't require runtime permission for notifications
    return true;
  }

  /**
   * Register callback for when notification is received (foreground)
   */
  public onNotificationReceived(
    callback: NotificationReceivedCallback
  ): () => void {
    this.receivedCallbacks.add(callback);
    return () => {
      this.receivedCallbacks.delete(callback);
    };
  }

  /**
   * Register callback for when notification is clicked/opened
   */
  public onNotificationClicked(
    callback: NotificationClickedCallback
  ): () => void {
    this.clickedCallbacks.add(callback);
    return () => {
      this.clickedCallbacks.delete(callback);
    };
  }

  /**
   * Clear all callbacks
   */
  public clearCallbacks(): void {
    this.receivedCallbacks.clear();
    this.clickedCallbacks.clear();
  }

  /**
   * Set user role tag for segmentation
   */
  public async setUserRole(role: 'CLIENT' | 'STYLIST' | 'ADMIN'): Promise<void> {
    await this.addTags({ role: role.toLowerCase() });
  }

  /**
   * Set user location tags for segmentation
   */
  public async setUserLocation(city: string, state: string): Promise<void> {
    await this.addTags({ city, state });
  }

  /**
   * Set user preferences tags
   */
  public async setUserPreferences(preferences: {
    bookingReminders?: boolean;
    newMessages?: boolean;
    promotions?: boolean;
  }): Promise<void> {
    const tags: Record<string, string> = {};

    if (preferences.bookingReminders !== undefined) {
      tags.booking_reminders = preferences.bookingReminders ? 'true' : 'false';
    }
    if (preferences.newMessages !== undefined) {
      tags.new_messages = preferences.newMessages ? 'true' : 'false';
    }
    if (preferences.promotions !== undefined) {
      tags.promotions = preferences.promotions ? 'true' : 'false';
    }

    await this.addTags(tags);
  }

  /**
   * Log out - remove user data
   */
  public async logout(): Promise<void> {
    await this.removeUser();
    this.clearCallbacks();
    console.log('Notification service logged out');
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

export default notificationService;
