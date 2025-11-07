/**
 * CompassView Component
 * 
 * Rotating compass UI with smooth spring animations.
 * Uses react-native-reanimated for hardware-accelerated performance.
 */

import { ThemedText } from '@/components/themed-text';
import { FontFamily } from '@/constants/theme';
import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    WithSpringConfig,
} from 'react-native-reanimated';
import { COMPASS_CONFIG } from '../config/compassConfig';
import { calculateTargetRotation, formatAngle, getCardinalDirection } from '../utils/angleUtils';
import { PointerSvg } from './PointerSvg';

const { width } = Dimensions.get('window');
const COMPASS_SIZE = Math.min(width - 80, 300);

interface CompassTheme {
  faceColor?: string;
  borderColor?: string;
  tickColor?: string;
  tickMajorColor?: string;
  pointerColor?: string;
  pointerAlignedColor?: string;
  centerDotColor?: string;
  cardinalColor?: string;
  outerRingColor?: string;
  showTicks?: boolean;
}

interface CompassViewProps {
  qiblaDirection: number;      // Direction to Qibla (0-360°)
  currentHeading: number;       // Current compass heading (0-360°)
  isAligned?: boolean;          // Whether pointing at Qibla
  showInstruction?: boolean;    // Show built-in instruction text
  theme?: CompassTheme;         // Optional theming for colors
}

