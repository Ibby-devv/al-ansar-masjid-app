/**
 * Clean Build Script
 *
 * This script safely cleans Android build artifacts by removing directories
 * instead of using gradlew clean (which fails when certain directories don't exist).
 *
 * Run with: npm run clean
 */

const fs = require('fs');
const path = require('path');

// Directories to clean
const dirsToClean = [
  'android/app/build',
  'android/app/.cxx',
  'android/build',
  'android/.gradle',
];

console.log('🧹 Cleaning Android build artifacts...\n');

let cleanedCount = 0;
let skippedCount = 0;

dirsToClean.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);

  if (fs.existsSync(fullPath)) {
    try {
      console.log(`🗑️  Removing: ${dir}`);
      fs.rmSync(fullPath, { recursive: true, force: true });
      cleanedCount++;
    } catch (error) {
      console.error(`❌ Failed to remove ${dir}:`, error.message);
    }
  } else {
    console.log(`⏭️  Skipping: ${dir} (doesn't exist)`);
    skippedCount++;
  }
});

console.log(`\n✅ Clean complete!`);
console.log(`   - Cleaned: ${cleanedCount} directories`);
console.log(`   - Skipped: ${skippedCount} directories (already clean)`);
console.log('\n💡 Tip: Run "npm run android" to rebuild the app\n');
