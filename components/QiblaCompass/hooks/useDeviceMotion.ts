/**
 * useDeviceMotion Hook
 * 
 * Custom hook for tracking device orientation (pitch, roll, yaw).
 * Useful for tilt compensation and debugging compass behavior.
 */

import type { DeviceMotionMeasurement } from 'expo-sensors';
import { DeviceMotion } from 'expo-sensors';
import { useEffect, useState } from 'react';

export interface DeviceMotionData {
  pitch: number;    // Rotation around X axis (tilt forward/back) in degrees
  roll: number;     // Rotation around Y axis (tilt left/right) in degrees
  yaw: number;      // Rotation around Z axis (compass heading) in degrees
}

export interface DeviceMotionState {
  data: DeviceMotionData | null;
  isAvailable: boolean;
  error: string | null;
}

export const useDeviceMotion = (updateInterval: number = 100) => {
  const [state, setState] = useState<DeviceMotionState>({
    data: null,
    isAvailable: false,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    let subscription: { remove: () => void } | null = null;

    const checkAvailability = async () => {
      try {
        const available = await DeviceMotion.isAvailableAsync();
        if (isMounted) {
          setState(prev => ({
            ...prev,
            isAvailable: available,
            error: available ? null : 'DeviceMotion not available on this device',
          }));

          if (available) {
            startListening();
          }
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to check DeviceMotion';
          setState(prev => ({
            ...prev,
            isAvailable: false,
            error: errorMessage,
          }));
        }
      }
    };

    const startListening = () => {
      DeviceMotion.setUpdateInterval(updateInterval);

      subscription = DeviceMotion.addListener((result: DeviceMotionMeasurement) => {
        if (!isMounted) return;

        // Extract rotation data
        const rotation = result.rotation;
        if (rotation) {
          // Convert radians to degrees
          const pitch = (rotation.beta * 180) / Math.PI;  // Forward/back tilt
          const roll = (rotation.gamma * 180) / Math.PI;  // Left/right tilt
          const yaw = (rotation.alpha * 180) / Math.PI;   // Compass heading

          setState(prev => ({
            ...prev,
            data: {
              pitch,
              roll,
              yaw,
            },
            error: null,
          }));
        }
      });
    };

    checkAvailability();

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.remove();
      }
    };
  }, [updateInterval]);

  return state;
};
