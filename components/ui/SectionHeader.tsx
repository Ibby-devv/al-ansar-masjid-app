import React, { useMemo } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import type { AppTheme } from "../../hooks/useAppTheme";
import Badge from "./Badge";

type SectionHeaderProps = {
  title: string;
  containerStyle?: ViewStyle | ViewStyle[];
  rightBadge?: { label: string; bg: string; text: string } | null;
};

export default function SectionHeader({
  title,
  containerStyle,
  rightBadge,
}: SectionHeaderProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.title}>{title}</Text>
      {rightBadge ? (
        <Badge
          label={rightBadge.label}
          bgColor={rightBadge.bg}
          textColor={rightBadge.text}
          uppercase={false}
        />
      ) : null}
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: theme.colors.surface.muted,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.base,
    zIndex: 2,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text.base,
  },
});
