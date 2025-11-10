# Automatic Image Cleanup - Cloud Functions

## Overview
Automatically deletes images from Firebase Storage when events or campaigns are deleted from Firestore.

---

## Cloud Functions Created

### 1. **onEventDeleted**
- **Trigger:** Event document deleted from `events/{eventId}`
- **Action:** Deletes `/events/{eventId}/image.jpg` from Firebase Storage
- **Location:** `functions/src/cleanup/onEventDeleted.ts`

### 2. **onCampaignDeleted**
- **Trigger:** Campaign document deleted from `campaigns/{campaignId}`
- **Action:** Deletes `/campaigns/{campaignId}/image.jpg` from Firebase Storage
- **Location:** `functions/src/cleanup/onCampaignDeleted.ts`

---

## How It Works

1. **Admin deletes event/campaign** from dashboard (or via Firebase Console)
2. **Firestore triggers Cloud Function** automatically
3. **Cloud Function:**
   - Checks if the deleted document had an `image_url`
   - If yes, deletes the image file from Storage
   - If no, logs that no cleanup was needed
4. **Error handling:**
   - If file doesn't exist (404), logs warning and continues
   - If other error, logs error but doesn't fail

---

## Deployment

Deploy the new functions:

```bash
cd d:\DEV\MosqueApp\mosque_app_functions\functions
npm run deploy
```

This will deploy:
- ✅ `onEventDeleted` - Clean up event images
- ✅ `onCampaignDeleted` - Clean up campaign images

---

## Testing

### Test Event Deletion:
1. Create an event with an image in the admin dashboard
2. Note the event ID (visible in URL or Firestore)
3. Delete the event from the dashboard
4. Check Firebase Console → Storage → events/{eventId}/ - folder should be deleted
5. Check Cloud Functions logs for: `✅ Event image deleted from Storage`

### Test Campaign Deletion:
1. Create a campaign with an image
2. Delete the campaign
3. Verify image is removed from Storage
4. Check logs for: `✅ Campaign image deleted from Storage`

---

## Logs to Watch For

**Success:**
```
🗑️ Event deleted, cleaning up image...
✅ Event image deleted from Storage
```

**No image to delete:**
```
ℹ️ No image to delete for this event
```

**File already deleted:**
```
⚠️ Image file not found in Storage (already deleted)
```

**Error:**
```
❌ Error deleting event image from Storage
```

---

## Benefits

✅ **Prevents orphaned files** - No leftover images wasting storage
✅ **Automatic cleanup** - Works even if deleted via Firebase Console
✅ **Cost savings** - Reduces Firebase Storage usage and costs
✅ **Production-ready** - Proper error handling and logging
✅ **Works everywhere** - Triggers regardless of deletion method

---

## Cost Impact

**Before:** Deleting 100 events with images = 100 orphaned files (~30 MB)
**After:** Deleting 100 events with images = 0 orphaned files (automatic cleanup)

**Storage savings:** ~$0.026 per GB/month (Firebase pricing)

---

## Files Modified

1. ✅ `functions/src/cleanup/onEventDeleted.ts` (NEW)
2. ✅ `functions/src/cleanup/onCampaignDeleted.ts` (NEW)
3. ✅ `functions/src/index.ts` (UPDATED - exports new functions)

---

**Created:** 2025-11-02
**Status:** Ready for deployment
