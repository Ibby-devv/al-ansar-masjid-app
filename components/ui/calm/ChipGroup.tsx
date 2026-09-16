import React, { useMemo } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { AppTheme, useTheme } from "../../../contexts/ThemeContext";
import Chip, { type ChipTone } from "./Chip";

export type ChipOption = { key: string; label: string };

interface ChipGroupProps {
  options: ChipOption[];
  value: string;
  onChange: (key: string) => void;
  tone?: ChipTone;
  style?: StyleProp<ViewStyle>;
}

export default function ChipGroup({
  options,
  value,
  onChange,
  tone = "navy",
  style,
}: ChipGroupProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.row, style]}>
      {options.map((opt) => (
        <Chip
          key={opt.key}
          label={opt.label}
          selected={opt.key === value}
          onPress={() => onChange(opt.key)}
          tone={tone}
        />
      ))}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
    },
  });
