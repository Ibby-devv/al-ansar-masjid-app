# Play Store Deployment - Getting Started

## What Has Been Configured

Your Al Ansar Masjid app is now ready for Play Store deployment! Here's what was set up:

### ✅ Configuration Files Updated
1. **`eas.json`** - Configured for production Android App Bundle (AAB) builds
2. **`android/app/build.gradle`** - Updated to use production signing configuration
3. **`.gitignore`** - Protected sensitive keystore and credential files

### ✅ Files Created
1. **`PLAY_STORE_DEPLOYMENT.md`** - Complete deployment guide with all steps
2. **`DEPLOYMENT_CHECKLIST.md`** - Step-by-step checklist to track progress
3. **`deploy-playstore.ps1`** - Quick start script with commands
4. **`android/app/generate-keystore.ps1`** - Script to generate upload keystore
5. **`android/keystore.properties.template`** - Template for keystore credentials

## Quick Start (3 Simple Steps)

### Play Store builds use EAS (not local Gradle)

Signing for Play lives in your Expo account. Local `npm run build:bundle` is a different path and will fail Play upload unless you configure the same upload keystore.

Full guide: `generated-docs/PLAY_STORE_DEPLOYMENT.md`

### 1. Optional helper (prints commands only)
```powershell
.\deploy-playstore.ps1
```
Does **not** run the build.

### 2. Login (first time on a machine)
```powershell
eas login
# Keystore should already exist in EAS for this app — do not create a new one
# eas credentials   # only to view/download existing Android production credentials
```

### 3. Build and Deploy
```powershell
# Build production AAB (takes 10-20 minutes) — this is the command you want
eas build --platform android --profile production

# After build completes, download AAB
eas build:download --platform android --profile production

# Upload to Google Play Console
# Go to: https://play.google.com/console
# Testing → Internal testing → Create release → Upload AAB
```

## Next Steps

1. **Read the full guide:** `PLAY_STORE_DEPLOYMENT.md`
2. **Follow the checklist:** `DEPLOYMENT_CHECKLIST.md`
3. **Prepare assets:**
   - App icon (512x512 PNG)
   - Feature graphic (1024x500 PNG)
   - Screenshots (minimum 2)
   - Privacy policy URL

## Important Information

- **App Name:** Al Ansar Masjid
- **Package Name:** com.alansarmasjid.app
- **Current Version:** 1.0.0
- **EAS Project ID:** 0ae76e27-63df-41da-92fe-8a7526cfc915

## Two Build Options

### Option 1: EAS-Managed Keystore (Recommended)
- Easiest setup
- EAS stores and manages keystore
- Run: `eas credentials`

### Option 2: Self-Managed Keystore
- More control
- You manage keystore file
- Run: `.\android\app\generate-keystore.ps1`
- Create: `android/keystore.properties`

## Timeline

- **Configuration:** ✅ Complete
- **Build time:** 10-20 minutes
- **Google review (internal):** Instant
- **Google review (production):** 1-3 days

## Support & Resources

- **EAS Build:** https://docs.expo.dev/build/introduction/
- **EAS Submit:** https://docs.expo.dev/submit/introduction/
- **Play Console:** https://support.google.com/googleplay/android-developer

## Need Help?

1. Check `PLAY_STORE_DEPLOYMENT.md` for detailed instructions
2. Refer to `DEPLOYMENT_CHECKLIST.md` for step-by-step tracking
3. Review EAS build logs if build fails
4. Contact Play Console support for store-specific issues

---

**Ready to deploy?** Start with: `.\deploy-playstore.ps1`

Good luck with your launch! 🚀
