# Notification Icons Guide

This guide explains how to customize notification icons and app launcher icons in the Al-Ansar Masjid mobile app using the resource override system.

## Architecture Overview

The app uses a **resource override system** to ensure custom icons always make it into builds, even when Expo's prebuild regenerates native resources. This is crucial for:
- EAS cloud builds (which run prebuild automatically)
- Custom notification icons (Notifee)
- App launcher icons (ic_launcher)

### How It Works

1. **Source of truth**: `android-overrides/res/` contains your custom icons
2. **Build-time copy**: Gradle automatically copies overrides into `android/app/src/main/res/` before resource merging
3. **EAS hook**: Cloud builds regenerate notification icons from the script before building
4. **Result**: Your icons always win, regardless of prebuild behavior

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

### Override Source (Edit These)

**These are the files you should modify:**

```
android-overrides/res/
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
  ├── drawable-xxxhdpi/
  │   └── ... (96x96dp)
  └── mipmap-*/
      └── ic_launcher* (launcher icons)
```

### Build Output (Auto-Generated)

**Do NOT edit these directly—they get overwritten:**

```
android/app/src/main/res/
  ├── drawable-*/
  │   └── (copied from overrides at build time)
  └── mipmap-*/
      └── (copied from overrides at build time)
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

### Notification Icons

#### Option 1: Edit the Generator Script (Recommended)

1. Open `scripts/generate-notification-icons.js`
2. Modify the `pathData` for the icon you want to change:
   ```javascript
   const icons = {
     ic_notification_prayer: {
       name: 'Prayer Notification',
       pathData: 'M12,2L1,21h22L12,2z...', // <- Edit this SVG path
     },
     // ... other icons
   };
   ```
3. Run the generator to output to overrides:
   ```bash
   npm run icons:generate:notifications
   ```
4. Commit the changes in `android-overrides/res/drawable-*/`

#### Option 2: Use Android Asset Studio

1. Visit [Android Asset Studio - Notification Icon Generator](https://romannurik.github.io/AndroidAssetStudio/icons-notification.html)
2. Upload your icon design or use the clipart library
3. Adjust padding and customize as needed
4. Download the generated zip file
5. Extract and copy the `res/` contents to **`android-overrides/res/`** (not `android/app/src/main/res/`)
6. Rename files to match our naming convention:
   - `ic_stat_name.xml` → `ic_notification_prayer.xml` (etc.)
7. Commit the changes

#### Option 3: Manual Vector Drawable Creation

1. Create Android Vector Drawable XML files following this format:
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
2. Save files in **`android-overrides/res/drawable-*/`** with proper naming
3. Adjust `android:width` and `android:height` for each density (mdpi=24dp, hdpi=36dp, xhdpi=48dp, xxhdpi=72dp, xxxhdpi=96dp)
4. Commit the changes

### App Launcher Icon

#### Option 1: Auto-Generate from Assets (Recommended)

This is now the simplest and recommended approach:

1. Edit your adaptive icon source files in `assets/images/`:
   - `ic_launcher_foreground.png` (your main logo/symbol)
   - `ic_launcher_background.png` (solid color or gradient background)
   - `ic_launcher_monochrome.png` (single-color themed version)
   
   **Tip:** Use [Icon Kitchen](https://icon.kitchen/) to design and export these 3 files, then copy them directly to `assets/images/`

2. Generate all mipmap densities directly to overrides:
   ```bash
   npm run icons:generate:launcher
   ```

3. Commit the generated files:
   ```bash
   git add assets/images/ic_launcher_* android-overrides/res/mipmap-*
   git commit -m "Update app icon"
   ```

The script reads your source images and generates:
- All 5 density variants (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- Adaptive icon layers (foreground, background, monochrome)
- Legacy fallback icons (ic_launcher.png)
- XML definitions (ic_launcher.xml, ic_launcher_round.xml)

#### Option 2: Snapshot After Local Changes

If you prefer to use `expo prebuild` workflow:

1. Edit your launcher icon files in `android/app/src/main/res/mipmap-*/` or regenerate with `npx expo prebuild`
2. Run the snapshot script to capture them into overrides:
   ```bash
   npm run icons:snapshot
   ```
3. Commit the changes in `android-overrides/res/mipmap-*/`

#### Option 3: Direct Edit in Overrides

For manual control:

1. Replace files directly in `android-overrides/res/mipmap-*/`:
   - `ic_launcher.png`
   - `ic_launcher_background.png`
   - `ic_launcher_foreground.png`
   - `ic_launcher_monochrome.png`
   - `ic_launcher.xml` (in `mipmap-anydpi-v26/`)
   - `ic_launcher_round.xml` (in `mipmap-anydpi-v26/`)
2. Keep filenames identical
3. Commit the changes

## Workflow Commands

### Generate Notification Icons
```bash
npm run icons:generate:notifications
```
Regenerates all notification icons from the script into `android-overrides/res/drawable-*/`

### Generate Launcher Icons
```bash
npm run icons:generate:launcher
```
Reads `assets/images/ic_launcher_*.png` and generates all mipmap densities directly into `android-overrides/res/mipmap-*/`

**This is the recommended workflow for launcher icons!** No prebuild or snapshot needed.

**Icon Kitchen workflow:**
1. Design at [Icon Kitchen](https://icon.kitchen/)
2. Download the 3 adaptive icon files
3. Copy them to `assets/images/` (keeping the `ic_launcher_*.png` names)
4. Run this command to generate all densities

### Snapshot Launcher Icons (Legacy)
```bash
npm run icons:snapshot
```
Copies current launcher icons from `android/app/src/main/res/mipmap-*/` into `android-overrides/res/mipmap-*/`

Only needed if you manually edit native resources or prefer the prebuild workflow.

### Generate Play Store Icon
```bash
npm run make:play-icon
```
Creates a 512×512 PNG from your adaptive icon layers for Play Store listing upload

### Build Locally
```bash
npm run build:release
# or
npm run build:debug
```
Gradle will automatically apply overrides from `android-overrides/res/` during build

### Build with EAS
```bash
eas build --platform android --profile production
```
EAS will:
1. Run `npm run icons:generate:notifications` (via `eas-build-pre-build` hook)
2. Build with Gradle (which applies all overrides)

## Testing Your Icons

After modifying icons in `android-overrides/res/`:

1. **Local testing**:
   ```bash
   npm run build:debug
   npm run install:debug
   ```
   The build process automatically applies your overrides.

2. **EAS testing**:
   ```bash
   eas build --platform android --profile preview
   ```
   Download and install the APK to verify.

3. **Test all notification types**:
   - Trigger prayer notifications
   - Create test events
   - Send campaign notifications
   - Test urgent and general notifications

4. **Verify on different devices**:
   - Different Android versions may render icons slightly differently
   - Test on both light and dark system themes

5. **Check launcher icon**:
   - Long-press app icon to see adaptive icon behavior
   - Verify on different launcher apps (Pixel Launcher, Nova, etc.)

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

## How the Override System Works

### Build-Time Process

1. **EAS Pre-Build Hook** (cloud builds only):
   - EAS runs: `npm run icons:generate:notifications`
   - Notification icons are written to `android-overrides/res/drawable-*/`

2. **Gradle Copy Task** (all builds):
   - Before resource merging, Gradle runs `applyResourceOverrides` task
   - Copies everything from `android-overrides/res/` → `android/app/src/main/res/`
   - This overwrites any files generated by Expo prebuild

3. **Result**:
   - Your custom icons from overrides are guaranteed to be in the final APK/AAB
   - Works for both local Gradle builds and EAS cloud builds

### File Priority

```
android-overrides/res/       ← HIGHEST PRIORITY (edit these)
         ↓ (copied at build time)
