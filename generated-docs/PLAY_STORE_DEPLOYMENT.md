# Google Play Store Deployment Guide
# Al Ansar Masjid App - Internal Testing

This guide walks you through deploying the Al Ansar Masjid app to Google Play Store for internal testing.

## Prerequisites

1. ✓ EAS CLI installed: `npm install -g eas-cli`
2. ✓ Expo account (login with: `eas login`)
3. ✓ Google Play Console account
4. ✓ Java Development Kit (JDK) installed for keystore generation

## Step 1: Generate Upload Keystore (First Time Only)

The app is currently using debug signing. For Play Store, you need a production keystore.

### Option A: Let EAS Generate Keystore (Easiest)
```powershell
cd d:\DEV\MosqueApp\al-ansar-masjid-app
eas credentials
```
- Select: Android → production
- Choose: Set up a new keystore
- EAS will generate and manage the keystore for you

### Option B: Generate Your Own Keystore
```powershell
cd d:\DEV\MosqueApp\al-ansar-masjid-app\android\app
.\generate-keystore.ps1
```

After generating, create `android/keystore.properties`:
```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=upload
storeFile=upload-keystore.keystore
```

**Important:** Add to `.gitignore`:
```
android/keystore.properties
android/app/upload-keystore.keystore
```

## Step 2: Build Android App Bundle (AAB)

Build the production AAB file for Play Store:

```powershell
cd d:\DEV\MosqueApp\al-ansar-masjid-app

# Make sure you're logged in
eas login

# Build for production
eas build --platform android --profile production
```

This will:
- Build an Android App Bundle (.aab)
- Auto-increment the version code
- Sign the app with your upload keystore
- Upload to EAS servers

The build process takes 10-20 minutes. You can:
- Watch the build online at the provided URL
- Or continue working and check status with: `eas build:list`

Once complete, download the AAB file from the EAS dashboard or use:
```powershell
eas build:download --platform android --profile production
```

## Step 3: Create Google Play Console App

1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Fill in details:
   - App name: **Al Ansar Masjid**
   - Default language: **English (United States)**
   - App or game: **App**
   - Free or paid: **Free**
4. Accept declarations and create app

## Step 4: Set Up App Content & Store Listing

### Store Listing
1. Navigate to: Store presence → Main store listing
2. Fill in:
   - **App name:** Al Ansar Masjid
   - **Short description:** Prayer times, donations, and community events for Al Ansar Masjid
   - **Full description:** Comprehensive description of features (prayer times, Qibla compass, donations, events, etc.)
   - **App icon:** 512x512 PNG (from assets/images/icon.png)
   - **Feature graphic:** 1024x500 PNG
   - **Phone screenshots:** At least 2 screenshots (1080x1920 or similar)

### App Content
Complete all required sections:
1. **Privacy policy:** Add your privacy policy URL
2. **App access:** Declare if special access is needed
3. **Ads:** Declare if app contains ads (probably "No")
4. **Content rating:** Complete questionnaire
5. **Target audience:** Select age groups
6. **Data safety:** Declare data collection practices

## Step 5: Upload AAB for Internal Testing

1. In Play Console, go to: **Testing → Internal testing**
2. Click "**Create new release**"
3. Upload the AAB file you downloaded from EAS
4. Review release details:
   - Version name: 1.0.0
   - Version code: (auto-incremented)
5. Add release notes (e.g., "Initial internal testing release")
6. Click "**Save**" then "**Review release**"
7. Click "**Start rollout to Internal testing**"

## Step 6: Add Internal Testers

1. Go to: **Testing → Internal testing → Testers tab**
2. Create an email list of testers
3. Add tester email addresses
4. Save changes
5. Copy the opt-in URL and share with testers

Testers will:
1. Click the opt-in URL
2. Accept the invitation
3. Download the app from Play Store
4. Start testing

## Step 7: Future Updates

For subsequent releases:

```powershell
# 1. Update version in app.json (optional, EAS can auto-increment)
# 2. Build new version
cd d:\DEV\MosqueApp\al-ansar-masjid-app
eas build --platform android --profile production

# 3. Once build completes, download AAB
eas build:download --platform android --profile production

# 4. Upload to Play Console → Internal testing → Create new release
```

Or use EAS Submit to automate uploading:
```powershell
# Set up service account (one-time, see Step 8 below)
eas submit --platform android --profile production
```

## Step 8: Automate Submissions (Optional)

To use `eas submit` for automatic uploads:

1. In Google Play Console, set up a service account:
   - Go to: Setup → API access
   - Link to Google Cloud project or create new
   - Create service account with Play Console permissions
   - Download JSON key file

2. Save as `android/pc-api-key.json` (add to .gitignore)

3. Submit automatically:
```powershell
eas submit --platform android --profile production
```

## Troubleshooting

### Build Fails
- Check EAS build logs online
- Ensure all dependencies are properly installed
- Verify `google-services.json` is present

### Upload Rejected
- Ensure version code is higher than previous uploads
- Check that package name matches: `com.alansarmasjid.app`
- Verify app is properly signed

### Testing Link Doesn't Work
- Ensure tester email is added to internal testing list
- Tester must accept invitation first
- App must be rolled out to internal testing

## Commands Reference

```powershell
# Login to EAS
eas login

# Check current credentials
eas credentials

# Build production AAB
eas build --platform android --profile production

# Build APK for testing
eas build --platform android --profile production-apk

# List builds
eas build:list

# Download latest build
eas build:download --platform android --profile production

# Submit to Play Store (with service account)
eas submit --platform android --profile production

# Check build status
eas build:view [BUILD_ID]
```

## Important Notes

1. **Version Management:** EAS auto-increments `versionCode`. Update `version` in `app.json` manually for major releases.

2. **Keystore Security:** Never commit keystore files or credentials to git. Store securely and backup.

3. **Testing Track:** Start with internal testing (up to 100 testers), then move to closed testing (broader audience) before production.

4. **Review Time:** Internal testing is instant. Closed/Open testing requires Google review (1-3 days).

5. **App Signing:** Google Play App Signing is recommended. Google re-signs your app with their key after upload.

## Next Steps After Internal Testing

1. Collect feedback from internal testers
2. Fix bugs and issues
3. Create closed testing release (larger audience)
4. Complete all Play Console requirements
5. Submit for production review
6. Launch to production!

---

For more information:
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
