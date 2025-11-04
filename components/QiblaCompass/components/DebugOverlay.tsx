/**
 * DebugOverlay Component
 * 
 * Debug information overlay for development and tuning.
 * Only visible when debugMode is enabled.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COMPASS_CONFIG } from '../config/compassConfig';
import { formatAngle } from '../utils/angleUtils';

interface DebugOverlayProps {
  rawHeading?: number;
  smoothedHeading?: number;
  qiblaDirection?: number;
  rotation?: number;
  accuracy?: number;
  isCalibrated?: boolean;
  confidence?: number;
  magnitude?: number;
  lowConfidence?: boolean;
  smoothingWindow?: number;
  updateInterval?: number;
  /**
   * Force the overlay to render even if COMPASS_CONFIG.debugMode is false.
   * Useful for hidden/secret toggles in release builds.
   */
  forceVisible?: boolean;
  onClose?: () => void;
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({
  rawHeading,
  smoothedHeading,
  qiblaDirection,
  rotation,
  accuracy,
  isCalibrated,
  confidence,
  magnitude,
  lowConfidence,
  smoothingWindow = COMPASS_CONFIG.smoothingWindow,
  updateInterval = COMPASS_CONFIG.magnetometerInterval,
  forceVisible = false,
  onClose,
}) => {
  // In release builds, allow an explicit override via forceVisible
  if (!(COMPASS_CONFIG.debugMode || forceVisible)) {
    return null;
  }

  const getAccuracyColor = (acc: number = 0) => {
    if (acc > 0.7) return '#10b981'; // Green
    if (acc > 0.3) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>DEBUG MODE</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {/* Heading values */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compass Heading</Text>
          {COMPASS_CONFIG.showRawValues && rawHeading !== undefined && (
            <Text style={styles.value}>
              Raw: <Text style={styles.valueNumber}>{formatAngle(rawHeading, 1)}</Text>
            </Text>
          )}
          {COMPASS_CONFIG.showSmoothedValues && smoothedHeading !== undefined && (
            <Text style={styles.value}>
              Smoothed: <Text style={styles.valueNumber}>{formatAngle(smoothedHeading, 1)}</Text>
            </Text>
          )}
          {qiblaDirection !== undefined && (
            <Text style={styles.value}>
              Qibla: <Text style={styles.valueNumber}>{formatAngle(qiblaDirection, 1)}</Text>
            </Text>
          )}
          {rotation !== undefined && (
            <Text style={styles.value}>
              Rotation: <Text style={styles.valueNumber}>{formatAngle(rotation, 1)}</Text>
            </Text>
          )}
        </View>

        {/* Sensor info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sensor Status</Text>
          {accuracy !== undefined && (
            <Text style={styles.value}>
              Accuracy:{' '}
              <Text style={[styles.valueNumber, { color: getAccuracyColor(accuracy) }]}>
                {(accuracy * 100).toFixed(0)}%
              </Text>
            </Text>
          )}
          {confidence !== undefined && (
            <Text style={styles.value}>
              Confidence:{' '}
              <Text style={styles.valueNumber}>{Math.round(confidence * 100)}%</Text>
              {lowConfidence ? <Text style={{ color: '#ef4444' }}> (low)</Text> : null}
            </Text>
          )}
          {magnitude !== undefined && (
            <Text style={styles.value}>
              Field Magnitude:{' '}
              <Text style={styles.valueNumber}>{magnitude.toFixed(1)}µT</Text>
            </Text>
          )}
          {isCalibrated !== undefined && (
            <Text style={styles.value}>
              Calibrated:{' '}
              <Text
                style={[
                  styles.valueNumber,
                  { color: isCalibrated ? '#10b981' : '#ef4444' },
                ]}
              >
                {isCalibrated ? 'Yes' : 'No'}
              </Text>
            </Text>
          )}
        </View>

        {/* Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration</Text>
          <Text style={styles.value}>
            Smoothing Window: <Text style={styles.valueNumber}>{smoothingWindow}</Text>
          </Text>
          <Text style={styles.value}>
            Update Interval: <Text style={styles.valueNumber}>{updateInterval}ms</Text>
          </Text>
          <Text style={styles.value}>
            Min Angle Change: <Text style={styles.valueNumber}>{COMPASS_CONFIG.minAngleChange}°</Text>
          </Text>
          <Text style={styles.value}>
            Spring Damping: <Text style={styles.valueNumber}>{COMPASS_CONFIG.springDamping}</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 12,
    padding: 16,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    paddingBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
    letterSpacing: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    gap: 12,
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  valueNumber: {
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'monospace',
  },
});
