/**
 * useQiblaDirection Hook
 * 
 * Custom hook for calculating Qibla direction using the adhan package.
 * Returns the direction to Makkah from the user's current location.
 */

import { Coordinates, Qibla } from 'adhan';
import { useMemo } from 'react';
import { LocationCoordinates } from './useLocation';

export interface QiblaInfo {
  direction: number;           // Direction to Qibla in degrees (0-360°)
  isValid: boolean;            // Whether calculation was successful
}

/**
 * Calculate Qibla direction from coordinates
 * 
 * @param coordinates - User's current location
 * @returns Qibla information including direction in degrees
 */
export const useQiblaDirection = (coordinates: LocationCoordinates | null): QiblaInfo => {
  const qiblaInfo = useMemo(() => {
    if (!coordinates) {
      return {
        direction: 0,
        isValid: false,
      };
    }

    try {
      // Create Coordinates object for adhan
      const adhanCoordinates = new Coordinates(
        coordinates.latitude,
        coordinates.longitude
      );

      // Calculate Qibla direction
      // Returns direction in degrees from North (0-360)
      const qiblaDirection = Qibla(adhanCoordinates);

      return {
        direction: qiblaDirection,
        isValid: true,
      };
    } catch (error) {
      console.error('Error calculating Qibla direction:', error);
      return {
        direction: 0,
        isValid: false,
      };
    }
  }, [coordinates]);

  return qiblaInfo;
};
