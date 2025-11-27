import React, { useMemo } from "react";
import { StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import type { AppTheme } from "../../hooks/useAppTheme";

type PillButtonProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
};

export default function PillButton({ label, selected, onPress, style, textStyle }: PillButtonProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
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

const createStyles = (theme: AppTheme) => StyleSheet.create({
  base: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    marginRight: 8,
    minHeight: 38,
  },
  unselected: {
    backgroundColor: theme.colors.border.soft,
    borderColor: theme.colors.border.base,
  },
  selected: {
    backgroundColor: theme.colors.brand.navy[700],
    borderColor: theme.colors.brand.navy[700],
    shadowColor: theme.colors.brand.navy[700],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  textBase: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  textUnselected: {
    color: theme.colors.text.base,
  },
  textSelected: {
    color: theme.colors.text.header,
  },
});
