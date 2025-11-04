/**
 * Angle Utility Functions
 * 
 * Helper functions for angle calculations and normalizations.
 * Critical for smooth compass rotation and handling 0°/360° crossover.
 */

/**
 * Normalize an angle to 0-360 range
 * 
 * @param angle - Angle in degrees (can be negative or > 360)
 * @returns Normalized angle between 0 and 360
 * 
 * @example
 * normalizeAngle(-45) // Returns 315
 * normalizeAngle(450) // Returns 90
 */
export const normalizeAngle = (angle: number): number => {
  let normalized = angle % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  return normalized;
};

/**
 * Calculate the shortest rotation path between two angles
 * 
 * Handles the 0°/360° crossover to prevent the compass from
 * rotating the long way around (e.g., 359° to 1° should rotate 2°, not 358°)
 * 
 * @param from - Starting angle (0-360)
 * @param to - Target angle (0-360)
 * @returns Shortest angle difference (-180 to 180)
 * 
 * @example
 * getShortestAngle(10, 350) // Returns -20 (rotate left 20°)
 * getShortestAngle(350, 10) // Returns 20 (rotate right 20°)
 * getShortestAngle(90, 270) // Returns 180
 */
export const getShortestAngle = (from: number, to: number): number => {
  const diff = normalizeAngle(to - from);
  
  // If difference is > 180°, go the other way
  if (diff > 180) {
    return diff - 360;
  }
  
  return diff;
};

/**
 * Calculate target angle for smooth rotation
 * 
 * Given current rotation and target angle, calculates the next
 * rotation value that takes the shortest path
 * 
 * @param currentRotation - Current rotation value (can be > 360 or negative)
 * @param targetAngle - Target angle (0-360)
 * @returns New rotation value for smooth animation
 * 
 * @example
 * // Compass at 350°, want to go to 10°
 * calculateTargetRotation(350, 10) // Returns 370 (smooth rotation)
 * // Not: returns 10 (would cause 340° jump backwards)
 */
export const calculateTargetRotation = (
  currentRotation: number,
  targetAngle: number
): number => {
  const currentNormalized = normalizeAngle(currentRotation);
  const shortestPath = getShortestAngle(currentNormalized, targetAngle);
  
  // Add the shortest path to current rotation (not normalized)
  return currentRotation + shortestPath;
};

/**
 * Calculate angle from magnetometer x, y values
 * 
 * Converts magnetometer readings to compass heading.
 * Note: This gives magnetic north, not true north.
 * 
 * @param x - Magnetometer X axis (μT)
 * @param y - Magnetometer Y axis (μT)
 * @returns Angle in degrees (0-360)
 * 
 * @example
 * calculateAngleFromMagnetometer(0, 10) // Returns 0 (North)
 * calculateAngleFromMagnetometer(10, 0) // Returns 90 (East)
 */
export const calculateAngleFromMagnetometer = (x: number, y: number): number => {
  let angle = Math.atan2(y, x) * (180 / Math.PI);
  
  // Adjust so 0° is North (by default, 0° is East)
  angle = 90 - angle;
  
  return normalizeAngle(angle);
};

/**
 * Get cardinal direction from angle
 * 
 * @param angle - Angle in degrees (0-360)
 * @returns Cardinal direction string
 * 
 * @example
 * getCardinalDirection(0) // Returns "N"
 * getCardinalDirection(45) // Returns "NE"
 * getCardinalDirection(180) // Returns "S"
 */
export const getCardinalDirection = (angle: number): string => {
  const normalized = normalizeAngle(angle);
  
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(normalized / 45) % 8;
  
  return directions[index];
};

/**
 * Check if angle is within tolerance range
 * 
 * Useful for detecting when device is pointing at Qibla
 * 
 * @param angle - Current angle
 * @param target - Target angle
 * @param tolerance - Acceptable deviation in degrees
 * @returns True if within tolerance
 * 
 * @example
 * isWithinTolerance(92, 90, 5) // Returns true
 * isWithinTolerance(96, 90, 5) // Returns false
 */
export const isWithinTolerance = (
  angle: number,
  target: number,
  tolerance: number
): boolean => {
  const diff = Math.abs(getShortestAngle(angle, target));
  return diff <= tolerance;
};

/**
 * Format angle for display
 * 
 * @param angle - Angle in degrees
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted string
 * 
 * @example
 * formatAngle(247.89) // Returns "248°"
 * formatAngle(247.89, 1) // Returns "247.9°"
 */
export const formatAngle = (angle: number, decimals: number = 0): string => {
  return `${angle.toFixed(decimals)}°`;
};
