import React, { useMemo } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useTheme, AppTheme } from "../../contexts/ThemeContext";

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
};

export default function Card({ children, style }: CardProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  return <View style={[styles.card, style]}>{children}</View>;
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    ...theme.shadow.soft,
  },
});
