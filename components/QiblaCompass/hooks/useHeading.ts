/**
 * useHeading Hook
 * 
 * Custom hook for managing device heading using Location.watchHeadingAsync.
 * This provides true heading (corrected for magnetic declination) which fixes
 * the 180-degree error issue in different geographic locations.
 * 
 * Unlike the magnetometer-only approach, this uses the device's location
 * to automatically correct for magnetic declination, providing accurate
 * heading relative to true north.
 */

import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { COMPASS_CONFIG } from '../config/compassConfig';
import { normalizeAngle } from '../utils/angleUtils';
import { CircularMovingAverageSmoother } from '../utils/smoothing';

export interface HeadingData {
  heading: number;              // Smoothed true heading (0-360°), corrected for magnetic declination
  rawHeading: number;           // Raw true heading (0-360°)
  magHeading: number;           // Magnetic heading (0-360°)
  trueHeading: number;          // True heading from GPS (0-360°, -1 if no location permission)
  accuracy: number;             // Heading accuracy (0-3: 0=none, 1=low, 2=medium, 3=high)
  isCalibrated: boolean;        // Whether compass is calibrated (accuracy >= 2)
  confidence?: number;          // Composite confidence score (0-1)
  lowConfidence?: boolean;      // Whether confidence is below threshold
}

export interface HeadingState {
  data: HeadingData | null;
  isAvailable: boolean;
  isListening: boolean;
  error: string | null;
}

export const useHeading = () => {
  const [state, setState] = useState<HeadingState>({
    data: null,
    isAvailable: false,
    isListening: false,
    error: null,
  });

  const smootherRef = useRef<CircularMovingAverageSmoother | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
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

    // Start listening to heading updates
    const startListening = async () => {
      try {
        // Subscribe to heading updates
        const subscription = await Location.watchHeadingAsync((headingData) => {
          if (!isMounted || !smootherRef.current) return;

          // Extract heading data
          // trueHeading is -1 if location permission not granted
          // Use magHeading as fallback, or trueHeading if available
          let rawHeading = headingData.trueHeading >= 0 
            ? headingData.trueHeading 
            : headingData.magHeading;

          // Apply configurable heading correction (offset/invert)
          if (COMPASS_CONFIG.invertHeading) {
            rawHeading = normalizeAngle(rawHeading + 180);
          }
          if (COMPASS_CONFIG.headingOffsetDegrees) {
            rawHeading = normalizeAngle(rawHeading + COMPASS_CONFIG.headingOffsetDegrees);
          }

          // Apply smoothing
          const smoothedHeading = smootherRef.current.addValue(rawHeading);

          // Map iOS accuracy to our accuracy scale (0-1)
          // iOS accuracy: 0 (none), 1 (low <50°), 2 (medium <35°), 3 (high <20°)
          const iosAccuracy = headingData.accuracy ?? 0;
          const accuracy = iosAccuracy / 3; // normalize to 0-1
          const isCalibrated = iosAccuracy >= 2; // medium or high accuracy

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

          // Accuracy-based confidence
          const accuracyConfidence = accuracy;

          // Combine confidence metrics
          const weights = COMPASS_CONFIG.confidenceWeights ?? { magnitude: 0.6, jitter: 0.4 };
          // Use accuracy instead of magnitude for Location API
          const confidence = clamp01(
            weights.magnitude * accuracyConfidence + weights.jitter * jitterConfidence
          );
          const lowConfidence = confidence < (COMPASS_CONFIG.confidenceLowThreshold ?? 0.5);

          setState(prev => ({
            ...prev,
            data: {
              heading: smoothedHeading,
              rawHeading,
              magHeading: headingData.magHeading,
              trueHeading: headingData.trueHeading,
              accuracy,
              isCalibrated,
              confidence,
              lowConfidence,
            },
            isListening: true,
            isAvailable: true,
            error: null,
          }));
        });

        subscriptionRef.current = subscription;

        if (isMounted) {
          setState(prev => ({
            ...prev,
            isAvailable: true,
            isListening: true,
          }));
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to start heading listener';
          setState(prev => ({
            ...prev,
            isAvailable: false,
            error: errorMessage,
          }));
        }
      }
    };

    startListening();

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
