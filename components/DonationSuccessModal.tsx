import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useMemo, useRef } from 'react';
import {
    Animated,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import type { AppTheme } from '../hooks/useAppTheme';

interface DonationSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  amount: number;
  isRecurring: boolean;
  frequency?: string;
  donationType: string;
  campaignName?: string;
  receiptNumber?: string;
  stripeReceiptUrl?: string;
}

export default function DonationSuccessModal({
  visible,
  onClose,
  amount,
  isRecurring,
  frequency,
  donationType,
  campaignName,
  receiptNumber,
  stripeReceiptUrl,
}: DonationSuccessModalProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Reset and animate in
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, fadeAnim]);

  const handleViewReceipt = async () => {
    if (stripeReceiptUrl) {
      await Linking.openURL(stripeReceiptUrl);
    }
  };

  const handleShareReceipt = async () => {
    const message = `
JazakAllah Khair! 🌙

${isRecurring ? 'Recurring ' : ''}Donation Receipt
Amount: $${amount.toFixed(2)} AUD${isRecurring ? ` (${frequency})` : ''}
Type: ${donationType}${campaignName ? `\nCampaign: ${campaignName}` : ''}
${receiptNumber ? `Receipt: ${receiptNumber}` : ''}

Al Ansar Masjid
Thank you for your generous support!
    `.trim();

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync('data:text/plain;base64,' + btoa(message), {
          mimeType: 'text/plain',
          dialogTitle: 'Share Receipt',
        });
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Success Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.successCircle}>
                <Ionicons name="checkmark" size={60} color={theme.colors.text.inverse} />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>
              {isRecurring ? 'Recurring Donation Set Up! 🎉' : 'Donation Successful! 🎉'}
            </Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              JazakAllah Khair for your generous support!
            </Text>

            {/* Donation Details Card */}
            <View style={styles.detailsCard}>
              <View style={styles.amountContainer}>
                <Text style={styles.amountLabel}>
                  {isRecurring ? 'Recurring Amount' : 'Amount'}
                </Text>
                <Text style={styles.amount}>${amount.toFixed(2)}</Text>
                {isRecurring && frequency && (
                  <Text style={styles.frequency}>Every {frequency}</Text>
                )}
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Ionicons name="heart" size={20} color={theme.colors.text.muted} />
                <Text style={styles.detailLabel}>Donation Type</Text>
                <Text style={styles.detailValue}>{donationType}</Text>
              </View>

              {campaignName && (
                <View style={styles.detailRow}>
                  <Ionicons name="flag" size={20} color={theme.colors.text.muted} />
                  <Text style={styles.detailLabel}>Campaign</Text>
                  <Text style={styles.detailValue}>{campaignName}</Text>
                </View>
              )}

              {receiptNumber && (
                <View style={styles.detailRow}>
                  <Ionicons name="document-text" size={20} color={theme.colors.text.muted} />
                  <Text style={styles.detailLabel}>Receipt Number</Text>
                  <Text style={styles.detailValue}>{receiptNumber}</Text>
                </View>
              )}

              {isRecurring && (
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={20} color={theme.colors.brand.navy[700]} />
                  <Text style={styles.infoText}>
                    You&apos;ll receive an email receipt after each payment. You can manage your
                    subscription anytime from the Manage tab.
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              {stripeReceiptUrl && (
                <TouchableOpacity style={styles.secondaryButton} onPress={handleViewReceipt}>
                  <Ionicons name="receipt-outline" size={20} color={theme.colors.brand.navy[700]} />
                  <Text style={styles.secondaryButtonText}>View Receipt</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.secondaryButton} onPress={handleShareReceipt}>
                <Ionicons name="share-outline" size={20} color={theme.colors.brand.navy[700]} />
                <Text style={styles.secondaryButtonText}>Share</Text>
              </TouchableOpacity>
            </View>

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
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
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.accent.green,
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
  subtitle: {
    fontSize: theme.spacing.lg,
    color: theme.colors.text.muted,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
  },
  detailsCard: {
    backgroundColor: theme.colors.surface.soft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  amountContainer: {
    alignItems: 'center',
    paddingBottom: theme.spacing.lg,
  },
  amountLabel: {
    fontSize: theme.typography.body,
    color: theme.colors.text.muted,
    marginBottom: theme.spacing.sm,
  },
  amount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.brand.navy[700],
  },
  frequency: {
    fontSize: theme.spacing.lg,
    color: theme.colors.text.muted,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.base,
    marginVertical: theme.spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  detailLabel: {
    flex: 1,
    fontSize: theme.typography.body,
    color: theme.colors.text.muted,
  },
  detailValue: {
    fontSize: theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text.strong,
  },
  infoBox: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.accent.blueSoft,
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    marginTop: theme.spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.brand.navy[700],
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.accent.blueSoft,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
  },
  secondaryButtonText: {
    fontSize: theme.spacing.lg,
    fontWeight: '600',
    color: theme.colors.brand.navy[700],
  },
  closeButton: {
    backgroundColor: theme.colors.brand.navy[700],
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: theme.spacing.lg,
    fontWeight: 'bold',
    color: theme.colors.text.inverse,
  },
});
