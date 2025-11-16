import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '../constants/theme';

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
        return Theme.colors.text.muted;
      case 'error':
        return Theme.colors.error[500];
      default:
        return Theme.colors.brand.navy[700];
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xxl,
    minHeight: 200,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.colors.surface.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.lg,
  },
  iconContainerError: {
    backgroundColor: Theme.colors.error[100],
  },
  title: {
    fontSize: Theme.typography.h3,
    fontWeight: '700',
    color: Theme.colors.text.strong,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: Theme.typography.body,
    color: Theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
});
