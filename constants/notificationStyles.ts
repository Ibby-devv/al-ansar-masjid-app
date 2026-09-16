import { NotificationChannelId } from './notificationChannels';

export interface NotificationStyleConfig {
  color: string;
  smallIcon?: string;
  largeIcon?: string;
  useBigTextStyle?: boolean;
}

/**
 * Calm brand tints for Android notification chrome (small-icon colour).
 * Navy for most channels; gold for giving / urgency.
 */
export const NOTIFICATION_COLORS = {
  navy: '#1e3a8a',
  gold: '#d97706',
  urgent: '#b45309',
} as const;

/**
 * Simple white-on-transparent drawables in android/app/src/main/res/drawable-*.
 * Do not use ic_launcher — too detailed for status-bar glyphs.
 */
export const NOTIFICATION_STYLES: Record<NotificationChannelId, NotificationStyleConfig> = {
  prayer: {
    color: NOTIFICATION_COLORS.navy,
    smallIcon: 'ic_notification_prayer',
    useBigTextStyle: true,
  },
  events: {
    color: NOTIFICATION_COLORS.navy,
    smallIcon: 'ic_notification_event',
    useBigTextStyle: true,
  },
  campaigns: {
    color: NOTIFICATION_COLORS.gold,
    smallIcon: 'ic_notification_campaign',
    useBigTextStyle: true,
  },
  general: {
    color: NOTIFICATION_COLORS.navy,
    smallIcon: 'ic_notification_general',
    useBigTextStyle: true,
  },
  urgent: {
    color: NOTIFICATION_COLORS.urgent,
    smallIcon: 'ic_notification_urgent',
    useBigTextStyle: true,
  },
};
