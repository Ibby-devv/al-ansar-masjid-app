import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  TouchableOpacity,
  AppState,
  AppStateStatus,
  Linking,
  Platform,
  Easing,
} from 'react-native';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  calculateQiblaDirection,
  calculateHeading,
  calculateMagneticDeclination,
  normalizeDegrees,
  angleDifference,
  isPointingTowardsQibla,
} from '@/utils/qiblaCalculation';

interface QiblaCompassProps {
  onPermissionDenied?: () => void;
}

export default function QiblaCompass({ onPermissionDenied }: QiblaCompassProps) {
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wasPointingToQibla, setWasPointingToQibla] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const compassRotation = useRef(new Animated.Value(0)).current;
  const previousRotation = useRef<number>(0);
  const magnetometerSubscription = useRef<any>(null);
  const smoothedHeading = useRef<number>(0);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const isAnimating = useRef<boolean>(false);

  const startMagnetometer = useCallback(
    (declination: number) => {
      // Remove existing subscription if any
      if (magnetometerSubscription.current) {
        magnetometerSubscription.current.remove();
      }

      // Start magnetometer with calibrated sensor
      Magnetometer.setUpdateInterval(150);
      magnetometerSubscription.current = Magnetometer.addListener((data) => {
        // Calculate heading using simple 2D calculation
        const heading = calculateHeading(data, declination);

        // Smooth the heading with low-pass filter
        const alpha = 0.25;
        if (smoothedHeading.current === 0) {
          smoothedHeading.current = heading;
        } else {
          let diff = heading - smoothedHeading.current;
          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;
          smoothedHeading.current = normalizeDegrees(smoothedHeading.current + alpha * diff);
        }
        setDeviceHeading(smoothedHeading.current);
      });
    },
    []
  );

  const initializeQiblaCompass = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check current permission status first to avoid hanging on re-request
      let { status } = await Location.getForegroundPermissionsAsync();

      if (status !== 'granted') {
        const result = await Location.requestForegroundPermissionsAsync();
        status = result.status;
      }

      if (status !== 'granted') {
        setError('Location permission denied.');
        setPermissionDenied(true);
        onPermissionDenied?.();
        setIsLoading(false);
        return;
      }

      // Try to get last known location first for faster load
      let location;
      try {
        location = await Location.getLastKnownPositionAsync({
          maxAge: 300000, // 5 minutes
          requiredAccuracy: 1000, // 1km accuracy is fine for Qibla
        });
      } catch {
        // Ignore error, will fall through to getCurrentPositionAsync
      }

      // If no cached location or it's too old, get current position
      if (!location) {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      const { latitude, longitude } = location.coords;

      const qibla = calculateQiblaDirection(latitude, longitude);
      setQiblaDirection(qibla);

      // Calculate magnetic declination for this location
      const declination = calculateMagneticDeclination(latitude, longitude);

      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        if (geocode && geocode.length > 0) {
          const address = geocode[0];
          setLocationName(address.city || address.subregion || 'Your location');
        }
      } catch {
        // Geocoding is not critical, continue without it
      }

      startMagnetometer(declination);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize compass:', error);
      setError('Failed to get location. Please try again.');
      setIsLoading(false);
    }
  }, [onPermissionDenied, startMagnetometer]);

  const checkAndRequestPermission = useCallback(async () => {
    try {
      // First check the current permission status without requesting
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();

      if (currentStatus === 'granted') {
        // Permission was granted in settings, reinitialize
        setPermissionDenied(false);
        await initializeQiblaCompass();
      } else {
        // Still not granted, request again
        const { status: requestStatus } = await Location.requestForegroundPermissionsAsync();

        if (requestStatus === 'granted') {
          setPermissionDenied(false);
          await initializeQiblaCompass();
        }
      }
    } catch (err) {
      console.error('Error checking permissions:', err);
    }
  }, [initializeQiblaCompass]);

  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground, check if we had a permission error
      if (permissionDenied || error) {
        await checkAndRequestPermission();
      }
    }
    appState.current = nextAppState;
  }, [permissionDenied, error, checkAndRequestPermission]);

  useEffect(() => {
    initializeQiblaCompass();

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (magnetometerSubscription.current) {
        magnetometerSubscription.current.remove();
      }
      subscription.remove();
    };
  }, [initializeQiblaCompass, handleAppStateChange]);

  useEffect(() => {
    if (qiblaDirection !== null) {
      let targetRotation = normalizeDegrees(qiblaDirection - deviceHeading);
      const diff = angleDifference(previousRotation.current, targetRotation);
      const newRotation = previousRotation.current + diff;

      // Only animate if the rotation change is significant (reduces micro-jitter)
      const rotationDelta = Math.abs(diff);
      if (rotationDelta > 0.3) {
        previousRotation.current = newRotation;

        // Stop any ongoing animation before starting a new one
        compassRotation.stopAnimation(() => {
          isAnimating.current = true;
          Animated.timing(compassRotation, {
            toValue: newRotation,
            duration: 150,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start(() => {
            isAnimating.current = false;
          });
        });
      }

      const isPointing = isPointingTowardsQibla(deviceHeading, qiblaDirection);
      if (isPointing && !wasPointingToQibla) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setWasPointingToQibla(true);
      } else if (!isPointing && wasPointingToQibla) {
        setWasPointingToQibla(false);
      }
    }
  }, [deviceHeading, qiblaDirection]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#F5CBA7" />
        <Text style={styles.loadingText}>Finding Qibla...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="warning-outline" size={60} color="#fff" />
        <Text style={styles.errorText}>{error}</Text>
        {permissionDenied && (
          <Text style={styles.errorHint}>
            Please enable location permissions in your device settings
          </Text>
        )}
        <View style={styles.errorButtons}>
          <TouchableOpacity style={styles.retryButton} onPress={initializeQiblaCompass}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
          {permissionDenied && (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }}
            >
              <Text style={styles.settingsText}>Open Settings</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  const isPointing = qiblaDirection !== null && isPointingTowardsQibla(deviceHeading, qiblaDirection);

  return (
    <LinearGradient colors={['#0A1A3C', '#0A1A3C']} style={styles.container}>
      <Text style={styles.title}>Qibla</Text>
      <Text style={styles.subtitle}>Finder</Text>

      <View style={styles.card}>
        <View style={styles.locationRow}>
          <Text style={styles.locationLabel}>Location</Text>
        </View>

        <View style={styles.locationTag}>
          <Text style={styles.locationText}>{locationName}</Text>
        </View>

        <View style={styles.compassWrapper}>
          <Animated.View
            style={[
              styles.compass,
              {
                transform: [
                  {
                    rotate: compassRotation.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={[styles.cardinal, styles.w]}>W</Text>
            <Text style={[styles.cardinal, styles.n]}>N</Text>
            <Text style={[styles.cardinal, styles.e]}>E</Text>
            <Text style={[styles.cardinal, styles.s]}>S</Text>

            <View style={styles.needle} />
            <View style={styles.kaabaIcon} />
          </Animated.View>
        </View>

        <Text style={styles.statusText}>
          {isPointing ? "You're facing " : 'Face towards '}
          <Text style={styles.statusHighlight}>Mecca</Text>
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1A3C',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A1A3C',
  },
  loadingText: {
    color: '#F5CBA7',
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 16,
  },
  errorHint: {
    color: '#F5CBA7',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    paddingHorizontal: 20,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  retryButton: {
    backgroundColor: '#F5CBA7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#0A1A3C',
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: '#0E214F',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F5CBA7',
  },
  settingsText: {
    color: '#F5CBA7',
    fontWeight: '600',
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 28,
    fontWeight: '500',
    color: '#F5CBA7',
    marginBottom: 40,
  },
  card: {
    backgroundColor: '#0E214F',
    borderRadius: 24,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5CBA7',
  },
  locationRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  locationLabel: {
    color: '#9FA8DA',
    fontSize: 12,
    letterSpacing: 1,
  },
  locationTag: {
    backgroundColor: '#F5CBA7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 20,
  },
  locationText: {
    color: '#0A1A3C',
    fontWeight: '600',
  },
  compassWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  compass: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 6,
    borderColor: '#F5CBA7',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  needle: {
    position: 'absolute',
    width: 10,
    height: 80,
    backgroundColor: '#F5CBA7',
    borderRadius: 5,
    top: 30,
  },
  kaabaIcon: {
    position: 'absolute',
    top: 50,
    width: 24,
    height: 16,
    backgroundColor: '#0A1A3C',
    borderTopWidth: 6,
    borderTopColor: '#F5CBA7',
    borderRadius: 2,
  },
  cardinal: {
    position: 'absolute',
    fontSize: 18,
    fontWeight: '500',
    color: '#C5CAE9',
  },
  n: { top: 15 },
  s: { bottom: 15 },
  e: { right: 20 },
  w: { left: 20 },
  statusText: {
    marginTop: 24,
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
  },
  statusHighlight: {
    color: '#F5CBA7',
    fontWeight: '700',
  },
  calibrationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A5F',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFA726',
  },
  calibrationBannerText: {
    color: '#FFA726',
    fontSize: 14,
    fontWeight: '600',
  },
});
