# **RESPONSIVE DESIGN IMPLEMENTATION GUIDE**
## Al Ansar Masjid Mobile App

**Document Version:** 1.0  
**Created:** December 4, 2025  
**Target App:** Al Ansar Masjid Mobile App (Expo SDK 54, React Native 0.81.4)  
**Objective:** Implement production-ready responsive design across all screen sizes (320px–1366px)

---

## **EXECUTIVE SUMMARY**

This document provides a step-by-step implementation plan for making the Al Ansar Masjid app responsive across all mobile devices. The app currently has hardcoded pixel values and does not adapt to different screen sizes, causing inconsistent layouts on various phones and tablets.

**⚠️ IMPORTANT: BARE WORKFLOW MODE**

This project uses **Expo bare workflow** (native Android/iOS code committed). This affects:
- Native module compatibility testing
- Build process (Gradle for Android, Xcode for iOS)
- Testing approach (EAS Build or local native compilation)

**Implementation uses industry-standard libraries:**
- `react-native-size-matters` (v0.4.2) — Responsive scaling
- `react-native-safe-area-context` (v5.6.0) — Notch/safe area handling (already installed)

**Estimated Total Effort:** 8–12 hours over 4–5 phases  
**Testing Approach:** Expo Dev Client for iteration + native builds for validation + real device testing

---

## **PART 1: INFRASTRUCTURE SETUP** 
### Phase 0 (1–2 hours)

### 1.1 Install Dependencies

Run from the project root (`c:\DEV\Masjid App\al-ansar-masjid-app`):

```powershell
npm install react-native-size-matters
```

**Verify installation:**
```powershell
npm ls react-native-size-matters
```

Expected output: `react-native-size-matters@0.4.2`

**BARE WORKFLOW NOTE:** `react-native-size-matters` is pure JavaScript with no native dependencies. No changes needed to `android/app/build.gradle`, `ios/Podfile`, or native config files.

---

### 1.2 Create Responsive Constants File

**File:** `constants/responsive.ts` (NEW)

```typescript
// ============================================================================
// RESPONSIVE CONSTANTS & UTILITIES
// ============================================================================
/**
 * Breakpoints for adaptive layouts across different device sizes.
 * Based on industry standards: small phones (320px), medium (375px), 
 * large (430px), tablets (600px+)
 */

// Screen size breakpoints (in pixels)
export const SCREEN_BREAKPOINTS = {
  SMALL: 320,        // Small phones (iPhone SE, old Android)
  MEDIUM: 375,       // Standard phones (iPhone 12-14, Pixel 6)
  LARGE: 430,        // Large phones (Plus models, Pixel 8 Pro)
  TABLET: 600,       // Small tablets (iPad Mini)
  XLARGE: 768,       // Large tablets (iPad, iPad Air)
  XXLARGE: 1024      // iPad Pro
};

/**
 * Safe margins for content on different screen sizes.
 * Prevents text/buttons from touching edges on large phones.
 */
export const SAFE_MARGINS = {
  SMALL: 12,         // Compact phones need less margin
  MEDIUM: 16,        // Standard margin
  LARGE: 20,         // Large phones and tablets get more breathing room
  TABLET: 24,        // Tablets have plenty of space
  XLARGE: 32
};

/**
 * Touch target minimums (Android Material Design guideline: 48dp minimum)
 * Ensures buttons and interactive elements are easy to tap.
 */
export const TOUCH_TARGET = {
  MINIMUM: 48,       // Absolute minimum for accessibility
  COMFORTABLE: 56,   // Better for average users
  SPACIOUS: 64       // For tablet layouts
};

/**
 * Typography scaling factors for fonts.
 * moderateScale with lower factor = text doesn't scale as aggressively.
 * This prevents text from becoming too large on big screens.
 */
export const FONT_SCALING = {
  HEADING: 0.2,      // Headings: minimal scaling (~20% of screen width growth)
  BODY: 0.1,         // Body text: conservative scaling (~10% of growth)
  CAPTION: 0.05      // Captions: minimal scaling (~5% of growth)
};

export type ResponsiveValues = {
  isSmallPhone: boolean;
  isPhone: boolean;
  isTablet: boolean;
  isLargeTablet: boolean;
  isLandscape: boolean;
  isHighDPI: boolean;
  fontScale: number;
  width: number;
  height: number;
  getMargin: (category?: 'small' | 'medium' | 'large' | 'tablet') => number;
};
```

