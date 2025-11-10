/**
 * Splash Screen Generator Script
 *
 * This script generates splash screen images for all Android density folders.
 * It reads your source image from assets/images/splash-icon.png and creates
 * optimized versions for each screen density.
 *
 * Run with: node scripts/generate-splash-screen.js
 *
 * Source: assets/images/splash-icon.png
 * Output: android/app/src/main/res/drawable-{density}/splashscreen_logo.png
 *
 * Also updates colors.xml with the background color from app.json
 */

const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

// Paths
const SOURCE_IMAGE = path.join(process.cwd(), 'assets', 'images', 'splash-icon.png');
const RES_DIR = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res');
const COLORS_XML = path.join(RES_DIR, 'values', 'colors.xml');
const APP_JSON = path.join(process.cwd(), 'app.json');

async function generateSplashScreens() {
  console.log('🎨 Generating splash screen images...\n');

  // Read app.json to get imageWidth and background color
  let imageWidth = 200; // Default fallback
  let backgroundColor = '#ffffff';
  
  try {
    const appJson = JSON.parse(fs.readFileSync(APP_JSON, 'utf8'));
    const splashConfig = appJson.expo?.plugins?.find(p => 
      Array.isArray(p) && p[0] === 'expo-splash-screen'
    )?.[1];
    
    if (splashConfig) {
      imageWidth = splashConfig.imageWidth || 200;
      backgroundColor = splashConfig.backgroundColor || '#ffffff';
      console.log(`📱 Image width from app.json: ${imageWidth}dp`);
      console.log(`📱 Background color from app.json: ${backgroundColor}`);
    }
  } catch (_err) {
    console.warn('⚠️  Could not read config from app.json, using defaults (200dp, #ffffff)');
  }

  // Expo uses a fixed 288dp canvas size, then centers the logo (imageWidth) within it
  // Source: @expo/prebuild-config/src/plugins/unversioned/expo-splash-screen/withAndroidSplashImages.ts
  const BASE_CANVAS_SIZE = 288; // Fixed canvas size in dp
  
  const DENSITIES = {
    'mdpi': { canvas: BASE_CANVAS_SIZE * 1, logo: imageWidth * 1 },          // 1x baseline
    'hdpi': { canvas: BASE_CANVAS_SIZE * 1.5, logo: imageWidth * 1.5 },      // 1.5x
    'xhdpi': { canvas: BASE_CANVAS_SIZE * 2, logo: imageWidth * 2 },         // 2x
    'xxhdpi': { canvas: BASE_CANVAS_SIZE * 3, logo: imageWidth * 3 },        // 3x
    'xxxhdpi': { canvas: BASE_CANVAS_SIZE * 4, logo: imageWidth * 4 },       // 4x
  };

  console.log('\n📐 Target sizes (canvas + logo):');
  for (const [density, sizes] of Object.entries(DENSITIES)) {
    console.log(`   ${density.padEnd(8)}: Canvas ${sizes.canvas}x${sizes.canvas}px, Logo ${sizes.logo}x${sizes.logo}px`);
  }
  console.log('');

  // Check if source image exists
  if (!fs.existsSync(SOURCE_IMAGE)) {
    console.error(`❌ Source image not found: ${SOURCE_IMAGE}`);
    console.error('   Please add your splash image at: assets/images/splash-icon.png');
    process.exit(1);
  }

  // Update colors.xml
  updateColorsXml(backgroundColor);

  // Load source image
  console.log(`📂 Loading source image: ${SOURCE_IMAGE}`);
  const sourceImage = await Jimp.read(SOURCE_IMAGE);
  
  console.log(`   Source dimensions: ${sourceImage.bitmap.width}x${sourceImage.bitmap.height}\n`);

  // Generate for each density
  for (const [density, sizes] of Object.entries(DENSITIES)) {
    const outputDir = path.join(RES_DIR, `drawable-${density}`);
    const outputPath = path.join(outputDir, 'splashscreen_logo.png');

    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create transparent canvas at the fixed canvas size
    const canvas = new Jimp(sizes.canvas, sizes.canvas, 0x00000000);
    
    // Resize logo to fit within the logo size (maintain aspect ratio with contain)
    const resizedLogo = sourceImage.clone().contain(
      sizes.logo, 
      sizes.logo, 
      Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE
    );
    
    // Center the logo on the canvas
    const offsetX = Math.round((sizes.canvas - sizes.logo) / 2);
    const offsetY = Math.round((sizes.canvas - sizes.logo) / 2);
    canvas.composite(resizedLogo, offsetX, offsetY);

    // Save the image
    await canvas.writeAsync(outputPath);
    
    console.log(`✅ ${density.padEnd(8)} Canvas: ${sizes.canvas}x${sizes.canvas}px, Logo: ${sizes.logo}x${sizes.logo}px → saved`);
  }

  console.log('\n✨ Splash screen generation complete!');
  console.log('📝 Updated splashscreen_background color in values/colors.xml');
  console.log('\n💡 Next steps:');
  console.log('   1. Run a clean build: npm run clean:build:bundle');
  console.log('   2. Or commit changes and let EAS build pick them up\n');
}

function updateColorsXml(backgroundColor) {
  if (!fs.existsSync(COLORS_XML)) {
    console.warn(`⚠️  colors.xml not found at ${COLORS_XML}`);
    return;
  }

  let colorsContent = fs.readFileSync(COLORS_XML, 'utf8');
  
  // Update splashscreen_background color
  const colorPattern = /(<color name="splashscreen_background">)#[0-9a-fA-F]{6}(<\/color>)/;
  
  if (colorPattern.test(colorsContent)) {
    colorsContent = colorsContent.replace(colorPattern, `$1${backgroundColor}$2`);
    fs.writeFileSync(COLORS_XML, colorsContent, 'utf8');
    console.log(`✅ Updated splashscreen_background to ${backgroundColor} in colors.xml\n`);
  } else {
    console.warn('⚠️  Could not find splashscreen_background color in colors.xml\n');
  }
}

// Run the generator
generateSplashScreens().catch(err => {
  console.error('❌ Error generating splash screens:', err);
  process.exit(1);
});
