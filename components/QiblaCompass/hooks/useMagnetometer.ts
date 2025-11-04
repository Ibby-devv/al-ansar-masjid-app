/**
 * useMagnetometer Hook
 * 
 * Custom hook for managing magnetometer sensor with smoothing.
 * Returns current compass heading with reduced jitter.
 */

import { Magnetometer } from 'expo-sensors';
import type { MagnetometerMeasurement } from 'expo-sensors/build/Magnetometer';
import { useEffect, useRef, useState } from 'react';
import { COMPASS_CONFIG } from '../config/compassConfig';
import { calculateAngleFromMagnetometer, normalizeAngle } from '../utils/angleUtils';
import { CircularMovingAverageSmoother } from '../utils/smoothing';

export interface MagnetometerData {
  heading: number;              // Smoothed compass heading (0-360°)
  rawHeading: number;           // Raw compass heading (0-360°)
  x: number;                    // Raw magnetometer X
  y: number;                    // Raw magnetometer Y
  z: number;                    // Raw magnetometer Z
  accuracy: number;             // Magnetometer accuracy (-1 to 1, iOS only)
  isCalibrated: boolean;        // Whether compass needs calibration
}

export interface MagnetometerState {
  data: MagnetometerData | null;
  isAvailable: boolean;
  isListening: boolean;
  error: string | null;
}

export const useMagnetometer = () => {
  const [state, setState] = useState<MagnetometerState>({
    data: null,
    isAvailable: false,
    isListening: false,
    error: null,
  });

  const smootherRef = useRef<CircularMovingAverageSmoother | null>(null);
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Initialize smoother
    smootherRef.current = new CircularMovingAverageSmoother(
      COMPASS_CONFIG.smoothingWindow
    );

    // Check if magnetometer is available
    const checkAvailability = async () => {
      try {
        const available = await Magnetometer.isAvailableAsync();
        if (isMounted) {
          setState(prev => ({
            ...prev,
            isAvailable: available,
            error: available ? null : 'Magnetometer not available on this device',
          }));

          if (available) {
            startListening();
          }
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to check magnetometer';
          setState(prev => ({
            ...prev,
            isAvailable: false,
            error: errorMessage,
          }));
        }
      }
    };

    const startListening = () => {
      // Set update interval
      Magnetometer.setUpdateInterval(COMPASS_CONFIG.magnetometerInterval);

      // Subscribe to magnetometer updates
      subscriptionRef.current = Magnetometer.addListener((result: MagnetometerMeasurement) => {
        if (!isMounted || !smootherRef.current) return;

        const { x, y, z } = result;

        // Calculate raw heading
        let rawHeading = calculateAngleFromMagnetometer(x, y);

        // Apply configurable heading correction (offset/invert)
        if (COMPASS_CONFIG.invertHeading) {
          rawHeading = normalizeAngle(rawHeading + 180);
        }
        if (COMPASS_CONFIG.headingOffsetDegrees) {
          rawHeading = normalizeAngle(rawHeading + COMPASS_CONFIG.headingOffsetDegrees);
        }

        // Apply smoothing
        const smoothedHeading = smootherRef.current.addValue(rawHeading);

        // Determine accuracy (iOS provides this, Android doesn't)
        // For now, we'll assume good accuracy if values are reasonable
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        const accuracy = magnitude > 10 ? 1 : 0.3; // Simple heuristic
        const isCalibrated = accuracy > COMPASS_CONFIG.lowAccuracyThreshold;

        setState(prev => ({
          ...prev,
          data: {
            heading: smoothedHeading,
            rawHeading,
            x,
            y,
            z,
            accuracy,
            isCalibrated,
          },
          isListening: true,
          error: null,
        }));
      });
    };

    checkAvailability();

    return () => {
      isMounted = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, []);

  /**
   * Update smoothing window size dynamically
   */
  const setSmoothingWindow = (size: number) => {
    if (smootherRef.current) {
      smootherRef.current.setWindowSize(size);
    }
  };

  /**
   * Reset the smoother (clears buffer)
   */
  const resetSmoothing = () => {
    if (smootherRef.current) {
      smootherRef.current.reset();
    }
  };

  return {
    ...state,
    setSmoothingWindow,
    resetSmoothing,
  };
};
