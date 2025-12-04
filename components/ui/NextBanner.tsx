import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View, ViewStyle, useWindowDimensions } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import type { AppTheme } from "../../hooks/useAppTheme";

type NextBannerProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  text: string;
  style?: ViewStyle | ViewStyle[];
};

export default function NextBanner({ icon = "flash", text, style }: NextBannerProps): React.JSX.Element {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, fontScale), [theme, fontScale]);
  
  return (
    <View style={[styles.container, style]}>
      <Ionicons name={icon as any} size={24} color={theme.colors.brand.gold[600]} />
      <Text 
        style={styles.text}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {text}
      </Text>
    </View>
  );
}

const createStyles = (theme: AppTheme, fontScale: number) => StyleSheet.create({
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
    flex: 1,
    flexShrink: 1,
    color: theme.colors.brand.gold[600],
    fontSize: 16 * fontScale,
    fontWeight: "800",
  },
});
