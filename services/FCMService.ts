import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import FcmTokenApi from './FcmTokenApi';
import NotificationService from './NotificationService';

// Background message handler - REQUIRED for data-only messages when app is closed/background
// This must be at the top level, outside of any class or function
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('📭 Background message received:', remoteMessage);

  const data = remoteMessage.data;
  const title = (typeof data?.title === 'string' ? data.title : null) || 'Al-Ansar Masjid';
  const body = (typeof data?.body === 'string' ? data.body : null) || '';
  const notificationType = data?.type as string | undefined;

  try {
    switch (notificationType) {
      case 'prayer':
        await NotificationService.displayPrayerNotification(title, body, data);
        break;
      case 'event':
        await NotificationService.displayEventNotification(title, body, data);
        break;
      case 'campaign':
        await NotificationService.displayCampaignNotification(title, body, data);
        break;
      case 'urgent':
        await NotificationService.displayUrgentNotification(title, body, data);
        break;
      default:
        await NotificationService.displayNotification({
          title,
          body,
          channelId: 'general',
          data,
        });
    }
  } catch (error) {
    console.error('❌ Error displaying background notification:', error);
  }
});

class FCMService {
  /**
   * Initialize FCM - Call on app startup
   */
  async initialize() {
    console.log('🔔 ========================================');
    console.log('🔔 Initializing FCM Service...');
    console.log('🔔 ========================================');

    try {
      // Initialize notification channels first (required for Android)
      await NotificationService.initializeChannels();
      
      // Request notification permission
      const permissionGranted = await this.requestPermission();

      if (permissionGranted) {
        console.log('✅ Permission granted - proceeding with token registration');
        
        // Get and save FCM token (gracefully skip on transient failures)
        try {
          await this.registerToken();
        } catch (err: any) {
          const msg = String(err?.message || err);
          // Don't crash initialization on transient or service availability issues
          if (msg.includes('SERVICE_NOT_AVAILABLE') || err?.code === 'messaging/unknown') {
            console.warn('⚠️ registerToken skipped due to transient FCM service unavailability. Will retry on token refresh.');
          } else {
            console.warn('⚠️ registerToken failed, continuing without token:', msg);
          }
        }

        // Listen for token refresh
        this.listenForTokenRefresh();

        // Setup foreground notification handler
        this.setupForegroundHandler();
        
        console.log('✅ FCM Service initialized successfully');
      } else {
        console.log('⚠️ Notifications disabled - user denied permission');
      }
    } catch (error) {
      console.error('❌ FCM Service initialization encountered an error (continuing):', error);
      // Do not throw to avoid breaking app startup in offline/emulator scenarios
    }
    
    console.log('🔔 ========================================');
  }

