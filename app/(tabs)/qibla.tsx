import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { Linking, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompassView } from '../../components/QiblaCompass/components/CompassView';
import { DebugOverlay } from '../../components/QiblaCompass/components/DebugOverlay';
import { COMPASS_CONFIG } from '../../components/QiblaCompass/config/compassConfig';
import { useLocation } from '../../components/QiblaCompass/hooks/useLocation';
import { useMagnetometer } from '../../components/QiblaCompass/hooks/useMagnetometer';
import { usePlacename } from '../../components/QiblaCompass/hooks/usePlacename';
import { useQiblaDirection } from '../../components/QiblaCompass/hooks/useQiblaDirection';
import { getShortestAngle, isWithinTolerance } from '../../components/QiblaCompass/utils/angleUtils';

const NAVY = '#0f2945';
const LIGHT = '#f5efeb';
const ACCENT = '#f4a261';
const MUTED = 'rgba(255,255,255,0.6)';
const TOLERANCE = 10; // degrees

export default function QiblaScreen(): React.JSX.Element {
  const { coordinates, isLoading, error, hasPermission, retry } = useLocation();
  const { name: place } = usePlacename(coordinates);
  const { data: mag, isAvailable, error: magError } = useMagnetometer();
  const { direction: qiblaDirection, isValid } = useQiblaDirection(coordinates);

  const [showDebug, setShowDebug] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const SECRET_HOLD_MS = 5000;
  const [showAccuracyHint, setShowAccuracyHint] = useState(false);
  const lowSinceRef = useRef<number | null>(null);
  const snoozedUntilRef = useRef<number | null>(null);

  const heading = mag?.heading ?? 0;
  const diff = getShortestAngle(heading, qiblaDirection);
  const aligned = isWithinTolerance(heading, qiblaDirection, TOLERANCE);
  const baseTurnLeft = diff < -TOLERANCE;
  const baseTurnRight = diff > TOLERANCE;
  const turnLeft = COMPASS_CONFIG.invertInstruction ? baseTurnRight : baseTurnLeft;
  const turnRight = COMPASS_CONFIG.invertInstruction ? baseTurnLeft : baseTurnRight;

  // Haptic feedback when transitioning into aligned state
  const prevAligned = useRef<boolean>(false);
  useEffect(() => {
    if (aligned && !prevAligned.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    prevAligned.current = aligned;
  }, [aligned]);

  // Cleanup any pending hold timers on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    };
  }, []);

  const onInfoPress = () => {
    if (COMPASS_CONFIG.debugMode) {
      setShowDebug((v) => !v);
    }
  };

  const onInfoPressIn = () => {
    if (!COMPASS_CONFIG.debugMode) {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      holdTimerRef.current = setTimeout(() => {
        setShowDebug(true);
      }, SECRET_HOLD_MS);
    }
  };

  const onInfoPressOut = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  // Show a subtle accuracy hint after sustained low confidence
  useEffect(() => {
    if (!COMPASS_CONFIG.showAccuracyHint) {
      setShowAccuracyHint(false);
      lowSinceRef.current = null;
      return;
    }
    const conf = mag?.confidence;
    if (conf === undefined) return;
    const threshold = COMPASS_CONFIG.confidenceLowThreshold ?? 0.5;
    const duration = COMPASS_CONFIG.lowConfidenceMinDurationMs ?? 3000;
    const now = Date.now();
    // Respect snooze window if active
    const snoozedUntil = snoozedUntilRef.current ?? 0;
    if (now < snoozedUntil) {
      setShowAccuracyHint(false);
      return;
    }
    if (conf < threshold) {
      if (lowSinceRef.current == null) lowSinceRef.current = now;
      if (!showAccuracyHint && lowSinceRef.current && now - lowSinceRef.current >= duration) {
        setShowAccuracyHint(true);
      }
    } else {
      lowSinceRef.current = null;
      setShowAccuracyHint(false);
    }
  }, [mag?.confidence, showAccuracyHint]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <ThemedText style={styles.locationLabel}>LOCATION</ThemedText>
          <View style={styles.locationPill}>
            <ThemedText style={styles.locationText}>{place || 'Current location'}</ThemedText>
            <Ionicons name="chevron-down" size={16} color={MUTED} />
          </View>
        </View>
        <TouchableOpacity 
          style={styles.infoButton} 
          accessibilityLabel="Info"
          // In dev, tap toggles. In release, require a 5s continuous hold (press-in) to open.
          onPress={onInfoPress}
          onPressIn={onInfoPressIn}
          onPressOut={onInfoPressOut}
        >
          <ThemedText style={styles.infoText}>i</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Debug Overlay */}
      {showDebug && (
        <DebugOverlay
          rawHeading={mag?.rawHeading}
          smoothedHeading={heading}
          qiblaDirection={qiblaDirection}
          rotation={qiblaDirection - heading}
          accuracy={mag?.accuracy}
          confidence={mag?.confidence}
          magnitude={mag?.magnitude}
          lowConfidence={mag?.lowConfidence}
          isCalibrated={mag?.accuracy ? mag.accuracy > 0.5 : undefined}
          forceVisible={true}
          onClose={() => setShowDebug(false)}
        />
      )}

      {/* Subtle Accuracy Hint */}
      {showAccuracyHint && (
        <View style={styles.hintContainer}>
          <ThemedText style={styles.hintText}>
            Improve accuracy: move your phone in a figure ‘8’
          </ThemedText>
          <TouchableOpacity
            onPress={() => {
              setShowAccuracyHint(false);
              // Snooze further hints for a while and reset timer so it doesn't reappear immediately
              snoozedUntilRef.current = Date.now() + (COMPASS_CONFIG.accuracyHintSnoozeMs ?? 120000);
              lowSinceRef.current = null;
            }}
          >
            <ThemedText style={styles.hintDismiss}>Dismiss</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* States */}
      {!hasPermission && hasPermission !== null && (
        <View style={styles.stateBox}>
          <ThemedText style={styles.stateText}>Location access required</ThemedText>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Linking.openSettings().catch(() => {});
              }}
            >
              <ThemedText style={styles.actionButtonText}>Open Settings</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: 'rgba(255,255,255,0.06)' }]}
              onPress={retry}
            >
              <ThemedText style={styles.actionButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {isLoading && (
  <View style={styles.stateBox}><ThemedText style={styles.stateText}>Getting location…</ThemedText></View>
      )}
      {error && (
  <TouchableOpacity onPress={retry} style={styles.stateBox}><ThemedText style={styles.stateText}>{error} • Tap to retry</ThemedText></TouchableOpacity>
      )}
      {!isAvailable && magError && (
  <View style={styles.stateBox}><ThemedText style={styles.stateText}>{magError}</ThemedText></View>
      )}

      {/* Compass */}
      {isValid && mag && (
        <View style={styles.compassArea}>
          <CompassView
            qiblaDirection={qiblaDirection}
            currentHeading={heading}
            isAligned={aligned}
            showInstruction={false}
            theme={{
              faceColor: LIGHT,
              borderColor: 'rgba(255,255,255,0.7)',
              tickColor: 'rgba(0,0,0,0.1)',
              tickMajorColor: 'rgba(0,0,0,0.25)',
              pointerColor: ACCENT,
              pointerAlignedColor: '#2ecc71',
              cardinalColor: 'rgba(0,0,0,0.2)',
            }}
          />
        </View>
      )}

      {/* Instruction */}
      {isValid && mag && (
        <View style={styles.instructionRow}>
          {aligned ? (
            <ThemedText style={[styles.instructionText, styles.instructionAligned]}>You&apos;re facing Makkah</ThemedText>
          ) : (
            <ThemedText style={styles.instructionText}>
              Turn to your {turnLeft ? <ThemedText style={styles.instructionEmph}>left</ThemedText> : turnRight ? <ThemedText style={styles.instructionEmph}>right</ThemedText> : <ThemedText style={styles.instructionEmph}>side</ThemedText>}
            </ThemedText>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NAVY,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationLabel: {
    color: MUTED,
    fontSize: 14,
    letterSpacing: 1,
    marginBottom: 6,
    fontFamily: 'Poppins_600SemiBold',
    paddingLeft: 16,
  },
  locationPill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    color: '#f3b17b',
    fontSize: 24,
    fontFamily: 'Poppins_800ExtraBold',
  },
  infoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  stateBox: {
    marginTop: 8,
    marginHorizontal: 20,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
  },
  stateText: {
    color: '#cbd5e1',
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#e5e7eb',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  compassArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  instructionRow: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    minHeight: 80,
  },
  instructionText: {
    fontSize: 32,
    color: '#e5e7eb',
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    lineHeight: 40,
  },
  instructionAligned: {
    color: ACCENT,
  },
  instructionEmph: {
    color: '#ffffff',
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    lineHeight: 40,
  },
  hintContainer: {
    marginHorizontal: 24,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  hintText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
    flexWrap: 'wrap',
  },
  hintDismiss: {
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    paddingHorizontal: 4,
  },
});
