# Image Upload & Big Picture Notifications - Implementation Plan

## Project Overview

This document outlines the complete implementation plan for adding image upload functionality to the mosque admin dashboard and displaying those images in both the mobile app and as Big Picture style notifications.

---

## Current State

### Mobile App (`al-ansar-masjid-app`)
- ✅ **Campaign images ARE displayed** in `CampaignCard.tsx` (180px height, from `image_url` field)
- ❌ **Event images are NOT displayed** in events screen
- ✅ **Notifications working** with custom icons for each type (prayer, event, campaign, urgent, general)
- ✅ **Vibration patterns working** for different notification types
- ✅ **Foreground and background notifications working**

### Admin Dashboard (`mosque-admin-dashboard`)
- ❌ **No image upload functionality** - just text input for external URLs
- ❌ **Campaign images NOT displayed** - only shows "🖼️ Image configured" indicator
- ❌ **Event images NOT displayed**
- ⚠️ **Firebase Storage configured** in `firebase.ts` but not being used

### Firebase Functions (`mosque_app_functions`)
- ✅ **Sending data-only messages** with notification type
- ❌ **NOT including image URLs** in notification payloads

### Data Models
Both Event and Campaign interfaces have `image_url?: string` field defined:
- `types/index.ts` in mobile app
- TypeScript interfaces in admin dashboard components

---

## Implementation Plan - Order of Operations

### **Phase 1: Firebase Storage Setup** (Foundation)
**Goal:** Enable and configure Firebase Storage for image uploads

**Tasks:**
1. Enable Firebase Storage in Firebase Console
   - Go to Firebase Console → Storage → Get Started
   - Choose security rules mode (start with test mode, then secure later)

