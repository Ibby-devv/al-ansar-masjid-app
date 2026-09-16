import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
  useWindowDimensions,
} from "react-native";
import { AppTheme, useTheme } from "../../contexts/ThemeContext";
import { useResponsive } from "../../hooks/useResponsive";

type Option = { key: string; label: string };

type PillToggleProps = {
  options: Option[];
  value: string;
  onChange: (key: string) => void;
  style?: ViewStyle | ViewStyle[];
};

export default function PillToggle({
  options,
  value,
  onChange,
  style,
}: PillToggleProps): React.JSX.Element {
  const theme = useTheme();
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(
    () => createStyles(theme, ms, fontScale),
    [theme, ms, fontScale]
  );

  return (
    <View style={[styles.container, style]}>
      {options.map((opt) => {
        const selected = opt.key === value;
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => onChange(opt.key)}
            activeOpacity={0.85}
            style={[styles.item, selected && styles.itemSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text
              style={[styles.text, selected && styles.textSelected]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (
  theme: AppTheme,
  ms: (size: number, factor?: number) => number,
  fontScale: number
) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      backgroundColor: theme.colors.surface.muted,
      marginHorizontal: theme.spacing.lg,
      borderRadius: theme.radius.md,
      padding: ms(3, 0.05),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.soft,
      gap: ms(2, 0.05),
    },
    item: {
      flex: 1,
      minHeight: ms(44, 0.1),
      paddingVertical: Math.max(ms(10, 0.1), ms(8, 0.1) * fontScale),
      borderRadius: ms(10, 0.1),
      alignItems: "center",
      justifyContent: "center",
    },
    itemSelected: {
      backgroundColor: theme.colors.brand.navy[800],
    },
    text: {
      color: theme.colors.text.muted,
      fontSize: ms(14, 0.2) * fontScale,
      fontWeight: "500",
    },
    textSelected: {
      color: theme.colors.text.header,
      fontWeight: "600",
    },
  });
