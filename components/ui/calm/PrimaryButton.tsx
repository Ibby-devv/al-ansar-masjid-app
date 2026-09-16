import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
  useWindowDimensions,
} from "react-native";
import { AppTheme, useTheme } from "../../../contexts/ThemeContext";
import { useResponsive } from "../../../hooks/useResponsive";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export default function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  icon,
  iconColor,
  style,
  accessibilityLabel,
}: PrimaryButtonProps): React.JSX.Element {
  const theme = useTheme();
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(
    () => createStyles(theme, ms, fontScale),
    [theme, ms, fontScale]
  );

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.text.header} />
      ) : (
        <>
          {icon ? (
            <Ionicons
              name={icon}
              size={ms(20, 0.2)}
              color={iconColor ?? theme.colors.text.header}
            />
          ) : null}
          <Text style={styles.label}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (
  theme: AppTheme,
  ms: (size: number, factor?: number) => number,
  fontScale: number
) =>
  StyleSheet.create({
    button: {
      backgroundColor: theme.colors.brand.navy[800],
      borderRadius: theme.radius.lg,
      paddingVertical: theme.spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.sm,
      ...theme.shadow.header,
    },
    disabled: {
      backgroundColor: theme.colors.text.muted,
      shadowOpacity: 0,
      elevation: 0,
    },
    label: {
      color: theme.colors.text.header,
      fontSize: ms(16, 0.2) * fontScale,
      fontWeight: "600",
    },
  });