2. Set up Storage security rules in Firebase Console:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Images for events
    match /events/{eventId}/{fileName} {
      allow read: if true; // Public read
      allow write: if request.auth != null // Authenticated users only
                   && request.resource.size < 1 * 1024 * 1024 // Max 1MB
                   && request.resource.contentType.matches('image/.*'); // Images only
    }

    // Images for campaigns
    match /campaigns/{campaignId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.resource.size < 1 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

3. Install Firebase Storage SDK in admin dashboard:
```bash
cd mosque-admin-dashboard
npm install firebase
```

4. Update `mosque-admin-dashboard/src/firebase.ts` to export storage:
```typescript
import { getStorage } from 'firebase/storage';

export const storage = getStorage(app);
```

---

### **Phase 2: Admin Dashboard - Image Upload Component**
**Goal:** Create reusable image upload with compression and Firebase Storage integration

**Files to create/modify:**
- `mosque-admin-dashboard/src/components/ImageUpload.tsx` (NEW)
- `mosque-admin-dashboard/src/components/CampaignsTab.tsx` (MODIFY)
- `mosque-admin-dashboard/src/components/EventsTab.tsx` (MODIFY)

**Image Constraints:**
- **Max file size:** 1 MB before upload
- **Max dimensions:** 800x450px (16:9 ratio)
- **Target compressed size:** 200-300 KB
- **Allowed formats:** JPG, PNG
- **Output format:** JPG (compressed)

**ImageUpload Component Features:**
- Drag & drop or click to upload
- Image preview with dimensions and file size
- Client-side validation (size, type, dimensions)
- Automatic resize to 800px width (maintaining aspect ratio)
- Automatic compression to ~75-80% quality
- Upload progress indicator
- Delete existing image
- Error handling and user feedback

**Storage Structure:**
```
/events/{eventId}/
  - image.jpg (800x450px max, ~200-300 KB)

/campaigns/{campaignId}/
  - image.jpg (800x450px max, ~200-300 KB)
```

**Implementation Details:**

1. **Create `ImageUpload.tsx` component** with:
   - File input with drag & drop
   - Image preview
   - Client-side image compression using browser Canvas API
   - Upload to Firebase Storage using `uploadBytesResumable`
   - Return download URL to parent component

2. **Update `CampaignsTab.tsx`**:
   - Replace text input for `image_url` with `ImageUpload` component
   - Display uploaded image in campaign cards
   - Pass image URL to Firestore when saving campaign

3. **Update `EventsTab.tsx`**:
   - Replace text input for `image_url` with `ImageUpload` component
   - Display uploaded image in event cards
   - Pass image URL to Firestore when saving event

---

### **Phase 3: Mobile App - Event Images Display**
**Goal:** Display event images in the mobile app (like campaigns already do)

**Files to modify:**
- `al-ansar-masjid-app/app/(tabs)/events.tsx`

**Implementation:**
Add image display to event cards, similar to `CampaignCard.tsx`:
```typescript
{event.image_url && (
  <Image
    source={{ uri: event.image_url }}
    style={styles.eventImage}
    resizeMode="cover"
  />
)}
```

**Styling:**
- Display image at top of event card
- Height: 180px (same as campaign cards)
- Full width with border radius
- Fallback placeholder if no image

---

### **Phase 4: Cloud Functions - Include Images in Notifications**
**Goal:** Include image URLs in notification data payloads

**Files to modify:**
- `mosque_app_functions/functions/src/notifications/onEventCreated.ts`
- `mosque_app_functions/functions/src/notifications/onEventUpdated.ts`
- `mosque_app_functions/functions/src/notifications/onCampaignCreated.ts`

**Changes:**
Add `imageUrl` to notification data:
```typescript
const message = {
  data: {
    type: "event",
    eventId: eventId,
    title: "🕌 New Event",
    body: `${eventData.title}${dateStr}`,
    imageUrl: eventData.image_url || "", // ADD THIS
    // ... other fields
  },
  tokens: tokens,
};
```

**Note:** Only include `imageUrl` if it exists in the event/campaign data.

---

### **Phase 5: Mobile App - Big Picture Notifications**
**Goal:** Display notifications with images using Android Big Picture style

**Files to modify:**
- `al-ansar-masjid-app/services/NotificationService.ts`

**Implementation:**

1. **Update `DisplayNotificationOptions` interface**:
```typescript
export interface DisplayNotificationOptions {
  title: string;
  body: string;
  channelId?: NotificationChannelId;
  data?: Record<string, any>;
  largeIcon?: string;
  imageUrl?: string; // ADD THIS - for Big Picture style
}
```

2. **Update `displayNotification` method** to support Big Picture style:
```typescript
// After the BigText style section, add Big Picture style:

// Add Big Picture style if image URL is provided
if (data?.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.trim()) {
  notification.android.style = {
    type: AndroidStyle.BIGPICTURE,
    picture: data.imageUrl.trim(),
  };
}
```

3. **Import AndroidStyle**:
```typescript
import notifee, { AndroidStyle } from '@notifee/react-native';
```

4. **Update notification display methods** to pass image URL:
```typescript
async displayEventNotification(title: string, body: string, data?: Record<string, any>) {
  return this.displayNotification({
    title,
    body,
    channelId: 'events',
    data,
    imageUrl: data?.imageUrl, // PASS IMAGE URL
  });
}

async displayCampaignNotification(title: string, body: string, data?: Record<string, any>) {
  return this.displayNotification({
    title,
    body,
    channelId: 'campaigns',
    data,
    imageUrl: data?.imageUrl, // PASS IMAGE URL
  });
}
```

**Big Picture Style Behavior:**
- When notification is collapsed: Shows small icon + title + body
- When notification is expanded: Shows large image below text
- Image is downloaded and cached by Android automatically
- If image fails to load, falls back to regular notification

---

### **Phase 6: Testing & Validation**
**Goal:** End-to-end testing and optimization

**Testing Checklist:**

**Admin Dashboard:**
- [ ] Upload image for new campaign
- [ ] Upload image for new event
- [ ] Replace existing image
- [ ] Delete image
- [ ] Verify image appears in campaign/event list
- [ ] Test file size validation (try uploading >1MB file)
- [ ] Test file type validation (try uploading PDF, etc.)

**Mobile App - Images Display:**
- [ ] Campaign images display correctly in cards
- [ ] Event images display correctly in cards
- [ ] Images load smoothly while scrolling
- [ ] Placeholder shows when no image

**Mobile App - Notifications:**
- [ ] Create event with image → receive notification → expand → see image
- [ ] Create campaign with image → receive notification → expand → see image
- [ ] Test with app in foreground
- [ ] Test with app in background
- [ ] Test with app completely closed
- [ ] Test notification without image (should work normally)
- [ ] Test with slow internet (image loading)
- [ ] Test with no internet (notification should still show without image)

**Firebase Functions:**
- [ ] Verify image URL is included in notification payload
- [ ] Check Cloud Function logs for errors
- [ ] Test with event that has no image

**Performance:**
- [ ] Check image file sizes (should be ~200-300 KB)
- [ ] Check loading time in mobile app
- [ ] Check Firebase Storage usage and costs
- [ ] Optimize if needed

---

## Technical Notes

### Image Optimization Strategy

**Client-side compression** (in ImageUpload component):
```typescript
// Pseudo-code for image compression
const compressImage = async (file: File): Promise<Blob> => {
  // 1. Load image into canvas
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // 2. Calculate new dimensions (max 800px width)
  const maxWidth = 800;
  let width = img.width;
  let height = img.height;

  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  canvas.width = width;
  canvas.height = height;

  // 3. Draw and compress
  ctx.drawImage(img, 0, 0, width, height);

  // 4. Convert to blob with 75% quality
  return new Promise(resolve => {
    canvas.toBlob(resolve, 'image/jpeg', 0.75);
  });
};
```

### Android Big Picture Style Specifications

- **Recommended image size:** 2:1 aspect ratio (e.g., 1024x512px)
- **Maximum dimensions:** Android will scale down if too large
- **Supported formats:** JPG, PNG, WebP
- **Loading:** Images are downloaded asynchronously by Android
- **Caching:** Android caches notification images automatically
- **Fallback:** If image fails to load, notification shows without image

### Firebase Storage Costs (Approximate)

Based on Firebase pricing (as of 2024):
- **Storage:** $0.026 per GB/month
- **Download bandwidth:** $0.12 per GB

**Example cost calculation:**
- 100 events/campaigns with images: ~30 MB storage = ~$0.001/month
- 1,000 notification image downloads/month: ~300 MB = ~$0.036/month

**Total estimated cost for moderate usage: <$1/month**

---

## Troubleshooting Guide

### Issue: Images not uploading
**Check:**
- Firebase Storage is enabled in console
- Storage rules allow write access
- File size is under 1MB
- File type is JPG or PNG
- User is authenticated

### Issue: Images not displaying in mobile app
**Check:**
- `image_url` field exists in Firestore document
- URL is valid and publicly accessible
- Image component has correct `source={{ uri: imageUrl }}` syntax
- Check React Native console for image loading errors

### Issue: Notifications showing without images
**Check:**
- `imageUrl` is included in FCM data payload
- Image URL is valid and accessible
- Android has internet connection
- Check Notifee logs for errors
- Try a different image URL (test with known working URL)

### Issue: Images too large / slow to load
**Solution:**
- Verify compression is working in ImageUpload component
- Check actual file size in Firebase Storage console
- Consider generating multiple image sizes (thumbnail + full)
- Use Firebase CDN for faster delivery

---

## Future Enhancements (Optional)

1. **Multiple image sizes:**
   - Thumbnail (400x225, ~50 KB) for cards
   - Full (800x450, ~200 KB) for notifications

2. **Image cropping tool:**
   - Allow admin to crop/adjust image before upload

3. **Lazy loading:**
   - Load images only when visible in viewport

4. **Progressive loading:**
   - Show blur placeholder → sharp image

5. **Custom notification actions:**
   - "View Event" button on notification
   - "Donate Now" button for campaigns

---

## Resources

**Documentation:**
- [Firebase Storage Web SDK](https://firebase.google.com/docs/storage/web/start)
- [Notifee Android Styles](https://notifee.app/react-native/docs/android/styles)
- [React Native Image](https://reactnative.dev/docs/image)

**Tools:**
- [TinyPNG](https://tinypng.com/) - Test image compression
- [Squoosh](https://squoosh.app/) - Image compression tool

**Current File Locations:**
- Mobile app: `d:\DEV\MosqueApp\al-ansar-masjid-app`
- Admin dashboard: `d:\DEV\MosqueApp\mosque-admin-dashboard`
- Firebase functions: `d:\DEV\MosqueApp\mosque_app_functions`

---

## Quick Start Prompt for New Chat

```
I need to implement image upload functionality for a mosque admin dashboard and display those images in notifications.

CONTEXT:
- Admin dashboard: React web app with Firebase
- Mobile app: React Native with Expo, Firebase, and Notifee
- Firebase functions: Send notifications when events/campaigns are created

CURRENT STATE:
- Campaign images already display in mobile app cards
- Event images do NOT display anywhere
- No image upload functionality - just text input for URLs
- Firebase Storage is configured but not being used
- Notifications work with custom icons and vibration patterns

GOAL:
Implement complete image upload flow:
1. Firebase Storage setup with security rules
2. Admin dashboard image upload component with compression
3. Display event images in mobile app
4. Include images in notification payloads (Cloud Functions)
5. Big Picture notifications in mobile app

IMAGE REQUIREMENTS:
- Max 1MB file size
- Auto-resize to 800x450px
- Auto-compress to ~200-300 KB
- JPG/PNG only
- Storage structure: /events/{id}/image.jpg and /campaigns/{id}/image.jpg

Please read the full implementation plan at:
d:\DEV\MosqueApp\IMAGE_UPLOAD_IMPLEMENTATION_PLAN.md

Let's start with Phase 1: Firebase Storage setup. What do I need to do?
```

---

**Document created:** 2025-11-02
**Last updated:** 2025-11-02
**Status:** Ready for implementation
