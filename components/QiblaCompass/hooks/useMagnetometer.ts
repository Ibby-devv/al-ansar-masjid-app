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
  magnitude?: number;           // Magnetic field strength (µT)
  confidence?: number;          // Composite confidence score (0-1)
  lowConfidence?: boolean;      // Whether confidence is below threshold
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
  const samplesRef = useRef<{ t: number; rad: number }[]>([]);

  const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

  const circularStdDevDeg = (rads: number[]): number => {
    if (!rads.length) return 0;
    let sumSin = 0;
    let sumCos = 0;
    for (const a of rads) {
      sumSin += Math.sin(a);
      sumCos += Math.cos(a);
    }
    const R = Math.sqrt(sumSin * sumSin + sumCos * sumCos) / rads.length;
    if (R <= 0) return 180; // worst-case
    const stdRad = Math.sqrt(-2 * Math.log(R));
    return (stdRad * 180) / Math.PI;
  };

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

        // Determine accuracy (heuristic placeholder) and confidence
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        const accuracy = magnitude > 10 ? 1 : 0.3; // legacy simple heuristic
        const isCalibrated = accuracy > COMPASS_CONFIG.lowAccuracyThreshold;

        // Confidence from magnetic field magnitude
        const min = COMPASS_CONFIG.fieldStrengthMin ?? 25;
        const max = COMPASS_CONFIG.fieldStrengthMax ?? 65;
        const slack = COMPASS_CONFIG.fieldStrengthSlack ?? 20;
        let magnitudeConfidence = 1;
        if (magnitude < min) {
          magnitudeConfidence = clamp01(1 - (min - magnitude) / slack);
        } else if (magnitude > max) {
          magnitudeConfidence = clamp01(1 - (magnitude - max) / slack);
        }

        // Jitter confidence over a recent window (circular stddev)
        const now = Date.now();
        const rad = (smoothedHeading * Math.PI) / 180;
        samplesRef.current.push({ t: now, rad });
        const windowMs = COMPASS_CONFIG.jitterWindowMs ?? 1500;
        // Drop old samples
        const cutoff = now - windowMs;
        while (samplesRef.current.length && samplesRef.current[0].t < cutoff) {
          samplesRef.current.shift();
        }
        const stdDeg = circularStdDevDeg(samplesRef.current.map(s => s.rad));
        const badStd = COMPASS_CONFIG.jitterStdBadDeg ?? 10;
        const jitterConfidence = clamp01(1 - stdDeg / badStd);

        const weights = COMPASS_CONFIG.confidenceWeights ?? { magnitude: 0.6, jitter: 0.4 };
        const confidence = clamp01(
          weights.magnitude * magnitudeConfidence + weights.jitter * jitterConfidence
        );
        const lowConfidence = confidence < (COMPASS_CONFIG.confidenceLowThreshold ?? 0.5);

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
            magnitude,
            confidence,
            lowConfidence,
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
