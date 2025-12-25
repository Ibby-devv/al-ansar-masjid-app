# iOS Build & Release Guide (Expo Bare Workflow)

This guide explains how to build, test, and ship the iOS version of the Al Ansar Masjid app using the Expo bare workflow. It covers both local Xcode builds (on macOS) and the optional EAS Build path. Tasks are split into Code vs Non‑Code for clarity.

## TL;DR Paths
- Local build on macOS (Xcode): Best for day‑to‑day development and device testing.
- EAS Build (cloud): Optional; convenient for CI or when distributing builds without Xcode.

---

## Non‑Code Tasks (Apple/Firebase/Admin)

- Apple Developer
  - Create/join an Apple Developer Program account (Admin/Agent role).
  - Reserve a unique Bundle ID (e.g., `com.alansar.masjid`) in Certificates, Identifiers & Profiles.
  - Create an App record in App Store Connect with the same Bundle ID.
  - Set up signing: enable Automatic Signing in Xcode (Team selected) for all targets.

- Certificates & Profiles
  - Let Xcode manage Signing or create a Distribution Certificate and Provisioning Profiles if doing manual signing.
  - Add Capabilities in the Apple portal/Xcode as required: Push Notifications, Background Modes (Remote notifications), Apple Pay (optional).

- Firebase (iOS app)
  - In Firebase Console, add an iOS app using the exact Bundle ID.
  - Download `GoogleService-Info.plist` and add it to the Xcode iOS target (Project navigator → drag into app, ensure “Copy if needed” and target selected).
  - Cloud Messaging: upload APNs Auth Key (`.p8`) or certificates to enable push via FCM.

- App Store Connect
  - Fill app metadata, screenshots, and compliance answers.
  - Add TestFlight testers as needed (internal/external).

---

## Code / Config Tasks (Repository Changes)

- app.json (Expo config)
  - Add/update iOS block for versioning and identifiers (kept in sync with Xcode):
    ```json
    {
      "expo": {
        "name": "Al Ansar Masjid",
        "scheme": "alansar",
        "ios": {
          "bundleIdentifier": "com.alansar.masjid",
          "buildNumber": "1",
          "googleServicesFile": "./GoogleService-Info.plist",
          "infoPlist": {
            "NSLocationWhenInUseUsageDescription": "We use your location to show Qibla direction.",
            "UIBackgroundModes": ["remote-notification"]
          }
        },
        "plugins": [
          "react-native-firebase/app",
          "react-native-firebase/messaging",
          ["@stripe/stripe-react-native", { "merchantIdentifier": "merchant.com.alansar" }]
        ]
      }
    }
    ```
    Notes:
    - In bare workflow, plugins only apply when regenerating native projects (prebuild/EAS). If you’re not prebuilding, mirror these values manually in Xcode/Info.plist.

- Info.plist (native iOS)
  - Ensure these keys are present in the iOS target’s `Info.plist`:
    - `NSLocationWhenInUseUsageDescription` — Qibla feature.
    - `UIBackgroundModes` includes `remote-notification` — background notification delivery.
    - `CFBundleURLTypes` entry for deep link scheme (e.g., `alansar`).
    - If using Apple Pay: Apple Pay merchant ID configuration per Stripe docs.

- Capabilities (Xcode → Target → Signing & Capabilities)
  - Add: Push Notifications.
  - Add: Background Modes → Remote notifications.
  - Optional: Apple Pay (if accepting Apple Pay via Stripe).

- Firebase iOS config
  - Add `GoogleService-Info.plist` to the iOS app target (checked under Build Phases → Copy Bundle Resources).

- Stripe (if using PaymentSheet/Apple Pay)
  - Add the Stripe pod via npm/yarn (already installed in JS) and ensure `pod install` pulls `Stripe`.
  - For Apple Pay: create and set `merchantIdentifier` in app code/config and enable Apple Pay capability in Xcode.

- Deep Links
  - Confirm scheme matches app config (e.g., `alansar://`). Ensure URL Types configured in Xcode.

---

