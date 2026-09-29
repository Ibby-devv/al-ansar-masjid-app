# Play Console recommendations — batch fix

Working doc for Google Play pre-launch / vitals recommendations. Fix these in one release pass after collecting the full list from Play Console.

**App:** Al Ansar Masjid (`com.alansarmasjid.app`)  
**Build path:** local `npm run build:bundle` / `build:release` (committed `android/`)  
**Last updated:** 2026-03-29

---

## Already done (prior release)

| Topic | Status | Notes |
|-------|--------|--------|
| DEX code optimization (R8) | Done | `android.enableMinifyInReleaseBuilds` + shrink resources; `proguard-android-optimize.txt`; keep rules for Expo modules + Stripe push-provisioning `dontwarn`. Obfuscation ~89% in App bundle explorer. |

---

## Batch queue

Paste each Play recommendation below (title + detail). Mark priority and owner notes. Implement all checked items together, then ship one AAB and re-check App bundle explorer / pre-launch report.

### 1. Bitmap image optimization — use an image-loading library

**Play summary:** App manually downloads/decodes network images via `HttpURLConnection` + `BitmapFactory.decodeStream`, which can cause high memory use and crashes. Prefer an image-loading library (caching, downsampling, memory management).

**Industry practice (our stack):** Use **`expo-image`** for remote UI images (Glide on Android, SDWebImage on iOS). Do not use React Native’s `Image` for `https://` URIs.

**In scope (app UI):**

| File | Current | Change |
|------|---------|--------|
| `components/CampaignCard.tsx` | RN `Image` + `campaign.image_url` | `import { Image } from 'expo-image'`; keep `source` / sizing; prefer `contentFit="cover"` over `resizeMode` |
| `app/(tabs)/events.tsx` | RN `Image` + `event.image_url` | Same |
| `components/EventDetailsModal.tsx` | RN `Image` + `event.image_url` | Same |

**Out of scope / leave as-is:**

- Local assets (e.g. home logo via `require(...)`) — RN `Image` is fine.
- **Notifee Big Picture** (`data.imageUrl` → `AndroidStyle.BIGPICTURE`) — Notifee owns download/decode; cannot plug in Glide. Our push images are already ~50 KB / resized. Accept residual Play noise for notification bitmaps, or omit Big Picture if Play still flags after UI migration.

**Acceptance:**

- [ ] All remote in-app images use `expo-image`
- [ ] Smoke-test campaigns list, events list, event details (image load, scroll, low-memory device if available)
- [ ] Release AAB uploaded; re-check Play bitmap recommendation (may still mention Notifee)

**Optional follow-ups (not required for this batch):**

- Shared wrapper component (e.g. `RemoteImage`) so future screens don’t reintroduce RN `Image` for URIs
- Explicit `cachePolicy` / recycling props on `expo-image` if we see memory pressure

---

### 2. Improve your app's memory and performance with R8 optimization

**Play detail:**

Your R8 configuration could be causing higher memory usage and lower performance. Address the following to improve your app's optimization:

Optimized resource shrinking isn't enabled
Upgrade your Android Gradle plugin to version 9.0 or higher

**Likely cause / files:**

- Expo SDK 54 / RN 0.81 pins **AGP 8.11.0** (`node_modules/react-native/gradle/libs.versions.toml`).
- Optimized resource shrinking needs **AGP ≥ 8.12** (default in AGP 9.0 when `shrinkResources` is on).
- We already have minify + classic `shrinkResources` enabled (prior DEX work).

**Proposed fix:**

- **This batch: defer.** Do not force AGP 9.0 on SDK 54 — breaks Expo/RN Gradle alignment.
- Track for next Expo SDK upgrade that ships AGP 8.12+/9.x; then optimized resource shrinking comes for free (or via `android.r8.optimizedResourceShrinking=true` on 8.12–8.13).
- Document in release notes / Play reply if needed: “R8 full mode + resource shrinking enabled; AGP upgrade pending Expo SDK.”

**Acceptance:**

- [ ] Explicitly marked deferred (or implemented after Expo AGP bump)
- [ ] No unsupported AGP override merged into this release

---

### 3. Edge-to-edge may not display for all users

**Play detail:**

From Android 15, apps targeting SDK 35 will display edge-to-edge by default. Apps targeting SDK 35 should handle insets to make sure that their app displays correctly on Android 15 and later. Investigate this issue and allow time to test edge-to-edge and make the required updates. Alternatively, call enableEdgeToEdge() for Kotlin or EdgeToEdge.enable() for Java for backward compatibility.

**Likely cause / files:**

- `app.json` / `gradle.properties`: `edgeToEdgeEnabled=true` already.
- Screens use `SafeAreaView` / `useSafeAreaInsets` (tabs, home, events, donate, qibla, more).
- Play wants confirmation that insets are correct on Android 15+ and/or explicit `EdgeToEdge.enable()` for older API parity.
- Theme still sets `android:statusBarColor` (see item 4) which fights true edge-to-edge.

**Proposed fix:**

- Audit key screens on Android 15+ (home, events, donate flow, qibla, more): no content under system bars / cutouts; tab bar respects bottom inset (already uses insets).
- Prefer `expo-status-bar` / transparent system bars; avoid painting opaque bar colors in theme (ties to item 4).
- Only add native `EdgeToEdge.enable()` in `MainActivity` if Expo’s `edgeToEdgeEnabled` path is insufficient after audit — don’t duplicate blindly.
- Fix gaps found in audit (missing `edges` / padding) rather than blanket layout rewrites.