---

### 1.3 Create `useResponsive` Hook

**File:** `hooks/useResponsive.ts` (NEW)

```typescript
// ============================================================================
// RESPONSIVE DIMENSIONS HOOK
// ============================================================================
/**
 * Custom hook for responsive design utilities.
 * Provides breakpoint detection, dimensions, and margin calculations.
 * Memoized to prevent unnecessary re-renders.
 * 
 * @returns ResponsiveValues object with device info
 * 
 * @example
 * const { isTablet, width, getMargin } = useResponsive();
 * const marginTop = getMargin(); // Returns appropriate margin based on screen size
 */

import { useWindowDimensions, PixelRatio } from 'react-native';
import { useMemo } from 'react';
import { 
  SCREEN_BREAKPOINTS, 
  SAFE_MARGINS, 
  ResponsiveValues 
} from '@/constants/responsive';

export const useResponsive = (): ResponsiveValues => {
  const { width, height, fontScale, scale } = useWindowDimensions();

  // Memoize calculations to prevent unnecessary re-renders
  return useMemo(() => {
    const isSmallPhone = width < SCREEN_BREAKPOINTS.MEDIUM;
    const isPhone = width < SCREEN_BREAKPOINTS.TABLET;
    const isTablet = width >= SCREEN_BREAKPOINTS.TABLET;
    const isLargeTablet = width >= SCREEN_BREAKPOINTS.XLARGE;
    const isLandscape = width > height;
    const isHighDPI = PixelRatio.get() >= 3;

    const getMargin = (category?: 'small' | 'medium' | 'large' | 'tablet'): number => {
      if (category) return SAFE_MARGINS[category.toUpperCase() as keyof typeof SAFE_MARGINS];
      
      // Auto-select based on screen size
      if (isSmallPhone) return SAFE_MARGINS.SMALL;
      if (width < SCREEN_BREAKPOINTS.LARGE) return SAFE_MARGINS.MEDIUM;
      if (width < SCREEN_BREAKPOINTS.TABLET) return SAFE_MARGINS.LARGE;
      if (width < SCREEN_BREAKPOINTS.XLARGE) return SAFE_MARGINS.TABLET;
      return SAFE_MARGINS.XLARGE;
    };

    return {
      isSmallPhone,
      isPhone,
      isTablet,
      isLargeTablet,
      isLandscape,
      isHighDPI,
      fontScale,
      width,
      height,
      getMargin
    };
  }, [width, height, fontScale, scale]);
};
```

---

### 1.4 Update App Entry Point (SafeAreaProvider)

**File:** `app/_layout.tsx` (MODIFY)

Look for the root `Stack.Navigator` or layout rendering. Verify that `SafeAreaProvider` wraps the entire app:

```typescript
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  // ... existing code ...

  return (
    <SafeAreaProvider>  {/* ← ADD THIS if not present */}
      <StripeProvider
        publishableKey={STRIPE_PUBLISHABLE_KEY}
      >
        {/* ... rest of app ... */}
      </StripeProvider>
    </SafeAreaProvider>
  );
}
```

**Verify:** Check that `SafeAreaProvider` is imported from `react-native-safe-area-context` (NOT `react-native`).

---

## **PART 2: AUDIT CURRENT CODE**
### Phase 1 (1.5–2 hours) — ASSESSMENT ONLY

### 2.1 Search for Hardcoded Pixel Values

Use grep to find all hardcoded sizing values that need refactoring:

```powershell
cd "c:\DEV\Masjid App\al-ansar-masjid-app"
grep -r "width: [0-9]" --include="*.tsx" --include="*.ts" app/ components/
grep -r "height: [0-9]" --include="*.tsx" --include="*.ts" app/ components/
grep -r "padding: [0-9]" --include="*.tsx" --include="*.ts" app/ components/
grep -r "margin: [0-9]" --include="*.tsx" --include="*.ts" app/ components/
grep -r "fontSize: [0-9]" --include="*.tsx" --include="*.ts" app/ components/
```

### 2.2 Document Findings

Create a spreadsheet tracking:
- File path
- Component name
- Line number
- Property (width, padding, fontSize, etc.)
- Current value
- Recommended change

