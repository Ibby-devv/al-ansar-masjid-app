# Al Ansar Masjid Mobile App #

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Versioning & Releases

Android versioning uses two values:

1. `version` (semantic string) — shown to users as the version name.
2. `android.versionCode` (integer) — must strictly increase for every Google Play upload.

Where to bump:

- Primary source: `app.json` under `expo.version` and `expo.android.versionCode`.
- Mirrored in: `android/app/build.gradle` (`defaultConfig { versionName, versionCode }`) for consistency with local builds.

Release workflow:

```text
1. Decide next semantic version (e.g. 1.0.1 -> 1.0.2).
2. Increment android.versionCode (e.g. 11 -> 12).
3. Commit changes.
4. Generate bundle locally: npm run build:bundle (creates app-release.aab).
5. Upload AAB to Play Console (Internal testing track first).
6. (Optional) Tag git: git tag v1.0.2 && git push --tags.
```

Notes:

- Because we run `expo prebuild --clean` in cloud builds, `app.json` must hold the authoritative version values.
- Keep versionCode monotonic; if you skip a number it’s fine, but never reuse one.
- iOS (when added) will use `ios.buildNumber` similarly.

Example bump:

```jsonc
{
   "expo": {
      "version": "1.0.2",
      "android": { "versionCode": 12 }
   }
}
```

Troubleshooting:

- Play Console rejects upload: ensure versionCode > last published.
- Local build still shows old version: clean build (`cd android && gradlew clean bundleRelease`).

This section documents the agreed process so future releases stay consistent.
