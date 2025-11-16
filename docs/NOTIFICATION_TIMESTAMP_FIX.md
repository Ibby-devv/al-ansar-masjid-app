# Notification Timestamp Issue - Resolution Guide

## Issue
After transitioning from string dates to Firestore Timestamps throughout the app, notifications stopped being received.

## Root Cause
Firebase Cloud Messaging (FCM) **requires all data payload values to be strings**. When the backend Cloud Functions were updated to work with Timestamp fields in Firestore documents, they attempted to include these Timestamp objects in notification payloads without converting them to strings first. This caused FCM to reject the messages, resulting in no notifications being delivered.

## Solution

### Mobile App Changes (COMPLETED - v1.0.6)
✅ The mobile app has been updated to robustly handle timestamp data in notification payloads:

1. **New Utilities** (`utils/notificationDataHelpers.ts`)
   - Parses timestamps from JSON strings, ISO dates, and unix timestamps
   - Automatically processes incoming notification data
   - Handles common timestamp field names

2. **Updated FCMService** (`services/FCMService.ts`)
   - Processes all incoming notification data before use
   - Deserializes timestamp fields automatically
   - Enhanced logging for debugging

3. **Documentation** (`docs/NOTIFICATION_DATA_FORMAT.md`)
   - Complete guide for backend team
   - Code examples for correct timestamp serialization
   - Common mistakes to avoid

### Backend Changes (REQUIRED)

⚠️ **The backend Cloud Functions MUST be updated** to serialize Timestamp objects to strings before sending notifications.

#### Required Changes in Cloud Functions

**Location**: `functions/src/notifications/` (in the backend repository)

**Files to Update**:
- `onEventCreated.ts`
- `onEventUpdated.ts`
- `onCampaignCreated.ts`
- `onIqamahChanged.ts`
- `sendCustomNotification.ts`
- Any other notification-sending functions

**Example Fix**:

```typescript
// ❌ BEFORE (BROKEN)
const eventData = eventDoc.data();
const message = {
  data: {
    type: 'event',
    title: eventData.title,
    body: eventData.description,
    eventDate: eventData.date, // ❌ This is a Timestamp object, not a string!
    imageUrl: eventData.image_url || '',
  },
  tokens: fcmTokens,
  android: { priority: 'high' },
};

// ✅ AFTER (FIXED)
const eventData = eventDoc.data();
const eventDate: Timestamp = eventData.date;

const message = {
  data: {
    type: 'event',
    title: eventData.title,
    body: eventData.description,
    // ✅ Serialize the Timestamp to a JSON string
    eventDate: JSON.stringify({
      seconds: eventDate.seconds,
      nanoseconds: eventDate.nanoseconds
    }),
    imageUrl: eventData.image_url || '',
  },
  tokens: fcmTokens,
  android: { priority: 'high' },
};
```

**Alternative Serialization Methods**:

```typescript
// Option 1: JSON string (RECOMMENDED - preserves precision)
eventDate: JSON.stringify({ seconds: timestamp.seconds, nanoseconds: timestamp.nanoseconds })

// Option 2: ISO 8601 string (simpler, but loses nanosecond precision)
eventDate: timestamp.toDate().toISOString()

// Option 3: Unix timestamp in seconds (loses precision, but compact)
eventDate: String(timestamp.seconds)
```

## Testing

### After Backend is Updated

1. **Deploy Updated Cloud Functions**
   ```bash
   cd mosque_app_functions/functions
   npm run build
   npm run deploy
   ```

2. **Test Notification Flow**
   - Create a new event in the admin dashboard
   - Verify notification is sent (check Cloud Functions logs)
   - Verify notification is received on device (check app logs)

3. **Check App Logs**
   Look for these log messages:
   ```
   📭 Background message received: {...}
   📋 Processed notification data: { type: 'event', ... }
   ✅ Notification displayed
   ```

4. **Check Cloud Functions Logs**
   - Should show successful sends: `successCount: X`
   - Should NOT show errors about invalid data types

### Verification Checklist

- [ ] Cloud Functions deploy successfully
- [ ] Test event creation triggers notification
- [ ] Mobile app receives notification
- [ ] Mobile app logs show processed timestamp data
- [ ] Notification displays correctly with event details
- [ ] Tapping notification navigates correctly (if implemented)

## Rollback Plan

If issues occur after backend update:

1. **Verify the serialization format**
   - Check Cloud Functions logs for the actual data being sent
   - Ensure ALL values in `data` object are strings

2. **Test with hardcoded values**
   - Try sending a test notification with hardcoded string values
   - If that works, the issue is in the serialization logic

3. **Check FCM errors**
   - Look for FCM errors in Cloud Functions logs
   - Common error: "Invalid value type for field 'data'"

## Related Documentation

- `docs/NOTIFICATION_DATA_FORMAT.md` - Detailed backend implementation guide
- `utils/notificationDataHelpers.ts` - Mobile app timestamp parsing utilities
- `services/FCMService.ts` - Notification handling implementation

## Support

If notifications still don't work after backend update:

1. Check backend Cloud Functions logs for send errors
2. Check mobile app logs for receive/process errors
3. Verify FCM tokens are being registered correctly
4. Test with a simple notification (no timestamp data) to isolate the issue

---

**Status**: Mobile app updates complete ✅ | Backend updates required ⚠️
**Version**: Mobile app v1.0.6+ supports timestamp deserialization
**Last Updated**: 2025-11-16