## Local macOS Build (Xcode)

1) Prerequisites (macOS)
   - Xcode (latest stable) + command line tools.
   - CocoaPods: `sudo gem install cocoapods`
   - Node 20.x, Watchman (optional).

2) Install iOS dependencies
   ```bash
   cd al-ansar-masjid-app/ios
   pod install --repo-update
   ```

3) Open workspace in Xcode
   - Open `ios/AlAnsarMasjid.xcworkspace` (your workspace name may differ) in Xcode.
   - Select the app target → Signing & Capabilities → choose your Team → enable Automatic Signing.

4) Configure identifiers and version
   - General tab: set `Bundle Identifier` to match Firebase/App Store (e.g., `com.alansar.masjid`).
   - Set `Version` (marketing version, e.g., 1.0.0) and `Build` (increment every submission).

5) Run on simulator or device
   - Simulator: choose an iPhone device and click Run.
   - Real device: connect device, ensure provisioning, then Run. Note: push notifications require a physical device.

6) Archive and upload (TestFlight/App Store)
   - Product → Scheme: select `Any iOS Device (arm64)`.
   - Product → Archive. When complete, open Organizer.
   - Validate/Distribute → App Store Connect → Upload. Follow prompts.

---

## Optional: EAS Build (Cloud) for iOS

You can build iOS in the cloud even in bare workflow, which simplifies signing.

1) Install and login
```bash
npm i -g eas-cli
eas login
```

2) Initialize (once)
```bash
cd al-ansar-masjid-app
eas init
```

3) Build and submit
```bash
# Preview build for QA
eas build --platform ios --profile preview

# Production/TestFlight build
eas build --platform ios --profile production

# Submit latest iOS build to App Store Connect
eas submit --platform ios --profile production
```

Notes:
- Ensure `ios.bundleIdentifier` and `ios.buildNumber` are correct in `app.json`.
- If letting EAS manage credentials, it will create certificates/profiles for you.
- For Firebase/APNs, you still need to upload the APNs key in Firebase Console.

---

## Push Notifications Checklist (FCM/APNs)

- Apple Developer → Keys: create APNs Auth Key (`.p8`), note Key ID and Team ID.
- Firebase Console → Project Settings → Cloud Messaging → iOS app: upload APNs key.
- Build and install on a real device (simulator won’t receive push).
- Ensure `UIBackgroundModes` → `remote-notification` is enabled and app has notification permission.

---

## Troubleshooting

- Bundle ID mismatch
  - Must match across Xcode target, Firebase iOS app, App Store Connect, and any config files.

- Missing `GoogleService-Info.plist`
  - App may run but Firebase/FCM features won’t initialize. Confirm file is in the iOS target’s Copy Bundle Resources.

- Push not working on iOS
  - Test on a physical device. Confirm APNs key uploaded to Firebase and Background Modes → Remote notifications is enabled.

- Build number rejected
  - Increment the Build in Xcode (or `ios.buildNumber` if using EAS) for every new submission.

- Cocoapods errors
  - Run `pod repo update` then `pod install`. Ensure Ruby and CocoaPods are up to date.

- Deep link doesn’t open app
  - Verify `CFBundleURLTypes` contains your scheme and matches `scheme` in `app.json`.

---

## Reference: Minimal Info.plist keys

Add these keys to the iOS target’s `Info.plist` if not already present:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We use your location to show Qibla direction.</string>
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
  <!-- Add others only if you actually need them -->
</array>
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>alansar</string>
    </array>
  </dict>
  <!-- Add Stripe URL scheme if required by your flow -->
</array>
```

---

## Quick Commands (macOS)

```bash
# From project root
cd al-ansar-masjid-app

# Install pods
cd ios && pod install --repo-update && cd ..

# Start Metro and run in Xcode manually
npx expo start

# Optional EAS path
eas login
eas build --platform ios --profile preview
eas submit --platform ios --profile production
```

---

If you want, we can fill in concrete values for Bundle ID, merchant IDs, and add the required Info.plist entries directly in the iOS target.
