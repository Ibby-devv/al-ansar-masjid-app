import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Modal,
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

export interface DonationError {
  type: "network" | "validation" | "payment" | "server" | "unknown";
  message: string;
  originalError?: unknown;
}

interface DonationErrorModalProps {
  visible: boolean;
  onClose: () => void;
  onRetry?: () => void;
  error: DonationError | null;
}

const getErrorDetails = (error: DonationError) => {
  switch (error.type) {
    case "network":
      return {
        icon: "cloud-offline-outline" as const,
        title: "Connection issue",
        description: "Please check your internet connection and try again.",
        showRetry: true,
      };
    case "validation":
      return {
        icon: "alert-circle-outline" as const,
        title: "Invalid information",
        description: error.message,
        showRetry: false,
      };
    case "payment":
      return {
        icon: "card-outline" as const,
        title: "Payment failed",
        description:
          error.message ||
          "Your payment could not be processed. Please check your card details and try again.",
        showRetry: true,
      };
    case "server":
      return {
        icon: "server-outline" as const,
        title: "Server error",
        description:
          "Our server encountered an issue. Please try again in a moment.",
        showRetry: true,
      };
    default:
      return {
        icon: "warning-outline" as const,
        title: "Something went wrong",
        description:
          error.message || "An unexpected error occurred. Please try again.",
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
  const styles = useMemo(
    () => createStyles(theme, ms, fontScale),
    [theme, ms, fontScale]
  );

  if (!error) {
    return (
      <Modal visible={false} transparent>
        <View />
      </Modal>
    );
  }

  const details = getErrorDetails(error);
  const showRetry = details.showRetry && Boolean(onRetry);

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
            <View style={styles.iconContainer}>
              <View style={styles.errorCircle}>
                <Ionicons
                  name={details.icon}
                  size={ms(36, 0.2)}
                  color={theme.colors.error[500]}
                />
              </View>
            </View>

            <Text style={styles.title}>{details.title}</Text>
            <Text style={styles.description}>{details.description}</Text>

            {error.type === "payment" ? (
              <View style={styles.solutionsCard}>
                <Text style={styles.solutionsTitle}>Common solutions</Text>
                <View style={styles.solutionItem}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={ms(18, 0.2)}
                    color={theme.colors.accent.green}
                  />
                  <Text style={styles.solutionText}>
                    Check that your card details are correct
                  </Text>
                </View>
                <View style={styles.solutionItem}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={ms(18, 0.2)}
                    color={theme.colors.accent.green}
                  />
                  <Text style={styles.solutionText}>
                    Ensure you have sufficient funds
                  </Text>
                </View>
                <View style={styles.solutionItem}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={ms(18, 0.2)}
                    color={theme.colors.accent.green}
                  />
                  <Text style={styles.solutionText}>
                    Contact your bank if the issue persists
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={styles.actions}>
              {showRetry && onRetry ? (
                <PrimaryButton
                  label="Try again"
                  onPress={onRetry}
                  icon="refresh"
                />
              ) : null}

              {showRetry ? (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
              ) : (
                <PrimaryButton label="Close" onPress={onClose} />
              )}
            </View>

            <View style={styles.supportBox}>
              <Ionicons
                name="information-circle-outline"
                size={ms(18, 0.2)}
                color={theme.colors.icon.brand}
              />
              <Text style={styles.supportText}>
                Need help? Contact us at support@alansar.au
              </Text>
            </View>
          </ScrollView>
        </View>
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
    errorCircle: {
      width: ms(72, 0.2),
      height: ms(72, 0.2),
      borderRadius: ms(20, 0.15),
      backgroundColor: theme.colors.error[100],
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.error[500],
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
    description: {
      fontSize: ms(14, 0.2) * fontScale,
      color: theme.colors.text.muted,
      textAlign: "center",
      marginBottom: theme.spacing.xl,
      lineHeight: ms(20, 0.2),
    },
    solutionsCard: {
      backgroundColor: theme.colors.surface.soft,
      borderRadius: theme.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.soft,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    solutionsTitle: {
      fontSize: ms(11, 0.15) * fontScale,
      fontWeight: "500",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: theme.colors.text.muted,
      marginBottom: theme.spacing.md,
    },
    solutionItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    solutionText: {
      flex: 1,
      fontSize: ms(13, 0.2) * fontScale,
      color: theme.colors.text.base,
      lineHeight: ms(19, 0.2),
    },
    actions: {
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    secondaryButton: {
      backgroundColor: theme.colors.surface.base,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.base,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.lg,
      alignItems: "center",
    },
    secondaryButtonText: {
      fontSize: ms(15, 0.2) * fontScale,
      fontWeight: "600",
      color: theme.colors.text.strong,
    },
    supportBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.accent.blueSoft,
      padding: theme.spacing.md,
      borderRadius: theme.radius.sm,
    },
    supportText: {
      flex: 1,
      fontSize: ms(12, 0.15) * fontScale,
      color: theme.colors.icon.brand,
      lineHeight: ms(17, 0.15),
    },
  });
