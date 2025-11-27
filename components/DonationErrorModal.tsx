import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import type { AppTheme } from '../hooks/useAppTheme';

export interface DonationError {
  type: 'network' | 'validation' | 'payment' | 'server' | 'unknown';
  message: string;
  originalError?: any;
}

interface DonationErrorModalProps {
  visible: boolean;
  onClose: () => void;
  onRetry?: () => void;
  error: DonationError | null;
}

const getErrorDetails = (error: DonationError) => {
  switch (error.type) {
    case 'network':
      return {
        icon: 'cloud-offline-outline' as const,
        title: 'Connection Issue',
        description: 'Please check your internet connection and try again.',
        showRetry: true,
      };
    case 'validation':
      return {
        icon: 'alert-circle-outline' as const,
        title: 'Invalid Information',
        description: error.message,
        showRetry: false,
      };
    case 'payment':
      return {
        icon: 'card-outline' as const,
        title: 'Payment Failed',
        description: error.message || 'Your payment could not be processed. Please check your card details and try again.',
        showRetry: true,
      };
    case 'server':
      return {
        icon: 'server-outline' as const,
        title: 'Server Error',
        description: 'Our server encountered an issue. Please try again in a moment.',
        showRetry: true,
      };
    default:
      return {
        icon: 'warning-outline' as const,
        title: 'Something Went Wrong',
        description: error.message || 'An unexpected error occurred. Please try again.',
        showRetry: true,
      };
  }
};

export default function DonationErrorModal({
  visible,
  onClose,
  onRetry,
  error,
}: DonationErrorModalProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  if (!error) {
    return (
      <Modal visible={false} transparent>
        <View />
      </Modal>
    );
  }

  const details = getErrorDetails(error);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Error Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.errorCircle}>
                <Ionicons name={details.icon} size={60} color={theme.colors.text.inverse} />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>{details.title}</Text>

            {/* Description */}
            <Text style={styles.description}>{details.description}</Text>

            {/* Common Solutions */}
            {error.type === 'payment' && (
              <View style={styles.solutionsCard}>
                <Text style={styles.solutionsTitle}>Common Solutions:</Text>
                <View style={styles.solutionItem}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.accent.green} />
                  <Text style={styles.solutionText}>
                    Check that your card details are correct
                  </Text>
                </View>
                <View style={styles.solutionItem}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.accent.green} />
                  <Text style={styles.solutionText}>
                    Ensure you have sufficient funds
                  </Text>
                </View>
                <View style={styles.solutionItem}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.accent.green} />
                  <Text style={styles.solutionText}>
                    Contact your bank if the issue persists
                  </Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              {details.showRetry && onRetry && (
                <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                  <Ionicons name="refresh" size={20} color={theme.colors.text.inverse} />
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  details.showRetry && onRetry && styles.closeButtonSecondary
                ]}
                onPress={onClose}
              >
                <Text
                  style={[
                    styles.closeButtonText,
                    details.showRetry && onRetry && styles.closeButtonTextSecondary
                  ]}
                >
                  {details.showRetry && onRetry ? 'Cancel' : 'Close'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Support Info */}
            <View style={styles.supportBox}>
              <Ionicons name="information-circle" size={20} color={theme.colors.brand.navy[700]} />
              <Text style={styles.supportText}>
                Need help? Contact us at support@alansar.org.au
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  container: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radius.xl,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    overflow: 'hidden',
    ...theme.shadow.header,
  },
  scrollView: {
    flexGrow: 1,
  },
  content: {
    padding: theme.spacing.xxl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  errorCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.error[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.soft,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.colors.text.strong,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: theme.spacing.lg,
    color: theme.colors.text.muted,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  solutionsCard: {
    backgroundColor: theme.colors.surface.soft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  solutionsTitle: {
    fontSize: theme.spacing.lg,
    fontWeight: '600',
    color: theme.colors.text.strong,
    marginBottom: theme.spacing.md,
  },
  solutionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  solutionText: {
    flex: 1,
    fontSize: theme.typography.body,
    color: theme.colors.text.base,
    lineHeight: 20,
  },
  actions: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.brand.navy[700],
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
  },
  retryButtonText: {
    fontSize: theme.spacing.lg,
    fontWeight: 'bold',
    color: theme.colors.text.inverse,
  },
  closeButton: {
    backgroundColor: theme.colors.brand.navy[700],
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  closeButtonSecondary: {
    backgroundColor: theme.colors.surface.soft,
    borderWidth: 2,
    borderColor: theme.colors.border.base,
  },
  closeButtonText: {
    fontSize: theme.spacing.lg,
    fontWeight: '600',
    color: theme.colors.text.inverse,
  },
  closeButtonTextSecondary: {
    color: theme.colors.text.strong,
  },
  supportBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.accent.blueSoft,
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
  },
  supportText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.brand.navy[700],
    lineHeight: 18,
  },
});
