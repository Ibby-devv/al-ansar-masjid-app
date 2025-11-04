/**
 * QiblaCompass Component
 * 
 * Main Qibla compass feature that combines location, magnetometer,
 * and Qibla calculations into a functional compass.
 */

import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CompassView } from './components/CompassView';
import { DebugOverlay } from './components/DebugOverlay';
import { COMPASS_CONFIG } from './config/compassConfig';
import { useLocation } from './hooks/useLocation';
import { useMagnetometer } from './hooks/useMagnetometer';
import { useQiblaDirection } from './hooks/useQiblaDirection';
import { isWithinTolerance } from './utils/angleUtils';

const QIBLA_TOLERANCE = 10; // Degrees tolerance for "aligned" state

export const QiblaCompass: React.FC = () => {
  const [showDebug, setShowDebug] = useState<boolean>(COMPASS_CONFIG.debugMode);
  // Get user location
  const {
    coordinates,
    isLoading: locationLoading,
    error: locationError,
    hasPermission,
    retry: retryLocation,
  } = useLocation();

  // Get magnetometer data
  const {
    data: magnetometerData,
    isAvailable: magnetometerAvailable,
    error: magnetometerError,
  } = useMagnetometer();

  // Calculate Qibla direction
  const { direction: qiblaDirection, isValid: qiblaValid } = useQiblaDirection(coordinates);

  // Check if user is pointing toward Qibla
  const isAligned = magnetometerData
    ? isWithinTolerance(magnetometerData.heading, qiblaDirection, QIBLA_TOLERANCE)
    : false;

  // Show calibration helper if needed
  const needsCalibration = magnetometerData && !magnetometerData.isCalibrated;

  // Loading state
  if (locationLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  // Location permission denied
  if (hasPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>📍</Text>
        <Text style={styles.errorTitle}>Location Access Required</Text>
        <Text style={styles.errorMessage}>{locationError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={retryLocation}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Location error
  if (locationError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Location Error</Text>
        <Text style={styles.errorMessage}>{locationError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={retryLocation}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Magnetometer not available
  if (!magnetometerAvailable) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>🧭</Text>
        <Text style={styles.errorTitle}>Compass Unavailable</Text>
        <Text style={styles.errorMessage}>
          {magnetometerError || 'Your device does not have a magnetometer sensor.'}
        </Text>
      </View>
    );
  }

  // Magnetometer error
  if (magnetometerError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Compass Error</Text>
        <Text style={styles.errorMessage}>{magnetometerError}</Text>
      </View>
    );
  }

  // Waiting for data
  if (!magnetometerData || !qiblaValid) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Initializing compass...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Debug overlay */}
      {showDebug && (
        <DebugOverlay
          rawHeading={magnetometerData.rawHeading}
          smoothedHeading={magnetometerData.heading}
          qiblaDirection={qiblaDirection}
          rotation={qiblaDirection - magnetometerData.heading}
          accuracy={magnetometerData.accuracy}
          isCalibrated={magnetometerData.isCalibrated}
          onClose={() => setShowDebug(false)}
        />
      )}

      {/* Dev-only toggle button to reopen debug */}
      {__DEV__ && !showDebug && (
        <TouchableOpacity
          style={styles.debugToggle}
          onPress={() => setShowDebug(true)}
          accessibilityLabel="Show debug overlay"
        >
          <Text style={styles.debugToggleText}>🐞</Text>
        </TouchableOpacity>
      )}

      {/* Calibration warning */}
      {needsCalibration && (
        <View style={styles.calibrationWarning}>
          <Text style={styles.calibrationTitle}>📱 Calibration Needed</Text>
          <Text style={styles.calibrationText}>
            Move your phone in a figure-8 pattern for better accuracy
          </Text>
        </View>
      )}

      {/* Main compass */}
      <View style={styles.compassWrapper}>
        <CompassView
          qiblaDirection={qiblaDirection}
          currentHeading={magnetometerData.heading}
          isAligned={isAligned}
        />
      </View>

      {/* Location info */}
      {coordinates && (
        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>
            📍 {coordinates.latitude.toFixed(4)}°, {coordinates.longitude.toFixed(4)}°
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  compassWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  calibrationWarning: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  calibrationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  calibrationText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 18,
  },
  locationInfo: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  locationText: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  debugToggle: {
    position: 'absolute',
    right: 16,
    top: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 58, 138, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
  },
  debugToggleText: {
    color: '#fff',
    fontSize: 18,
  },
});