**Acceptance:**

- [ ] Manual check on Android 15+ (or emulator) for main tabs + donate + qibla
- [ ] No clipped CTAs / overlapping status or nav bars
- [ ] Item 4 theme cleanup landed if it blocks correct edge-to-edge

---

### 4. Your app uses deprecated APIs or parameters for edge-to-edge

**Play detail:**

One or more of the APIs you use or parameters that you set for edge-to-edge and window display have been deprecated in Android 15. Your app uses the following deprecated APIs or parameters:

android.view.Window.setStatusBarColor
android.view.Window.setNavigationBarColor
android.view.Window.getStatusBarColor
LAYOUT_IN_DISPLAY_CUTOUT_MODE_DEFAULT
LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
These start in the following places:

F6.m.a
Qa.j.invokeSuspend
Qa.k.invokeSuspend
U5.c.runGuarded
com.facebook.react.modules.statusbar.StatusBarModule.getTypedExportedConstants
com.google.android.material.datepicker.n.W
ic.n.invoke
A1.d.r
F6.k.w
To fix this, migrate away from these APIs or parameters.

**Likely cause / files:**

| Source (Play / code) | Ours? |
|----------------------|--------|
| `android:statusBarColor` in `android/app/src/main/res/values/styles.xml` | **Yes — fix** |
| `com.facebook.react.modules.statusbar.StatusBarModule` | RN core — used via RN/`expo-status-bar` `StatusBar` on several screens |
| `com.google.android.material.datepicker` | **Dependency** (likely Stripe / Material), not our UI |
| Obfuscated `F6` / `Qa` / `A1` / cutout modes | RN / Expo / libs |

**Proposed fix:**

- Remove `android:statusBarColor` (and any nav bar color items if present) from `AppTheme` in `styles.xml`; rely on edge-to-edge + `expo-status-bar` for icon style only (`style` / `barStyle`), not window color APIs where avoidable.
- Prefer `expo-status-bar` (`StatusBar` from `expo-status-bar`) over RN `StatusBar` where screens still import from `react-native` (home, events, more, donate, qibla).
- Accept residual Play hits from RN `StatusBarModule` and Material datepicker until upstream Expo/RN/Stripe drop those APIs — do not vendor-patch Material.
- Re-test splash → first frame (splash theme must still look correct).

**Acceptance:**

- [ ] Our theme no longer sets deprecated bar colors
- [ ] Screens use `expo-status-bar` consistently (or documented exceptions)
- [ ] Visual smoke: light/dark-ish headers, splash, donate
- [ ] Note remaining dependency-owned APIs in Play if warning persists

---

### 5. Remove resizability and orientation restrictions for large screens

**Play detail:**

From Android 16, Android will ignore resizability and orientation restrictions for large screen devices, such as foldables and tablets. This may lead to layout and usability issues for your users.

We detected the following resizability and orientation restrictions in your app:

<activity android:name="com.alansarmasjid.app.MainActivity" android:screenOrientation="PORTRAIT" />
To improve the user experience for your app, remove these restrictions and check that your app layouts work on various screen sizes and orientations by testing on Android 16 and below.

**Likely cause / files:**

- `app.json` → `"orientation": "portrait"` → `AndroidManifest` `android:screenOrientation="portrait"` on `MainActivity`.

**Proposed fix:**

- Set `"orientation": "default"` (or remove portrait lock) in `app.json` and clear `android:screenOrientation` on `MainActivity` in `android/app/src/main/AndroidManifest.xml`.
- **Product / QA:** test landscape + tablet/foldable (or resized emulator) for: prayer home, events, donate, **Qibla compass** (highest risk), more/settings.
- Fix only broken layouts found (SafeArea, flex, compass sizing) — no full tablet redesign required for this recommendation.
- If Qibla is unusable in landscape, consider locking **only** that screen via Expo Screen Orientation API later; keep activity free for Play.

**Acceptance:**

- [ ] Portrait lock removed from manifest / app config
- [ ] Smoke-tested portrait + landscape on phone; at least one large-width layout check
- [ ] Qibla usable or follow-up ticket filed for screen-level lock / layout fix

---


## Release checklist (when batch is ready)

1. Implement items 1–5 (or however many are filled in)
2. `npm run lint`
3. `cd android && gradlew assembleRelease` (avoid extra version bump) → device smoke test
4. `npm run build:bundle` when ready to publish
5. Upload AAB → confirm recommendations cleared or reduced in Play Console
6. User-facing release notes: keep generic (“Performance and stability improvements”) unless a fix is user-visible

---

## Notes

- **Item 2:** Do not casually bump AGP to 9.0 for optimized resource shrinking while on Expo SDK 54 (AGP ~8.11 via RN). Defer to a future Expo SDK that ships AGP 8.12+/9.
- Prefer Expo packages; `expo-image` is already a dependency (`package.json`) — item 1 is migration only, no new deps.
- Items 3–4 overlap: theme + StatusBar cleanup serves both.
- Item 5 needs a quick product OK (unlock orientation); Qibla is the main QA risk.
