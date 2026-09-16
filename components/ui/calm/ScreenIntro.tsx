import React, { useMemo } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle, useWindowDimensions } from "react-native";
import { AppTheme, useTheme } from "../../../contexts/ThemeContext";
import { useResponsive } from "../../../hooks/useResponsive";

interface ScreenIntroProps {
  title: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
}

export default function ScreenIntro({
  title,
  subtitle,
  style,
}: ScreenIntroProps): React.JSX.Element {
  const theme = useTheme();
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(
    () => createStyles(theme, ms, fontScale),
    [theme, ms, fontScale]
  );

  return (
    <View style={[styles.intro, style]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const createStyles = (
  theme: AppTheme,
  ms: (size: number, factor?: number) => number,
  fontScale: number
) =>
  StyleSheet.create({
    intro: {
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: ms(18, 0.25) * fontScale,
      fontWeight: "600",
      color: theme.colors.text.strong,
      letterSpacing: -0.2,
    },
    subtitle: {
      marginTop: ms(4, 0.05),
      fontSize: ms(13, 0.2) * fontScale,
      color: theme.colors.text.muted,
      lineHeight: ms(18, 0.2),
    },
  });
