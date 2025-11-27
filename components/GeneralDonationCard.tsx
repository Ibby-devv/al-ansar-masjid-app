// ============================================================================
// COMPONENT: GeneralDonationCard
// Location: components/GeneralDonationCard.tsx
// Displays general donation option when campaigns are present
// ============================================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import type { AppTheme } from '../hooks/useAppTheme';

interface GeneralDonationCardProps {
  onPress: () => void;
}

export default function GeneralDonationCard({ onPress }: GeneralDonationCardProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Ionicons name="heart" size={32} color={theme.colors.brand.navy[700]} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>💚 General Donation</Text>
        <Text style={styles.description}>
          Support our daily operations and community programs
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={24} color={theme.colors.text.muted} />
    </TouchableOpacity>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent.green,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.accent.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.strong,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: theme.colors.text.muted,
    lineHeight: 18,
  },
});