**Example:**
| File | Component | Property | Current | Issue |
|------|-----------|----------|---------|-------|
| `app/(tabs)/index.tsx` | PrayerTimeCard | padding | `20` | Not scaled for small phones |
| `components/CampaignCard.tsx` | CampaignCard | width | `300` | Fixed width breaks on tablets |
| `components/DonationAnalyticsCard.tsx` | AnalyticsCard | fontSize | `16` | Doesn't respect user font scale |

### 2.3 Identify Component Categories

Group components by priority:

**Category A (High Priority — Most Visible):**
- `app/(tabs)/index.tsx` (Prayer times — home screen)
- `app/(tabs)/donate/give.tsx` (Donations)
- `app/(tabs)/events.tsx` (Events)

**Category B (Medium Priority):**
- `app/(tabs)/qibla.tsx` (Qibla compass)
- `app/(tabs)/more.tsx` (Settings)
- `components/CampaignCard.tsx`
- `components/DonationAnalyticsCard.tsx`

**Category C (Low Priority):**
- Modals, overlays, small UI components
- `components/ui/` components

---

## **PART 3: IMPLEMENT SCALED STYLES**
### Phase 2 (2–3 hours) — PRAYER TIMES SCREEN

### 3.1 Refactor `app/(tabs)/index.tsx`

**Step 1: Import scaling utilities**

```typescript
import { ScaledSheet } from 'react-native-size-matters';
import { useResponsive } from '@/hooks/useResponsive';
import { SCREEN_BREAKPOINTS } from '@/constants/responsive';
```

**Step 2: Replace hardcoded styles**

