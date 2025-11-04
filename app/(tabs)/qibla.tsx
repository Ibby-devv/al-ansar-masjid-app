import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
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
          onPress={() => setShowDebug(!showDebug)}
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
          isCalibrated={mag?.accuracy ? mag.accuracy > 0.5 : undefined}
          onClose={() => setShowDebug(false)}
        />
      )}

      {/* States */}
      {!hasPermission && hasPermission !== null && (
  <View style={styles.stateBox}><ThemedText style={styles.stateText}>Location access required</ThemedText></View>
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
});
