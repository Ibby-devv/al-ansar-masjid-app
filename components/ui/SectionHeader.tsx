import React, { useMemo } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import type { AppTheme } from "../../hooks/useAppTheme";
import { useResponsive } from "../../hooks/useResponsive";
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
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, ms, fontScale), [theme, ms, fontScale]);
  
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

const createStyles = (theme: AppTheme, ms: (size: number, factor?: number) => number, fontScale: number) => StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ms(16, 0.1),
    paddingVertical: ms(6, 0.05),
    backgroundColor: theme.colors.surface.muted,
    borderBottomWidth: ms(1, 0.05),
    borderBottomColor: theme.colors.border.base,
    zIndex: 2,
    elevation: 2,
  },
  title: {
    fontSize: ms(16, 0.2) * fontScale,
    fontWeight: "800",
    color: theme.colors.text.base,
  },
});
