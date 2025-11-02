/**
 * Notifee Background Event Handler
 *
 * This file handles background events from Notifee (notification taps, dismissals, etc.)
 * when the app is in the background or quit state.
 *
 * IMPORTANT: This must be imported at the top level (in index.js) for it to work.
 */

import notifee, { EventType } from '@notifee/react-native';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('📱 Background notification event:', type);

  switch (type) {
    case EventType.PRESS:
      console.log('User pressed notification:', detail.notification?.title);
      // You can add navigation logic here later if needed
      // For example, navigate to specific screens based on notification data
      break;

    case EventType.DISMISSED:
      console.log('User dismissed notification');
      break;

    case EventType.ACTION_PRESS:
      console.log('User pressed notification action:', detail.pressAction?.id);
      break;

    default:
      console.log('Other notification event:', type);
  }
});

console.log('✅ Notifee background event handler registered');
