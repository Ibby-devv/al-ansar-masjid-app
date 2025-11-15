# Copilot Instructions - Al Ansar Masjid Mobile App

## Project Overview

**Al Ansar Masjid Mobile App** is a React Native mobile application built with Expo for mosque services including prayer times, Qibla compass, donations (via Stripe), events, and push notifications via Firebase Cloud Messaging.

### Tech Stack
- **Framework**: Expo SDK 54 (~54.0.13) with React Native 0.81.4
- **Language**: TypeScript (strict mode enabled)
- **Runtime**: Node.js 20.x, npm 10.x
- **Navigation**: Expo Router v6 (file-based routing)
- **Backend**: Firebase (Firestore, Cloud Functions, FCM, App Check)
- **State**: React hooks (useState, useEffect, custom hooks)
- **Build**: Gradle 8.14.3, Java 17 (OpenJDK Temurin)
- **Linting**: ESLint with expo config

### Project Size
- ~12,000 lines of code across 71 TypeScript files
- Android native code committed in `android/` directory
- No test infrastructure currently

---

## Critical Build & Development Commands

### Installation & Dependencies
**ALWAYS run `npm install` before building** - Fresh clone requires dependencies installed first.

```bash
npm install        # Install dependencies (takes ~25s, may show 15 moderate vulnerabilities - acceptable)
```

### Linting
```bash
npm run lint       # Runs 'expo lint' - MUST pass before committing
```

Expected: 0 errors (warnings acceptable if pre-existing). Current warnings in `app/(tabs)/donate/give.tsx` and `app/(tabs)/events.tsx` are known issues.

### Cleaning Build Artifacts
```bash
npm run clean      # Removes android/app/build, android/build, android/.gradle, android/app/.cxx
```

**IMPORTANT**: Use `npm run clean` instead of `./gradlew clean` which fails when directories don't exist. The custom clean script handles missing directories gracefully.

### Development Server
```bash
npm start          # Starts Expo dev server (alias: 'npm run dev')
npx expo start     # Alternative command
```

### Android Build Commands
**NOTE**: Native builds require Android SDK and emulator/device setup. Most development uses Expo Go or EAS Build service.

```bash
npm run android                  # Run on Android emulator/device
npm run build:debug              # Build debug APK (requires android/ setup)
npm run build:release            # Build release APK (requires keystore)
npm run build:bundle             # Build release AAB for Play Store

# Clean + build combinations
npm run clean:build:debug        # Clean then build debug
npm run clean:build:release      # Clean then build release
npm run clean:build:bundle       # Clean then build bundle
```

**Gradle Commands**: When running Gradle directly, use `./gradlew` from the `android/` directory:
```bash
cd android && ./gradlew --version            # Check Gradle version
cd android && ./gradlew assembleDebug        # Build debug APK
cd android && ./gradlew bundleRelease        # Build release AAB
```

**First Gradle run**: Downloads Gradle 8.14.3 (~100MB), takes 30-60 seconds. Subsequent builds are faster.

### EAS Build (Production)
```bash
eas build --platform android --profile production     # Build production AAB (10-20 min cloud build)
eas submit --platform android --profile production    # Submit to Play Store (requires pc-api-key.json)
```

**EAS Profiles** (defined in `eas.json`):
- `development`: Debug build with dev client
- `preview`: Release APK for internal testing
- `production`: Release AAB for Play Store (auto-increments versionCode)
- `production-apk`: Release APK variant

---

## Project Architecture & File Structure

