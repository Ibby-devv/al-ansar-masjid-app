# Notification Data Format for Backend Cloud Functions

## Overview
This document specifies the correct format for sending notification data from Firebase Cloud Functions to the mobile app, particularly when dealing with Timestamp fields.

## Critical Requirement: FCM Data Payload Must Use Strings

**Firebase Cloud Messaging (FCM) requires ALL values in the `data` payload to be strings.**

This means when you have Firestore Timestamp objects that need to be included in notification data, they must be serialized to strings before sending.

## Recommended Timestamp Serialization Formats

The mobile app's `processNotificationData()` function can handle timestamps in the following formats (in order of preference):

### 1. JSON String of Timestamp Object (RECOMMENDED)
```typescript
// Backend (Cloud Functions)
const eventDate: FirebaseFirestoreTypes.Timestamp = eventDoc.data().date;

const notificationData = {
  type: 'event',
  title: 'New Event',
  body: 'Check out our upcoming event',
  eventId: eventDoc.id,
  eventDate: JSON.stringify({
    seconds: eventDate.seconds,
    nanoseconds: eventDate.nanoseconds
  }),
  imageUrl: eventDoc.data().image_url || ''
};
```

### 2. ISO 8601 Date String
```typescript
// Backend (Cloud Functions)
const eventDate: FirebaseFirestoreTypes.Timestamp = eventDoc.data().date;

const notificationData = {
  type: 'event',
  title: 'New Event',
  body: 'Check out our upcoming event',
  eventId: eventDoc.id,
  eventDate: eventDate.toDate().toISOString(), // e.g., "2024-01-15T14:30:00.000Z"
  imageUrl: eventDoc.data().image_url || ''
};
```

### 3. Unix Timestamp (Seconds)
```typescript
// Backend (Cloud Functions)
const eventDate: FirebaseFirestoreTypes.Timestamp = eventDoc.data().date;

const notificationData = {
  type: 'event',
  title: 'New Event',
  body: 'Check out our upcoming event',
  eventId: eventDoc.id,
  eventDate: String(eventDate.seconds), // e.g., "1705328400"
  imageUrl: eventDoc.data().image_url || ''
};
```

## Timestamp Fields Automatically Detected

The mobile app will automatically attempt to deserialize the following field names if they are present in the notification data:

- `date`, `eventDate`, `startDate`, `endDate`, `start_date`, `end_date`
- `createdAt`, `updatedAt`, `created_at`, `updated_at`
- `scheduledAt`, `scheduled_at`

## Example: Complete Notification Payload

### Event Notification
```typescript
// functions/src/notifications/onEventCreated.ts

import { Timestamp } from 'firebase-admin/firestore';
import { MulticastMessage } from 'firebase-admin/messaging';

const eventData = eventDoc.data();
const eventDate: Timestamp = eventData.date;

const message: MulticastMessage = {
  tokens: fcmTokens,
  data: {
    type: 'event',
    title: eventData.title,
    body: `Join us on ${eventDate.toDate().toLocaleDateString()}`,
    eventId: eventDoc.id,
    // CRITICAL: Serialize the timestamp
    eventDate: JSON.stringify({
      seconds: eventDate.seconds,
      nanoseconds: eventDate.nanoseconds
    }),
    imageUrl: eventData.image_url || '',
  },
  android: {
    priority: 'high',
  },
  apns: {
    payload: {
      aps: {
        contentAvailable: true,
      },
    },
    headers: {
      'apns-push-type': 'background',
      'apns-priority': '5',
    },
  },
};

await admin.messaging().sendMulticast(message);
```

### Campaign Notification
```typescript
// functions/src/notifications/onCampaignCreated.ts

const campaignData = campaignDoc.data();
const startDate: Timestamp = campaignData.start_date;
const endDate: Timestamp = campaignData.end_date;

const message: MulticastMessage = {
  tokens: fcmTokens,
  data: {
    type: 'campaign',
    title: campaignData.title,
    body: campaignData.description,
    campaignId: campaignDoc.id,
    // CRITICAL: Serialize timestamps
    startDate: JSON.stringify({
      seconds: startDate.seconds,
      nanoseconds: startDate.nanoseconds
    }),
    endDate: JSON.stringify({
      seconds: endDate.seconds,
      nanoseconds: endDate.nanoseconds
    }),
    imageUrl: campaignData.image_url || '',
  },
  android: {
    priority: 'high',
  },
  apns: {
    payload: {
      aps: {
        contentAvailable: true,
      },
    },
    headers: {
      'apns-push-type': 'background',
      'apns-priority': '5',
    },
  },
};

await admin.messaging().sendMulticast(message);
```

## Common Mistakes to Avoid

### ❌ WRONG: Sending Timestamp object directly
```typescript
const message = {
  data: {
    eventDate: eventDate, // ERROR: Object, not a string!
  }
};
```

### ❌ WRONG: Using toString() on Timestamp
```typescript
const message = {
  data: {
    eventDate: eventDate.toString(), // Produces "[object Object]"
  }
};
```

### ✅ CORRECT: Serialize to JSON string
```typescript
const message = {
  data: {
    eventDate: JSON.stringify({
      seconds: eventDate.seconds,
      nanoseconds: eventDate.nanoseconds
    }),
  }
};
```

### ✅ CORRECT: Convert to ISO string
```typescript
const message = {
  data: {
    eventDate: eventDate.toDate().toISOString(),
  }
};
```

## Testing

### Verify Notification Payload
Before deploying, test your notification payload:

```typescript
console.log('Notification data payload:', JSON.stringify(message.data, null, 2));
```

Ensure:
1. All values in `data` are strings (not objects or numbers)
2. Timestamp fields are properly serialized
3. All required fields (title, body, type) are present

### Test on Device
After deploying:
1. Trigger a notification from the backend
2. Check mobile app logs for: `📋 Processed notification data:`
3. Verify timestamps were deserialized correctly
4. Confirm notification displays properly

## Mobile App Changes (v1.0.6+)

The mobile app now includes:
- `utils/notificationDataHelpers.ts`: Utilities to parse timestamps from various string formats
- Updated `FCMService.ts`: Automatically processes notification data to deserialize timestamps
- Enhanced logging: Shows processed data structure for debugging

## Reference

- **FCM Data Messages Docs**: https://firebase.google.com/docs/cloud-messaging/concept-options#data_messages
- **Mobile App Code**: `services/FCMService.ts`, `utils/notificationDataHelpers.ts`
- **Admin SDK Messaging**: https://firebase.google.com/docs/reference/admin/node/firebase-admin.messaging
