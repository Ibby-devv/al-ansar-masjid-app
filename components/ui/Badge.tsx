import React, { useMemo } from "react";
import { StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import type { AppTheme } from "../../hooks/useAppTheme";

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
  const styles = useMemo(() => createStyles(theme), [theme]);
  
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

const createStyles = (theme: AppTheme) => StyleSheet.create({
  badge: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  badgePill: {
    borderRadius: theme.radius.pill,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  upper: {
    textTransform: "uppercase",
  },
});
