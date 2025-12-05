// ============================================================================
// COMPONENT: CampaignCard
// Location: components/CampaignCard.tsx
// Displays a campaign with progress bar and donate button
// ============================================================================

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import type { AppTheme } from '../hooks/useAppTheme';
import { Campaign } from '../hooks/useCampaigns';
import { useResponsive } from '../hooks/useResponsive';

interface CampaignCardProps {
  campaign: Campaign;
  onPress: () => void;
}

export default function CampaignCard({ campaign, onPress }: CampaignCardProps): React.JSX.Element {
  const theme = useTheme();
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, ms, fontScale), [theme, ms, fontScale]);
  
  // Calculate progress percentage
  const progress = campaign.goal_amount > 0 
    ? (campaign.current_amount / campaign.goal_amount) * 100 
    : 0;

  // Animated value for smooth progress bar transitions
  const animatedProgress = useRef(new Animated.Value(progress)).current;

  // Animate progress bar when it changes (smooth transition)
  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 800, // 800ms smooth transition
      useNativeDriver: false, // width animation requires non-native driver
    }).start();
  }, [progress, animatedProgress]);

  // Format currency
  const formatCurrency = (cents: number): string => {
    return `$${(cents / 100).toLocaleString('en-AU', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    })}`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Image (if provided) */}
      {campaign.image_url && (
        <Image 
          source={{ uri: campaign.image_url }} 
          style={styles.image}
          resizeMode="cover"
        />
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {campaign.title}
        </Text>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {campaign.description}
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill, 
                { 
                  width: animatedProgress.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp',
                  }),
                  backgroundColor: progress >= 100 ? theme.colors.progress.complete : theme.colors.progress.fill
                }
              ]} 
            />
          </View>

          {/* Progress Text */}
          <View style={styles.progressTextRow}>
            <Text style={styles.progressAmount}>
              {formatCurrency(campaign.current_amount)} raised
            </Text>
            <Text style={styles.progressPercentage}>
              {progress.toFixed(0)}%
            </Text>
          </View>

          {/* Goal */}
          <View style={styles.goalRow}>
            <Text style={styles.goalText}>
              Goal: {formatCurrency(campaign.goal_amount)}
            </Text>
            {progress >= 100 && (
              <Text style={styles.goalReached}>✅ Goal Reached!</Text>
            )}
          </View>
        </View>

        {/* Donate Button */}
        <TouchableOpacity style={styles.donateButton} onPress={onPress}>
          <Ionicons name="heart" size={20} color={theme.colors.text.header} />
          <Text style={styles.donateButtonText}>Donate Now</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: AppTheme, ms: (size: number, factor?: number) => number, fontScale: number) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: ms(16, 0.1),
    overflow: 'hidden',
    marginBottom: ms(16, 0.1),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: ms(180, 0.2),
    backgroundColor: theme.colors.border.base,
  },
  content: {
    padding: ms(16, 0.1),
  },
  title: {
    fontSize: ms(20, 0.3) * fontScale,
    fontWeight: 'bold',
    color: theme.colors.text.strong,
    marginBottom: ms(8, 0.1),
  },
  description: {
    fontSize: ms(14, 0.2) * fontScale,
    color: theme.colors.text.muted,
    lineHeight: ms(20, 0.2),
    marginBottom: ms(16, 0.1),
  },
  progressSection: {
    marginBottom: ms(16, 0.1),
  },
  progressBar: {
    height: ms(12, 0.1),
    backgroundColor: theme.colors.progress.background,
    borderRadius: ms(6, 0.05),
    overflow: 'hidden',
    marginBottom: ms(8, 0.1),
  },
  progressFill: {
    height: '100%',
    borderRadius: ms(6, 0.05),
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ms(4, 0.1),
  },
  progressAmount: {
    fontSize: ms(14, 0.2) * fontScale,
    color: theme.colors.text.muted,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: ms(14, 0.2) * fontScale,
    color: theme.colors.text.muted,
    fontWeight: '600',
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalText: {
    fontSize: ms(15, 0.2) * fontScale,
    color: theme.colors.text.strong,
    fontWeight: '700',
  },
  goalReached: {
    fontSize: ms(13, 0.2) * fontScale,
    color: theme.colors.progress.complete,
    fontWeight: '700',
  },
  donateButton: {
    backgroundColor: theme.colors.brand.navy[700],
    borderRadius: ms(12, 0.1),
    paddingVertical: ms(14, 0.1),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(8, 0.1),
  },
  donateButtonText: {
    color: theme.colors.text.header,
    fontSize: ms(16, 0.2) * fontScale,
    fontWeight: 'bold',
  },
});
