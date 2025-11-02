import { AndroidImportance } from '@notifee/react-native';

export type NotificationChannelId = 'prayer' | 'events' | 'campaigns' | 'general' | 'urgent';

export interface NotificationChannel {
  id: NotificationChannelId;
  name: string;
  description: string;
  importance: AndroidImportance;
  sound?: string;
  vibrationPattern?: number[];
}

export const NOTIFICATION_CHANNELS: Record<NotificationChannelId, NotificationChannel> = {
  prayer: {
    id: 'prayer',
    name: 'Prayer Times',
    description: 'Notifications for prayer times and reminders',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [300, 200, 300, 200],
  },
  events: {
    id: 'events',
    name: 'Events',
    description: 'Notifications about mosque events and programs',
    importance: AndroidImportance.DEFAULT,
    sound: 'default',
  },
  campaigns: {
    id: 'campaigns',
    name: 'Donation Campaigns',
    description: 'Updates about fundraising campaigns',
    importance: AndroidImportance.DEFAULT,
    sound: 'default',
  },
  general: {
    id: 'general',
    name: 'General Announcements',
    description: 'General mosque announcements and updates',
    importance: AndroidImportance.DEFAULT,
    sound: 'default',
  },
  urgent: {
    id: 'urgent',
    name: 'Urgent Alerts',
    description: 'Important and time-sensitive announcements',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [500, 300, 500, 300],
  },
};
