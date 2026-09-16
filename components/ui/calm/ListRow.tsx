import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
  useWindowDimensions,
} from "react-native";
import { AppTheme, useTheme } from "../../../contexts/ThemeContext";
import { useResponsive } from "../../../hooks/useResponsive";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface ListRowProps {
  title: string;
  subtitle?: string;
  hint?: string;
  icon?: IconName;
  /** Soft well behind the icon; defaults to blueSoft */
  iconColor?: string;
  iconBackground?: string;
  /** Custom icon node (e.g. brand Instagram glyph) */
  iconNode?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  selected?: boolean;
  right?: React.ReactNode;
  /** Hide bottom hairline divider */
  last?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export default function ListRow({
  title,
  subtitle,
  hint,
  icon,
  iconColor,
  iconBackground,
  iconNode,
  onPress,
  showChevron,
  selected = false,
  right,
  last = false,
  style,
  accessibilityLabel,
}: ListRowProps): React.JSX.Element {
  const theme = useTheme();
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(
    () => createStyles(theme, ms, fontScale),
    [theme, ms, fontScale]
  );

  const chevron = showChevron ?? Boolean(onPress);
  const tint = iconColor ?? theme.colors.brand.navy[700];
  const well = iconBackground ?? theme.colors.accent.blueSoft;

  const content = (
    <>
      {(icon || iconNode) && (
        <View style={[styles.iconWell, { backgroundColor: well }]}>
          {iconNode ??
            (icon ? (
              <Ionicons name={icon} size={ms(20, 0.2)} color={tint} />
            ) : null)}
        </View>
      )}
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      {right}
      {selected ? (
        <Ionicons
          name="checkmark-circle"
          size={ms(22, 0.2)}
          color={theme.colors.brand.navy[700]}
        />
      ) : null}
      {chevron && !right && !selected ? (
        <Ionicons
          name="chevron-forward"
          size={ms(18, 0.2)}
          color={theme.colors.text.subtle}
        />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.row, !last && styles.divider, style]}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ selected }}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[styles.row, !last && styles.divider, style]}
      accessibilityLabel={accessibilityLabel ?? title}
    >
      {content}
    </View>
  );
}

const createStyles = (
  theme: AppTheme,
  ms: (size: number, factor?: number) => number,
  fontScale: number
) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.md,
      minHeight: ms(56, 0.1),
    },
    divider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.soft,
    },
    iconWell: {
      width: ms(36, 0.2),
      height: ms(36, 0.2),
      borderRadius: ms(10, 0.15),
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    copy: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: ms(15, 0.2) * fontScale,
      fontWeight: "500",
      color: theme.colors.text.strong,
    },
    subtitle: {
      marginTop: ms(2, 0.05),
      fontSize: ms(13, 0.2) * fontScale,
      color: theme.colors.text.muted,
      lineHeight: ms(18, 0.2),
    },
    hint: {
      marginTop: ms(2, 0.05),
      fontSize: ms(12, 0.15) * fontScale,
      color: theme.colors.text.subtle,
    },
  });