android/app/src/main/res/   ← Gets overwritten (do not edit)
         ↓ (compiled into)
Final APK/AAB               ← Contains your override icons
```

## Important Notes

### What to Edit
✅ **DO edit**: `android-overrides/res/` (source of truth)
✅ **DO edit**: `scripts/generate-notification-icons.js` (for notification icons)
✅ **DO edit**: `assets/images/ic_launcher_*.png` (for launcher icons - recommended!)
✅ **DO run**: `npm run icons:generate:launcher` (after editing assets/images)
✅ **DO run**: `npm run icons:generate:notifications` (after editing notification script)
✅ **DO use**: [Icon Kitchen](https://icon.kitchen/) to design and export adaptive icons

### What NOT to Edit
❌ **DO NOT edit**: `android/app/src/main/res/` directly (gets overwritten by Gradle)
❌ **DO NOT commit**: Generated files in `android/app/src/main/res/` (they're transient)

### Version Control
- ✅ Commit files in `android-overrides/res/`
- ✅ Commit changes to generator scripts
- ❌ Don't commit `android/app/src/main/res/` (handled by Gradle/prebuild)

## Troubleshooting

### Icons not appearing in EAS builds
- **Verify overrides exist**: Check `android-overrides/res/` is committed to git
- **Check hook ran**: Look for "Generating notification icons" in EAS build logs
- **Gradle task logs**: Search logs for "Applying resource overrides"

### Icons not appearing in local builds
- **Run snapshot**: `npm run icons:snapshot` to capture current launcher icons
- **Regenerate notifications**: `npm run icons:generate:notifications`
- **Clean build**: `cd android && ./gradlew clean && cd ..` then rebuild

### Icons get overwritten after prebuild
- This is expected! The override system handles this automatically.
- Edit your icons in `assets/images/` and run `npm run icons:generate:launcher`
- Or edit directly in `android-overrides/res/`—Gradle will apply them at build time

### Launcher icons look wrong
- **Regenerate from source**: `npm run icons:generate:launcher`
- **Check source images**: Verify `assets/images/ic_launcher_*.png` are correct sizes and format
- **Verify overrides exist**: Check `android-overrides/res/mipmap-*/` contains all densities
- **Icon Kitchen export**: Make sure you copied all 3 files (foreground, background, monochrome)

### Icons look pixelated
- **Check density folders**: Ensure icons exist in all density folders in `android-overrides/res/`
- **Use vector drawables**: XML-based icons scale perfectly at all sizes

### Icons appear as squares
- **Wrong format**: Notification icons must be white silhouettes on transparent background
- **Check pathData**: Invalid SVG path data will render incorrectly

### Wrong icon shows up
- **File naming**: Ensure files in `android-overrides/res/` match the names referenced in code
- **Commit overrides**: Make sure your changes in `android-overrides/` are committed to git for EAS builds

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

## Quick Reference

### Common Tasks

**Change a notification icon:**
1. Edit `scripts/generate-notification-icons.js`
2. Run: `npm run icons:generate:notifications`
3. Commit changes in `android-overrides/res/drawable-*/`

**Change the app launcher icon:**
1. Edit files in `assets/images/`:
   - `ic_launcher_foreground.png`
   - `ic_launcher_background.png`
   - `ic_launcher_monochrome.png`
   
   Or use [Icon Kitchen](https://icon.kitchen/) and copy exported files
2. Run: `npm run icons:generate:launcher`
3. Commit changes in `android-overrides/res/mipmap-*/`

**Generate Play Store listing icon:**
```bash
npm run make:play-icon
```
Upload the generated `store-assets/playstore-icon-512.png` to Play Console

**Before EAS build:**
- Just commit your `android-overrides/` changes—EAS handles the rest automatically

**Local development:**
```bash
npm run icons:generate:notifications  # Regenerate notification icons
npm run icons:generate:launcher       # Regenerate launcher icons from assets
npm run build:release                 # Build with overrides applied
```

## Files Overview

### Scripts
- `scripts/generate-notification-icons.js` - Generates notification vector drawables
- `scripts/generate-launcher-icons.js` - Generates launcher icons from assets/images
- `scripts/snapshot-launcher-icons.js` - Captures launcher icons into overrides (legacy)
- `scripts/make-play-icon.js` - Generates 512x512 Play Store listing icon

### Configuration
- `android/app/build.gradle` - Contains `applyResourceOverrides` Gradle task
- `package.json` - Defines `eas-build-pre-build` hook and icon scripts
- `android-overrides/res/` - Source of truth for custom icons
- `assets/images/` - Source for launcher icon adaptive layers (ic_launcher_*.png)

### Key Code References
- Notification styles: `constants/notificationStyles.ts`
- Icon configuration: `app.json` (launcher icon adaptive layers)

## Production Recommendations

For a production app, consider:

1. **Hire a designer**: Professional icons significantly improve user experience
2. **Follow Material Design**: Adhere to Google's design guidelines
3. **Test across devices**: Verify icons look good on all Android versions
4. **Consider accessibility**: Ensure icons are distinguishable for users with visual impairments
5. **Brand consistency**: Icons should match your overall app branding and color scheme
6. **Version control discipline**: Always edit `android-overrides/`, never `android/app/src/main/res/` directly

## Need Help?

If you need assistance with notification icons:
- Review [Android Notification Design Guidelines](https://material.io/design/platform-guidance/android-notifications.html)
- Check [React Native Notifee Documentation](https://notifee.app/react-native/docs/android/appearance#small-icon)
- See the project's `PLAY_STORE_DEPLOYMENT.md` for full EAS build workflow
- Ask in the project's issue tracker or discussions
