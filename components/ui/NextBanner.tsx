import React, { useMemo } from "react";
import { StyleSheet, Text, View, ViewStyle, useWindowDimensions } from "react-native";
import { FontFamily } from "../../constants/theme";
import { AppTheme, useTheme } from "../../contexts/ThemeContext";
import { useResponsive } from "../../hooks/useResponsive";

type NextBannerProps = {
  prayerName: string;
  timeRemaining: string;
  style?: ViewStyle | ViewStyle[];
};

export default function NextBanner({
  prayerName,
  timeRemaining,
  style,
}: NextBannerProps): React.JSX.Element {
  const theme = useTheme();
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, ms, fontScale), [theme, ms, fontScale]);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.accent} />
      <View style={styles.content}>
        <Text style={styles.label} numberOfLines={1}>
          Next
        </Text>
        <Text style={styles.prayerName} numberOfLines={1} ellipsizeMode="tail">
          {prayerName}
        </Text>
        <Text style={styles.countdown} numberOfLines={1} ellipsizeMode="tail">
          {timeRemaining}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (
  theme: AppTheme,
  ms: (size: number, factor?: number) => number,
  fontScale: number,
) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "stretch",
      backgroundColor: theme.colors.surface.card,
      borderColor: theme.colors.border.soft,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: theme.radius.md,
      marginBottom: ms(10, 0.1),
      overflow: "hidden",
    },
    accent: {
      width: ms(3, 0.05),
      backgroundColor: theme.colors.brand.gold[600],
    },
    content: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: ms(8, 0.1),
      paddingHorizontal: ms(12, 0.1),
      paddingVertical: ms(8, 0.1),
    },
    label: {
      color: theme.colors.text.muted,
      fontFamily: FontFamily.medium,
      fontSize: ms(11, 0.15) * fontScale,
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    prayerName: {
      flex: 1,
      flexShrink: 1,
      color: theme.colors.text.base,
      fontFamily: FontFamily.semibold,
      fontSize: ms(15, 0.2) * fontScale,
    },
    countdown: {
      flexShrink: 1,
      maxWidth: "46%",
      color: theme.colors.text.muted,
      fontFamily: FontFamily.medium,
      fontSize: ms(12, 0.15) * fontScale,
      textAlign: "right",
    },
  });
