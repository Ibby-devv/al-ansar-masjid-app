# Play Store Deployment Checklist
# Al Ansar Masjid App - Internal Testing

## Pre-Deployment Setup

- [ ] Google Play Console account created
- [ ] EAS CLI installed (`npm install -g eas-cli`)
- [ ] Logged into EAS (`eas login`)
- [ ] Java JDK installed (for keystore generation)

## Configuration (One-Time)

- [ ] Upload keystore configured
  - [ ] Option A: EAS-managed keystore (`eas credentials`)
  - [ ] Option B: Custom keystore generated (`android/app/generate-keystore.ps1`)
  - [ ] `android/keystore.properties` created (if using custom)
  - [ ] Keystore files added to `.gitignore`
- [ ] App assets ready
  - [ ] App icon (512x512 PNG)
  - [ ] Feature graphic (1024x500 PNG)
  - [ ] Screenshots (at least 2)
  - [ ] Privacy policy URL

## Build & Upload

- [ ] Bump version before building (required for every Play upload)
  - [ ] `app.json`
    - [ ] Increment `expo.version` (user-facing version name, e.g. `"1.2"` → `"1.3"`)
    - [ ] Increment `expo.android.versionCode` (integer, must be higher than the last upload, e.g. `25` → `26`)
  - [ ] `android/app/build.gradle`
    - [ ] Increment `versionName` to match `expo.version`
    - [ ] Increment `versionCode` to match `expo.android.versionCode`
  - [ ] Keep both files in sync — Gradle is what the AAB embeds when building locally (`npm run build:bundle`)
  - [ ] Do **not** rely on `package.json` version for Play Console
- [ ] Build production AAB
  - [ ] Option A (local): `npm run build:bundle`
  - [ ] Option B (EAS): `eas build --platform android --profile production`
  - [ ] Wait for build to complete
  - [ ] Build successful ✓
- [ ] Download / locate AAB file
  - [ ] Local: `android/app/build/outputs/bundle/release/app-release.aab`
  - [ ] EAS: `eas build:download --platform android --profile production`
  - [ ] AAB file saved / ready to upload

## Google Play Console Setup

- [ ] Create app in Play Console
  - [ ] App name: Al Ansar Masjid
  - [ ] Package: com.alansarmasjid.app
  - [ ] Language: English (United States)
  - [ ] App type: Free
- [ ] Complete store listing
  - [ ] Short description
  - [ ] Full description
  - [ ] App icon uploaded
  - [ ] Feature graphic uploaded
  - [ ] Screenshots uploaded (minimum 2)
- [ ] Complete app content
  - [ ] Privacy policy URL added
  - [ ] App access declared
  - [ ] Ads declaration
  - [ ] Content rating completed
  - [ ] Target audience selected
  - [ ] Data safety completed

## Internal Testing Release

- [ ] Create internal testing release
  - [ ] Navigate to: Testing → Internal testing
  - [ ] Click "Create new release"
  - [ ] Upload AAB file
  - [ ] Confirm version name and version code match the values you bumped
  - [ ] Add release notes
  - [ ] Save and review release
  - [ ] Start rollout to internal testing
- [ ] Add internal testers
  - [ ] Create email list
  - [ ] Add tester email addresses
  - [ ] Save changes
  - [ ] Copy opt-in URL
  - [ ] Share URL with testers

## Testing

- [ ] Testers receive and accept invitation
- [ ] Testers can download app from Play Store
- [ ] App installs successfully
- [ ] All features working correctly
  - [ ] Prayer times display
  - [ ] Qibla compass works
  - [ ] Donations flow works
  - [ ] Events display correctly
  - [ ] Notifications working
- [ ] Collect feedback from testers
- [ ] Address any issues found

## Future Updates Preparation

- [ ] Service account created for auto-submission (optional)
  - [ ] API access enabled in Play Console
  - [ ] Service account created
  - [ ] JSON key downloaded
  - [ ] Saved as `android/pc-api-key.json`
  - [ ] Added to `.gitignore`
- [ ] Auto-submission tested
  - [ ] Run: `eas submit --platform android --profile production`

## Notes

**Version / versionCode:** bump manually in both `app.json` and `android/app/build.gradle` before every upload  
**Current (as of last checklist edit):** version `1.2`, versionCode `25`  
**Package:** com.alansarmasjid.app  
**Build Type:** App Bundle (AAB)  
**Testing Track:** Internal Testing  

**Important Files:**
- Version source of truth: `app.json` (`expo.version`, `expo.android.versionCode`)
- Native Android values (must match): `android/app/build.gradle` (`versionName`, `versionCode`)
- Configuration: `eas.json`, `app.json`
- Deployment guide: `generated-docs/PLAY_STORE_DEPLOYMENT.md`
- Quick start (prints commands only): `deploy-playstore.ps1`

**Security Reminders:**
- Never commit keystore files
- Never commit keystore.properties
- Never commit pc-api-key.json
- Keep all credentials secure and backed up
- Prefer EAS-managed upload key for Play; do not generate a new keystore for an app already published

## Ready for Next Stage?

After successful internal testing:

- [ ] All critical bugs fixed
- [ ] Feedback incorporated
- [ ] Ready for closed testing (broader audience)
- [ ] All Play Console requirements complete
- [ ] Ready for production review

---

Last Updated: September 11, 2026
