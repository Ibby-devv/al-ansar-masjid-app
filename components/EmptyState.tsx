import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import type { AppTheme } from '../hooks/useAppTheme';

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
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
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
        return theme.colors.error[500];
      default:
        return theme.colors.brand.navy[700];
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, variant === 'error' && styles.iconContainerError]}>
        <Ionicons 
          name={icon || getDefaultIcon()} 
          size={48} 
          color={getIconColor()} 
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xxl,
    minHeight: 200,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surface.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  iconContainerError: {
    backgroundColor: theme.colors.error[100],
  },
  title: {
    fontSize: theme.typography.h3,
    fontWeight: '700',
    color: theme.colors.text.strong,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: theme.typography.body,
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
});
