import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import { db } from '../firebase';
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
    console.log('🔔 Initializing FCM Service...');

    // 1. Sign in anonymously
    await this.signInAnonymously();

    // 2. Request notification permission
    const permissionGranted = await this.requestPermission();

    if (permissionGranted) {
      // 3. Get and save FCM token
      await this.registerToken();

      // 4. Listen for token refresh
      this.listenForTokenRefresh();

      // 5. Setup foreground notification handler
      this.setupForegroundHandler();
    } else {
      console.log('⚠️ Notifications disabled - user denied permission');
    }

    console.log('✅ FCM Service initialized');
  }

  /**
   * Sign in user anonymously
   */
  private async signInAnonymously() {
    try {
      const user = auth().currentUser;
      
      if (user) {
        console.log('✅ Already signed in:', user.uid);
        return user.uid;
      }
      
      const userCredential = await auth().signInAnonymously();
      console.log('✅ Signed in anonymously:', userCredential.user.uid);
      return userCredential.user.uid;
    } catch (error) {
      console.error('❌ Error signing in anonymously:', error);
      throw error;
    }
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
   * Get FCM token and save to Firestore
   */
  private async registerToken() {
    try {
      const uid = auth().currentUser?.uid;
      if (!uid) {
        console.error('❌ No user ID available');
        return;
      }

      const token = await messaging().getToken();
      console.log('📱 FCM Token:', token);

      // Save to Firestore
      await db.collection('users').doc(uid).set({
        fcmToken: token,
        notificationsEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, { merge: true });

      console.log('✅ FCM token saved to Firestore');
    } catch (error) {
      console.error('❌ Error registering token:', error);
    }
  }

  /**
   * Listen for token refresh
   */
  private listenForTokenRefresh() {
    messaging().onTokenRefresh(async (newToken) => {
      console.log('🔄 FCM token refreshed:', newToken);

      const uid = auth().currentUser?.uid;
      if (uid) {
        await db.collection('users').doc(uid).update({
          fcmToken: newToken,
          updatedAt: new Date(),
        });
        console.log('✅ New token saved');
      }
    });
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
   * Get current user ID
   */
  getUserId(): string | null {
    return auth().currentUser?.uid || null;
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
}

export default new FCMService();
