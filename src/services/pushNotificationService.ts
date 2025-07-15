import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: {
    channelId?: string;
    messageId?: string;
    senderId?: string;
    scheduleId?: string;
    type?: 'message' | 'schedule' | 'alert' | 'system';
  };
}

class PushNotificationService {
  private initialized = false;
  private permissionGranted = false;

  async initialize() {
    if (this.initialized) return;

    // Check if platform supports push notifications
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only work on native platforms');
      return;
    }

    try {
      // Request permission to use push notifications
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }
      
      if (permStatus.receive !== 'granted') {
        throw new Error('User denied permissions!');
      }

      this.permissionGranted = true;
      await PushNotifications.register();

      // Setup listeners
      this.setupListeners();
      
      this.initialized = true;
      console.log('Push notifications initialized successfully');
      
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  private setupListeners() {
    // On successful registration
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token: ', token.value);
      // Store token for sending notifications
      this.storeDeviceToken(token.value);
    });

    // Some issue with our setup
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on registration: ', JSON.stringify(error));
    });

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received: ', notification);
      this.handleNotificationReceived(notification);
    });

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action performed', notification.actionId, notification.inputValue);
      this.handleNotificationTapped(notification);
    });
  }

  private async storeDeviceToken(token: string) {
    try {
      // Store in localStorage for now - in production, send to your backend
      localStorage.setItem('pushToken', token);
      
      // TODO: Send token to your backend to associate with user
      console.log('Device token stored:', token);
    } catch (error) {
      console.error('Error storing device token:', error);
    }
  }

  private handleNotificationReceived(notification: any) {
    // Handle notification when app is in foreground
    const { title, body, data } = notification;
    
    // Show local notification if needed
    this.showLocalNotification({
      title,
      body,
      data,
    });

    // Trigger any app-specific handlers
    this.notifyAppHandlers('received', notification);
  }

  private handleNotificationTapped(notification: any) {
    // Handle when user taps notification
    const { data } = notification.notification;
    
    if (data?.channelId) {
      // Navigate to specific channel/chat
      this.navigateToChannel(data.channelId);
    }

    this.notifyAppHandlers('tapped', notification);
  }

  private navigateToChannel(channelId: string) {
    // Navigate to the specific channel - implement based on your routing
    window.location.hash = `#/team?channel=${channelId}`;
  }

  private notifyAppHandlers(event: string, data: any) {
    // Dispatch custom events for the app to listen to
    window.dispatchEvent(new CustomEvent('pushNotification', {
      detail: { event, data }
    }));
  }

  async showLocalNotification(payload: NotificationPayload) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: payload.title,
            body: payload.body,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'beep.wav',
            attachments: undefined,
            actionTypeId: "",
            extra: payload.data || {},
          }
        ]
      });
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }

  // Send notification to other users (requires backend)
  async sendNotificationToUsers(userIds: string[], payload: NotificationPayload) {
    try {
      // This would call your backend API to send push notifications
      const response = await fetch('/api/send-push-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds,
          payload,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      console.log('Notification sent successfully');
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  getDeviceToken(): string | null {
    return localStorage.getItem('pushToken');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  hasPermission(): boolean {
    return this.permissionGranted;
  }
}

export const pushNotificationService = new PushNotificationService();