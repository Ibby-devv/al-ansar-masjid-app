import React, { useMemo } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { AppTheme, useTheme } from "../../../contexts/ThemeContext";

interface PanelProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Drop default padding — useful for stacked ListRows */
  flush?: boolean;
  /** Equal padding on all sides (event cards, etc.) */
  compact?: boolean;
}

export default function Panel({
  children,
  style,
  flush = false,
  compact = false,
}: PanelProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View
      style={[
        styles.panel,
        compact && styles.compact,
        flush && styles.flush,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    panel: {
      backgroundColor: theme.colors.surface.base,
      borderRadius: theme.radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.soft,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.lg,
      overflow: "hidden",
    },
    compact: {
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
    },
    flush: {
      paddingHorizontal: 0,
      paddingTop: 0,
      paddingBottom: 0,
    },
  });
