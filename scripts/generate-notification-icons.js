/**
 * Notification Icon Generator
 *
 * Writes white-on-transparent Android Vector Drawables for Notifee smallIcons.
 * Keep silhouettes simple — status-bar size is ~24dp.
 *
 * Run: node scripts/generate-notification-icons.js
 */

/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');

// Material-style pathData (24x24 viewport), white fill applied in XML
const icons = {
  // Crescent — prayer / iqamah
  ic_notification_prayer: {
    name: 'Prayer Notification',
    pathData:
      'M12.1,2.05C7.05,2.5 3.1,6.7 3.1,11.9c0,5.35 4.15,9.75 9.4,10.05c-3.35-1.45-5.7-4.8-5.7-8.7c0-3.95 2.4-7.35 5.85-8.8C12.35,3.85 12.25,2.9 12.1,2.05z',
  },
  // Calendar — events
  ic_notification_event: {
    name: 'Event Notification',
    pathData:
      'M19,4h-1V2h-2v2H8V2H6v2H5C3.89,4,3,4.9,3,6v14c0,1.1,0.89,2,2,2h14c1.1,0,2-0.9,2-2V6C21,4.9,20.1,4,19,4zM19,20H5V10h14V20zM19,8H5V6h14V8z',
  },
  // Heart — campaigns / donations
  ic_notification_campaign: {
    name: 'Campaign Notification',
    pathData:
      'M12,21.35l-1.45-1.32C5.4,15.36,2,12.28,2,8.5C2,5.42,4.42,3,7.5,3c1.74,0,3.41,0.81,4.5,2.09C13.09,3.81,14.76,3,16.5,3C19.58,3,22,5.42,22,8.5c0,3.78-3.4,6.86-8.55,11.54L12,21.35z',
  },
  // Megaphone — general announcements
  ic_notification_general: {
    name: 'General Notification',
    pathData:
      'M3,9v6h2l5,3V6L5,9H3zM14.5,12c0-1.77-1.02-3.29-2.5-4.03v8.05C13.48,15.29,14.5,13.77,14.5,12zM12,4.07v2.06c2.89,0.86,5,3.54,5,6.87s-2.11,6.01-5,6.87v2.06c4.01-0.91,7-4.49,7-8.93S16.01,4.98,12,4.07z',
  },
  // Alert — urgent
  ic_notification_urgent: {
    name: 'Urgent Notification',
    pathData:
      'M1,21h22L12,2L1,21zM13,18h-2v-2h2V18zM13,14h-2v-4h2V14z',
  },
};

const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
const sizeByDensity = {
  mdpi: 24,
  hdpi: 36,
  xhdpi: 48,
  xxhdpi: 72,
  xxxhdpi: 96,
};

const baseDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

console.log('Generating notification icons into src/main/res...\n');

Object.entries(icons).forEach(([iconName, iconData]) => {
  console.log(`Creating ${iconData.name} (${iconName})...`);

  densities.forEach((density) => {
    const drawableDir = path.join(baseDir, `drawable-${density}`);
    if (!fs.existsSync(drawableDir)) {
      fs.mkdirSync(drawableDir, { recursive: true });
    }

    const size = sizeByDensity[density];
    const filePath = path.join(drawableDir, `${iconName}.xml`);
    const androidXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="${size}dp"
    android:height="${size}dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="${iconData.pathData}" />
</vector>
`;

    fs.writeFileSync(filePath, androidXml);
    console.log(`  ✓ ${density}`);
  });

  console.log();
});

console.log('Done. Point notificationStyles.ts smallIcon at these resource names.');