Convert from:
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  card: {
    width: 300,
    padding: 15,
    marginBottom: 10
  },
  title: {
    fontSize: 20,
    fontWeight: '700'
  }
});
```

To:
```typescript
const styles = ScaledSheet.create({
  container: {
    flex: 1,
    padding: '16@ms0.3',        // Moderate scaling with 0.3 factor
    backgroundColor: '#fff'
  },
  card: {
    padding: '12@ms0.3',         // Was: 15
    marginBottom: '8@vs',        // Vertical scale for spacing
    borderRadius: '8@s'          // Rounded corners scale too
  },
  title: {
    fontSize: '20@ms0.2',        // Aggressive moderation for headers
    fontWeight: '700'
  }
});
```

**Step 3: Add responsive layout logic**

```typescript
export default function PrayerTimesScreen(): React.JSX.Element {
  const { isTablet, width, getMargin } = useResponsive();
  const numColumns = isTablet ? 2 : 1;  // 2-column grid on tablets
  
  return (
    <SafeAreaView style={[styles.container, { paddingHorizontal: getMargin() }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: getMargin(),
          paddingBottom: getMargin()
        }}
      >
        {/* Grid layout that adapts to device */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {prayerTimes.map((prayer) => (
            <View key={prayer.name} style={{ width: `${100 / numColumns}%` }}>
              <PrayerCard prayer={prayer} />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

### 3.2 Refactor `app/(tabs)/donate/give.tsx`

**Focus:** Fix the Picker component issue (dark mode text visibility)

**Step 1: Import utilities**

```typescript
import { ScaledSheet } from 'react-native-size-matters';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/constants/theme';  // Or ThemeContext if implemented
```

**Step 2: Replace Picker styling**

Find the Picker component section:

```typescript
// BEFORE
<Picker
  selectedValue={selectedType}
  onValueChange={handleTypeChange}
  style={{ height: 50, color: '#333' }}
>
  {/* options */}
</Picker>

// AFTER
const theme = useTheme();  // Get theme colors

<Picker
  selectedValue={selectedType}
  onValueChange={handleTypeChange}
  style={[
    styles.picker,
    { color: theme.colors.text.strong }  // Fix dark mode issue
  ]}
  dropdownIconColor={theme.colors.text.strong}
>
  {settings.donation_types.map((type) => (
    <Picker.Item
      key={type.id}
      label={type.label}
      value={type.id}
      color={theme.colors.text.strong}  // Fix dropdown text color
    />
  ))}
</Picker>

// In ScaledSheet:
const styles = ScaledSheet.create({
  picker: {
    height: '50@vs',           // Vertical scale
    color: '#333',             // Theme will override this
    borderRadius: '8@s'
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: '8@s',
    overflow: 'hidden'
  }
});
```

**Step 3: Adapt layout for tablets**

```typescript
export default function GiveTab(): React.JSX.Element | null {
  const { isTablet, width, getMargin } = useResponsive();
  const cardWidth = isTablet ? '45%' : '100%';  // Side-by-side on tablets
  
  return (
    <ScrollView 
      contentContainerStyle={{
        paddingHorizontal: getMargin(),
        paddingVertical: getMargin()
      }}
    >
      <View style={{ 
        flexDirection: isTablet ? 'row' : 'column',
        gap: getMargin(),
        flexWrap: 'wrap'
      }}>
        {/* Campaign cards in adaptive grid */}
      </View>
    </ScrollView>
  );
}
```

**Testing for Phase 2:**

```
Test Device Configurations:
├── iPhone SE (375×667) — Text visible? Buttons tappable?
├── iPhone 14 Plus (430×932) — Proper spacing? No gaps?
├── iPad (768×1024) — 2-column layout works? Text readable?
└── Landscape (iPhone 14: 932×430) — Layout doesn't break?
```

---

## **PART 4: REFACTOR REMAINING SCREENS**
### Phase 3 (1.5–2 hours) — EVENTS & QIBLA SCREENS

### 4.1 Refactor `app/(tabs)/events.tsx`

**Approach:** Event cards should scale vertically and adapt grid on tablets.

```typescript
import { ScaledSheet } from 'react-native-size-matters';
import { useResponsive } from '@/hooks/useResponsive';

export default function EventsScreen(): React.JSX.Element {
  const { isTablet, width } = useResponsive();
  
  const styles = ScaledSheet.create({
    container: { 
      flex: 1, 
      padding: '16@ms0.3' 
    },
    eventCard: {
      marginBottom: '12@vs',
      borderRadius: '12@s',
      overflow: 'hidden'
    },
    eventTitle: {
      fontSize: '18@ms0.2',      // Scale moderately
      fontWeight: '600'
    },
    eventDate: {
      fontSize: '14@ms0.1',
      marginTop: '8@vs'
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={{ 
          flexDirection: isTablet ? 'row' : 'column',
          flexWrap: 'wrap',
          gap: '12@ms0.3'
        }}>
          {events.map(event => (
            <EventCard 
              key={event.id} 
              event={event} 
              style={{ width: isTablet ? '48%' : '100%' }}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

### 4.2 Refactor `app/(tabs)/qibla.tsx`

**Approach:** Compass needs special handling for different screen sizes.

```typescript
export default function QiblaScreen(): React.JSX.Element {
  const { width, isTablet } = useResponsive();
  
  // Compass should be square, scale with screen
  const compassSize = isTablet 
    ? Math.min(width * 0.6, 400)  // Max 60% of width, capped at 400
    : Math.min(width * 0.8, 300); // Max 80% of width, capped at 300
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        paddingHorizontal: 16
      }}>
        <QiblaCompass size={compassSize} />
      </View>
    </SafeAreaView>
  );
}
```

**Testing for Phase 3:**

```
Verify on:
├── Small phone (375px width) — Compass fits screen? Text legible?
├── Tablet (768px width) — Comfortable padding? Events in 2-column?
└── Landscape mode — Proper reflow? No overlaps?
```

---

## **PART 5: REFACTOR COMPONENT LIBRARY**
### Phase 4 (1–2 hours) — SHARED COMPONENTS

### 5.1 Create Responsive Card Component

**File:** `components/ResponsiveCard.tsx` (NEW)

```typescript
import React from 'react';
import { View, ViewStyle } from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { useResponsive } from '@/hooks/useResponsive';

interface ResponsiveCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const styles = ScaledSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: '12@s',
    padding: '12@ms0.3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: '4@s',
    elevation: 3
  }
});

export default function ResponsiveCard({ 
  children, 
  style 
}: ResponsiveCardProps): React.JSX.Element {
  const { getMargin } = useResponsive();
  
  return (
    <View style={[
      styles.card,
      { marginBottom: getMargin('medium') },
      style
    ]}>
      {children}
    </View>
  );
}
```

### 5.2 Update Existing Cards

Refactor these components to use `ScaledSheet`:

**Components to Update:**
- `components/CampaignCard.tsx`
- `components/DonationAnalyticsCard.tsx`
- `components/DonationErrorModal.tsx`
- `components/DonationSuccessModal.tsx`
- `components/GeneralDonationCard.tsx`

**Pattern (for each component):**

```typescript
// Before
const styles = StyleSheet.create({
  card: { width: 300, padding: 15 },
  title: { fontSize: 18 }
});

