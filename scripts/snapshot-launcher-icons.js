/* eslint-disable no-undef */
// Snapshot current launcher icons from android/app/src/main/res into android-overrides/res
// Run when you want to capture your current local app icon so EAS builds use it reliably.

const fs = require('fs');
const path = require('path');

const resSrc = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const resDst = path.join(__dirname, '..', 'android-overrides', 'res');

// known mipmap directories (not directly used but here for reference)
// const mipmapDirs = [
//   'mipmap-anydpi-v26',
//   'mipmap-mdpi',
//   'mipmap-hdpi',
//   'mipmap-xhdpi',
//   'mipmap-xxhdpi',
//   'mipmap-xxxhdpi',
// ];

const filesToCopy = [
  // XMLs
  { dir: 'mipmap-anydpi-v26', names: ['ic_launcher.xml', 'ic_launcher_round.xml'] },
  // PNG patterns per density
  { dir: 'mipmap-mdpi', names: ['ic_launcher.png', 'ic_launcher_background.png', 'ic_launcher_foreground.png', 'ic_launcher_monochrome.png'] },
  { dir: 'mipmap-hdpi', names: ['ic_launcher.png', 'ic_launcher_background.png', 'ic_launcher_foreground.png', 'ic_launcher_monochrome.png'] },
  { dir: 'mipmap-xhdpi', names: ['ic_launcher.png', 'ic_launcher_background.png', 'ic_launcher_foreground.png', 'ic_launcher_monochrome.png'] },
  { dir: 'mipmap-xxhdpi', names: ['ic_launcher.png', 'ic_launcher_background.png', 'ic_launcher_foreground.png', 'ic_launcher_monochrome.png'] },
  { dir: 'mipmap-xxxhdpi', names: ['ic_launcher.png', 'ic_launcher_background.png', 'ic_launcher_foreground.png', 'ic_launcher_monochrome.png'] },
];

function copyIfExists(src, dst) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  return true;
}

console.log('📦 Snapshotting launcher icons into android-overrides/res ...');
let copied = 0;
for (const group of filesToCopy) {
  for (const name of group.names) {
    const src = path.join(resSrc, group.dir, name);
    const dst = path.join(resDst, group.dir, name);
    if (copyIfExists(src, dst)) {
      console.log(`  ✓ ${group.dir}/${name}`);
      copied++;
    }
  }
}

if (copied === 0) {
  console.warn('⚠️  No launcher icon files found to snapshot. Ensure you have built locally at least once.');
} else {
  console.log(`✅ Snapshot complete. ${copied} files copied.`);
}
