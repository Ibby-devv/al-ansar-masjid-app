import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import type { AppTheme } from '../hooks/useAppTheme';
import { useResponsive } from '../hooks/useResponsive';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  variant?: 'offline' | 'empty' | 'error';
}

export default function EmptyState({
  icon,
  title,
  message,
  variant = 'empty',
}: EmptyStateProps): React.JSX.Element {
  const { theme } = useTheme();
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, ms, fontScale), [theme, ms, fontScale]);
  
  const getDefaultIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (variant) {
      case 'offline':
        return 'cloud-offline-outline';
      case 'error':
        return 'alert-circle-outline';
      default:
        return 'information-circle-outline';
    }
  };

  const getIconColor = (): string => {
    switch (variant) {
      case 'offline':
        return theme.colors.text.muted;
      case 'error':
        return theme.colors.accent.amber;
      default:
        return theme.colors.accent.blue;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, variant === 'error' && styles.iconContainerError]}>
        <Ionicons 
          name={icon || getDefaultIcon()} 
          size={ms(48, 0.2)} 
          color={getIconColor()} 
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const createStyles = (theme: AppTheme, ms: (size: number, factor?: number) => number, fontScale: number) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xxl,
    minHeight: ms(200, 0.2),
  },
  iconContainer: {
    width: ms(80, 0.2),
    height: ms(80, 0.2),
    borderRadius: ms(40, 0.2),
    backgroundColor: theme.colors.surface.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: ms(1, 0.05),
    borderColor: theme.colors.border.base,
  },
  iconContainerError: {
    backgroundColor: theme.colors.accent.amberSoft,
    borderColor: theme.colors.accent.amber,
  },
  title: {
    fontSize: theme.typography.h3 * fontScale,
    fontWeight: '700',
    color: theme.colors.text.strong,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: theme.typography.body * fontScale,
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: ms(22, 0.2) * fontScale,
    maxWidth: ms(300, 0.2),
  },
});
