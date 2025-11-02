# Notification Icons Guide

This guide explains how to customize notification icons in the Al-Ansar Masjid mobile app.

## Current Icon Setup

The app uses custom notification icons for each notification type:

| Notification Type | Icon Name | Icon Design |
|------------------|-----------|-------------|
| Prayer | `ic_notification_prayer` | Mosque/Prayer icon |
| Event | `ic_notification_event` | Calendar icon |
| Campaign | `ic_notification_campaign` | Megaphone icon |
| General | `ic_notification_general` | Bell icon |
| Urgent | `ic_notification_urgent` | Alert/Warning icon |

## Icon Files Location

Icons are stored in Android Vector Drawable XML format:

```
android/app/src/main/res/
  ├── drawable-mdpi/
  │   ├── ic_notification_prayer.xml (24x24dp)
  │   ├── ic_notification_event.xml
  │   ├── ic_notification_campaign.xml
  │   ├── ic_notification_general.xml
  │   └── ic_notification_urgent.xml
  ├── drawable-hdpi/
  │   └── ... (36x36dp)
  ├── drawable-xhdpi/
  │   └── ... (48x48dp)
  ├── drawable-xxhdpi/
  │   └── ... (72x72dp)
  └── drawable-xxxhdpi/
      └── ... (96x96dp)
```

## Android Notification Icon Guidelines

Android notification icons have specific design requirements:

### Design Requirements
- **Simple silhouettes**: Keep designs simple and recognizable
- **White on transparent**: Icons should be white (#FFFFFF) on a transparent background
- **No gradients**: Use solid colors only
- **Consistent padding**: Leave padding around the icon for visual balance
- **Clear at small sizes**: Icons must be recognizable at 24x24dp

### Size Specifications
- **mdpi**: 24x24 pixels (1x baseline)
- **hdpi**: 36x36 pixels (1.5x)
- **xhdpi**: 48x48 pixels (2x)
- **xxhdpi**: 72x72 pixels (3x)
- **xxxhdpi**: 96x96 pixels (4x)

## How to Customize Icons

### Option 1: Use Android Asset Studio (Recommended)

1. Visit [Android Asset Studio - Notification Icon Generator](https://romannurik.github.io/AndroidAssetStudio/icons-notification.html)
2. Upload your icon design or use the clipart library
3. Adjust padding and customize as needed
4. Download the generated zip file
5. Extract the contents
6. Copy the `res/` folder contents to `android/app/src/main/res/`
7. Rename files to match our naming convention:
   - `ic_stat_name.xml` → `ic_notification_prayer.xml` (etc.)

### Option 2: Manual Creation with Vector Drawables

1. Create an SVG icon following the design guidelines
2. Convert to Android Vector Drawable XML format:

```xml
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M12,2L1,21h22L12,2z..." />
</vector>
```

3. Save as `.xml` file in each `drawable-*` folder
4. Adjust `android:width` and `android:height` for each density

### Option 3: Use the Icon Generator Script

The project includes a script to regenerate placeholder icons:

```bash
node scripts/generate-notification-icons.js
```

This will create basic placeholder icons. You can modify the script to use your own SVG paths.

## Testing Your Icons

After adding or modifying icons:

1. **Clean and rebuild** the Android app:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx react-native run-android
   ```

2. **Test all notification types**:
   - Trigger prayer notifications
   - Create test events
   - Send campaign notifications
   - Test urgent and general notifications

3. **Verify on different devices**:
   - Different Android versions may render icons slightly differently
   - Test on both light and dark system themes

## Icon Design Tips

### Good Examples
✅ Simple geometric shapes (circles, squares, triangles)
✅ Clear silhouettes that read well at small sizes
✅ Consistent line weights
✅ Recognizable symbols (bell, calendar, alert)

### What to Avoid
❌ Complex details that disappear at small sizes
❌ Thin lines (use minimum 2dp stroke width)
❌ Text or numbers in icons
❌ Gradients or shadows
❌ Multiple colors (use white only)

## Icon Resources

### Design Tools
- **Figma**: Free vector design tool with Material Design icons
- **Adobe Illustrator**: Professional vector graphics editor
- **Inkscape**: Free, open-source SVG editor

### Icon Libraries
- [Material Design Icons](https://fonts.google.com/icons): Google's official icon library
- [Font Awesome](https://fontawesome.com/): Large collection of free icons
- [Feather Icons](https://feathericons.com/): Simple, beautiful open-source icons
- [Heroicons](https://heroicons.com/): Beautiful hand-crafted SVG icons

### Conversion Tools
- [SVG to Vector Drawable Converter](https://svg2vector.com/): Convert SVG to Android XML
- [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/): Complete icon generation suite

## Troubleshooting

### Icons not appearing
- **Check file names**: Must match exactly (case-sensitive on some systems)
- **Rebuild app**: Icons are compiled into the APK at build time
- **Check XML syntax**: Invalid XML will cause the icon to fail silently

### Icons look pixelated
- **Check density folders**: Ensure icons exist in all density folders
- **Use vector drawables**: XML-based icons scale perfectly at all sizes

### Icons appear as squares
- **Wrong format**: Notification icons must be white silhouettes on transparent background
- **Check pathData**: Invalid SVG path data will render incorrectly

## Code Reference

Icons are configured in [constants/notificationStyles.ts](../constants/notificationStyles.ts):

```typescript
export const NOTIFICATION_STYLES = {
  prayer: {
    color: NOTIFICATION_COLORS.prayer,
    smallIcon: 'ic_notification_prayer',
    useBigTextStyle: true,
  },
  // ... other types
};
```

To change which icon is used for a notification type, update the `smallIcon` property to reference a different drawable resource name.

## Production Recommendations

For a production app, consider:

1. **Hire a designer**: Professional icons significantly improve user experience
2. **Follow Material Design**: Adhere to Google's design guidelines
3. **Test across devices**: Verify icons look good on all Android versions
4. **Consider accessibility**: Ensure icons are distinguishable for users with visual impairments
5. **Brand consistency**: Icons should match your overall app branding and color scheme

## Need Help?

If you need assistance with notification icons:
- Review [Android Notification Design Guidelines](https://material.io/design/platform-guidance/android-notifications.html)
- Check [React Native Notifee Documentation](https://notifee.app/react-native/docs/android/appearance#small-icon)
- Ask in the project's issue tracker or discussions
