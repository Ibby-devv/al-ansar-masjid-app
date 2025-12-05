import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import type { AppTheme } from '../hooks/useAppTheme';
import { useResponsive } from '../hooks/useResponsive';

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
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, ms, fontScale), [theme, ms, fontScale]);
  
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
                <Ionicons name={details.icon} size={60} color={theme.colors.text.header} />
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
                  <Ionicons name="refresh" size={20} color={theme.colors.text.header} />
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

const createStyles = (theme: AppTheme, ms: (size: number, factor?: number) => number, fontScale: number) => StyleSheet.create({
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
    maxWidth: ms(500, 0.3),
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
    width: ms(120, 0.2),
    height: ms(120, 0.2),
    borderRadius: ms(60, 0.1),
    backgroundColor: theme.colors.error[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.soft,
  },
  title: {
    fontSize: ms(26, 0.3) * fontScale,
    fontWeight: 'bold',
    color: theme.colors.text.strong,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: ms(16, 0.2) * fontScale,
    color: theme.colors.text.muted,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: ms(24, 0.2),
  },
  solutionsCard: {
    backgroundColor: theme.colors.surface.soft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  solutionsTitle: {
    fontSize: ms(16, 0.2) * fontScale,
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
    fontSize: ms(14, 0.2) * fontScale,
    color: theme.colors.text.base,
    lineHeight: ms(20, 0.2),
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
    fontSize: ms(16, 0.2) * fontScale,
    fontWeight: 'bold',
    color: theme.colors.text.header,
  },
  closeButton: {
    backgroundColor: theme.colors.brand.navy[700],
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  closeButtonSecondary: {
    backgroundColor: theme.colors.surface.soft,
    borderWidth: ms(2, 0.05),
    borderColor: theme.colors.border.base,
  },
  closeButtonText: {
    fontSize: ms(16, 0.2) * fontScale,
    fontWeight: '600',
    color: theme.colors.text.header,
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
    fontSize: ms(13, 0.2) * fontScale,
    color: theme.colors.brand.navy[700],
    lineHeight: ms(18, 0.2),
  },
});
