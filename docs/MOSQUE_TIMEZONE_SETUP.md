# Mosque Timezone Configuration

## Overview

The Al Ansar Masjid app now supports timezone-aware prayer time calculations. This ensures that the "current prayer" highlight and "time to next prayer" countdown work correctly regardless of where the user is located.

## Why This Matters

**Problem**: Without timezone configuration:
- A user in New York viewing the app would see prayer times calculated for Brisbane
- But the "current prayer" would be highlighted based on New York time
- This creates confusion when the user's local time doesn't match the mosque's local time

**Solution**: The app now uses the mosque's timezone for all time comparisons.

## How to Configure

### Firebase Firestore Setup

Add a `timezone` field to your mosque settings document:

```javascript
// In Firestore: mosqueSettings/current
{
  "name": "Al Ansar Masjid",
  "latitude": -27.4705,
  "longitude": 153.0260,
  "timezone": "Australia/Brisbane",  // ← Add this field
  "calculation_method": "MuslimWorldLeague",
  // ... other settings
}
```

### Finding Your Timezone Identifier

Use the **IANA timezone database** format (e.g., "Continent/City"):

**Common Examples**:
- Australia: `"Australia/Brisbane"`, `"Australia/Sydney"`, `"Australia/Melbourne"`
- USA: `"America/New_York"`, `"America/Chicago"`, `"America/Los_Angeles"`
- UK: `"Europe/London"`
- Middle East: `"Asia/Dubai"`, `"Asia/Riyadh"`, `"Asia/Kuwait"`
- Canada: `"America/Toronto"`, `"America/Vancouver"`
- Singapore: `"Asia/Singapore"`

**Full List**: [List of IANA Timezone Identifiers](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

### Verification

After setting the timezone:
1. Open the app on a device in a different timezone
2. Check that the "Next Prayer" countdown makes sense for the mosque's local time
3. Verify that the correct prayer is highlighted based on mosque time, not user time

## Technical Details

### What Gets Adjusted

With timezone configured, the following now use **mosque local time**:
- ✅ Current prayer highlighting (gold background)
- ✅ "Next prayer in X hours Y minutes" countdown
- ✅ Prayer time staleness check (shows warning if times are old)
- ✅ Auto-fetch prayer times (checks if update is needed based on mosque's day)

### What Stays the Same

These continue to work as before:
- ✅ Prayer time calculation (still uses mosque coordinates)
- ✅ Prayer time display (times shown are for mosque location)
- ✅ Islamic date calculation

### Fallback Behavior

If no timezone is configured:
- The app falls back to using the **user's device time**
- This maintains backward compatibility with existing installations
- However, users in different timezones may see incorrect "current prayer" highlights

## Example Scenarios

### Scenario 1: User in Same Timezone as Mosque
- **Mosque**: Brisbane, Australia (`Australia/Brisbane`)
- **User**: Also in Brisbane
- **Result**: Everything works as before (no difference)

### Scenario 2: User in Different Timezone
- **Mosque**: Brisbane, Australia (`Australia/Brisbane`)
- **User**: New York, USA
- **Without timezone config**: 
  - Mosque local time: 1:00 AM (Fajr is next)
  - User local time: 10:00 AM (would incorrectly show Dhuhr as current)
- **With timezone config**: 
  - ✅ Correctly shows Fajr as next prayer (based on mosque time)
  - ✅ Countdown shows accurate time until Fajr in Brisbane

### Scenario 3: Traveler Using App
- **Mosque**: Brisbane, Australia
- **User**: Traveling in Dubai
- **Result**: 
  - ✅ Still sees Brisbane prayer times (correct)
  - ✅ "Current prayer" reflects what's happening at the mosque in Brisbane
  - ✅ Can plan to join virtual or check mosque status accurately

## Migration Guide

### For Existing Installations

1. **Determine your mosque's timezone**:
   - Check your mosque's coordinates in Firebase
   - Use [timezonefinder.io](https://timezonefinder.io/) if unsure
   - Confirm the IANA timezone identifier

2. **Update Firestore**:
   ```javascript
   // Update the mosqueSettings/current document
   firebase.firestore()
     .collection('mosqueSettings')
     .doc('current')
     .update({
       timezone: 'Australia/Brisbane' // Replace with your timezone
     });
   ```

3. **Deploy app update**:
   - Users on older app versions will continue to work (uses fallback)
   - Users on new version will automatically use timezone-aware calculations

4. **Test**:
   - Change your device timezone to a different one
   - Open the app and verify prayer highlighting is still correct

## Troubleshooting

### Issue: Wrong Prayer Still Highlighted

**Possible causes**:
1. Timezone identifier is incorrect or misspelled
2. Timezone field not synced to app yet (check Firebase)
3. App cache needs refresh (restart app)

**Solution**:
- Verify timezone identifier in Firebase console
- Ensure it matches IANA database format exactly
- Force close and reopen the app

### Issue: "Data is stale" Warning Shows Incorrectly

**Cause**: Staleness check now uses mosque timezone

**Solution**:
- This is expected behavior if prayer times were last updated in a different day (mosque time)
- Pull to refresh to update prayer times
- Times will auto-update when mosque's day changes

### Issue: Countdown Shows Negative Time

**Cause**: Clock skew or incorrect timezone

**Solution**:
- Check device time is correct
- Verify timezone identifier in Firebase
- Ensure mosque coordinates are accurate

## Support

For questions or issues:
1. Check Firebase console for correct timezone value
2. Test with device in same timezone as mosque first
3. Create an issue on GitHub with:
   - Mosque timezone setting
   - User device timezone
   - Expected vs actual behavior

## References

- [IANA Timezone Database](https://www.iana.org/time-zones)
- [List of Timezones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
- [MDN Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
