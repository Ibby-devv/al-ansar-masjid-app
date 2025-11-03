import { Coordinates, Qibla } from 'adhan';

/**
 * Kaaba coordinates in Mecca, Saudi Arabia
 */
export const KAABA_COORDINATES = {
  latitude: 21.4225,
  longitude: 39.8262,
} as const;

/**
 * Calculate the Qibla direction (bearing to Kaaba) from given coordinates
 * @param latitude - User's latitude
 * @param longitude - User's longitude
 * @returns Direction in degrees from North (0-360°)
 */
export function calculateQiblaDirection(
  latitude: number,
  longitude: number
): number {
  const coordinates = new Coordinates(latitude, longitude);
  return Qibla(coordinates);
}

/**
 * Calculate magnetic declination (difference between magnetic and true north)
 * Uses World Magnetic Model approximation
 * @param latitude - User's latitude
 * @param longitude - User's longitude
 * @returns Magnetic declination in degrees (positive = east, negative = west)
 */
export function calculateMagneticDeclination(
  latitude: number,
  longitude: number
): number {
  // Simplified magnetic declination estimation
  // For production, you'd use a proper WMM library or API
  // This is a rough approximation for common areas

  // Australia (example: Sydney area)
  if (latitude > -45 && latitude < -10 && longitude > 110 && longitude < 155) {
    return 12; // Approximate declination for eastern Australia
  }

  // Middle East
  if (latitude > 10 && latitude < 40 && longitude > 25 && longitude < 65) {
    return 3; // Approximate declination for Middle East
  }

  // North America (Eastern)
  if (latitude > 25 && latitude < 50 && longitude > -100 && longitude < -65) {
    return -15; // Approximate declination for eastern North America
  }

  // Europe
  if (latitude > 35 && latitude < 70 && longitude > -10 && longitude < 40) {
    return 2; // Approximate declination for Europe
  }

  // Default to 0 if region not recognized
  return 0;
}

/**
 * Calculate heading/bearing from magnetometer data
 * @param magnetometerData - Raw magnetometer data with x, y, z values
 * @param magneticDeclination - Magnetic declination in degrees (optional)
 * @returns Heading in degrees from True North (0-360°)
 */
export function calculateHeading(
  magnetometerData: {
    x: number;
    y: number;
    z: number;
  },
  magneticDeclination: number = 0
): number {
  const { x, y } = magnetometerData;

  // Calculate magnetic heading using atan2
  // Based on empirical testing, the coordinate system is:
  // - When pointing North: X≈0, Y>0
  // - When pointing East: X<0, Y>0
  // - When pointing South: X<0, Y<0
  // - When pointing West: X>0, Y≈0
  // This means we need to use atan2(-x, y) to get the correct heading
  let angle = Math.atan2(-x, y);

  // Convert to degrees
  let degrees = angle * (180 / Math.PI);

  // Normalize to 0-360 range (atan2 returns -180 to 180)
  if (degrees < 0) {
    degrees += 360;
  }

  // Apply magnetic declination correction to get true north
  degrees += magneticDeclination;

  // Normalize again after adding declination
  degrees = normalizeDegrees(degrees);

  return degrees;
}

/**
 * Normalize degrees to 0-360 range
 * @param degrees - Any degree value
 * @returns Normalized degrees (0-360)
 */
export function normalizeDegrees(degrees: number): number {
  let normalized = degrees % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  return normalized;
}

/**
 * Calculate the difference between two angles (shortest arc)
 * @param angle1 - First angle in degrees
 * @param angle2 - Second angle in degrees
 * @returns Difference in degrees (-180 to 180)
 */
export function angleDifference(angle1: number, angle2: number): number {
  let diff = angle2 - angle1;

  // Normalize to -180 to 180 range (shortest arc)
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;

  return diff;
}

/**
 * Calculate distance to Kaaba in kilometers using Haversine formula
 * @param latitude - User's latitude
 * @param longitude - User's longitude
 * @returns Distance in kilometers
 */
export function calculateDistanceToKaaba(
  latitude: number,
  longitude: number
): number {
  const R = 6371; // Earth's radius in kilometers

  const lat1 = toRadians(latitude);
  const lat2 = toRadians(KAABA_COORDINATES.latitude);
  const deltaLat = toRadians(KAABA_COORDINATES.latitude - latitude);
  const deltaLon = toRadians(KAABA_COORDINATES.longitude - longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get cardinal direction from degrees
 * @param degrees - Angle in degrees (0-360)
 * @returns Cardinal direction (N, NE, E, SE, S, SW, W, NW)
 */
export function getCardinalDirection(degrees: number): string {
  const normalized = normalizeDegrees(degrees);
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(normalized / 45) % 8;
  return directions[index];
}

/**
 * Check if user is pointing towards Qibla (within tolerance)
 * @param deviceHeading - Current device heading in degrees
 * @param qiblaDirection - Qibla direction in degrees
 * @param tolerance - Tolerance in degrees (default: 5°)
 * @returns true if pointing towards Qibla
 */
export function isPointingTowardsQibla(
  deviceHeading: number,
  qiblaDirection: number,
  tolerance: number = 5
): boolean {
  const diff = Math.abs(angleDifference(deviceHeading, qiblaDirection));
  return diff <= tolerance;
}
