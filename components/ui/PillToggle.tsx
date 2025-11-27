import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import type { AppTheme } from "../../hooks/useAppTheme";

type Option = { key: string; label: string };

type PillToggleProps = {
  options: Option[];
  value: string;
  onChange: (key: string) => void;
  style?: ViewStyle | ViewStyle[];
};

export default function PillToggle({ options, value, onChange, style }: PillToggleProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  return (
    <View style={[styles.container, style]}>
      {options.map((opt) => {
        const selected = opt.key === value;
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => onChange(opt.key)}
            activeOpacity={0.9}
            style={[styles.item, selected && styles.itemSelected]}
          >
            <Text style={[styles.text, selected && styles.textSelected]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface.card,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
    padding: 3,
    ...theme.shadow.soft,
  },
  item: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    alignItems: "center",
  },
  itemSelected: {
    backgroundColor: theme.colors.brand.navy[700],
    shadowColor: theme.colors.brand.navy[700],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    color: theme.colors.text.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  textSelected: {
    color: theme.colors.text.header,
  },
});
