# Notification Timestamp Issue - Resolution Guide

## Issue
After transitioning from string dates to Firestore Timestamps throughout the app, notifications stopped being received.

## Root Cause
Firebase Cloud Messaging (FCM) **requires all data payload values to be strings**. When the backend Cloud Functions were updated to work with Timestamp fields in Firestore documents, they attempted to include these Timestamp objects in notification payloads without converting them to strings first. This caused FCM to reject the messages, resulting in no notifications being delivered.

## Solution

### ⚠️ This is a Backend-Only Issue

**The mobile app does NOT need any changes.** The app simply displays notification title and body - it doesn't parse or use timestamp data from the notification payload. The entire issue is on the backend side where Cloud Functions must serialize Timestamps before sending via FCM.

### Backend Changes (REQUIRED - See Below)

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
   - Verify notification is sent (check Cloud Functions logs for successful send)
   - Verify notification is received on device

3. **Check Cloud Functions Logs**
   - Should show successful sends: `successCount: X`
   - Should NOT show errors about invalid data types or FCM errors

### Verification Checklist

- [ ] Cloud Functions deploy successfully
- [ ] Test event creation triggers notification
- [ ] Mobile app receives notification
- [ ] Notification displays correctly with event details

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

- `docs/NOTIFICATION_DATA_FORMAT.md` - Detailed backend implementation guide with code examples

## Support

If notifications still don't work after backend update:

1. Check backend Cloud Functions logs for FCM send errors
2. Verify FCM data payload has all string values
3. Test with a simple notification (no timestamp data) to isolate the issue
4. Check FCM token registration is working correctly

---

**Status**: Backend updates required ⚠️
**Mobile App**: No changes needed - app already handles string data correctly
**Last Updated**: 2025-11-16
