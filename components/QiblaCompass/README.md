# Qibla Compass Component

The Qibla Compass component helps users find the direction to Makkah (Kaaba) for prayer.

## How It Works

The compass uses the device's location services to:
1. Get the user's current GPS coordinates
2. Calculate the direction to Makkah using the `adhan` package
3. Determine the device's heading using `Location.watchHeadingAsync`
4. Display the difference between the device heading and Qibla direction

## Heading Calculation

### Current Implementation (Location.watchHeadingAsync)

The compass now uses `Location.watchHeadingAsync` from expo-location which provides:
- **True Heading**: Heading relative to true north, automatically corrected for magnetic declination based on GPS location
- **Magnetic Heading**: Raw heading from the device's magnetometer
- **Accuracy Level**: 0-3 scale indicating compass calibration quality

This approach fixes the ~180-degree error that occurred in certain geographic locations (e.g., Medina) where magnetic declination is significant.

### Previous Implementation (Magnetometer only)

Previously used `expo-sensors/Magnetometer` which only provided magnetic heading without correction for magnetic declination. This caused significant errors in locations with high magnetic declination.

## Key Features

- **Automatic Magnetic Declination Correction**: Uses GPS location to correct for local magnetic field variations
- **Smooth Rotation**: Uses circular moving average to reduce jitter
- **Haptic Feedback**: Provides feedback when aligned with Qibla
- **Calibration Hints**: Shows hints when compass accuracy is low
- **Debug Mode**: Hold the info button for detailed sensor data

## Configuration

See `config/compassConfig.ts` for tunable parameters:
- Smoothing window size
- Accuracy thresholds
- Animation settings
- Debug mode toggles

## Hooks

### useHeading
Provides device heading using Location API with magnetic declination correction.

### useLocation
Manages GPS location with permission handling.

### useQiblaDirection
Calculates direction to Makkah from current coordinates.

### useDeviceMotion
Provides device pitch/roll for advanced features (future use).

## Permissions Required

- **Location (foreground)**: Required for two purposes:
  - Getting GPS coordinates to calculate direction to Makkah
  - Enabling magnetic declination correction for accurate heading