// After
const styles = ScaledSheet.create({
  card: { 
    padding: '15@ms0.3',     // Scaled padding
    borderRadius: '12@s'
  },
  title: { 
    fontSize: '18@ms0.2'     // Scaled with lower factor
  }
});

// In component:
export default function CardComponent(props): React.JSX.Element {
  const { isTablet, getMargin } = useResponsive();
  
  return (
    <View style={[
      styles.card,
      { marginHorizontal: getMargin() }  // Adaptive margins
    ]}>
      {/* content */}
    </View>
  );
}
```

**Testing for Phase 4:**

```
Regression testing:
├── All cards display correctly on phone?
├── Cards stack properly on small screens?
├── Cards resize appropriately on tablets?
└── No visual glitches or overlaps?
```

---

## **PART 6: TESTING STRATEGY**
### Local Emulator Testing

### 6.1 Android Emulator Setup

**Create virtual devices for each breakpoint:**

```powershell
# List available device definitions
sdkmanager --list

# Create small phone (375px width = ~5.5" with 1.5x DPI)
emulator -avd "Pixel_3a_XL" -scale 0.75

# Create large phone (430px width = ~6.7" device)
emulator -avd "Pixel_6_Pro" -scale 1.0

# Create tablet (768px width)
emulator -avd "Pixel_Tablet" -scale 0.75
```

**If no emulators exist, create them first:**

```powershell
# From Android SDK
sdkmanager --install "system-images;android-34;default;arm64-v8a"
avdmanager create avd -n "Pixel_6_Pro" -k "system-images;android-34;default;arm64-v8a"
```

### 6.2 Test Checklist for Each Device

**For SMALL PHONE (375px):**
- [ ] Text is readable without zooming
- [ ] Buttons have minimum 48dp touch targets
- [ ] Content doesn't overflow screen
- [ ] Horizontal scrolling not needed for main content
- [ ] Modals fit within screen bounds

**For LARGE PHONE (430px):**
- [ ] Proper spacing between elements (no cramped layout)
- [ ] Cards scale appropriately
- [ ] No wasted whitespace on right/left

**For TABLET (768px):**
- [ ] Multi-column layouts display (2-column event grid, etc.)
- [ ] Cards don't stretch too wide (max width ~400-500px)
- [ ] Appropriate padding on left/right edges
- [ ] Comfortable spacing for tablet usage

**For LANDSCAPE MODE:**
- [ ] Layout reflows correctly (rows become columns, etc.)
- [ ] Text remains readable
- [ ] Safe areas respect Dynamic Island/notch

### 6.3 Running Tests Locally (Bare Workflow)

**BARE WORKFLOW TESTING:**

Start Expo dev server with Expo Dev Client:

```powershell
cd "c:\DEV\Masjid App\al-ansar-masjid-app"
npm start
```

**Connect to emulator/device:**

```powershell
# In separate terminal
adb devices              # Verify device connected
```

**Press `a` in terminal to run on Android emulator** (must have Expo Dev Client app installed)

For iOS, press `i` (requires macOS and Xcode)

**Simulate different screen sizes:**

In emulator: Settings → Display → Density/Resolution

**Test specific screens:**

```
Prayer Times Screen (home):
- Verify prayer cards display in rows
- Check time format readable on small phone
- Tablet: confirm 2-column layout

Donations Screen (give.tsx):
- Test Picker dropdown opens/closes
- Verify text visible in dark mode
- Check Campaign cards layout

Events Screen:
- List displays properly
- Cards scale with screen size
- Landscape: verify horizontal scrolling works
```

**⚠️ BARE WORKFLOW ADVANTAGE:** Changes to TypeScript/JavaScript reload instantly in dev client—no native rebuild needed. This significantly speeds up iteration.

### 6.4 Real Device Testing (Bare Workflow)

**Minimum real device testing required:**

| Device | Size | DPI | Test | Priority | Build Method |
|--------|------|-----|------|----------|---------------|
| iPhone SE | 375×667 | 2x | Minimum viable | ⭐⭐⭐ | Xcode or EAS |
| iPhone 14 Pro | 430×932 | 3x | Standard | ⭐⭐⭐ | Xcode or EAS |
| iPad (7th gen) | 768×1024 | 2x | Tablet | ⭐⭐ | Xcode or EAS |
| Samsung Galaxy S24 | 1440×3120 | 3.5x | High-DPI Android | ⭐⭐ | Gradle or EAS |

**Testing process on real device (Bare Workflow):**

**For Android:**
```powershell
cd "c:\DEV\Masjid App\al-ansar-masjid-app"

