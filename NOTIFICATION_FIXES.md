# FCM Notification Fixes Applied

## Problem
Notifications stopped working after phone update (likely Android 13+). Cloud Functions show successful sends but device doesn't receive notifications.

## Root Causes Identified
1. **Android 13 Permission Missing**: `POST_NOTIFICATIONS` runtime permission not declared in manifest
2. **Low Priority Data Messages**: Background data-only messages need `android: { priority: 'high' }` to wake the app

## Changes Made

### 1. Android App (`al-ansar-masjid-app`)

#### Added Android 13 Permission
**File**: `android/app/src/main/AndroidManifest.xml`
- Added `<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>`
- This allows Android 13+ devices to show the runtime permission prompt

#### Added Diagnostic Test UI
**File**: `screens/NotificationSettingsScreen.tsx`
- Shows device Android API level, app version, device ID, system permission status
- Test button to trigger local notification (validates Notifee rendering path)
- Permission prompt with guidance for Android 13+ users
- Helps identify if issue is device permission vs FCM delivery

### 2. Cloud Functions (`mosque_app_functions`)

#### Created Messaging Helper Utility
**File**: `functions/src/utils/messagingHelpers.ts`
- `buildDataOnlyMessage()`: Builds FCM payload with high priority for Android + content-available for iOS
- Ensures background message handlers are invoked when app is backgrounded/quit
- Follows RN Firebase best practices for data-only messages

#### Updated All Notification Functions
**Files**:
- `functions/src/notifications/sendCustomNotification.ts`
- `functions/src/notifications/onEventCreated.ts`
- `functions/src/notifications/onCampaignCreated.ts`
- `functions/src/notifications/onIqamahChanged.ts`
- `functions/src/notifications/onEventUpdated.ts`

All now use `buildDataOnlyMessage()` which includes:
```typescript
{
  data: { ...notificationData },
  tokens: [...],
  android: {
    priority: 'high', // CRITICAL for background delivery
  },
  apns: {
    payload: {
      aps: {
        contentAvailable: true, // For iOS
      },
    },
    headers: {
      'apns-push-type': 'background',
      'apns-priority': '5',
    },
  },
}
```

## Next Steps: Deploy & Test

### 1. Build and Install Updated App
```powershell
cd D:\DEV\MosqueApp\al-ansar-masjid-app
npm run build:release
npm run install:release
```

### 2. Deploy Updated Cloud Functions
```powershell
cd D:\DEV\MosqueApp\mosque_app_functions\functions
npm run build
npm run deploy
```

### 3. Run Diagnostic Tests

#### Test Device Permission
1. Open app → Settings → Notifications
2. Check "Diagnostics" section at bottom
3. Note Android API level (if 33+, you're on Android 13)
4. Check "System Permission" status:
   - ❌ DENIED → Tap "Test Local Notification" button → Should prompt for permission
   - ✅ GRANTED → Good, proceed

#### Test Local Notification
1. Tap "🧪 Test Local Notification" button
2. Should see notification appear immediately
3. If it appears: Notifee rendering works, issue was FCM delivery
4. If it doesn't: Check device Settings → Apps → Your App → Notifications

#### Test FCM Background Delivery
1. Background the app (home button)
2. Trigger a notification from admin dashboard or create an event
3. Should now see notification on device (previously wouldn't appear)
4. Check Cloud Functions logs for successCount

### 4. Verify End-to-End
- Create a test event in admin dashboard
- Check phone receives notification (app backgrounded)
- Open notification → should navigate to event details
- Check Firestore `fcmTokens` → `lastSeen` updates when app opens

## Expected Results
- Android 13+ devices will now show permission prompt on first launch
- Background notifications will wake the app JS and display via Notifee
- Foreground notifications continue working as before
- Token cleanup continues to remove invalid tokens automatically

## Rollback (if needed)
If issues arise:
1. App: Remove POST_NOTIFICATIONS line from manifest, rebuild
2. Functions: Revert to previous message format without priority (not recommended—this was the bug)

## Reference
- [RN Firebase Messaging Docs](https://rnfirebase.io/messaging/usage)
- [Android 13 Notification Permission](https://developer.android.com/develop/ui/views/notifications/notification-permission)
- [Notifee Android Permissions](https://notifee.app/react-native/docs/android/permissions)
