import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '../constants/theme';
import { Donation } from '../types/donation';

interface DonationAnalyticsCardProps {
  donations: Donation[];
  subscriptions: Donation[];
}

export default function DonationAnalyticsCard({
  donations,
  subscriptions,
}: DonationAnalyticsCardProps) {
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="stats-chart" size={24} color={Theme.colors.brand.navy[700]} />
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

const getColorForIndex = (index: number): string => {
  const colors = [
    Theme.colors.brand.navy[700],
    Theme.colors.accent.green,
    Theme.colors.accent.blue,
  ];
  return colors[index] || Theme.colors.brand.navy[700];
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.surface.base,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    ...Theme.shadow.soft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  headerTitle: {
    fontSize: Theme.typography.h3,
    fontWeight: 'bold',
    color: Theme.colors.text.strong,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Theme.colors.surface.soft,
    padding: Theme.spacing.lg,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.brand.navy[700],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: Theme.typography.small,
    color: Theme.colors.text.muted,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.border.base,
    marginVertical: Theme.spacing.lg,
  },
  breakdownSection: {
    marginBottom: Theme.spacing.md,
  },
  breakdownTitle: {
    fontSize: Theme.typography.body,
    fontWeight: '600',
    color: Theme.colors.text.strong,
    marginBottom: Theme.spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  breakdownInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    flex: 1,
  },
  breakdownDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  breakdownType: {
    fontSize: Theme.typography.body,
    color: Theme.colors.text.base,
    flex: 1,
  },
  breakdownValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  breakdownAmount: {
    fontSize: Theme.typography.body,
    fontWeight: '600',
    color: Theme.colors.text.strong,
    minWidth: 70,
    textAlign: 'right',
  },
  breakdownPercentage: {
    fontSize: Theme.typography.small,
    color: Theme.colors.text.muted,
    minWidth: 35,
    textAlign: 'right',
  },
  thankYouBox: {
    backgroundColor: Theme.colors.accent.blueSoft,
    padding: Theme.spacing.md,
    borderRadius: Theme.radius.sm,
    marginTop: Theme.spacing.sm,
  },
  thankYouText: {
    fontSize: Theme.typography.body,
    color: Theme.colors.brand.navy[700],
    textAlign: 'center',
  },
});
