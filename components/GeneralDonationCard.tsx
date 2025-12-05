// ============================================================================
// COMPONENT: GeneralDonationCard
// Location: components/GeneralDonationCard.tsx
// Displays general donation option when campaigns are present
// ============================================================================

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { AppTheme, useTheme } from '../contexts/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';

interface GeneralDonationCardProps {
  onPress: () => void;
}

export default function GeneralDonationCard({ onPress }: GeneralDonationCardProps): React.JSX.Element {
  const theme = useTheme();
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, ms, fontScale), [theme, ms, fontScale]);
  
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

const createStyles = (theme: AppTheme, ms: (size: number, scale?: number) => number, fontScale: number) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: ms(16, 0.1),
    padding: ms(16, 0.1),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(16, 0.1),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: ms(4, 0.05),
    borderLeftColor: theme.colors.accent.green,
  },
  iconContainer: {
    width: ms(56, 0.2),
    height: ms(56, 0.2),
    borderRadius: ms(28, 0.1),
    backgroundColor: theme.colors.accent.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(16, 0.1),
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: ms(18, 0.2) * fontScale,
    fontWeight: 'bold',
    color: theme.colors.text.strong,
    marginBottom: ms(4, 0.1),
  },
  description: {
    fontSize: ms(14, 0.2) * fontScale,
    color: theme.colors.text.muted,
    lineHeight: ms(18, 0.2),
  },
});
