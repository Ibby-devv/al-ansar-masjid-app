import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
  useWindowDimensions,
} from "react-native";
import { AppTheme, useTheme } from "../../../contexts/ThemeContext";
import { useResponsive } from "../../../hooks/useResponsive";

export type ChipTone = "navy" | "gold";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: ChipTone;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export default function Chip({
  label,
  selected = false,
  onPress,
  tone = "navy",
  style,
  accessibilityLabel,
}: ChipProps): React.JSX.Element {
  const theme = useTheme();
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(
    () => createStyles(theme, ms, fontScale),
    [theme, ms, fontScale]
  );

  const selectedStyle =
    tone === "gold" ? styles.selectedGold : styles.selectedNavy;
  const selectedTextStyle =
    tone === "gold" ? styles.textSelectedGold : styles.textSelectedNavy;

  return (
    <TouchableOpacity
      style={[styles.chip, selected && selectedStyle, style]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text style={[styles.text, selected && selectedTextStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (
  theme: AppTheme,
  ms: (size: number, factor?: number) => number,
  fontScale: number
) =>
  StyleSheet.create({
    chip: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.base,
      backgroundColor: theme.colors.surface.base,
      borderRadius: theme.radius.pill,
      paddingVertical: ms(8, 0.1),
      paddingHorizontal: ms(14, 0.1),
    },
    selectedNavy: {
      borderColor: theme.colors.brand.navy[800],
      backgroundColor: theme.colors.brand.navy[800],
    },
    selectedGold: {
      borderColor: theme.colors.brand.gold[600],
      backgroundColor: theme.colors.brand.gold[600],
    },
    text: {
      fontSize: ms(13, 0.2) * fontScale,
      fontWeight: "500",
      color: theme.colors.text.muted,
    },
    textSelectedNavy: {
      color: theme.colors.text.header,
      fontWeight: "600",
    },
    textSelectedGold: {
      color: theme.colors.text.inverse,
      fontWeight: "600",
    },
  });
