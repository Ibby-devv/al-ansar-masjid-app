/**
 * Notification Icon Generator Script
 *
 * This script creates simple SVG placeholder icons for different notification types.
 * For production, you should replace these with professionally designed icons.
 *
 * Run with: node scripts/generate-notification-icons.js
 *
 * IMPORTANT: Android notification icons should be:
 * - Simple white silhouettes on transparent background
 * - Follow Material Design guidelines
 * - Sizes: 24x24dp (mdpi), 36x36dp (hdpi), 48x48dp (xhdpi), 72x72dp (xxhdpi), 96x96dp (xxxhdpi)
 */

/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');

// Icon definitions with proper Android Vector Drawable pathData
const icons = {
  ic_notification_prayer: {
    name: 'Prayer Notification',
    // Bell icon (mosque icon is too complex, using bell as prayer reminder)
    pathData: 'M12,22c1.1,0,2,-0.9,2,-2h-4C10,21.1,10.9,22,12,22zM18,16v-5c0,-3.07,-1.63,-5.64,-4.5,-6.32V4c0,-0.83,-0.67,-1.5,-1.5,-1.5S10.5,3.17,10.5,4v0.68C7.64,5.36,6,7.92,6,11v5l-2,2v1h16v-1L18,16zM16,17H8v-6c0,-2.48,1.51,-4.5,4,-4.5s4,2.02,4,4.5V17z',
  },
  ic_notification_event: {
    name: 'Event Notification',
    // Calendar icon
    pathData: 'M19,4h-1V2h-2v2H8V2H6v2H5C3.89,2,3.01,2.9,3.01,4L3,20c0,1.1,0.89,2,2,2h14c1.1,0,2,-0.9,2,-2V4C21,2.9,20.1,2,19,2zM19,20H5V10h14V20zM19,8H5V6h14V8zM7,12h2v2H7V12zM11,12h2v2h-2V12zM15,12h2v2h-2V12z',
  },
  ic_notification_campaign: {
    name: 'Campaign Notification',
    // Megaphone icon
    pathData: 'M18,11v2h4v-2H18zM16,17.61c0.96,0.71,2.21,1.65,3.2,2.39c0.4,-0.53,0.8,-1.07,1.2,-1.6c-0.99,-0.74,-2.24,-1.68,-3.2,-2.4C16.8,16.54,16.4,17.08,16,17.61zM20.4,5.6c-0.4,-0.53,-0.8,-1.07,-1.2,-1.6c-0.99,0.74,-2.24,1.68,-3.2,2.4c0.4,0.53,0.8,1.07,1.2,1.6C18.16,7.28,19.41,6.35,20.4,5.6zM4,9C2.9,9,2,9.9,2,11v2c0,1.1,0.9,2,2,2h1v4h2v-4h1l5,3V6L8,9H4zM15.5,12c0,-1.33,-0.58,-2.53,-1.5,-3.35v6.69C14.92,14.53,15.5,13.33,15.5,12z',
  },
  ic_notification_urgent: {
    name: 'Urgent Notification',
    // Alert triangle icon
    pathData: 'M12,2L1,21h22L12,2zM12,6l7.53,13H4.47L12,6zM11,10v4h2v-4H11zM11,16v2h2v-2H11z',
  },
  ic_notification_general: {
    name: 'General Notification',
    // Info icon
    pathData: 'M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10,-4.48,10,-10S17.52,2,12,2zM12,20c-4.41,0,-8,-3.59,-8,-8s3.59,-8,8,-8s8,3.59,8,8S16.41,20,12,20zM11,11h2v6h-2V11zM11,7h2v2h-2V7z',
  },
};

// Sizes for each density (in pixels)
const sizes = {
  'mdpi': 24,
  'hdpi': 36,
  'xhdpi': 48,
  'xxhdpi': 72,
  'xxxhdpi': 96,
};

// Write directly into src/main/res so they're always included (no Gradle copy needed)
const baseDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

console.log('📱 Generating notification icons directly to src/main/res...\n');

// For each icon type
Object.entries(icons).forEach(([iconName, iconData]) => {
  console.log(`Creating ${iconData.name} (${iconName})...`);

  // For each density
  Object.entries(sizes).forEach(([density, size]) => {
    const drawableDir = path.join(baseDir, `drawable-${density}`);

    // Ensure directory exists
    if (!fs.existsSync(drawableDir)) {
      fs.mkdirSync(drawableDir, { recursive: true });
    }

    // Write SVG file (Android supports SVG in drawable folders)
    const filePath = path.join(drawableDir, `${iconName}.xml`);

    // Convert to Android Vector Drawable XML format
    const androidXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="${size}dp"
    android:height="${size}dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="${iconData.pathData}" />
</vector>`;

    fs.writeFileSync(filePath, androidXml);
    console.log(`  ✓ ${density}: ${filePath}`);
  });

  console.log();
});

console.log('✅ Notification icons generated successfully!\n');
console.log('⚠️  NOTE: These are simple placeholder icons.');
console.log('📝 For production, consider using:');
console.log('   - Professional icon design tools');
console.log('   - Android Asset Studio: https://romannurik.github.io/AndroidAssetStudio/');
console.log('   - Custom SVG icons converted to Android Vector Drawables\n');
