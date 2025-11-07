/* eslint-disable no-undef */
// Generate launcher icons (all mipmap densities) from assets/images adaptive icon layers
// Writes directly to android-overrides/res/mipmap-* for guaranteed inclusion in builds

const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets', 'images');
const OUTPUT_BASE = path.join(ROOT, 'android-overrides', 'res');

// Source adaptive icon layers
const FG_SOURCE = path.join(ASSETS, 'android-icon-foreground.png');
const BG_SOURCE = path.join(ASSETS, 'android-icon-background.png');
const MONO_SOURCE = path.join(ASSETS, 'android-icon-monochrome.png');

// Android mipmap densities and sizes
// Adaptive icon specs: 108x108dp safe zone with 72x72dp visible area
const DENSITIES = {
  mdpi: 108,    // 1x
  hdpi: 162,    // 1.5x
  xhdpi: 216,   // 2x
  xxhdpi: 324,  // 3x
  xxxhdpi: 432, // 4x
};

// Legacy icon sizes (for fallback ic_launcher.png)
const LEGACY_SIZES = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

async function generateAdaptiveIcons() {
  console.log('📱 Generating launcher icons from assets/images...\n');

  // Verify source files exist
  const missing = [];
  if (!fs.existsSync(FG_SOURCE)) missing.push('android-icon-foreground.png');
  if (!fs.existsSync(BG_SOURCE)) missing.push('android-icon-background.png');
  if (!fs.existsSync(MONO_SOURCE)) missing.push('android-icon-monochrome.png');

  if (missing.length > 0) {
    console.error(`✗ Missing source files in assets/images/:`);
    missing.forEach(f => console.error(`  - ${f}`));
    process.exit(1);
  }

  // Load source images
  console.log('Loading source images...');
  const [fgImg, bgImg, monoImg] = await Promise.all([
    Jimp.read(FG_SOURCE),
    Jimp.read(BG_SOURCE),
    Jimp.read(MONO_SOURCE),
  ]);
  console.log('✓ Loaded foreground, background, and monochrome\n');

  // Generate for each density
  for (const [density, size] of Object.entries(DENSITIES)) {
    const mipmapDir = path.join(OUTPUT_BASE, `mipmap-${density}`);
    fs.mkdirSync(mipmapDir, { recursive: true });

    console.log(`Generating ${density} (${size}x${size})...`);

    // Clone and resize each layer
    const fg = fgImg.clone().resize(size, size, Jimp.RESIZE_BICUBIC);
    const bg = bgImg.clone().resize(size, size, Jimp.RESIZE_BICUBIC);
    const mono = monoImg.clone().resize(size, size, Jimp.RESIZE_BICUBIC);

    // Write adaptive icon layers
    await fg.writeAsync(path.join(mipmapDir, 'ic_launcher_foreground.png'));
    await bg.writeAsync(path.join(mipmapDir, 'ic_launcher_background.png'));
    await mono.writeAsync(path.join(mipmapDir, 'ic_launcher_monochrome.png'));

    // Generate legacy fallback icon (composite of bg + fg, cropped to safe zone)
    const legacySize = LEGACY_SIZES[density];
    const legacy = new Jimp(legacySize, legacySize, 0x00000000);
    
    // Scale background to cover legacy size
    const bgLegacy = bg.clone().cover(
      legacySize,
      legacySize,
      Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE,
      Jimp.RESIZE_BICUBIC
    );
    legacy.composite(bgLegacy, 0, 0);

    // Scale foreground to fit within legacy size (with padding)
    const fgScale = legacySize * 0.66; // Foreground takes ~66% of legacy icon
    const fgLegacy = fg.clone().contain(
      fgScale,
      fgScale,
      Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE,
      Jimp.RESIZE_BICUBIC
    );
    const fgOffset = Math.round((legacySize - fgScale) / 2);
    legacy.composite(fgLegacy, fgOffset, fgOffset);

    await legacy.writeAsync(path.join(mipmapDir, 'ic_launcher.png'));

    console.log(`  ✓ mipmap-${density}/ic_launcher*.png`);
  }

  // Generate adaptive icon XML (anydpi-v26)
  const anydpiDir = path.join(OUTPUT_BASE, 'mipmap-anydpi-v26');
  fs.mkdirSync(anydpiDir, { recursive: true });

  const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@mipmap/ic_launcher_background"/>
  <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
  <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>
</adaptive-icon>`;

  const adaptiveIconRoundXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@mipmap/ic_launcher_background"/>
  <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
  <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>
</adaptive-icon>`;

  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveIconXml);
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveIconRoundXml);

  console.log('\n✓ mipmap-anydpi-v26/ic_launcher.xml');
  console.log('✓ mipmap-anydpi-v26/ic_launcher_round.xml');

  console.log('\n✅ Launcher icons generated successfully!');
  console.log(`📁 Output: ${OUTPUT_BASE}/mipmap-*/`);
  console.log('\n💡 Next steps:');
  console.log('   1. Review icons in android-overrides/res/mipmap-*/');
  console.log('   2. Commit changes to version control');
  console.log('   3. Build with: npm run build:release or eas build');
}

generateAdaptiveIcons().catch(err => {
  console.error('\n✗ Failed to generate launcher icons:', err.message);
  process.exit(1);
});
