/**
 * useLocation Hook
 * 
 * Custom hook for managing user location with permission handling.
 * Returns current coordinates for Qibla calculation.
 */

import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationState {
  coordinates: LocationCoordinates | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean | null;
}

export const useLocation = () => {
  const [state, setState] = useState<LocationState>({
    coordinates: null,
    isLoading: true,
    error: null,
    hasPermission: null,
  });

  useEffect(() => {
    let isMounted = true;

    const getLocation = async () => {
      try {
        // Check current permission first
        let { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          const req = await Location.requestForegroundPermissionsAsync();
          status = req.status;
        }
        
        if (!isMounted) return;

        if (status !== 'granted') {
          setState({
            coordinates: null,
            isLoading: false,
            error: 'Location permission denied. Please enable location access in settings.',
            hasPermission: false,
          });
          return;
        }

        setState(prev => ({
          ...prev,
          hasPermission: true,
          isLoading: true,
        }));

        // Try last known location for faster cold start
        let position = await Location.getLastKnownPositionAsync();
        if (!position) {
          // Fallback to current position with balanced accuracy
          position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        }

        if (!isMounted) return;

        setState({
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          isLoading: false,
          error: null,
          hasPermission: true,
        });
      } catch (err) {
        if (!isMounted) return;

        const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
        setState(prev => ({
          coordinates: null,
          isLoading: false,
          error: errorMessage,
          // Preserve prior permission state when possible
          hasPermission: prev.hasPermission ?? null,
        }));
      }
    };

    getLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Retry getting location
   */
  const retry = async () => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setState({
        coordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        isLoading: false,
        error: null,
        hasPermission: true,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  };

  return {
    ...state,
    retry,
  };
};