# Connect via USB and enable USB debugging
adb devices  # Verify device listed

# Option 1: Use Expo dev client (fastest)
npm start
# Press 'a' to run on Android

# Option 2: Build and install debug APK
npm run build:debug
npm run install:debug
```

**For iOS (requires macOS):**
```bash
# Open Xcode project
open ios/al_ansar_masjid_app.xcworkspace

# Select device and run in Xcode
# Or use EAS Build
eas build --platform ios --profile preview
```

**For both platforms:**
1. Connect device via USB and enable developer mode
2. Install the app (via Gradle, Xcode, or EAS)
3. Walk through each screen
4. Verify touch responsiveness (tap buttons)
5. Test landscape rotation
6. Test with different text sizes (Accessibility settings)
7. Note any visual issues

**⚠️ BARE WORKFLOW ADVANTAGE:** Use Expo dev client for hot reload testing without rebuilding native code, significantly speeding up the iteration cycle.

---

## **PART 7: VALIDATION & SIGN-OFF**
### Phase 5 (30 mins — Final Check)

### 7.1 Responsive Design Validation Checklist

- [ ] All hardcoded pixel values converted to scaled values
- [ ] `useResponsive()` hook used for layout decisions
- [ ] `ScaledSheet.create()` used for all styles
- [ ] Font sizes use moderate scaling (0.1–0.2 factor)
- [ ] Spacing uses vertical/horizontal scaling appropriately
- [ ] SafeAreaProvider wraps app
- [ ] Picker component text visible in dark mode
- [ ] Small phone (375px): no overflow or text cutoff
- [ ] Large phone (430px+): comfortable spacing
- [ ] Tablet (768px+): multi-column layouts where appropriate
- [ ] Landscape mode: layouts reflow correctly
- [ ] High-DPI devices: sharp text (no blurriness)
- [ ] Accessibility: font scale respected from system settings
- [ ] Touch targets: minimum 48dp (buttons, interactive elements)

### 7.2 Performance Check

```powershell
# Run linter to catch any TypeScript issues
npm run lint
```

Expected: 0 errors (warnings may exist for pre-existing issues)

**BARE WORKFLOW CHECK:**

```powershell
# Clean native build artifacts before committing
npm run clean

# Verify no unexpected native dependencies were added
git diff package.json
```

No native module registration needed—`react-native-size-matters` is pure JavaScript.

### 7.3 Commit Changes

```powershell
git add -A
git commit -m "feat: implement responsive design system

- Add useResponsive() hook for breakpoint detection
- Add responsive.ts constants for breakpoints/margins
- Convert hardcoded pixel values to scaled styles using ScaledSheet
- Implement multi-column layouts for tablets
- Fix Picker component text visibility in dark mode
- Update prayer times, donations, and events screens
- Ensure proper safe area handling for notches

Tested on: small phone (375px), large phone (430px), 
tablet (768px), and landscape mode"
```

---

## **APPENDIX A: QUICK REFERENCE GUIDE**

### Annotation Syntax for ScaledSheet

```typescript
const styles = ScaledSheet.create({
  // Horizontal scaling (width, horizontal padding/margin)
  width: '200@s',              // scale(200)
  paddingHorizontal: '16@s',   // scale(16)
  marginLeft: '8@s',           // scale(8)
  
  // Vertical scaling (height, vertical padding/margin)
  height: '100@vs',            // verticalScale(100)
  paddingVertical: '12@vs',    // verticalScale(12)
  marginTop: '10@vs',          // verticalScale(10)
  
  // Moderate scaling (don't scale too aggressively)
  padding: '10@ms0.3',         // moderateScale(10, 0.3) — conservative
  fontSize: '16@ms0.1',        // moderateScale(16, 0.1) — very conservative for text
  borderRadius: '8@s',         // scale(8) — full scale for corners
  
  // Rounding (prevent blurry borders)
  border: '1@sr',              // Math.round(scale(1))
});
```

### useResponsive Hook Usage

```typescript
import { useResponsive } from '@/hooks/useResponsive';

