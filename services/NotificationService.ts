import notifee, { AndroidStyle } from '@notifee/react-native';
import { Platform } from 'react-native';
import { NOTIFICATION_CHANNELS, NotificationChannelId } from '../constants/notificationChannels';
import { NOTIFICATION_STYLES } from '../constants/notificationStyles';

export interface DisplayNotificationOptions {
  title: string;
  body: string;
  channelId?: NotificationChannelId;
  data?: Record<string, any>;
  largeIcon?: string;
  imageUrl?: string;
}

class NotificationService {
  /**
   * Initialize all notification channels
   * Should be called once on app startup
   */
  async initializeChannels() {
    console.log('🔔 Creating notification channels...');
    
    try {
      // Create all defined channels
      for (const channel of Object.values(NOTIFICATION_CHANNELS)) {
        await notifee.createChannel({
          id: channel.id,
          name: channel.name,
          description: channel.description,
          importance: channel.importance,
          sound: channel.sound,
          vibrationPattern: channel.vibrationPattern,
        });
      }
      
      console.log('✅ Notification channels created');
    } catch (error) {
      console.error('❌ Error creating notification channels:', error);
      throw error;
    }
  }

  /**
   * Display a notification with proper styling
   */
  async displayNotification(options: DisplayNotificationOptions) {
    const {
      title,
      body,
      channelId = 'general',
      data,
      largeIcon,
      imageUrl,
    } = options;

    try {
      const styleConfig = NOTIFICATION_STYLES[channelId];

      const channel = NOTIFICATION_CHANNELS[channelId];

      // Fallback: allow image URL to be provided via data.imageUrl when not explicitly passed
      const effectiveImageUrl = (imageUrl && imageUrl.trim()) || (typeof data?.imageUrl === 'string' && data.imageUrl.trim()) || '';

      const notification: any = {
        title,
        body,
        android: {
          channelId,
          importance: channel.importance,
          color: styleConfig.color,
          smallIcon: styleConfig.smallIcon || 'ic_launcher',
          pressAction: {
            id: 'default',
          },
        },
        data,
      };

      // Add vibration pattern if defined for this channel
      if (channel.vibrationPattern) {
        notification.android.vibrationPattern = channel.vibrationPattern;
      }

      // Add sound if defined for this channel
      if (channel.sound) {
        notification.android.sound = channel.sound;
      }

      // Only add largeIcon if it exists
      const finalLargeIcon = largeIcon || styleConfig.largeIcon;
      if (finalLargeIcon) {
        notification.android.largeIcon = finalLargeIcon;
      }

      // Add Big Picture style on Android if image URL is provided
      if (effectiveImageUrl) {
        notification.android.style = {
          type: AndroidStyle.BIGPICTURE,
          picture: effectiveImageUrl,
        };
        // Add iOS attachment so images also display on iOS
        notification.ios = {
          attachments: [
            {
              url: effectiveImageUrl,
            },
          ],
        };
      }
      // Otherwise, add BigText style if enabled
      else if (styleConfig.useBigTextStyle) {
        notification.android.style = {
          type: AndroidStyle.BIGTEXT,
          text: body,
        };
      }

      await notifee.displayNotification(notification);

      console.log(`✅ Notification displayed: ${title} (${channelId})${imageUrl ? ' [with image]' : ''}`);
    } catch (error) {
      console.error('❌ Error displaying notification:', error);
      throw error;
    }
  }

  /**
   * Display a prayer time notification
   */
  async displayPrayerNotification(title: string, body: string, data?: Record<string, any>) {
    return this.displayNotification({
      title,
      body,
      channelId: 'prayer',
      data,
    });
  }

  /**
   * Display an event notification
   */
  async displayEventNotification(title: string, body: string, data?: Record<string, any>) {
    return this.displayNotification({
      title,
      body,
      channelId: 'events',
      data,
      imageUrl: data?.imageUrl,
    });
  }

  /**
   * Display a campaign notification
   */
  async displayCampaignNotification(title: string, body: string, data?: Record<string, any>) {
    return this.displayNotification({
      title,
      body,
      channelId: 'campaigns',
      data,
      imageUrl: data?.imageUrl,
    });
  }

  /**
   * Display an urgent notification
   */
  async displayUrgentNotification(title: string, body: string, data?: Record<string, any>) {
    return this.displayNotification({
      title,
      body,
      channelId: 'urgent',
      data,
      imageUrl: data?.imageUrl,
    });
  }

  /**
   * Get a summary of available channels (Android)
   */
  async getChannels(): Promise<{ id: string; name: string; importance?: number }[]> {
    try {
      const channels = await notifee.getChannels();
      return channels.map((c: any) => ({ id: c.id, name: c.name, importance: c.importance }));
    } catch (error) {
      console.warn('Error fetching channels:', error);
      return [];
    }
  }

  /**
   * Open channel-specific settings (Android)
   */
  async openChannelSettings(channelId: string) {
    try {
      // Notifee's openNotificationSettings does not take params; some versions expose channel-specific API separately.
      // Try channel-specific approach via Android intent fallback first.
      // @ts-ignore
      if (typeof (notifee as any).openChannelSettings === 'function') {
        // @ts-ignore
        await (notifee as any).openChannelSettings(channelId);
        return;
      }
      // Fallback: open general notification settings
      await notifee.openNotificationSettings();
    } catch (error) {
      console.error('Error opening channel settings:', error);
      // Fallback: open general settings
      try { await notifee.openNotificationSettings(); } catch {}
    }
  }

  /**
   * Check if battery optimization is enabled (Android)
   */
  async isBatteryOptimizationEnabled(): Promise<boolean | null> {
    try {
      // @ts-ignore - API is Android-only
      if (typeof (notifee as any).isBatteryOptimizationEnabled === 'function') {
        return await (notifee as any).isBatteryOptimizationEnabled();
      }
      return null;
    } catch (error) {
      console.warn('Error checking battery optimization:', error);
      return null;
    }
  }

  /**
   * Open battery optimization settings page (Android)
   */
  async openBatteryOptimizationSettings() {
    try {
      if (Platform.OS === 'android') {
        // Notifee v7+ supports opening power manager settings
        await notifee.openBatteryOptimizationSettings();
      } else {
        // Fallback for non-Android
        await notifee.openNotificationSettings();
      }
    } catch (error) {
      console.warn('Error opening battery optimization settings:', error);
      // Fallback to general notification settings
      try {
        await notifee.openNotificationSettings();
      } catch (e) {
        console.error('Failed to open any settings:', e);
      }
    }
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const settings = await notifee.getNotificationSettings();
      return settings.authorizationStatus === 1 || settings.authorizationStatus >= 2;
    } catch (error) {
      console.error('Error checking notification settings:', error);
      return false;
    }
  }

  /**
   * Open notification settings
   */
  async openSettings() {
    try {
      await notifee.openNotificationSettings();
    } catch (error) {
      console.error('Error opening notification settings:', error);
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      console.log('📱 Requesting notification permission...');
      
      const settings = await notifee.requestPermission();
      console.log('Permission settings:', settings);
      
      const isGranted = 
        settings.authorizationStatus === 1 || // Android granted
        settings.authorizationStatus >= 2;     // iOS authorized/provisional
      
      if (isGranted) {
        console.log('✅ Notification permission granted');
        await this.initializeChannels();
        return true;
      } else {
        console.log('⚠️ Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting permission:', error);
      return false;
    }
  }
}

export default new NotificationService();
