// ============================================================================
// COMPONENT: CampaignCard
// Location: components/CampaignCard.tsx
// Displays a campaign with progress bar and donate button
// ============================================================================

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import type { AppTheme } from '../hooks/useAppTheme';
import { Campaign } from '../hooks/useCampaigns';

interface CampaignCardProps {
  campaign: Campaign;
  onPress: () => void;
}

export default function CampaignCard({ campaign, onPress }: CampaignCardProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
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
          <Ionicons name="heart" size={20} color={theme.colors.text.inverse} />
          <Text style={styles.donateButtonText}>Donate Now</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: theme.colors.border.base,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.strong,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: theme.colors.text.muted,
    lineHeight: 20,
    marginBottom: 16,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 12,
    backgroundColor: theme.colors.progress.background,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressAmount: {
    fontSize: 14,
    color: theme.colors.text.muted,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 14,
    color: theme.colors.text.muted,
    fontWeight: '600',
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalText: {
    fontSize: 15,
    color: theme.colors.text.strong,
    fontWeight: '700',
  },
  goalReached: {
    fontSize: 13,
    color: theme.colors.progress.complete,
    fontWeight: '700',
  },
  donateButton: {
    backgroundColor: theme.colors.brand.navy[700],
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  donateButtonText: {
    color: theme.colors.text.inverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
