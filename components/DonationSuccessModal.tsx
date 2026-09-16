import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import React, { useEffect, useMemo, useRef } from "react";
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
  useWindowDimensions,
} from "react-native";
import { PrimaryButton } from "./ui/calm";
import { AppTheme, useTheme } from "../contexts/ThemeContext";
import { useResponsive } from "../hooks/useResponsive";

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
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(
    () => createStyles(theme, ms, fontScale),
    [theme, ms, fontScale]
  );

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
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

  const handleViewReceipt = async (): Promise<void> => {
    if (stripeReceiptUrl) {
      await Linking.openURL(stripeReceiptUrl);
    }
  };

  const handleShareReceipt = async (): Promise<void> => {
    const causeLine = campaignName || donationType || "General donation";
    const message = `
JazakAllah Khair!

${isRecurring ? "Recurring " : ""}Donation Receipt
Amount: $${amount.toFixed(2)} AUD${isRecurring ? ` (${frequency})` : ""}
${campaignName ? "Campaign" : "Cause"}: ${causeLine}
${receiptNumber ? `Receipt: ${receiptNumber}` : ""}

Al Ansar Masjid
Thank you for your generous support!
    `.trim();

    if (Platform.OS === "ios" || Platform.OS === "android") {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync("data:text/plain;base64," + btoa(message), {
          mimeType: "text/plain",
          dialogTitle: "Share Receipt",
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
            <View style={styles.iconContainer}>
              <View style={styles.successCircle}>
                <Ionicons
                  name="checkmark"
                  size={ms(40, 0.2)}
                  color={theme.colors.text.header}
                />
              </View>
            </View>

            <Text style={styles.title}>
              {isRecurring
                ? "Recurring donation set up"
                : "Donation successful"}
            </Text>

            <Text style={styles.subtitle}>
              JazakAllah Khair for your generous support
            </Text>

            <View style={styles.detailsCard}>
              <View style={styles.amountContainer}>
                <Text style={styles.amountLabel}>
                  {isRecurring ? "Recurring amount" : "Amount"}
                </Text>
                <Text style={styles.amount}>${amount.toFixed(2)}</Text>
                {isRecurring && frequency ? (
                  <Text style={styles.frequency}>Every {frequency}</Text>
                ) : null}
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Ionicons
                  name={campaignName ? "flag-outline" : "heart-outline"}
                  size={ms(18, 0.2)}
                  color={theme.colors.icon.brand}
                />
                <Text style={styles.detailLabel}>
                  {campaignName ? "Campaign" : "Cause"}
                </Text>
                <Text style={styles.detailValue}>
                  {campaignName || donationType || "General donation"}
                </Text>
              </View>

              {receiptNumber ? (
                <View style={styles.detailRow}>
                  <Ionicons
                    name="document-text-outline"
                    size={ms(18, 0.2)}
                    color={theme.colors.icon.muted}
                  />
                  <Text style={styles.detailLabel}>Receipt</Text>
                  <Text style={styles.detailValue}>{receiptNumber}</Text>
                </View>
              ) : null}

              {isRecurring ? (
                <View style={styles.infoBox}>
                  <Ionicons
                    name="information-circle-outline"
                    size={ms(18, 0.2)}
                    color={theme.colors.icon.brand}
                  />
                  <Text style={styles.infoText}>
                    You&apos;ll receive an email receipt after each payment. You
                    can manage your subscription anytime from the Manage tab.
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.actions}>
              {stripeReceiptUrl ? (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    void handleViewReceipt();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="View receipt"
                >
                  <Ionicons
                    name="receipt-outline"
                    size={ms(18, 0.2)}
                    color={theme.colors.icon.brand}
                  />
                  <Text style={styles.secondaryButtonText}>View receipt</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  void handleShareReceipt();
                }}
                accessibilityRole="button"
                accessibilityLabel="Share receipt"
              >
                <Ionicons
                  name="share-outline"
                  size={ms(18, 0.2)}
                  color={theme.colors.icon.brand}
                />
                <Text style={styles.secondaryButtonText}>Share</Text>
              </TouchableOpacity>
            </View>

            <PrimaryButton label="Done" onPress={onClose} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (
  theme: AppTheme,
  ms: (size: number, factor?: number) => number,
  fontScale: number
) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
      justifyContent: "center",
      alignItems: "center",
      padding: theme.spacing.xl,
    },
    container: {
      backgroundColor: theme.colors.surface.base,
      borderRadius: theme.radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.soft,
      width: "100%",
      maxWidth: ms(500, 0.3),
      maxHeight: "90%",
      overflow: "hidden",
    },
    scrollView: {
      flexGrow: 1,
    },
    content: {
      padding: theme.spacing.xl,
    },
    iconContainer: {
      alignItems: "center",
      marginBottom: theme.spacing.lg,
    },
    successCircle: {
      width: ms(72, 0.2),
      height: ms(72, 0.2),
      borderRadius: ms(36, 0.1),
      backgroundColor: theme.colors.accent.green,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: ms(20, 0.25) * fontScale,
      fontWeight: "600",
      color: theme.colors.text.strong,
      textAlign: "center",
      letterSpacing: -0.2,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: ms(14, 0.2) * fontScale,
      color: theme.colors.text.muted,
      textAlign: "center",
      marginBottom: theme.spacing.xl,
      lineHeight: ms(20, 0.2),
    },
    detailsCard: {
      backgroundColor: theme.colors.surface.soft,
      borderRadius: theme.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.soft,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    amountContainer: {
      alignItems: "center",
      paddingBottom: theme.spacing.md,
    },
    amountLabel: {
      fontSize: ms(12, 0.15) * fontScale,
      fontWeight: "500",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: theme.colors.text.muted,
      marginBottom: theme.spacing.sm,
    },
    amount: {
      fontSize: ms(36, 0.3) * fontScale,
      fontWeight: "700",
      color: theme.colors.brand.navy[800],
      letterSpacing: -0.8,
    },
    frequency: {
      fontSize: ms(14, 0.2) * fontScale,
      color: theme.colors.text.muted,
      marginTop: ms(4, 0.05),
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border.soft,
      marginVertical: theme.spacing.md,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    detailLabel: {
      flex: 1,
      fontSize: ms(13, 0.2) * fontScale,
      color: theme.colors.text.muted,
    },
    detailValue: {
      fontSize: ms(13, 0.2) * fontScale,
      fontWeight: "600",
      color: theme.colors.text.strong,
      maxWidth: "50%",
      textAlign: "right",
    },
    infoBox: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.accent.blueSoft,
      padding: theme.spacing.md,
      borderRadius: theme.radius.sm,
      marginTop: theme.spacing.sm,
    },
    infoText: {
      flex: 1,
      fontSize: ms(12, 0.15) * fontScale,
      color: theme.colors.icon.brand,
      lineHeight: ms(17, 0.15),
    },
    actions: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    secondaryButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.surface.base,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.icon.brand,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.md,
    },
    secondaryButtonText: {
      fontSize: ms(14, 0.2) * fontScale,
      fontWeight: "600",
      color: theme.colors.icon.brand,
    },
  });
