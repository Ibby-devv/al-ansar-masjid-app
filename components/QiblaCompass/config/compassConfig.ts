/**
 * Qibla Compass Configuration
 * 
 * Central configuration for all tunable parameters.
 * Adjust these values to fine-tune compass behavior.
 */

export interface CompassConfig {
  // Sensor Settings
  magnetometerInterval: number;      // Update interval in milliseconds
  
  // Smoothing Settings
  smoothingWindow: number;           // Number of samples to average (higher = smoother but more lag)
  minAngleChange: number;            // Minimum angle change to trigger update (reduces jitter)
  
  // Animation Settings
  springDamping: number;             // Spring damping (10-25: higher = less bouncy)
  springStiffness: number;           // Spring stiffness (50-150: higher = faster response)
  springMass: number;                // Spring mass (usually 1)
  
  // Debug Settings
  debugMode: boolean;                // Enable debug overlay
  showRawValues: boolean;            // Show raw magnetometer readings
  showSmoothedValues: boolean;       // Show smoothed values
  logPerformance: boolean;           // Log performance metrics to console
  
  // Calibration Settings
  lowAccuracyThreshold: number;      // Threshold to show calibration prompt (-1 to 1)

  // Heading Correction
  headingOffsetDegrees: number;      // Additive offset to heading (e.g., 180 to flip)
  invertHeading: boolean;            // If true, flip heading by 180°

  // Instruction Direction
  invertInstruction: boolean;        // Swap left/right instructions if your device feels reversed
}

/**
 * Default configuration - balanced for most devices
 * 
 * Tuning Guidelines:
 * - Too jittery? Increase smoothingWindow or springDamping
 * - Too laggy? Decrease smoothingWindow or increase springStiffness
 * - Jumpy at small movements? Increase minAngleChange
 */
export const COMPASS_CONFIG: CompassConfig = {
  // Sensor Settings
  magnetometerInterval: 150,         // 150ms = ~6-7 updates/sec (good balance)
  
  // Smoothing Settings
  smoothingWindow: 5,                // Average last 5 readings
  minAngleChange: 2,                 // Ignore changes < 2 degrees
  
  // Animation Settings
  springDamping: 15,                 // Moderate damping
  springStiffness: 100,              // Moderate stiffness
  springMass: 1,                     // Standard mass
  
  // Debug Settings
  debugMode: __DEV__,                // Auto-enable in development
  showRawValues: false,              // Toggle for debugging
  showSmoothedValues: false,         // Toggle for debugging
  logPerformance: false,             // Console logging
  
  // Calibration Settings
  lowAccuracyThreshold: 0.3,         // Show calibration if accuracy < 0.3

  // Heading Correction (adjust if your device reports reversed axes)
  headingOffsetDegrees: 0,
  invertHeading: true,

  // Instruction Direction
  invertInstruction: true,
};

/**
 * Preset configurations for different scenarios
 */
export const COMPASS_PRESETS = {
  // Ultra-smooth but slightly laggy
  smooth: {
    ...COMPASS_CONFIG,
    smoothingWindow: 10,
    minAngleChange: 3,
    springDamping: 20,
    springStiffness: 80,
  },
  
  // Very responsive but might be jittery
  responsive: {
    ...COMPASS_CONFIG,
    smoothingWindow: 3,
    minAngleChange: 1,
    springDamping: 10,
    springStiffness: 150,
  },
  
  // Balanced default
  balanced: COMPASS_CONFIG,
  
  // For testing/debugging
  debug: {
    ...COMPASS_CONFIG,
    debugMode: true,
    showRawValues: true,
    showSmoothedValues: true,
    logPerformance: true,
  },
};

/**
 * Helper to switch between presets
 */
export type CompassPreset = keyof typeof COMPASS_PRESETS;

export const getPreset = (preset: CompassPreset): CompassConfig => {
  return COMPASS_PRESETS[preset];
};
