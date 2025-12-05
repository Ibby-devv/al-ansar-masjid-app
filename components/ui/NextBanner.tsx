import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View, ViewStyle, useWindowDimensions } from "react-native";
import { AppTheme, useTheme } from "../../contexts/ThemeContext";
import { useResponsive } from "../../hooks/useResponsive";

type NextBannerProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  text: string;
  style?: ViewStyle | ViewStyle[];
};

export default function NextBanner({ icon = "flash", text, style }: NextBannerProps): React.JSX.Element {
  const theme = useTheme();
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, ms, fontScale), [theme, ms, fontScale]);
  
  return (
    <View style={[styles.container, style]}>
      <Ionicons name={icon as any} size={ms(24, 0.2)} color={theme.colors.brand.gold[600]} />
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

const createStyles = (theme: AppTheme, ms: (size: number, factor?: number) => number, fontScale: number) => StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(10, 0.1),
    paddingHorizontal: ms(16, 0.1),
    paddingVertical: ms(12, 0.1),
    backgroundColor: theme.colors.accent.amberSoft,
    borderColor: theme.colors.brand.gold[400] || theme.colors.accent.amber,
    borderWidth: ms(1, 0.05),
    borderRadius: theme.radius.md,
    marginBottom: ms(12, 0.1),
  },
  text: {
    flex: 1,
    flexShrink: 1,
    color: theme.colors.brand.gold[600],
    fontSize: ms(16, 0.2) * fontScale,
    fontWeight: "800",
  },
});
