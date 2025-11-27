import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import type { AppTheme } from '../hooks/useAppTheme';
import { Donation } from '../types/donation';

interface DonationAnalyticsCardProps {
  donations: Donation[];
  subscriptions: Donation[];
}

export default function DonationAnalyticsCard({
  donations,
  subscriptions,
}: DonationAnalyticsCardProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  // Calculate analytics
  const totalOneTime = donations.reduce((sum, d) => sum + d.amount, 0) / 100; // Convert from cents
  const totalRecurring = subscriptions.reduce((sum, s) => sum + s.amount, 0) / 100;
  const totalDonated = totalOneTime + totalRecurring;
  
  const totalCount = donations.length + subscriptions.length;
  const averageDonation = totalCount > 0 ? totalDonated / totalCount : 0;

  // Breakdown by donation type
  const typeBreakdown: { [key: string]: number } = {};
  [...donations, ...subscriptions].forEach((d) => {
    const type = d.donation_type_label || 'General';
    typeBreakdown[type] = (typeBreakdown[type] || 0) + d.amount / 100;
  });

  const topTypes = Object.entries(typeBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const getColorForIndex = (index: number): string => {
    const colors = [
      theme.colors.brand.navy[700],
      theme.colors.accent.green,
      theme.colors.accent.blue,
    ];
    return colors[index] || theme.colors.brand.navy[700];
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="stats-chart" size={24} color={theme.colors.brand.navy[700]} />
        <Text style={styles.headerTitle}>Your Impact</Text>
      </View>

      {/* Main Stats */}
      <View style={styles.statsGrid}>
        {/* Total Donated */}
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${totalDonated.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Donated</Text>
        </View>

        {/* Total Donations */}
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalCount}</Text>
          <Text style={styles.statLabel}>Donations</Text>
        </View>

        {/* Average */}
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${averageDonation.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Average</Text>
        </View>

        {/* Active Subscriptions */}
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{subscriptions.length}</Text>
          <Text style={styles.statLabel}>Recurring</Text>
        </View>
      </View>

      {/* Breakdown Section */}
      {topTypes.length > 0 && (
        <>
          <View style={styles.divider} />
          
          <View style={styles.breakdownSection}>
            <Text style={styles.breakdownTitle}>Top Categories</Text>
            {topTypes.map(([type, amount], index) => {
              const percentage = (amount / totalDonated) * 100;
              return (
                <View key={type} style={styles.breakdownRow}>
                  <View style={styles.breakdownInfo}>
                    <View
                      style={[
                        styles.breakdownDot,
                        { backgroundColor: getColorForIndex(index) },
                      ]}
                    />
                    <Text style={styles.breakdownType}>{type}</Text>
                  </View>
                  <View style={styles.breakdownValues}>
                    <Text style={styles.breakdownAmount}>${amount.toFixed(2)}</Text>
                    <Text style={styles.breakdownPercentage}>
                      {percentage.toFixed(0)}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}

      {/* Thank You Message */}
      <View style={styles.thankYouBox}>
        <Text style={styles.thankYouText}>
          JazakAllah Khair for your generous support! 🌙
        </Text>
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadow.soft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.typography.h3,
    fontWeight: 'bold',
    color: theme.colors.text.strong,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface.soft,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.brand.navy[700],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: theme.typography.small,
    color: theme.colors.text.muted,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.base,
    marginVertical: theme.spacing.lg,
  },
  breakdownSection: {
    marginBottom: theme.spacing.md,
  },
  breakdownTitle: {
    fontSize: theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text.strong,
    marginBottom: theme.spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  breakdownInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  breakdownDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  breakdownType: {
    fontSize: theme.typography.body,
    color: theme.colors.text.base,
    flex: 1,
  },
  breakdownValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  breakdownAmount: {
    fontSize: theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text.strong,
    minWidth: 70,
    textAlign: 'right',
  },
  breakdownPercentage: {
    fontSize: theme.typography.small,
    color: theme.colors.text.muted,
    minWidth: 35,
    textAlign: 'right',
  },
  thankYouBox: {
    backgroundColor: theme.colors.accent.blueSoft,
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    marginTop: theme.spacing.sm,
  },
  thankYouText: {
    fontSize: theme.typography.body,
    color: theme.colors.brand.navy[700],
    textAlign: 'center',
  },
});
