import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Theme } from '../constants/theme';

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
}: DonationErrorModalProps) {
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
                <Ionicons name={details.icon} size={60} color="#fff" />
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
                  <Ionicons name="checkmark-circle" size={20} color={Theme.colors.accent.green} />
                  <Text style={styles.solutionText}>
                    Check that your card details are correct
                  </Text>
                </View>
                <View style={styles.solutionItem}>
                  <Ionicons name="checkmark-circle" size={20} color={Theme.colors.accent.green} />
                  <Text style={styles.solutionText}>
                    Ensure you have sufficient funds
                  </Text>
                </View>
                <View style={styles.solutionItem}>
                  <Ionicons name="checkmark-circle" size={20} color={Theme.colors.accent.green} />
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
                  <Ionicons name="refresh" size={20} color="#fff" />
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
              <Ionicons name="information-circle" size={20} color={Theme.colors.brand.navy[700]} />
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  container: {
    backgroundColor: Theme.colors.surface.base,
    borderRadius: Theme.radius.xl,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    overflow: 'hidden',
    ...Theme.shadow.header,
  },
  scrollView: {
    flexGrow: 1,
  },
  content: {
    padding: Theme.spacing.xxl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  errorCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ef4444', // Red for errors
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadow.soft,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Theme.colors.text.strong,
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
  },
  description: {
    fontSize: Theme.spacing.lg,
    color: Theme.colors.text.muted,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
    lineHeight: 24,
  },
  solutionsCard: {
    backgroundColor: Theme.colors.surface.soft,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
  },
  solutionsTitle: {
    fontSize: Theme.spacing.lg,
    fontWeight: '600',
    color: Theme.colors.text.strong,
    marginBottom: Theme.spacing.md,
  },
  solutionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  solutionText: {
    flex: 1,
    fontSize: Theme.typography.body,
    color: Theme.colors.text.base,
    lineHeight: 20,
  },
  actions: {
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    backgroundColor: Theme.colors.brand.navy[700],
    padding: Theme.spacing.lg,
    borderRadius: Theme.radius.md,
  },
  retryButtonText: {
    fontSize: Theme.spacing.lg,
    fontWeight: 'bold',
    color: Theme.colors.text.inverse,
  },
  closeButton: {
    backgroundColor: Theme.colors.brand.navy[700],
    padding: Theme.spacing.lg,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
  },
  closeButtonSecondary: {
    backgroundColor: Theme.colors.surface.soft,
    borderWidth: 2,
    borderColor: Theme.colors.border.base,
  },
  closeButtonText: {
    fontSize: Theme.spacing.lg,
    fontWeight: '600',
    color: Theme.colors.text.inverse,
  },
  closeButtonTextSecondary: {
    color: Theme.colors.text.strong,
  },
  supportBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Theme.spacing.sm,
    backgroundColor: Theme.colors.accent.blueSoft,
    padding: Theme.spacing.md,
    borderRadius: Theme.radius.sm,
  },
  supportText: {
    flex: 1,
    fontSize: 13,
    color: Theme.colors.brand.navy[700],
    lineHeight: 18,
  },
});