export default function MyScreen(): React.JSX.Element {
  const { 
    isTablet,                    // boolean: width >= 600
    isSmallPhone,                // boolean: width < 375
    width,                       // actual width in pixels
    height,                      // actual height in pixels
    isLandscape,                 // boolean: width > height
    fontScale,                   // system font scale (1 = normal, 2 = 200%)
    getMargin                    // function: returns appropriate margin
  } = useResponsive();
  
  // Example: Adaptive grid
  const numColumns = isTablet ? 3 : 2;
  
  // Example: Responsive margin
  const margin = getMargin();  // Auto-select based on screen size
  
  // Example: Conditional render
  if (isTablet) {
    return <TabletLayout />;
  }
  return <PhoneLayout />;
}
```

### Breakpoint Reference

| Range | Device | Use Case |
|-------|--------|----------|
| 320–375px | Small phones (SE, older Android) | Minimal padding, single column |
| 375–430px | Standard phones (iPhone 12-14) | Standard padding, readable text |
| 430–600px | Large phones (Plus models) | Generous padding, comfort spacing |
| 600–768px | Small tablets (iPad Mini) | Multi-column, increased touch targets |
| 768px+ | Large tablets (iPad, Pro) | Multi-panel layouts, max content width |

---

## **APPENDIX B: TROUBLESHOOTING**

### Issue: Text appears blurry on high-DPI devices

**Solution:** Use `PixelRatio.roundToNearestPixel()` or add `r` suffix to ScaledSheet:

```typescript
const styles = ScaledSheet.create({
  padding: '10@msr',  // ← Add 'r' for rounded value
});
```

### Issue: Layout shifts on rotation

**Solution:** Ensure `useResponsive()` dependency array includes all dimension changes:

```typescript
// Already handled in useResponsive hook via useMemo
// Just call it at top of component
```

### Issue: Picker text invisible on dark mode

**Solution:** Explicitly set text color:

```typescript
<Picker
  style={{ color: theme.colors.text.strong }}
  dropdownIconColor={theme.colors.text.strong}
>
  <Picker.Item color={theme.colors.text.strong} label="..." value="..." />
</Picker>
```

### Issue: Performance degradation after changes

**Solution:** Ensure dimensions are memoized:

```typescript
// Good ✅
const { isTablet } = useResponsive();  // Memoized

// Bad ❌
const isTablet = width >= 600;  // Recalculates every render
```

---

## **APPENDIX C: EXAMPLE BEFORE/AFTER**

### Example 1: Prayer Times Card

**BEFORE (Hardcoded):**
```typescript
const styles = StyleSheet.create({
  card: {
    width: 300,
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 18,
    fontWeight: '700'
  }
});

export default function PrayerCard() {
  return <View style={styles.card}>...</View>;
}
```

**AFTER (Responsive):**
```typescript
const styles = ScaledSheet.create({
  card: {
    padding: '12@ms0.3',
    marginBottom: '8@vs',
    borderRadius: '8@s',
    backgroundColor: '#fff'
  },
  title: {
    fontSize: '18@ms0.2',
    fontWeight: '700'
  }
});

export default function PrayerCard(): React.JSX.Element {
  const { isTablet, getMargin } = useResponsive();
  
  return (
    <View style={[styles.card, { marginHorizontal: getMargin() }]}>
      {/* Content scales with device */}
    </View>
  );
}
```

---

## **FINAL NOTES**

1. **Install Dependencies First** — Run `npm install react-native-size-matters` before starting Phase 2
2. **Test Incrementally** — Don't refactor entire app at once; validate after each phase
3. **Use Expo Dev Client** — Bare workflow advantage: instant reloads without native rebuilds
4. **Use Real Devices** — Emulator can simulate but real hardware testing is essential
5. **Respect User Accessibility** — Always scale fonts based on `fontScale` from `useWindowDimensions()`
6. **Safe Area Required** — Ensure `SafeAreaProvider` wraps app for notch/Dynamic Island handling
7. **Dark Mode Compatibility** — Use theme colors (from `constants/theme.ts` or ThemeContext) for text/backgrounds

### **BARE WORKFLOW SPECIFIC NOTES**

- **No native code changes needed** — `react-native-size-matters` is pure JavaScript
- **Expo Dev Client is your best friend** — JavaScript changes reload instantly without native rebuilds
- **Clean build artifacts** before committing: `npm run clean`
- **android/** and **ios/** directories are committed — no special handling unless modifying native code
- **EAS Build available** if local native compilation has issues
- **Xcode/Gradle** are your native build tools for production builds

---

**Document End**
