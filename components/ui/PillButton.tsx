import React, { useMemo } from "react";
import { StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle, useWindowDimensions } from "react-native";
import { useTheme, AppTheme } from "../../contexts/ThemeContext";
import { useResponsive } from "../../hooks/useResponsive";

type PillButtonProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
};

export default function PillButton({ label, selected, onPress, style, textStyle }: PillButtonProps): React.JSX.Element {
  const theme = useTheme();
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, ms, fontScale), [theme, ms, fontScale]);
  
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.base,
        selected ? styles.selected : styles.unselected,
        style,
      ]}
    >
      <Text style={[styles.textBase, selected ? styles.textSelected : styles.textUnselected, textStyle]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const createStyles = (theme: AppTheme, ms: (size: number, factor?: number) => number, fontScale: number) => StyleSheet.create({
  base: {
    paddingVertical: ms(10, 0.1),
    paddingHorizontal: ms(14, 0.1),
    borderRadius: ms(22, 0.2),
    borderWidth: ms(1, 0.05),
    marginRight: ms(8, 0.05),
    minHeight: ms(38, 0.1),
  },
  unselected: {
    backgroundColor: theme.colors.border.soft,
    borderColor: theme.colors.border.base,
  },
  selected: {
    backgroundColor: theme.colors.brand.navy[700],
    borderColor: theme.colors.brand.navy[700],
    shadowColor: theme.colors.brand.navy[700],
    shadowOffset: { width: 0, height: ms(2, 0.05) },
    shadowOpacity: 0.25,
    shadowRadius: ms(4, 0.1),
    elevation: 2,
  },
  textBase: {
    fontSize: ms(14, 0.2) * fontScale,
    fontWeight: "800",
    letterSpacing: ms(0.2, 0.05),
    lineHeight: ms(18, 0.2) * fontScale,
  },
  textUnselected: {
    color: theme.colors.text.base,
  },
  textSelected: {
    color: theme.colors.text.header,
  },
});
