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

- [ ] Build production AAB
  - [ ] Run: `eas build --platform android --profile production`
  - [ ] Wait for build to complete (10-20 minutes)
  - [ ] Build successful ✓
- [ ] Download AAB file
  - [ ] Run: `eas build:download --platform android --profile production`
  - [ ] AAB file saved locally

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
  - [ ] Review version name (1.0.0) and version code
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

**Version:** 1.0.0 (Version Code: Auto-incremented by EAS)
**Package:** com.alansarmasjid.app
**Build Type:** App Bundle (AAB)
**Testing Track:** Internal Testing

**Important Files:**
- Configuration: `eas.json`, `app.json`
- Build config: `android/app/build.gradle`
- Deployment guide: `PLAY_STORE_DEPLOYMENT.md`
- Quick start: `deploy-playstore.ps1`

**Security Reminders:**
- Never commit keystore files
- Never commit keystore.properties
- Never commit pc-api-key.json
- Keep all credentials secure and backed up

## Ready for Next Stage?

After successful internal testing:

- [ ] All critical bugs fixed
- [ ] Feedback incorporated
- [ ] Ready for closed testing (broader audience)
- [ ] All Play Console requirements complete
- [ ] Ready for production review

---

Last Updated: November 6, 2025