  /**
   * Request notification permission (fixed for Android)
   */
  private async requestPermission(): Promise<boolean> {
    try {
      console.log('📱 Requesting notification permission...');
      
      // Use NotificationService to request permission and initialize channels
      const isGranted = await NotificationService.requestPermission();
      
      if (isGranted) {
        console.log('✅ Notification permission granted and channels initialized');
        return true;
      } else {
        console.log('⚠️ Notification permission denied');
        console.log('User can enable notifications later in Settings screen');
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting permission:', error);
      return false;
    }
  }

  /**
   * Get FCM token and save via callable
   */
  private async registerToken() {
    try {
      console.log('📝 registerToken: Getting device info...');
      
      const deviceId = Platform.OS === 'android'
        ? await DeviceInfo.getAndroidId()
        : await DeviceInfo.getUniqueId();

  const token = await messaging().getToken();
      const appVersion = DeviceInfo.getVersion();

      console.log('📱 Device ID:', deviceId);
      console.log('📱 Platform:', Platform.OS);
      console.log('📱 App Version:', appVersion);
      console.log('📱 FCM Token (first 20 chars):', token.substring(0, 20) + '...');

      console.log('🌐 Calling registerFcmToken callable...');
      const result = await FcmTokenApi.registerFcmToken({
        deviceId,
        fcmToken: token,
        platform: Platform.OS as 'android' | 'ios',
        appVersion,
        notificationsEnabled: true,
      });
      
      console.log('✅ FCM token registered successfully:', {
        isNew: !result.updated,
        isUpdate: result.updated,
      });
    } catch (error: any) {
      const code = error?.code;
      const message = error?.message || '';
      console.warn('⚠️ Error registering token (will not block startup):', {
        code,
        message,
      });
      // Propagate only non-transient errors if needed; otherwise swallow
      if (String(message).includes('SERVICE_NOT_AVAILABLE')) {
        return; // transient; skip
      }
      if (code === 'messaging/unknown') {
        return; // likely transient on emulator/offline
      }
      // For other errors, rethrow so callers can decide
      throw error;
    }
  }

  /**
   * Listen for token refresh
   */
  private listenForTokenRefresh() {
    console.log('👂 Setting up token refresh listener...');
    
    messaging().onTokenRefresh(async (newToken) => {
      console.log('🔄 ========================================');
      console.log('🔄 FCM token refreshed!');
      console.log('🔄 New token (first 20 chars):', newToken.substring(0, 20) + '...');

      try {
        const deviceId = Platform.OS === 'android'
          ? await DeviceInfo.getAndroidId()
          : await DeviceInfo.getUniqueId();

        const appVersion = DeviceInfo.getVersion();

        console.log('🌐 Updating token via callable...');
        await FcmTokenApi.registerFcmToken({
          deviceId,
          fcmToken: newToken,
          platform: Platform.OS as 'android' | 'ios',
          appVersion,
          notificationsEnabled: true,
        });
        console.log('✅ Refreshed token saved successfully');
      } catch (error: any) {
        console.error('❌ Error updating refreshed token:', {
          code: error?.code,
          message: error?.message,
        });
      }
      
      console.log('🔄 ========================================');
    });
    
    console.log('✅ Token refresh listener active');
  }

  /**
   * Setup foreground notification handler
   * This displays notifications when app is open
   */
  private setupForegroundHandler() {
    messaging().onMessage(async (remoteMessage) => {
      console.log('📬 Foreground notification received:', remoteMessage);

      const data = remoteMessage.data;

      // For data-only messages, title and body are in data field
      const title = (typeof data?.title === 'string' ? data.title : null)
        || remoteMessage.notification?.title
        || 'Al-Ansar Masjid';
      const body = (typeof data?.body === 'string' ? data.body : null)
        || remoteMessage.notification?.body
        || '';

      // Determine channel based on notification type from data
      const notificationType = data?.type as string | undefined;

      try {
        switch (notificationType) {
          case 'prayer':
            await NotificationService.displayPrayerNotification(title, body, data);
            break;
          case 'event':
            await NotificationService.displayEventNotification(title, body, data);
            break;
          case 'campaign':
            await NotificationService.displayCampaignNotification(title, body, data);
            break;
          case 'urgent':
            await NotificationService.displayUrgentNotification(title, body, data);
            break;
          default:
            // General notification
            await NotificationService.displayNotification({
              title,
              body,
              channelId: 'general',
              data,
            });
        }
      } catch (error) {
        console.error('❌ Error displaying foreground notification:', error);
      }
    });

    console.log('✅ Foreground notification handler setup');
  }

  /**
   * Check if notifications are enabled (permission granted)
   */
  async areNotificationsEnabled(): Promise<boolean> {
    return NotificationService.areNotificationsEnabled();
  }

  /**
   * Open notification settings (for when user needs to manually enable)
   */
  async openSettings() {
    return NotificationService.openSettings();
  }

  /**
   * Get device ID
   */
  async getDeviceId(): Promise<string> {
    return Platform.OS === 'android'
      ? await DeviceInfo.getAndroidId()
      : await DeviceInfo.getUniqueId();
  }

  /**
   * Update notification settings for this device
   * Note: Caller should update AsyncStorage cache before calling this
   */
  async updateNotificationSettings(enabled: boolean): Promise<void> {
    console.log(`🔔 updateNotificationSettings: ${enabled ? 'ENABLE' : 'DISABLE'}`);
    
    try {
      const deviceId = await this.getDeviceId();
      console.log('📱 Device ID:', deviceId.substring(0, 8) + '...');
      
      // Update server
      await FcmTokenApi.setNotificationPreference({ deviceId, enabled });
      console.log(`✅ Notifications ${enabled ? 'enabled' : 'disabled'} on server`);
    } catch (error: any) {
      const code = error?.code;
      const message: string = String(error?.message || '');
      const transient =
        code === 'functions/unavailable' ||
        code === 'unavailable' ||
        code === 'functions/deadline-exceeded' ||
        code === 'deadline-exceeded' ||
        message.toUpperCase().includes('UNAVAILABLE') ||
        message.includes('Network request failed');

      if (transient) {
        console.warn('⚠️ updateNotificationSettings: transient failure (silent, will retry on next action):', {
          code,
          message,
        });
        return; // swallow transient errors
      }

      // Non-transient; still do not throw to avoid noisy UI
      console.warn('⚠️ updateNotificationSettings: non-transient error (not throwing):', {
        code,
        message,
      });
      return;
    }
  }

  /**
   * Update last seen timestamp - call this periodically when app is active
   */
  async updateLastSeen(): Promise<void> {
    try {
      const deviceId = await this.getDeviceId();
      console.log('👆 updateLastSeen for device:', deviceId.substring(0, 8) + '...');
      await FcmTokenApi.touchLastSeen({ deviceId });
    } catch (error: any) {
      console.warn('⚠️ Could not update lastSeen:', {
        code: error?.code,
        message: error?.message,
      });
    }
  }
}

export default new FCMService();
