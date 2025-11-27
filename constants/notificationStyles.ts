import { NotificationChannelId } from './notificationChannels';

export interface NotificationStyleConfig {
  color: string;
  smallIcon?: string;
  largeIcon?: string;
  useBigTextStyle?: boolean;
}

// App color theme - adjust to match your branding
export const NOTIFICATION_COLORS = {
  primary: '#1e3a8a', // Deep blue
  prayer: '#059669',  // Green
  event: '#7c3aed',   // Purple
  campaign: '#dc2626', // Red
  general: '#0284c7', // Sky blue
  urgent: '#ea580c',  // Orange
} as const;

// Unified icon for brand consistency - Android guidelines recommend monochromatic app icon
const UNIFIED_SMALL_ICON = 'ic_launcher'; // App launcher icon

export const NOTIFICATION_STYLES: Record<NotificationChannelId, NotificationStyleConfig> = {
  prayer: {
    color: NOTIFICATION_COLORS.prayer,
    smallIcon: UNIFIED_SMALL_ICON,
    useBigTextStyle: true,
  },
  events: {
    color: NOTIFICATION_COLORS.event,
    smallIcon: UNIFIED_SMALL_ICON,
    useBigTextStyle: true,
  },
  campaigns: {
    color: NOTIFICATION_COLORS.campaign,
    smallIcon: UNIFIED_SMALL_ICON,
    useBigTextStyle: true,
  },
  general: {
    color: NOTIFICATION_COLORS.general,
    smallIcon: UNIFIED_SMALL_ICON,
    useBigTextStyle: true,
  },
  urgent: {
    color: NOTIFICATION_COLORS.urgent,
    smallIcon: UNIFIED_SMALL_ICON,
    useBigTextStyle: true,
  },
};
