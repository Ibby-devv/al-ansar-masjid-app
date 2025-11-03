import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/constants/theme';
import {
  calculateQiblaDirection,
  calculateHeading,
  calculateMagneticDeclination,
  normalizeDegrees,
  angleDifference,
  calculateDistanceToKaaba,
  getCardinalDirection,
  isPointingTowardsQibla,
} from '@/utils/qiblaCalculation';

interface QiblaCompassProps {
  onPermissionDenied?: () => void;
}

export default function QiblaCompass({
  onPermissionDenied,
}: QiblaCompassProps) {
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [distanceToKaaba, setDistanceToKaaba] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [magneticDeclination, setMagneticDeclination] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [wasPointingToQibla, setWasPointingToQibla] = useState(false);

  const compassRotation = useRef(new Animated.Value(0)).current;
  const previousRotation = useRef<number>(0);
  const magnetometerSubscription = useRef<any>(null);
  const smoothedHeading = useRef<number>(0);

  // Initialize location and calculate Qibla direction
  useEffect(() => {
    initializeQiblaCompass();

    return () => {
      // Cleanup magnetometer subscription
      if (magnetometerSubscription.current) {
        magnetometerSubscription.current.remove();
      }
    };
  }, []);

  // Animate compass rotation based on device heading and Qibla direction
  useEffect(() => {
    if (qiblaDirection !== null) {
      let targetRotation = normalizeDegrees(qiblaDirection - deviceHeading);

      // Calculate the difference from previous rotation
      const diff = angleDifference(previousRotation.current, targetRotation);

      // Add the difference to previous rotation to get smooth transition
      const newRotation = previousRotation.current + diff;

      // Update the ref for next iteration
      previousRotation.current = newRotation;

      Animated.spring(compassRotation, {
        toValue: newRotation,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();

      // Check if pointing towards Qibla and trigger haptic feedback
      const isPointing = isPointingTowardsQibla(deviceHeading, qiblaDirection);
      if (isPointing && !wasPointingToQibla) {
        // Success notification with strong haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setWasPointingToQibla(true);
      } else if (!isPointing && wasPointingToQibla) {
        setWasPointingToQibla(false);
      }
    }
  }, [deviceHeading, qiblaDirection]);

  const initializeQiblaCompass = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied. Please enable location access.');
        onPermissionDenied?.();
        setIsLoading(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Calculate magnetic declination for this location
      const declination = calculateMagneticDeclination(latitude, longitude);
      setMagneticDeclination(declination);

      // Calculate Qibla direction
      const qibla = calculateQiblaDirection(latitude, longitude);
      setQiblaDirection(qibla);

      // Calculate distance to Kaaba
      const distance = calculateDistanceToKaaba(latitude, longitude);
      setDistanceToKaaba(distance);

      // Get location name (suburb/city) using reverse geocoding
      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (geocode && geocode.length > 0) {
          const address = geocode[0];
          // Build location string: "Suburb, City" or "City, Region"
          const locationParts = [
            address.city || address.subregion,
            address.region,
          ].filter(Boolean);
          setLocationName(locationParts.join(', '));
        }
      } catch (geocodeError) {
        console.log('Reverse geocoding failed:', geocodeError);
        // Non-critical error, continue without location name
      }

      // Start magnetometer updates
      startMagnetometer();

      setIsLoading(false);
    } catch (err) {
      console.error('Error initializing Qibla compass:', err);
      setError('Failed to get your location. Please try again.');
      setIsLoading(false);
    }
  };

  const startMagnetometer = () => {
    // Set update interval (in milliseconds)
    Magnetometer.setUpdateInterval(100);

    // Subscribe to magnetometer updates
    magnetometerSubscription.current = Magnetometer.addListener((data) => {
      // Calculate heading with magnetic declination correction
      const heading = calculateHeading(data, magneticDeclination);

      // Apply low-pass filter to smooth out sensor noise
      // alpha = 0.2 means 20% new value, 80% old value (adjust for more/less smoothing)
      const alpha = 0.25;
      if (smoothedHeading.current === 0) {
        smoothedHeading.current = heading;
      } else {
        // Handle angle wrapping (e.g., 359° -> 1° should not average to 180°)
        let diff = heading - smoothedHeading.current;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        smoothedHeading.current = normalizeDegrees(smoothedHeading.current + alpha * diff);
      }

      setDeviceHeading(smoothedHeading.current);

      // Check if calibration is needed (very low magnitude)
      const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
      setIsCalibrating(magnitude < 25);
    });
  };

  const handleRetry = () => {
    initializeQiblaCompass();
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Finding Qibla direction...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name="location-outline"
          size={64}
          color={Theme.colors.text.muted}
        />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isPointing = qiblaDirection !== null && isPointingTowardsQibla(deviceHeading, qiblaDirection);
  const qiblaAngle = qiblaDirection !== null ? Math.round(qiblaDirection) : 0;
  const currentHeading = Math.round(deviceHeading);

  // Generate degree markers (every 30 degrees)
  const degreeMarkers = [];
  for (let i = 0; i < 12; i++) {
    const angle = i * 30;
    degreeMarkers.push(
      <View
        key={angle}
        style={[
          styles.degreeMarker,
          {
            transform: [
              { rotate: `${angle}deg` },
              { translateY: -135 },
            ],
          },
        ]}
      >
        <Text style={styles.degreeText}>{angle}°</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#1B5E20', '#2E7D32', '#388E3C']}
      style={styles.container}
    >
      {/* Calibration Warning */}
      {isCalibrating && (
        <View style={styles.calibrationBanner}>
          <Ionicons name="warning-outline" size={20} color="#FFA000" />
          <Text style={styles.calibrationText}>
            Move your phone in a figure-8 pattern to calibrate
          </Text>
        </View>
      )}

      {/* Compass Container */}
      <View style={styles.compassContainer}>
        {/* Rotating Compass Ring */}
        <Animated.View
          style={[
            styles.compassRing,
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
          {/* Degree markers */}
          <View style={styles.degreesContainer}>{degreeMarkers}</View>

          {/* Cardinal directions */}
          <View style={[styles.cardinalContainer, { top: 10 }]}>
            <Text style={styles.cardinalTextN}>N</Text>
          </View>
          <View style={[styles.cardinalContainer, { right: 10, top: '50%', marginTop: -12 }]}>
            <Text style={styles.cardinalText}>E</Text>
          </View>
          <View style={[styles.cardinalContainer, { bottom: 10 }]}>
            <Text style={styles.cardinalText}>S</Text>
          </View>
          <View style={[styles.cardinalContainer, { left: 10, top: '50%', marginTop: -12 }]}>
            <Text style={styles.cardinalText}>W</Text>
          </View>

          {/* Qibla Direction Indicator (green arrow pointing up) */}
          <View style={styles.qiblaIndicator}>
            <View style={styles.qiblaArrow} />
          </View>
        </Animated.View>

        {/* Static Center - Kaaba Icon */}
        <View style={styles.centerIcon}>
          <Ionicons name="home" size={48} color="#FFD700" />
          <Text style={styles.kaabaText}>KAABA</Text>
        </View>

        {/* North Indicator (fixed at top) */}
        <View style={styles.northIndicator}>
          <View style={styles.northArrow} />
        </View>
      </View>

      {/* Location Info */}
      {locationName && (
        <View style={styles.locationCard}>
          <Ionicons name="location" size={16} color="#FFD700" />
          <Text style={styles.locationText}>{locationName}</Text>
        </View>
      )}

      {/* Info Cards */}
      <View style={styles.infoCardsContainer}>
        <View style={styles.infoCard}>
          <Ionicons name="compass-outline" size={24} color="#FFD700" />
          <Text style={styles.infoLabel}>Direction</Text>
          <Text style={styles.infoValue}>{qiblaAngle}°</Text>
          <Text style={styles.infoSubtext}>{getCardinalDirection(qiblaAngle)}</Text>
        </View>

        {distanceToKaaba !== null && (
          <View style={styles.infoCard}>
            <Ionicons name="navigate-outline" size={24} color="#FFD700" />
            <Text style={styles.infoLabel}>Distance</Text>
            <Text style={styles.infoValue}>
              {distanceToKaaba.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
            <Text style={styles.infoSubtext}>kilometers</Text>
          </View>
        )}
      </View>

      {/* Status indicator */}
      {isPointing && (
        <View style={styles.alignedIndicator}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.alignedText}>Aligned with Qibla</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#fff',
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#2E7D32',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  calibrationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 160, 0, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  calibrationText: {
    flex: 1,
    fontSize: 12,
    color: '#FFA000',
    fontWeight: '500',
  },
  compassContainer: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 20,
  },
  compassRing: {
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 3,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  degreesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  degreeMarker: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -15,
  },
  degreeText: {
    fontSize: 10,
    color: 'rgba(255, 215, 0, 0.6)',
    fontWeight: '600',
    textAlign: 'center',
  },
  cardinalContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  cardinalTextN: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  cardinalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgba(255, 215, 0, 0.8)',
  },
  qiblaIndicator: {
    position: 'absolute',
    top: 20,
    alignItems: 'center',
  },
  qiblaArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 40,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#4CAF50',
  },
  centerIcon: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(46, 125, 50, 0.9)',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  kaabaText: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: 'bold',
    marginTop: 4,
  },
  northIndicator: {
    position: 'absolute',
    top: -10,
    alignItems: 'center',
  },
  northArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FF5252',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
    marginBottom: 20,
  },
  locationText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },
  infoCardsContainer: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    marginTop: 10,
  },
  infoCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  infoLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  infoSubtext: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  alignedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
    marginTop: 16,
  },
  alignedText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
});
