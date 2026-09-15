import React, { useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useTheme, AppTheme } from '../contexts/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
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
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, ms, fontScale), [theme, ms, fontScale]);

  const totalOneTime = donations.reduce((sum, d) => sum + d.amount, 0) / 100;
  const totalRecurring = subscriptions.reduce((sum, s) => sum + s.amount, 0) / 100;
  const totalDonated = totalOneTime + totalRecurring;

  const totalCount = donations.length + subscriptions.length;
  const averageDonation = totalCount > 0 ? totalDonated / totalCount : 0;

  const causeBreakdown: { [key: string]: number } = {};
  [...donations, ...subscriptions].forEach((d) => {
    const cause = d.donation_type_label || 'General donation';
    causeBreakdown[cause] = (causeBreakdown[cause] || 0) + d.amount / 100;
  });

  const topCauses = Object.entries(causeBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const getColorForIndex = (index: number): string => {
    const colors = [
      theme.colors.brand.navy[700],
      theme.colors.brand.gold[600],
      theme.colors.accent.green,
    ];
    return colors[index] || theme.colors.brand.navy[700];
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Your impact</Text>
      <Text style={styles.headerSubtitle}>
        A quiet summary of your gifts to Al Ansar.
      </Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCell}>
          <Text style={styles.statValue}>${totalDonated.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total donated</Text>
        </View>

        <View style={styles.statCell}>
          <Text style={styles.statValue}>{totalCount}</Text>
          <Text style={styles.statLabel}>Donations</Text>
        </View>

        <View style={styles.statCell}>
          <Text style={styles.statValue}>${averageDonation.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Average</Text>
        </View>

        <View style={styles.statCell}>
          <Text style={styles.statValue}>{subscriptions.length}</Text>
          <Text style={styles.statLabel}>Recurring</Text>
        </View>
      </View>

      {topCauses.length > 0 && (
        <View style={styles.breakdownSection}>
          <Text style={styles.blockLabel}>Top causes</Text>
          {topCauses.map(([cause, amount], index) => {
            const percentage = totalDonated > 0 ? (amount / totalDonated) * 100 : 0;
            return (
              <View key={cause} style={styles.breakdownRow}>
                <View style={styles.breakdownInfo}>
                  <View
                    style={[
                      styles.breakdownDot,
                      { backgroundColor: getColorForIndex(index) },
                    ]}
                  />
                  <Text style={styles.breakdownCause} numberOfLines={1}>
                    {cause}
                  </Text>
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
      )}

      <Text style={styles.thankYouText}>
        JazakAllah Khair for your generous support.
      </Text>
    </View>
  );
}

const createStyles = (theme: AppTheme, ms: (size: number, factor?: number) => number, fontScale: number) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border.soft,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: ms(16, 0.2) * fontScale,
    fontWeight: '600',
    color: theme.colors.text.strong,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    marginTop: ms(4, 0.05),
    marginBottom: theme.spacing.lg,
    fontSize: ms(12, 0.15) * fontScale,
    color: theme.colors.text.muted,
    lineHeight: ms(17, 0.15),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statCell: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface.soft,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border.soft,
  },
  statValue: {
    fontSize: ms(20, 0.25) * fontScale,
    fontWeight: '700',
    color: theme.colors.brand.navy[800],
    marginBottom: ms(2, 0.05),
  },
  statLabel: {
    fontSize: ms(11, 0.15) * fontScale,
    color: theme.colors.text.muted,
  },
  breakdownSection: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border.soft,
  },
  blockLabel: {
    fontSize: ms(11, 0.15) * fontScale,
    fontWeight: '500',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.colors.text.muted,
    marginBottom: theme.spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  breakdownInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  breakdownDot: {
    width: ms(8, 0.05),
    height: ms(8, 0.05),
    borderRadius: ms(4, 0.05),
    flexShrink: 0,
  },
  breakdownCause: {
    fontSize: ms(13, 0.2) * fontScale,
    color: theme.colors.text.base,
    flex: 1,
  },
  breakdownValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flexShrink: 0,
  },
  breakdownAmount: {
    fontSize: ms(13, 0.2) * fontScale,
    fontWeight: '600',
    color: theme.colors.text.strong,
    minWidth: ms(64, 0.2),
    textAlign: 'right',
  },
  breakdownPercentage: {
    fontSize: ms(12, 0.15) * fontScale,
    color: theme.colors.text.muted,
    minWidth: ms(32, 0.1),
    textAlign: 'right',
  },
  thankYouText: {
    marginTop: theme.spacing.lg,
    fontSize: ms(12, 0.15) * fontScale,
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: ms(17, 0.15),
  },
});