### Root Directory Layout
```
/
├── app/                    # Expo Router - file-based routing (screens)
│   ├── (tabs)/            # Tab navigator screens
│   │   ├── index.tsx      # Home (Prayer Times)
│   │   ├── qibla.tsx      # Qibla Compass
│   │   ├── events.tsx     # Events List
│   │   ├── donate/        # Donation sub-routes
│   │   └── more.tsx       # More/Settings
│   └── _layout.tsx        # Root layout with navigation config
├── components/            # Reusable UI components
│   ├── ui/               # Generic UI components (badges, buttons, etc.)
│   └── QiblaCompass/     # Complex feature components
├── hooks/                # Custom React hooks
├── services/             # Firebase, notifications, API services
├── types/                # TypeScript type definitions
├── constants/            # Theme, notification channels, configs
├── assets/               # Images, fonts, icons
├── android/              # Android native project (COMMITTED - DO NOT GITIGNORE)
├── scripts/              # Build and utility scripts
├── docs/                 # Deployment guides and documentation
├── firebase.ts           # Firebase initialization
├── index.js              # App entry point (loads FCM handlers before app)
├── metro.config.js       # Metro bundler config (SVG transformer)
├── tsconfig.json         # TypeScript config (strict mode, path aliases)
├── eslint.config.js      # ESLint configuration
├── eas.json              # EAS Build profiles
└── package.json          # Dependencies and scripts
```

### Key Configuration Files
- **`package.json`**: Scripts, dependencies, project metadata
- **`app.json`**: Expo configuration (app name, version, plugins, deep linking)
- **`eas.json`**: EAS Build profiles for development/preview/production
- **`tsconfig.json`**: TypeScript strict mode, path alias `@/*` maps to root
- **`eslint.config.js`**: Uses `eslint-config-expo/flat` configuration
- **`metro.config.js`**: Enables SVG imports as React components via `react-native-svg-transformer`
- **`firebase.ts`**: Firebase initialization (App Check, Firestore, regional Functions)
- **`index.js`**: Critical entry point - registers FCM background handlers before app loads
- **`android/gradle.properties`**: Gradle JVM args, new architecture enabled, Hermes enabled
- **`android/keystore.properties.template`**: Template for signing configuration (actual file gitignored)

---

## Code Style & Best Practices - MANDATORY FOR ALL NEW CODE

### Language & Typing
- **TypeScript strict mode** - Always use proper typing, avoid `any`
- **Functional components** - Use function declarations with explicit return types
- **Arrow functions** for inline callbacks and event handlers
- **React.JSX.Element** for component return types (not JSX.Element or ReactElement)

### Naming Conventions
- **Components**: PascalCase, default export - `export default function ComponentName()`
- **Hooks**: camelCase, named export or default - `export const useCustomHook = ()`
- **Services**: PascalCase for classes/modules, camelCase for functions
- **Files**: Match component name - `ComponentName.tsx`, `useCustomHook.ts`
- **Types/Interfaces**: PascalCase - `interface UserData {}`, `type Prayer = {}`
- **Constants**: UPPER_SNAKE_CASE for true constants, camelCase for config objects

### Component Patterns
```typescript
// Preferred pattern for screen components
export default function ScreenName(): React.JSX.Element {
  const [state, setState] = useState<Type>(initialValue);
  
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  return (
    <View>
      {/* JSX */}
    </View>
  );
}

// For components with props
interface ComponentProps {
  title: string;
  onPress?: () => void;
}

export default function Component({ title, onPress }: ComponentProps) {
  // Component logic
}
```

### Import Organization
```typescript
// 1. React & React Native core
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 2. Third-party libraries (Expo, Firebase, etc.)
import { Ionicons } from '@expo/vector-icons';
import messaging from '@react-native-firebase/messaging';

// 3. Local components (relative imports)
import CustomButton from '../../components/ui/CustomButton';

// 4. Hooks
import { useFirebaseData } from '../../hooks/useFirebaseData';

// 5. Types, constants, utilities
import { Theme } from '../../constants/theme';
import { Prayer } from '../../types';
```

### Styling
- Use `StyleSheet.create()` for all styles (defined at bottom of file)
- Reference theme from `constants/theme.ts` for colors
- Use `SafeAreaView` from `react-native-safe-area-context` for screen containers
- Prefer `expo-linear-gradient` for gradients

### Comments & Documentation
- **Self-documenting code preferred** - Use clear variable/function names
- Add comments for:
  - Complex algorithms or business logic
  - Workarounds or temporary solutions
  - Firebase data structure expectations
  - Non-obvious dependencies or side effects
- Use JSDoc-style comments for exported functions/hooks that are reused
- Section headers with `// ======` for major file sections (see `useDonation.ts` example)

---

## Best Practice Enforcement - READ CAREFULLY

