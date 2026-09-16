import React, { useMemo } from "react";
import { StyleSheet, Text, View, ViewStyle, useWindowDimensions } from "react-native";
import { FontFamily } from "../../constants/theme";
import { AppTheme, useTheme } from "../../contexts/ThemeContext";
import { useResponsive } from "../../hooks/useResponsive";

type NextBannerProps = {
  prayerName: string;
  prayerTime: string;
  timeRemaining: string;
  style?: ViewStyle | ViewStyle[];
};

export default function NextBanner({
  prayerName,
  prayerTime,
  timeRemaining,
  style,
}: NextBannerProps): React.JSX.Element {
  const theme = useTheme();
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, ms, fontScale), [theme, ms, fontScale]);

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label} numberOfLines={1}>
        Next prayer
      </Text>
      <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
        {prayerName} · {prayerTime}
      </Text>
      <Text style={styles.countdown} numberOfLines={1} ellipsizeMode="tail">
        {timeRemaining}
      </Text>
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
      backgroundColor: theme.colors.surface.card,
      borderColor: theme.colors.border.soft,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: theme.radius.lg,
      marginBottom: ms(12, 0.1),
      paddingHorizontal: ms(16, 0.1),
      paddingVertical: ms(14, 0.1),
      gap: ms(4, 0.05),
      ...theme.shadow.soft,
    },
    label: {
      color: theme.colors.brand.gold[600],
      fontFamily: FontFamily.semibold,
      fontSize: ms(11, 0.15) * fontScale,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    title: {
      color: theme.colors.text.strong,
      fontFamily: FontFamily.semibold,
      fontSize: ms(22, 0.25) * fontScale,
      lineHeight: ms(28, 0.25) * fontScale,
    },
    countdown: {
      color: theme.colors.text.muted,
      fontFamily: FontFamily.medium,
      fontSize: ms(13, 0.15) * fontScale,
    },
  });
