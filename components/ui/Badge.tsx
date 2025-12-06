import React, { useMemo } from "react";
import { StyleSheet, Text, TextStyle, View, ViewStyle, useWindowDimensions } from "react-native";
import { useTheme, AppTheme } from "../../contexts/ThemeContext";
import { useResponsive } from "../../hooks/useResponsive";

type BadgeProps = {
  label: string;
  bgColor?: string;
  textColor?: string;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  pill?: boolean;
  uppercase?: boolean;
};

export default function Badge({
  label,
  bgColor,
  textColor,
  style,
  textStyle,
  pill = true,
  uppercase = true,
}: BadgeProps): React.JSX.Element {
  const theme = useTheme();
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, ms, fontScale), [theme, ms, fontScale]);
  
  const backgroundColor = bgColor ?? theme.colors.border.base;
  const color = textColor ?? theme.colors.text.base;
  
  return (
    <View
      style={[
        styles.badge,
        pill && styles.badgePill,
        { backgroundColor },
        style,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          { color },
          uppercase && styles.upper,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const createStyles = (theme: AppTheme, ms: (size: number, factor?: number) => number, fontScale: number) => StyleSheet.create({
  badge: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  badgePill: {
    borderRadius: theme.radius.pill,
  },
  badgeText: {
    fontSize: ms(10, 0.2) * fontScale,
    fontWeight: "800",
    letterSpacing: ms(0.5, 0.05),
  },
  upper: {
    textTransform: "uppercase",
  },
});
