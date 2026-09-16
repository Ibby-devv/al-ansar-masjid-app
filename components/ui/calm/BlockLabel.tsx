import React, { useMemo } from "react";
import { StyleSheet, Text, type StyleProp, type TextStyle, useWindowDimensions } from "react-native";
import { AppTheme, useTheme } from "../../../contexts/ThemeContext";
import { useResponsive } from "../../../hooks/useResponsive";

interface BlockLabelProps {
  children: string;
  style?: StyleProp<TextStyle>;
}

export default function BlockLabel({
  children,
  style,
}: BlockLabelProps): React.JSX.Element {
  const theme = useTheme();
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(
    () => createStyles(theme, ms, fontScale),
    [theme, ms, fontScale]
  );

  return <Text style={[styles.label, style]}>{children}</Text>;
}

const createStyles = (
  theme: AppTheme,
  ms: (size: number, factor?: number) => number,
  fontScale: number
) =>
  StyleSheet.create({
    label: {
      fontSize: ms(11, 0.15) * fontScale,
      fontWeight: "500",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: theme.colors.text.muted,
      marginBottom: theme.spacing.md,
    },
  });
