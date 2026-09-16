import { ThemedText } from "@/components/themed-text";
import { FontFamily } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Linking,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CompassView } from "../../components/QiblaCompass/components/CompassView";
import { DebugOverlay } from "../../components/QiblaCompass/components/DebugOverlay";
import { COMPASS_CONFIG } from "../../components/QiblaCompass/config/compassConfig";
import { useDeviceMotion } from "../../components/QiblaCompass/hooks/useDeviceMotion";
import { useHeading } from "../../components/QiblaCompass/hooks/useHeading";
import { useLocation } from "../../components/QiblaCompass/hooks/useLocation";
import { usePlacename } from "../../components/QiblaCompass/hooks/usePlacename";
import { useQiblaDirection } from "../../components/QiblaCompass/hooks/useQiblaDirection";
import {
  getShortestAngle,
  isWithinTolerance,
} from "../../components/QiblaCompass/utils/angleUtils";
import { AppTheme, useTheme } from "../../contexts/ThemeContext";
import { useResponsive } from "../../hooks/useResponsive";

const TOLERANCE = 10; // degrees

export default function QiblaScreen(): React.JSX.Element {
  const theme = useTheme();
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const isFocused = useIsFocused();
  const { coordinates, isLoading, error, hasPermission, retry } = useLocation();
  const { name: place, loading: isLoadingPlace } = usePlacename(coordinates);
  const { data: heading, isAvailable, error: headingError } = useHeading();
  const { direction: qiblaDirection, isValid } = useQiblaDirection(coordinates);
  const { data: motion } = useDeviceMotion();

  const styles = useMemo(
    () => createStyles(theme, ms, fontScale),
    [theme, ms, fontScale]
  );

  const [showDebug, setShowDebug] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const SECRET_HOLD_MS = 3000;
  const [showAccuracyHint, setShowAccuracyHint] = useState(false);
  const lowSinceRef = useRef<number | null>(null);
  const snoozedUntilRef = useRef<number | null>(null);

  const headingValue = heading?.heading ?? 0;
  const diff = getShortestAngle(headingValue, qiblaDirection);
  const aligned = isWithinTolerance(headingValue, qiblaDirection, TOLERANCE);
  const baseTurnLeft = diff < -TOLERANCE;
  const baseTurnRight = diff > TOLERANCE;
  const turnLeft = COMPASS_CONFIG.invertInstruction
    ? baseTurnRight
    : baseTurnLeft;
  const turnRight = COMPASS_CONFIG.invertInstruction
    ? baseTurnLeft
    : baseTurnRight;

  const prevAligned = useRef<boolean>(false);
  useEffect(() => {
    if (isFocused && aligned && !prevAligned.current) {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      ).catch(() => {});
    }
    prevAligned.current = aligned;
  }, [aligned, isFocused]);

  useEffect(() => {
    if (!isFocused) {
      prevAligned.current = false;
    }
  }, [isFocused]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    };
  }, []);

  const onInfoPress = (): void => {
    if (COMPASS_CONFIG.debugMode) {
      setShowDebug((v) => !v);
    }
  };

  const onInfoPressIn = (): void => {
    if (!COMPASS_CONFIG.debugMode) {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      holdTimerRef.current = setTimeout(() => {
        setShowDebug(true);
      }, SECRET_HOLD_MS);
    }
  };

  const onInfoPressOut = (): void => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (!COMPASS_CONFIG.showAccuracyHint) {
      setShowAccuracyHint(false);
      lowSinceRef.current = null;
      return;
    }
    const conf = heading?.confidence;
    if (conf === undefined) return;
    const threshold = COMPASS_CONFIG.confidenceLowThreshold ?? 0.5;
    const duration = COMPASS_CONFIG.lowConfidenceMinDurationMs ?? 3000;
    const now = Date.now();
    const snoozedUntil = snoozedUntilRef.current ?? 0;
    if (now < snoozedUntil) {
      setShowAccuracyHint(false);
      return;
    }
    if (conf < threshold) {
      if (lowSinceRef.current == null) lowSinceRef.current = now;
      if (
        !showAccuracyHint &&
        lowSinceRef.current &&
        now - lowSinceRef.current >= duration
      ) {
        setShowAccuracyHint(true);
      }
    } else {
      lowSinceRef.current = null;
      setShowAccuracyHint(false);
    }
  }, [heading?.confidence, showAccuracyHint]);

  const showPermissionDenied = !hasPermission && hasPermission !== null;
  const showCompass = isValid && Boolean(heading);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.topBar}>
        <View style={styles.locationBlock}>
          <ThemedText style={styles.locationLabel}>Location</ThemedText>
          <View style={styles.locationPill}>
            <Ionicons
              name="location-outline"
              size={ms(16, 0.2)}
              color={theme.colors.compass.accent}
            />
            <ThemedText
              style={styles.locationText}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              numberOfLines={1}
            >
              {isLoadingPlace
                ? "Locating…"
                : place || "Location unavailable"}
            </ThemedText>
          </View>
        </View>
        <TouchableOpacity
          style={styles.infoButton}
          accessibilityLabel="Compass info"
          onPress={onInfoPress}
          onPressIn={onInfoPressIn}
          onPressOut={onInfoPressOut}
        >
          <Ionicons
            name="information-circle-outline"
            size={ms(22, 0.2)}
            color={theme.colors.text.header}
          />
        </TouchableOpacity>
      </View>

      {showDebug && (
        <DebugOverlay
          rawHeading={heading?.rawHeading}
          smoothedHeading={headingValue}
          qiblaDirection={qiblaDirection}
          rotation={qiblaDirection - headingValue}
          accuracy={heading?.accuracy}
          confidence={heading?.confidence}
          magnitude={undefined}
          lowConfidence={heading?.lowConfidence}
          isCalibrated={
            heading?.accuracy ? heading.accuracy > 0.5 : undefined
          }
          pitch={motion?.pitch}
          roll={motion?.roll}
          magHeading={heading?.magHeading}
          trueHeading={heading?.trueHeading}
          magneticDeclination={
            heading?.trueHeading !== undefined &&
            heading?.trueHeading >= 0 &&
            heading?.magHeading !== undefined
              ? getShortestAngle(heading.trueHeading, heading.magHeading)
              : undefined
          }
          latitude={coordinates?.latitude}
          longitude={coordinates?.longitude}
          differenceFromQibla={diff}
          headingSource={
            heading?.trueHeading !== undefined && heading?.trueHeading >= 0
              ? "True (GPS-corrected)"
              : "Magnetic (fallback)"
          }
          forceVisible={true}
          onClose={() => setShowDebug(false)}
        />
      )}

      {showAccuracyHint && (
        <View style={styles.hintContainer}>
          <Ionicons
            name="compass-outline"
            size={ms(16, 0.2)}
            color={theme.colors.compass.muted}
          />
          <ThemedText style={styles.hintText}>
            Move your phone in a figure-8 to improve accuracy
          </ThemedText>
          <TouchableOpacity
            onPress={() => {
              setShowAccuracyHint(false);
              snoozedUntilRef.current =
                Date.now() + (COMPASS_CONFIG.accuracyHintSnoozeMs ?? 120000);
              lowSinceRef.current = null;
            }}
            accessibilityRole="button"
            accessibilityLabel="Dismiss accuracy hint"
          >
            <ThemedText style={styles.hintDismiss}>Dismiss</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {showPermissionDenied && (
        <View style={styles.stateBox}>
          <View style={styles.stateIconWell}>
            <Ionicons
              name="location-outline"
              size={ms(28, 0.2)}
              color={theme.colors.compass.accent}
            />
          </View>
          <ThemedText style={styles.stateTitle}>Location access needed</ThemedText>
          <ThemedText style={styles.stateText}>
            Allow location so we can find the Qibla from where you are.
          </ThemedText>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionButtonPrimary}
              onPress={() => {
                Linking.openSettings().catch(() => {});
              }}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
            >
              <ThemedText style={styles.actionButtonText}>
                Open Settings
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={retry}
              accessibilityRole="button"
              accessibilityLabel="Retry location"
            >
              <ThemedText style={styles.actionButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isLoading && (
        <View style={styles.stateBoxCompact}>
          <ThemedText style={styles.stateText}>Getting your location…</ThemedText>
        </View>
      )}

      {error ? (
        <TouchableOpacity
          onPress={retry}
          style={styles.stateBoxCompact}
          accessibilityRole="button"
          accessibilityLabel="Retry after location error"
        >
          <ThemedText style={styles.stateText}>
            {error} · Tap to retry
          </ThemedText>
        </TouchableOpacity>
      ) : null}

      {!isAvailable && headingError ? (
        <View style={styles.stateBoxCompact}>
          <ThemedText style={styles.stateText}>{headingError}</ThemedText>
        </View>
      ) : null}

      {showCompass && (
        <View style={styles.compassArea}>
          <CompassView
            qiblaDirection={qiblaDirection}
            currentHeading={headingValue}
            isAligned={aligned}
            showInstruction={false}
            theme={{
              faceColor: theme.colors.compass.face,
              borderColor:
                theme.colorScheme === "dark"
                  ? "rgba(255,255,255,0.35)"
                  : "rgba(255,255,255,0.7)",
              tickColor:
                theme.colorScheme === "dark"
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(0,0,0,0.1)",
              tickMajorColor:
                theme.colorScheme === "dark"
                  ? "rgba(255,255,255,0.28)"
                  : "rgba(0,0,0,0.25)",
              pointerColor: theme.colors.compass.accent,
              pointerAlignedColor: theme.colors.accent.green,
              cardinalColor:
                theme.colorScheme === "dark"
                  ? "rgba(255,255,255,0.22)"
                  : "rgba(0,0,0,0.2)",
              kaabahColor:
                theme.colorScheme === "dark" ? "#f5f5f5" : "#2f2a2a",
              kaabahStripeColor: theme.colors.brand.gold[400],
              directionTextColor: theme.colors.text.header,
              degreeTextColor: theme.colors.compass.muted,
            }}
          />
        </View>
      )}

      {showCompass && (
        <View style={styles.instructionRow}>
          {aligned ? (
            <ThemedText
              style={[styles.instructionText, styles.instructionAligned]}
            >
              You&apos;re facing the Kaaba
            </ThemedText>
          ) : (
            <ThemedText style={styles.instructionText}>
              Turn to your{" "}
              {turnLeft ? (
                <ThemedText style={styles.instructionEmph}>left</ThemedText>
              ) : turnRight ? (
                <ThemedText style={styles.instructionEmph}>right</ThemedText>
              ) : (
                <ThemedText style={styles.instructionEmph}>side</ThemedText>
              )}
            </ThemedText>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (
  theme: AppTheme,
  ms: (size: number, factor?: number) => number,
  fontScale: number
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.compass.background,
    },
    topBar: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing.md,
    },
    locationBlock: {
      flex: 1,
      minWidth: 0,
    },
    locationLabel: {
      color: theme.colors.compass.muted,
      fontSize: ms(11, 0.15) * fontScale,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      marginBottom: ms(6, 0.05),
      fontFamily: FontFamily.medium,
      paddingLeft: ms(4, 0.05),
    },
    locationPill: {
      backgroundColor: "rgba(255,255,255,0.08)",
      borderRadius: theme.radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.12)",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: ms(10, 0.1),
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      alignSelf: "flex-start",
      maxWidth: "100%",
    },
    locationText: {
      color: theme.colors.compass.accent,
      fontSize: ms(18, 0.25) * fontScale,
      fontFamily: FontFamily.semibold,
      lineHeight: ms(24, 0.2),
      flexShrink: 1,
    },
    infoButton: {
      width: ms(40, 0.2),
      height: ms(40, 0.2),
      borderRadius: ms(20, 0.2),
      backgroundColor: "rgba(255,255,255,0.08)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.12)",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    stateBox: {
      marginTop: theme.spacing.md,
      marginHorizontal: theme.spacing.lg,
      padding: theme.spacing.xl,
      backgroundColor: "rgba(255,255,255,0.06)",
      borderRadius: theme.radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.12)",
      alignItems: "center",
    },
    stateBoxCompact: {
      marginTop: theme.spacing.sm,
      marginHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      backgroundColor: "rgba(255,255,255,0.06)",
      borderRadius: theme.radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.1)",
    },
    stateIconWell: {
      width: ms(52, 0.2),
      height: ms(52, 0.2),
      borderRadius: ms(16, 0.15),
      backgroundColor: "rgba(244, 162, 97, 0.15)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.md,
    },
    stateTitle: {
      color: theme.colors.text.header,
      fontSize: ms(16, 0.2) * fontScale,
      fontFamily: FontFamily.semibold,
      textAlign: "center",
      marginBottom: ms(6, 0.05),
    },
    stateText: {
      color: theme.colors.compass.muted,
      textAlign: "center",
      fontFamily: FontFamily.regular,
      fontSize: ms(13, 0.2) * fontScale,
      lineHeight: ms(19, 0.2),
    },
    actionRow: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
      width: "100%",
    },
    actionButtonPrimary: {
      flex: 1,
      backgroundColor: "rgba(244, 162, 97, 0.25)",
      borderRadius: theme.radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.compass.accent,
      paddingVertical: theme.spacing.md,
      alignItems: "center",
    },
    actionButton: {
      flex: 1,
      backgroundColor: "rgba(255,255,255,0.08)",
      borderRadius: theme.radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.14)",
      paddingVertical: theme.spacing.md,
      alignItems: "center",
    },
    actionButtonText: {
      color: theme.colors.text.header,
      fontFamily: FontFamily.semibold,
      fontSize: ms(14, 0.2) * fontScale,
    },
    compassArea: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.lg,
      minHeight: ms(240, 0.2),
    },
    instructionRow: {
      paddingBottom: ms(36, 0.1),
      paddingHorizontal: theme.spacing.lg,
      alignItems: "center",
      minHeight: ms(64, 0.1),
    },
    instructionText: {
      fontSize: ms(24, 0.3) * fontScale,
      color: theme.colors.text.header,
      fontFamily: FontFamily.semibold,
      textAlign: "center",
      lineHeight: ms(32, 0.25),
      letterSpacing: -0.3,
    },
    instructionAligned: {
      color: theme.colors.compass.accent,
    },
    instructionEmph: {
      color: theme.colors.compass.accent,
      fontFamily: FontFamily.semibold,
      fontSize: ms(24, 0.3) * fontScale,
      lineHeight: ms(32, 0.25),
    },
    hintContainer: {
      marginHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.sm,
      backgroundColor: "rgba(255,255,255,0.06)",
      borderRadius: theme.radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.1)",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    hintText: {
      color: theme.colors.compass.muted,
      fontSize: ms(13, 0.15) * fontScale,
      fontFamily: FontFamily.medium,
      lineHeight: ms(18, 0.15),
      flex: 1,
    },
    hintDismiss: {
      color: theme.colors.text.header,
      fontSize: ms(12, 0.15) * fontScale,
      fontFamily: FontFamily.semibold,
      opacity: 0.8,
    },
  });