export const CompassView: React.FC<CompassViewProps> = ({
  qiblaDirection,
  currentHeading,
  isAligned = false,
  showInstruction = true,
  theme = {},
}) => {
  // Shared values for animation (runs on UI thread)
  const rotation = useSharedValue(0);
  const previousTarget = useSharedValue(0);

  // Spring animation configuration
  const springConfig: WithSpringConfig = useMemo(() => ({
    damping: COMPASS_CONFIG.springDamping,
    stiffness: COMPASS_CONFIG.springStiffness,
    mass: COMPASS_CONFIG.springMass,
  }), []);

  useEffect(() => {
    // Calculate the angle we need to rotate the compass
    // Qibla direction minus current heading = rotation needed
    const targetAngle = qiblaDirection - currentHeading;

    // Calculate smooth target rotation (handles 0°/360° crossover)
    const targetRotation = calculateTargetRotation(previousTarget.value, targetAngle);

    // Only update if change is significant (reduces unnecessary animations)
    const angleDiff = Math.abs(targetRotation - previousTarget.value);
    if (angleDiff > COMPASS_CONFIG.minAngleChange) {
      previousTarget.value = targetRotation;
      rotation.value = withSpring(targetRotation, springConfig);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qiblaDirection, currentHeading, springConfig]);

  // Animated style for compass rotation
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  // Calculate display heading (direction user is facing)
  const displayHeading = Math.round(currentHeading);
  const cardinalDirection = getCardinalDirection(currentHeading);

  const {
    faceColor = '#f8fafc',
    borderColor = '#ffffff',
    tickColor = '#94a3b8',
    tickMajorColor = '#64748b',
    pointerColor = '#f4a261',
    pointerAlignedColor = '#10b981',
    cardinalColor = 'rgba(0,0,0,0.2)',
    outerRingColor = '#eae0dd',
    showTicks = false,
  } = theme;

  // Compute pointer dimensions - larger bulbous pointer that doesn't start at center
  // Pointer should reach up toward Kaaba but not cover it, with semicircular bottom
  const QIBLA_INDICATOR_TOP = 30;
  const QIBLA_ICON_SIZE = 24;
  const QIBLA_TEXT_HEIGHT = 16;
  const POINTER_GAP = 12;
  const pointerHeight = Math.max(
    240, // 3x the original 80
    COMPASS_SIZE / 2 - (QIBLA_INDICATOR_TOP + QIBLA_ICON_SIZE + QIBLA_TEXT_HEIGHT + POINTER_GAP)
  );
  const pointerWidth = Math.max(120, Math.round(pointerHeight * 0.6)); // 3x the original 40

  // Position pointer so bottom bulb is offset from center (not at dead center)
  const POINTER_BOTTOM_OFFSET = 100; // Moved down from 90

  return (
    <View style={styles.container}>
      {/* Direction indicator */}
      <View style={styles.directionContainer}>
  <ThemedText style={styles.directionText}>{cardinalDirection}</ThemedText>
  <ThemedText style={styles.degreeText}>{formatAngle(displayHeading)}</ThemedText>
      </View>

      {/* Compass */}
      <View style={styles.compassContainer}>
        {/* Outer ring */}
        <View style={[styles.outerRing, { backgroundColor: outerRingColor }]} />
        {/* Fixed pointer - positioned above center with bulbous bottom */}
        <View
          style={[
            styles.pointerContainer,
            {
              width: pointerWidth,
              height: pointerHeight,
              marginLeft: -pointerWidth / 2,
              marginTop: -(pointerHeight - POINTER_BOTTOM_OFFSET), // Position so bottom is offset from center
            },
          ]}
        >
          <PointerSvg
            color={isAligned ? pointerAlignedColor : pointerColor}
            width={pointerWidth}
            height={pointerHeight}
          />
        </View>

        {/* Rotating compass rose */}
        <Animated.View style={[styles.compassRose, animatedStyle]}>
          {/* Qibla indicator (Ka'bah symbol or arrow) */}
          <View style={styles.qiblaIndicator}>
            <View style={styles.kaabah}>
              <View style={styles.kaabahStripe} />
            </View>
            <ThemedText style={styles.qiblaText}>QIBLA</ThemedText>
          </View>

          {/* Cardinal direction markers */}
          <View style={styles.cardinalN}>
            <ThemedText style={[styles.cardinalLabel, { color: cardinalColor }]}>N</ThemedText>
          </View>
          <View style={styles.cardinalE}>
            <ThemedText style={[styles.cardinalLabel, { color: cardinalColor }]}>E</ThemedText>
          </View>
          <View style={styles.cardinalS}>
            <ThemedText style={[styles.cardinalLabel, { color: cardinalColor }]}>S</ThemedText>
          </View>
          <View style={styles.cardinalW}>
            <ThemedText style={[styles.cardinalLabel, { color: cardinalColor }]}>W</ThemedText>
          </View>

          {/* Compass circle with tick marks */}
          <View style={[styles.compassCircle, { backgroundColor: faceColor, borderColor: borderColor }] }>
            {/* Optional tick marks */}
            {showTicks &&
              Array.from({ length: 36 }).map((_, i) => {
                const angle = i * 10;
                const isMajor = angle % 30 === 0;
                return (
                  <View
                    key={i}
                    style={[
                      styles.tick,
                      {
                        transform: [
                          { rotate: `${angle}deg` },
                          { translateY: -(COMPASS_SIZE / 2 - 15) },
                        ],
                      },
                      { backgroundColor: tickColor },
                      isMajor && { height: 12, width: 3, marginLeft: -1.5, backgroundColor: tickMajorColor },
                    ]}
                  />
                );
              })}
          </View>
        </Animated.View>

        {/* Center dot removed - no longer needed */}
      </View>

      {/* Instruction text */}
      {showInstruction && (
        <View style={styles.instructionContainer}>
          <ThemedText style={[styles.instructionText, isAligned && styles.instructionAligned]}>
            {isAligned ? '✓ Aligned with Qibla' : 'Point toward the indicator'}
          </ThemedText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  directionText: {
    fontSize: 32,
    fontFamily: FontFamily.bold,
    color: '#1e3a8a',
  },
  degreeText: {
    fontSize: 18,
    color: '#64748b',
    marginTop: 4,
  },
  compassContainer: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: COMPASS_SIZE + 30,
    height: COMPASS_SIZE + 30,
    borderRadius: (COMPASS_SIZE + 30) / 2,
  },
  pointerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    // Anchor the pointer so its rounded bottom sits at the dial center
    // width/height correspond to <PointerSvg width={44} height={100} />
    width: 44,
    height: 100,
    marginLeft: -22, // center horizontally
    marginTop: -100, // move up by its height so bottom is at center
    zIndex: 10,
  },
  // SVG pointer is used; keep container only
  compassRose: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassCircle: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  tick: {
    position: 'absolute',
    width: 2,
    height: 8,
    backgroundColor: '#94a3b8',
    top: '50%',
    left: '50%',
    marginLeft: -1,
    marginTop: -4,
  },
  qiblaIndicator: {
    position: 'absolute',
    top: 30,
    alignItems: 'center',
    zIndex: 5,
  },
  kaabah: {
    width: 24,
    height: 24,
    backgroundColor: '#2f2a2a',
    borderRadius: 4,
    marginBottom: 4,
  },
  kaabahStripe: {
    position: 'absolute',
    top: 5,
    left: 2,
    right: 2,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#f0b561',
  },
  qiblaText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#c9d4cf',
  },
  cardinalN: {
    position: 'absolute',
    top: 5,
  },
  cardinalE: {
    position: 'absolute',
    right: 5,
  },
  cardinalS: {
    position: 'absolute',
    bottom: 5,
  },
  cardinalW: {
    position: 'absolute',
    left: 5,
  },
  cardinalLabel: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#475569',
  },
  instructionContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  instructionAligned: {
    color: '#10b981',
    fontFamily: FontFamily.semibold,
  },
});
