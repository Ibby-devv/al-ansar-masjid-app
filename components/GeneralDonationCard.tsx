// ============================================================================
// COMPONENT: GeneralDonationCard
// Location: components/GeneralDonationCard.tsx
// Quiet row for general donation when campaigns are present
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
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="General donation"
    >
      <View style={styles.iconContainer}>
        <Ionicons name="heart-outline" size={ms(22, 0.2)} color={theme.colors.icon.brand} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>General donation</Text>
        <Text style={styles.description}>
          Daily operations and community programs
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={ms(20, 0.2)} color={theme.colors.icon.muted} />
    </TouchableOpacity>
  );
}

const createStyles = (theme: AppTheme, ms: (size: number, scale?: number) => number, fontScale: number) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(14, 0.1),
    paddingVertical: ms(14, 0.1),
    marginBottom: ms(16, 0.1),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border.soft,
  },
  iconContainer: {
    width: ms(44, 0.2),
    height: ms(44, 0.2),
    borderRadius: ms(12, 0.1),
    backgroundColor: theme.colors.accent.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: ms(16, 0.2) * fontScale,
    fontWeight: '600',
    color: theme.colors.text.strong,
    marginBottom: ms(2, 0.05),
  },
  description: {
    fontSize: ms(13, 0.2) * fontScale,
    color: theme.colors.text.muted,
    lineHeight: ms(18, 0.2),
  },
});