### Critical Rule: Always Conform to Best Practices

**When working on this codebase, you MUST:**

1. **Follow industry best practices** for React Native, TypeScript, and Expo development
2. **Write new code** that meets current best practice standards
3. **Refactor existing code** you touch to meet best practices, even if the original code doesn't
4. **Fix code smells** and anti-patterns when you encounter them

### Best Practices to Enforce

#### TypeScript Best Practices
- **No implicit any**: Always provide explicit types
- **Use const assertions** where appropriate
- **Avoid type assertions** (`as` keyword) unless absolutely necessary
- **Define proper interfaces** for all component props and function parameters
- **Use union types** and discriminated unions for state management
- **Extract complex types** into `types/` directory for reuse

#### React/React Native Best Practices
- **Use functional components** exclusively (no class components)
- **Proper dependency arrays** in useEffect, useMemo, useCallback
- **Avoid inline function definitions** in render (use useCallback for handlers)
- **Memoize expensive computations** with useMemo
- **Memoize complex components** with React.memo when appropriate
- **Proper error boundaries** for error handling
- **Accessibility**: Add accessibilityLabel and accessibilityRole to interactive elements

#### Performance Best Practices
- **Lazy load** heavy components when possible
- **Optimize FlatList/ScrollView** with proper keys, getItemLayout, and windowing
- **Debounce/throttle** user input handlers
- **Cache API responses** in AsyncStorage (see useDonation.ts pattern)
- **Minimize re-renders** by splitting state appropriately
- **Use React DevTools Profiler** insights to guide optimizations

#### Security Best Practices
- **Never commit secrets** (API keys, keystores, credentials)
- **Validate all user input** before processing
- **Sanitize data** before displaying in UI
- **Use secure storage** for sensitive data (not AsyncStorage for secrets)
- **Implement proper error handling** that doesn't expose system details
- **Keep dependencies updated** and audit for vulnerabilities

