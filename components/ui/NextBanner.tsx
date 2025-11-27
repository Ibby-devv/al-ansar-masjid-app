import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import type { AppTheme } from "../../hooks/useAppTheme";

type NextBannerProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  text: string;
  style?: ViewStyle | ViewStyle[];
};

export default function NextBanner({ icon = "flash", text, style }: NextBannerProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  return (
    <View style={[styles.container, style]}>
      <Ionicons name={icon as any} size={24} color={theme.colors.brand.gold[600]} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.accent.amberSoft,
    borderColor: theme.colors.brand.gold[400] || theme.colors.accent.amber,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    marginBottom: 12,
  },
  text: {
    color: theme.colors.brand.gold[600],
    fontSize: 16,
    fontWeight: "800",
  },
});
