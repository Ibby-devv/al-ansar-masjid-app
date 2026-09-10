# Google Play Store Deployment Guide

Al Ansar Masjid app — how to build and upload to Play Console.

## TL;DR — Use EAS for Play Store

Play Store releases are meant to go through **EAS** (Expo Application Services). The upload signing key is stored in your **Expo account**, so you do **not** need a keystore file on each PC.

```powershell
# From the project root (install CLI once if needed: npm install -g eas-cli)
eas login
eas build --platform android --profile production
```

When the cloud build finishes (~10–20 min):

```powershell
eas build:download --platform android --profile production
# Upload the .aab in Play Console → Testing → Internal testing → Create release
```

Or submit automatically (needs `android/pc-api-key.json`):

```powershell
eas submit --platform android --profile production
```

There is **no** npm script that runs this end-to-end.  
`.\deploy-playstore.ps1` only **prints** these steps (and can install the EAS CLI). It does **not** build or upload for you.

---

## EAS vs local Gradle — which to use?

| Goal | Use | Command |
|------|-----|---------|
| Upload to Google Play | **EAS** (recommended) | `eas build --platform android --profile production` |
| Local release AAB / APK on this machine | Local Gradle | `npm run clean:build:bundle` (or `build:release`) |
| Dev / debug APK | Local Gradle | `npm run clean:build:debug` |

**Why EAS for Play?**  
Earlier uploads were signed with the EAS-managed upload key. Local builds without `android/keystore.properties` fall back to the **debug** keystore. Play then rejects the AAB with “signed with the wrong key.”

Expected Play upload cert (example from a real rejection):

- Play expects: your EAS/upload key SHA1  
- Debug key looks like: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`

If you see that debug fingerprint, you built locally without release signing.

---

## Versioning

| Field | Where | Who bumps it |
|-------|--------|----------------|
| `versionCode` (integer Play requires to increase) | `app.json` → `android.versionCode` and `android/app/build.gradle` | **EAS production:** auto (`autoIncrement: true` in `eas.json`). **Local:** bump both places yourself before each Play upload. |
| `version` / `versionName` (user-facing, e.g. `1.2`) | `app.json` and `build.gradle` | You, when you want a new visible version. |

Package name must stay: `com.alansarmasjid.app`.

---

## Prerequisites (EAS path)

1. Node / npm installed; run `npm install` in the project root first  
2. EAS CLI: `npm install -g eas-cli` (or use `npx eas-cli …`)  
3. Expo account: `eas login`  
4. Google Play Console access to this app  

Signing: prefer **EAS-managed keystore** (`eas credentials` → Android → production). Do not create a *new* keystore if the app is already on Play — Play expects the existing upload certificate.

---

## Step-by-step: Play release with EAS

### 1. (Optional) Bump user-facing version

Edit `app.json` → `"version"` (and keep `versionName` in `android/app/build.gradle` in sync if you care about local consistency).  
Leave `versionCode` alone for EAS; it auto-increments from remote.

### 2. Build

```powershell
eas build --platform android --profile production
```

This builds an **AAB**, signs with the Expo-stored upload key, and auto-increments `versionCode`.

Profiles in `eas.json`:

- `production` — AAB for Play Store  
- `production-apk` — same signing, APK output  
- `preview` — internal APK  
- `development` — dev client  

### 3. Download or submit

```powershell
eas build:list
eas build:download --platform android --profile production
```

Upload the AAB in Play Console, **or**:

```powershell
eas submit --platform android --profile production
```

(`eas submit` needs a Play service account JSON at `android/pc-api-key.json` — gitignored.)

### 4. Internal testing (manual upload)

1. [Play Console](https://play.google.com/console) → **Testing → Internal testing**  
2. **Create new release** → upload AAB → release notes → rollout  
3. Add testers under the Testers tab and share the opt-in URL  

---

## Local Gradle builds (not for Play unless signing is set up)

Useful for device installs and debugging. **Not** the default Play path.

```powershell
npm install                    # required; missing packages break the JS bundle step
npm run clean                  # safe clean (scripts/clean-build.js) — prefer over gradlew clean
npm run clean:build:debug      # debug APK
npm run clean:build:release    # release APK
npm run clean:build:bundle     # release AAB
```

Outputs:

- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`  
- Release APK: `android/app/build/outputs/apk/release/app-release.apk`  
- Release AAB: `android/app/build/outputs/bundle/release/app-release.aab`  

Install helpers: `npm run install:debug` / `npm run install:release`.

### Local release signing (only if you insist on uploading a local AAB)

1. Download the **existing** upload keystore from EAS (`eas credentials`) — do not generate a new one for an app already on Play.  
2. Place it under `android/app/` (e.g. `upload-keystore.keystore`).  
3. Copy `android/keystore.properties.template` → `android/keystore.properties` and fill in passwords / alias / `storeFile`.  
4. If a clean prebuild wiped signing blocks: `npm run restore:signing`.  
5. Bump `versionCode` in **both** `app.json` and `android/app/build.gradle`.  
6. `npm run clean:build:bundle` and upload the AAB.

`keystore.properties` and `*.keystore` (except debug) are gitignored — they are not shared across PCs via git. That’s why EAS is easier on multiple machines.

Optional local key generation (new apps only): `android/app/generate-keystore.ps1`.

---

## Scripts reference

| Script / command | What it actually does |
|------------------|------------------------|
| `.\deploy-playstore.ps1` | Prints EAS instructions; may install `eas-cli`. **Does not build.** |
| `eas build --platform android --profile production` | Cloud AAB for Play (correct signing). |
| `eas submit --platform android --profile production` | Upload latest/compatible build to Play. |
| `npm run clean:build:bundle` | Local AAB via Gradle (debug-signed if no keystore.properties). |
| `npm run restore:signing` | Re-inject release signing config into `build.gradle` after prebuild. |
| `npm run clean` | Delete Android build artifacts safely. |

---

## Troubleshooting

### “Android App Bundle is signed with the wrong key”
You uploaded a **locally** built AAB signed with the debug key (or a different keystore). Rebuild with **EAS production**, or configure the **same** upload keystore Play already has.

### “versionCode already used” / must be higher
Bump `versionCode` (local) or use EAS `production` so `autoIncrement` runs.

### Bundle step: Unable to resolve module …
Run `npm install` and rebuild. Example: missing `@react-native-async-storage/async-storage` fails `:app:createBundleReleaseJsAndAssets`.

### Strange `Γûô` characters in the console
Metro progress bar Unicode vs Windows code page. Harmless. Optional: `chcp 65001`.

### EAS CLI not found
`npm install -g eas-cli` or `npx eas-cli build --platform android --profile production`.

---

## Store listing / first-time Console setup

If the app is new in Play Console: create the app, complete store listing, privacy policy, content rating, data safety, etc., then upload via Internal testing as above. Details for listing assets and tester setup are the same as a normal Play internal-test rollout.

---

## Related files

- `eas.json` — build/submit profiles  
- `app.json` — `version`, `android.versionCode`  
- `android/app/build.gradle` — local `versionCode` / signing  
- `android/keystore.properties.template` — local signing template  
- `generated-docs/DEPLOYMENT_CHECKLIST.md` — checklist  
- `generated-docs/GETTING_STARTED.md` — short intro  

External docs:

- [EAS Build](https://docs.expo.dev/build/introduction/)  
- [EAS Submit](https://docs.expo.dev/submit/introduction/)  
- [Play Console Help](https://support.google.com/googleplay/android-developer)
