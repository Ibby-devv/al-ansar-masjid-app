const fs = require('fs');
const path = require('path');

/**
 * This script restores the release signing configuration to android/app/build.gradle
 * after running `npx expo prebuild --clean` which overwrites custom Gradle configs.
 * 
 * Run this after prebuild to restore keystore signing for local release builds.
 */

const BUILD_GRADLE_PATH = path.join(process.cwd(), 'android', 'app', 'build.gradle');

// The signing config code to inject
const SIGNING_CONFIG_CODE = `
    // Load keystore properties if they exist
    def keystorePropertiesFile = rootProject.file("keystore.properties")
    def keystoreProperties = new Properties()
    if (keystorePropertiesFile.exists()) {
        keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
    }

    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
    
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            // Use release signing if available, otherwise use debug signing
            signingConfig keystorePropertiesFile.exists() ? signingConfigs.release : signingConfigs.debug`;

function restoreSigningConfig() {
    console.log('📝 Restoring signing configuration to build.gradle...');

    if (!fs.existsSync(BUILD_GRADLE_PATH)) {
        console.error('❌ Error: build.gradle not found at:', BUILD_GRADLE_PATH);
        process.exit(1);
    }

    let content = fs.readFileSync(BUILD_GRADLE_PATH, 'utf8');

    // Check if signing config already exists
    if (content.includes('keystorePropertiesFile') && content.includes('signingConfigs.release')) {
        console.log('✅ Signing configuration already present in build.gradle');
        return;
    }

    // Find the signingConfigs or buildTypes section to replace
    // Expo prebuild typically generates a basic signingConfigs with just debug
    const signingConfigPattern = /signingConfigs\s*\{[\s\S]*?\n\s*\}/;
    const buildTypesPattern = /buildTypes\s*\{[\s\S]*?(?=\n\s*packagingOptions|\n\s*androidResources|\n\s*dependencies|\n\})/;

    if (content.match(signingConfigPattern) && content.match(buildTypesPattern)) {
        // Replace both signingConfigs and buildTypes sections
        content = content.replace(signingConfigPattern, SIGNING_CONFIG_CODE.trim().split('\n').slice(1, 23).join('\n'));
        content = content.replace(buildTypesPattern, SIGNING_CONFIG_CODE.trim().split('\n').slice(24).join('\n') + '\n    }');
        
        fs.writeFileSync(BUILD_GRADLE_PATH, content, 'utf8');
        console.log('✅ Successfully restored signing configuration!');
        console.log('🔑 Release builds will now use keystore.properties for signing');
    } else {
        console.error('❌ Could not find signingConfigs or buildTypes section to replace.');
        console.error('   You may need to manually add the signing configuration.');
        process.exit(1);
    }
}

try {
    restoreSigningConfig();
} catch (error) {
    console.error('❌ Error restoring signing config:', error.message);
    process.exit(1);
}
