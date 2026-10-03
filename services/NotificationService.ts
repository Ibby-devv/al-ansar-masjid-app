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
      // Prayer channel has been observed as "enabled" yet dropping posts on some
      // installs (custom type=prayer / Iqama pushes). Recreate it so importance,
      // sound, and vibration are applied fresh. Android ignores updates in place.
      if (Platform.OS === 'android') {
        try {
          await notifee.deleteChannel('prayer');
        } catch (e) {
          console.warn('Could not delete prayer channel before recreate:', e);
        }
      }

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

  /** Notifee Android requires string data values; drop/convert anything else. */
  private toNotifeeData(
    data?: Record<string, any>
  ): Record<string, string> | undefined {
    if (!data) return undefined;
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value == null) continue;
      out[key] = typeof value === 'string' ? value : String(value);
    }
    return out;
  }

  private buildAndroidNotification(
    options: DisplayNotificationOptions,
    channelId: NotificationChannelId
  ) {
    const { title, body, data, largeIcon, imageUrl } = options;
    const styleConfig = NOTIFICATION_STYLES[channelId] ?? NOTIFICATION_STYLES.general;
    const channel = NOTIFICATION_CHANNELS[channelId] ?? NOTIFICATION_CHANNELS.general;
    const effectiveImageUrl =
      (imageUrl && imageUrl.trim()) ||
      (typeof data?.imageUrl === 'string' && data.imageUrl.trim()) ||
      '';

    const notification: any = {
      title,
      body,
      android: {
        channelId,
        importance: channel.importance,
        color: styleConfig.color,
        // Prefer channel icon; fall back to general if a drawable is missing
        smallIcon: styleConfig.smallIcon || 'ic_notification_general',
        pressAction: {
          id: 'default',
        },
        // Sound/vibration belong on the channel; repeating them here breaks some OEMs
      },
      data: this.toNotifeeData(data),
    };

    const finalLargeIcon = largeIcon || styleConfig.largeIcon;
    if (finalLargeIcon) {
      notification.android.largeIcon = finalLargeIcon;
    }

    if (effectiveImageUrl) {
      notification.android.style = {
        type: AndroidStyle.BIGPICTURE,
        picture: effectiveImageUrl,
      };
      notification.ios = {
        attachments: [{ url: effectiveImageUrl }],
      };
    } else if (styleConfig.useBigTextStyle) {
      notification.android.style = {
        type: AndroidStyle.BIGTEXT,
        text: body,
      };
    }

    return notification;
  }

  /**
   * Display a notification with proper styling.
   * Retries on the general channel if the requested channel/icon fails.
   */
  async displayNotification(options: DisplayNotificationOptions) {
    const channelId = options.channelId ?? 'general';

    try {
      const notification = this.buildAndroidNotification(options, channelId);
      await notifee.displayNotification(notification);
      console.log(
        `✅ Notification displayed: ${options.title} (${channelId})${
          options.imageUrl ? ' [with image]' : ''
        }`
      );
    } catch (error) {
      console.error(`❌ Error displaying notification on ${channelId}:`, error);
      if (channelId !== 'general') {
        try {
          const fallback = this.buildAndroidNotification(
            { ...options, channelId: 'general' },
            'general'
          );
          // Force a known-good icon on the fallback path
          fallback.android.smallIcon = 'ic_notification_general';
          await notifee.displayNotification(fallback);
          console.warn(
            `⚠️ Displayed via general fallback after ${channelId} failed`
          );
          return;
        } catch (fallbackError) {
          console.error('❌ General fallback also failed:', fallbackError);
        }
      }
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