#### Code Organization Best Practices
- **Single Responsibility Principle**: One component/hook/function = one purpose
- **DRY (Don't Repeat Yourself)**: Extract common logic into hooks/utilities
- **Consistent file structure**: Follow the established directory layout
- **Proper separation of concerns**: UI in components, logic in hooks, data in services
- **Keep files focused**: Split large files (>500 lines) into smaller modules

#### Error Handling Best Practices
```typescript
// Good: Proper error handling with user feedback
try {
  const result = await fetchData();
  setData(result);
} catch (error) {
  console.error('Failed to fetch data:', error);
  setError('Unable to load data. Please try again.');
  // Optional: Log to error tracking service
}

// Bad: Silent failures or exposing error details
try {
  const result = await fetchData();
  setData(result);
} catch (error) {
  // Silent failure - BAD
}
```

#### State Management Best Practices
```typescript
// Good: Proper typing and initial values
const [isLoading, setIsLoading] = useState<boolean>(false);
const [data, setData] = useState<UserData | null>(null);
const [error, setError] = useState<string | null>(null);

// Good: Cleanup in useEffect
useEffect(() => {
  let isMounted = true;
  
  async function loadData() {
    const result = await fetchData();
    if (isMounted) setData(result);
  }
  
  loadData();
  
  return () => {
    isMounted = false;
  };
}, []);

// Bad: No cleanup, race conditions possible
useEffect(() => {
  fetchData().then(setData);
}, []);
```

### When Modifying Existing Code

**Always improve code you touch:**

1. **Fix linting warnings** in files you modify (see current warnings in donate/give.tsx and events.tsx)
2. **Add missing types** if you encounter `any` or implicit types
3. **Refactor long functions** (>50 lines) into smaller, focused functions
4. **Extract magic numbers/strings** into named constants
5. **Add error handling** if missing
6. **Improve variable names** if unclear
7. **Add JSDoc comments** for exported functions if missing

**Example refactoring workflow:**
```typescript
// Before (existing code you're modifying)
function getData() {
  const x = db.collection('users').get(); // No error handling, unclear name
  return x;
}

// After (improved during your changes)
/**
 * Fetches all users from Firestore
 * @returns Promise<UserData[]> Array of user documents
 * @throws Error if Firestore query fails
 */
async function fetchAllUsers(): Promise<UserData[]> {
  try {
    const snapshot = await db.collection('users').get();
    return snapshot.docs.map(doc => doc.data() as UserData);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw new Error('Unable to load users');
  }
}
```

### Pre-Commit Checklist

Before committing ANY code, verify:
- [ ] `npm run lint` passes with 0 errors
- [ ] All new code follows TypeScript strict mode
- [ ] No console.log statements (use proper logging or remove)
- [ ] All functions have explicit return types
- [ ] All React hooks have proper dependency arrays
- [ ] Error handling implemented for async operations
- [ ] Code is DRY (no duplicate logic)
- [ ] Variable/function names are clear and descriptive
- [ ] Comments added for complex logic only
- [ ] No secrets or credentials in code
- [ ] Unused imports removed
- [ ] Unused variables removed (fix linting warnings)

---

## Development Workflow

### Making Changes
1. **Always run `npm install`** first on fresh clone
2. **Understand existing patterns** - Review similar components/hooks before creating new ones
3. **Follow existing structure**:
   - Screens → `app/` directory (Expo Router)
   - Reusable components → `components/`
   - Business logic → `hooks/` or `services/`
   - Type definitions → `types/`
4. **Apply best practices**: Even if existing code doesn't, your new code must
5. **Refactor as you go**: Improve code you touch
6. **Lint frequently**: Run `npm run lint` after changes
7. **Test locally**: Use `npm start` and test on Expo Go or emulator
8. **Small commits**: Commit logical units of work

### Testing Strategy
- **No automated test infrastructure** currently exists
- **Manual testing required**: Test changes on device/emulator using Expo Go
- **Validation steps**:
  1. Code compiles without TypeScript errors
  2. Linting passes (`npm run lint`)
  3. App runs without crashes on Expo dev client
  4. Feature works as expected on Android device/emulator
- **Do NOT add testing frameworks** unless explicitly requested
- **However**: Write code that would be easily testable (pure functions, separated logic)

### Dependency Management
- **Minimize new dependencies** - Use existing libraries when possible
- **Check compatibility**: Ensure packages work with Expo SDK 54 and React Native 0.81
- **Update carefully**: Package updates may break native modules
- **Security**: Review packages for known vulnerabilities before adding
- **Expo-compatible**: Prefer Expo packages over bare React Native alternatives

### Android Native Code
- **android/ directory is COMMITTED** - Changes are version controlled
- **Avoid modifying** unless absolutely necessary (e.g., native module config, permissions)
- **When modifying**:
  - Test thoroughly with `npm run build:debug`
  - Document changes in commit message
  - Ensure compatibility with EAS Build
- **Common modifications**:
  - `AndroidManifest.xml` for permissions
  - `build.gradle` files for dependencies
  - `res/` for native resources (icons, splash screens)

---

## Common Issues & Workarounds

### Build Issues

**Issue**: `./gradlew clean` fails with "directory not found"
- **Solution**: Use `npm run clean` instead (handles missing directories)

**Issue**: Gradle daemon startup slow on first run
- **Expected**: First run downloads Gradle 8.14.3 (~30-60s), subsequent runs faster

**Issue**: Metro bundler cache issues
- **Solution**: `npx expo start -c` (clear cache) or delete `.expo/` directory

**Issue**: Native module version mismatch
- **Solution**: `npm run clean && npm install && npm start`

### Firebase Issues

**Issue**: Functions timeout
- **Note**: Cloud Functions are deployed in `australia-southeast1` region
- **Config**: `regionalFunctions` exported from `firebase.ts`

**Issue**: App Check debug tokens
- **Dev mode**: Uses debug provider automatically when `__DEV__` is true
- **Production**: Requires Play Integrity (Android) or DeviceCheck (iOS)

### Notification Issues

**Critical**: Background message handler MUST be registered before app initialization
- **Location**: `services/FCMService.ts` (imported in `index.js`)
- **Do not move** `messaging().setBackgroundMessageHandler()` - must be top-level

### Known Code Quality Issues to Fix When Touched

**Current linting warnings** (fix when you modify these files):
- `app/(tabs)/donate/give.tsx:36` - Unused variable `campaignsLoading`
- `app/(tabs)/donate/give.tsx:37` - Unused variable `error`
- `app/(tabs)/events.tsx:27` - Unused variable `formatEventDate`

---

## Deployment & CI/CD

### No GitHub Actions Currently
- No CI/CD pipelines configured
- No automated testing on PRs
- Manual testing required before merge

### Deployment Process
See `docs/PLAY_STORE_DEPLOYMENT.md` and `docs/DEPLOYMENT_CHECKLIST.md` for complete guides.

**Key steps**:
1. Update version in `app.json` (versionCode auto-increments on EAS)
2. Run `eas build --platform android --profile production`
3. Wait for cloud build (~10-20 minutes)
4. Download AAB or auto-submit to Play Store

**Signing**:
- **Keystore**: Can be EAS-managed or self-managed
- **Files gitignored**: `*.keystore`, `keystore.properties`, `pc-api-key.json`
- **Templates**: `android/keystore.properties.template` provided

### Pre-deployment Checklist
- [ ] All linting passes (`npm run lint`)
- [ ] Version updated in `app.json`
- [ ] Manual testing completed on Android device
- [ ] Firebase services working (notifications, Firestore, Functions)
- [ ] Deep linking tested (`alansar://` scheme)
- [ ] Stripe payments tested (if donation changes made)

---

## Important Files to Never Modify Without Good Reason

### Entry Point Configuration
- **`index.js`**: Registers background handlers - order matters, do not reorder imports
- **`metro.config.js`**: SVG transformer config - breaking change affects all imports

### Firebase Configuration
- **`firebase.ts`**: Initialization code for App Check, Firestore, Functions
- **`google-services.json`**: Firebase Android config (gitignored in production, committed for demo)

### Native Configuration
- **`android/app/build.gradle`**: Signing config, dependencies, React Native configuration
- **`android/gradle.properties`**: JVM args, architecture flags, Hermes/new arch settings
- **`android/app/src/main/AndroidManifest.xml`**: Permissions, deep linking, app metadata

### Build Configuration
- **`eas.json`**: Build profiles for different deployment targets
- **`app.json`**: Expo configuration - version, plugins, deep linking schemes

---

## Quick Reference

### File Size Limits
- Keep components under 500 lines (split into smaller components if needed)
- Hooks should be focused on single responsibility

### Performance Best Practices
- Use `React.memo()` for expensive components
- Implement `useMemo()` / `useCallback()` for heavy computations
- Offline-first: Use AsyncStorage for caching (see `useDonation.ts` example)
- Firestore: Prefer one-time fetches over real-time listeners for static data

### State Management
- **Local state**: `useState` for component-specific state
- **Shared state**: Custom hooks (e.g., `useFirebaseData`) with AsyncStorage caching
- **Global state**: No Redux/MobX - use hooks and prop drilling (small app)

### Navigation
- **Expo Router**: File-based routing in `app/` directory
- **Deep linking**: `alansar://` scheme configured in `app.json`
- **Route with params**: Use `router.push()` from `expo-router`

### Asset Management
- **Images**: Place in `assets/images/`
- **Icons**: Use Ionicons from `@expo/vector-icons` (preferred) or custom SVGs
- **SVGs**: Import directly: `import Logo from './logo.svg'` (metro.config.js handles this)
- **Fonts**: Poppins loaded via `@expo-google-fonts/poppins`

---

## When in Doubt

1. **Check existing code**: Look for similar patterns in the codebase
2. **Follow TypeScript strict mode**: Let the compiler guide you
3. **Apply best practices**: When existing code doesn't, make yours better
4. **Lint early and often**: `npm run lint` catches most issues
5. **Test on device**: Use Expo Go for quick iteration
6. **Keep it simple**: Don't over-engineer solutions
7. **Document workarounds**: If you find a workaround, document it in code comments
8. **Refactor as you go**: Leave code better than you found it
9. **Ask for clarification**: If requirements are unclear, ask before implementing

---

**Last Updated**: 2025-11-15
**App Version**: 1.0.5
**Expo SDK**: 54.0.13
**React Native**: 0.81.4
