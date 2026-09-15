import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import DonationAnalyticsCard from "../../../components/DonationAnalyticsCard";
import PillToggle from "../../../components/ui/PillToggle";
import { AppTheme, useTheme } from "../../../contexts/ThemeContext";
import { regionalFunctions } from "../../../firebase";
import { useFirebaseData } from "../../../hooks/useFirebaseData";
import { useResponsive } from "../../../hooks/useResponsive";
import { Donation } from "../../../types/donation";

type DonationListType = "one-time" | "recurring";

export default function HistoryTab(): React.JSX.Element {
  const theme = useTheme();
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(
    () => createStyles(theme, ms, fontScale),
    [theme, ms, fontScale]
  );

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [subscriptions, setSubscriptions] = useState<Donation[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<DonationListType>("one-time");
  const { mosqueSettings } = useFirebaseData();
  const MOSQUE_TZ = mosqueSettings?.timezone || "Australia/Sydney";

  const loadDonations = async () => {
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    setHasLoaded(false);

    try {
      const getUserDonations = regionalFunctions.httpsCallable("getUserDonations");
      const result = await getUserDonations({ email: email.trim() });
      const data = result.data as any;

      setDonations(data.donations || []);
      setSubscriptions(data.subscriptions || []);
      setHasLoaded(true);

      if (data.donations.length === 0 && data.subscriptions.length === 0) {
        Alert.alert(
          "No Donations Found",
          "No donations found for this email address."
        );
      }
    } catch (error: any) {
      console.error("Error loading donations:", error);
      Alert.alert("Error", "Failed to load donations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";

    try {
      let date: Date;

      if (timestamp.toDate && typeof timestamp.toDate === "function") {
        date = timestamp.toDate();
      } else if (timestamp._seconds !== undefined) {
        date = new Date(timestamp._seconds * 1000);
      } else if (timestamp.seconds !== undefined) {
        date = new Date(timestamp.seconds * 1000);
      } else {
        date = new Date(timestamp);
      }

      if (isNaN(date.getTime())) {
        console.warn("Invalid date:", timestamp);
        return "N/A";
      }

      return date.toLocaleString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: MOSQUE_TZ,
      });
    } catch (error) {
      console.error("Error formatting date:", error, timestamp);
      return "N/A";
    }
  };

  const formatCurrency = (amount: number) => {
    const dollars = amount / 100;
    return `$${dollars.toFixed(2)}`;
  };

  const renderDonation = (donation: Donation) => (
    <View key={donation.id} style={styles.donationCard}>
      <View style={styles.donationHeader}>
        <View style={styles.donationIcon}>
          <Ionicons
            name="heart-outline"
            size={ms(20, 0.2)}
            color={theme.colors.brand.navy[700]}
          />
        </View>
        <View style={styles.donationInfo}>
          <Text style={styles.donationType}>
            {donation.donation_type_label || "General donation"}
          </Text>
          <Text style={styles.donationDate}>
            {formatDate(donation.date || donation.created_at)}
          </Text>
        </View>
        <Text style={styles.donationAmount}>
          {formatCurrency(donation.amount)}
        </Text>
      </View>

      {donation.receipt_number && (
        <View style={styles.receiptRow}>
          <Ionicons
            name="document-text-outline"
            size={ms(14, 0.15)}
            color={theme.colors.text.muted}
          />
          <Text style={styles.receiptText}>
            Receipt: {donation.receipt_number}
          </Text>
        </View>
      )}

      {donation.stripe_receipt_url && (
        <TouchableOpacity
          style={styles.viewReceiptButton}
          onPress={() => Linking.openURL(donation.stripe_receipt_url!)}
          accessibilityRole="button"
          accessibilityLabel="View receipt"
        >
          <Ionicons
            name="receipt-outline"
            size={ms(16, 0.2)}
            color={theme.colors.brand.navy[700]}
          />
          <Text style={styles.viewReceiptText}>View receipt</Text>
          <Ionicons
            name="open-outline"
            size={ms(12, 0.15)}
            color={theme.colors.text.muted}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSubscription = (subscription: Donation) => (
    <View key={subscription.id} style={styles.donationCard}>
      <View style={styles.donationHeader}>
        <View style={[styles.donationIcon, styles.recurringIcon]}>
          <Ionicons
            name="refresh-outline"
            size={ms(20, 0.2)}
            color={theme.colors.brand.gold[600]}
          />
        </View>
        <View style={styles.donationInfo}>
          <Text style={styles.donationType}>
            {subscription.donation_type_label || "General donation"}
          </Text>
          <Text style={styles.donationDate}>
            {subscription.frequency || "Monthly"}
            {" · "}
            {subscription.status || "Active"}
          </Text>
        </View>
        <View style={styles.amountColumn}>
          <Text style={styles.donationAmount}>
            {formatCurrency(subscription.amount)}
          </Text>
          <View style={styles.recurringChip}>
            <Text style={styles.recurringChipText}>Recurring</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {!hasLoaded && (
          <>
            <View style={styles.intro}>
              <Text style={styles.introTitle}>Donation history</Text>
              <Text style={styles.introSubtitle}>
                Enter the email used for your donations to view past gifts and
                recurring subscriptions.
              </Text>
            </View>

            <View style={styles.panel}>
              <Text style={styles.blockLabel}>Your email</Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                placeholderTextColor={theme.colors.text.subtle}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[styles.ctaButton, loading && styles.ctaButtonDisabled]}
                onPress={loadDonations}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="View history"
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.text.header} />
                ) : (
                  <>
                    <Ionicons
                      name="search-outline"
                      size={ms(20, 0.2)}
                      color={theme.colors.text.header}
                    />
                    <Text style={styles.ctaButtonText}>View history</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {hasLoaded && (
          <>
            <View style={styles.emailDisplay}>
              <View style={styles.emailInfo}>
                <Ionicons
                  name="mail-outline"
                  size={ms(18, 0.2)}
                  color={theme.colors.text.muted}
                />
                <Text style={styles.emailText} numberOfLines={1}>
                  {email}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.changeButton}
                onPress={() => {
                  setHasLoaded(false);
                  setDonations([]);
                  setSubscriptions([]);
                }}
                accessibilityRole="button"
                accessibilityLabel="Change email"
              >
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>
            </View>

            {(donations.length > 0 || subscriptions.length > 0) && (
              <DonationAnalyticsCard
                donations={donations}
                subscriptions={subscriptions}
              />
            )}

            <PillToggle
              options={[
                { key: "one-time", label: `One-time (${donations.length})` },
                {
                  key: "recurring",
                  label: `Recurring (${subscriptions.length})`,
                },
              ]}
              value={activeTab}
              onChange={(key) => setActiveTab(key as DonationListType)}
              style={styles.listToggle}
            />

            <View style={styles.donationsList}>
              {activeTab === "one-time" &&
                (donations.length > 0 ? (
                  donations.map(renderDonation)
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="heart-outline"
                      size={ms(40, 0.2)}
                      color={theme.colors.text.subtle}
                    />
                    <Text style={styles.emptyText}>
                      No one-time donations found
                    </Text>
                  </View>
                ))}

              {activeTab === "recurring" &&
                (subscriptions.length > 0 ? (
                  subscriptions.map(renderSubscription)
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="refresh-outline"
                      size={ms(40, 0.2)}
                      color={theme.colors.text.subtle}
                    />
                    <Text style={styles.emptyText}>
                      No recurring donations found
                    </Text>
                  </View>
                ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (
  theme: AppTheme,
  ms: (size: number, factor?: number) => number,
  fontScale: number
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface.muted,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.lg,
      paddingBottom: ms(40, 0.1),
    },
    intro: {
      marginBottom: theme.spacing.lg,
    },
    introTitle: {
      fontSize: ms(18, 0.25) * fontScale,
      fontWeight: "600",
      color: theme.colors.text.strong,
      letterSpacing: -0.2,
    },
    introSubtitle: {
      marginTop: ms(4, 0.05),
      fontSize: ms(13, 0.2) * fontScale,
      color: theme.colors.text.muted,
      lineHeight: ms(18, 0.2),
    },
    panel: {
      backgroundColor: theme.colors.surface.base,
      borderRadius: theme.radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.soft,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.lg,
    },
    blockLabel: {
      fontSize: ms(11, 0.15) * fontScale,
      fontWeight: "500",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: theme.colors.text.muted,
      marginBottom: theme.spacing.md,
    },
    input: {
      backgroundColor: theme.colors.surface.soft,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical:
        Platform.OS === "ios" ? theme.spacing.md : theme.spacing.sm,
      fontSize: ms(15, 0.2) * fontScale,
      color: theme.colors.text.strong,
      marginBottom: theme.spacing.lg,
      borderWidth: ms(1.5, 0.05),
      borderColor: theme.colors.border.base,
    },
    ctaButton: {
      backgroundColor: theme.colors.brand.navy[800],
      borderRadius: theme.radius.lg,
      paddingVertical: theme.spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.sm,
      ...theme.shadow.header,
    },
    ctaButtonDisabled: {
      backgroundColor: theme.colors.text.muted,
      shadowOpacity: 0,
      elevation: 0,
    },
    ctaButtonText: {
      color: theme.colors.text.header,
      fontSize: ms(16, 0.2) * fontScale,
      fontWeight: "600",
    },
    emailDisplay: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.colors.surface.base,
      borderRadius: theme.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.soft,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    emailInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      flex: 1,
      minWidth: 0,
    },
    emailText: {
      flex: 1,
      fontSize: ms(14, 0.2) * fontScale,
      color: theme.colors.text.strong,
      fontWeight: "500",
    },
    changeButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: ms(6, 0.1),
    },
    changeButtonText: {
      color: theme.colors.brand.navy[700],
      fontSize: ms(14, 0.2) * fontScale,
      fontWeight: "600",
    },
    listToggle: {
      marginHorizontal: 0,
      marginBottom: theme.spacing.lg,
    },
    donationsList: {
      gap: theme.spacing.md,
    },
    donationCard: {
      backgroundColor: theme.colors.surface.base,
      borderRadius: theme.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.soft,
      padding: theme.spacing.lg,
    },
    donationHeader: {
      flexDirection: "row",
      alignItems: "center",
    },
    donationIcon: {
      width: ms(40, 0.2),
      height: ms(40, 0.2),
      borderRadius: ms(12, 0.1),
      backgroundColor: theme.colors.accent.blueSoft,
      alignItems: "center",
      justifyContent: "center",
      marginRight: theme.spacing.md,
      flexShrink: 0,
    },
    recurringIcon: {
      backgroundColor: theme.colors.accent.amberSoft,
    },
    donationInfo: {
      flex: 1,
      minWidth: 0,
      marginRight: theme.spacing.sm,
    },
    donationType: {
      fontSize: ms(15, 0.2) * fontScale,
      fontWeight: "600",
      color: theme.colors.text.strong,
      marginBottom: ms(2, 0.05),
    },
    donationDate: {
      fontSize: ms(12, 0.15) * fontScale,
      color: theme.colors.text.muted,
    },
    amountColumn: {
      alignItems: "flex-end",
      gap: ms(6, 0.05),
    },
    donationAmount: {
      fontSize: ms(15, 0.2) * fontScale,
      fontWeight: "700",
      color: theme.colors.brand.navy[800],
    },
    recurringChip: {
      backgroundColor: theme.colors.accent.amberSoft,
      borderRadius: theme.radius.pill,
      paddingHorizontal: ms(8, 0.1),
      paddingVertical: ms(2, 0.05),
    },
    recurringChipText: {
      fontSize: ms(11, 0.15) * fontScale,
      fontWeight: "600",
      color: theme.colors.brand.gold[600],
    },
    receiptRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.soft,
    },
    receiptText: {
      fontSize: ms(12, 0.15) * fontScale,
      color: theme.colors.text.muted,
    },
    viewReceiptButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.surface.soft,
      borderRadius: theme.radius.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.soft,
    },
    viewReceiptText: {
      fontSize: ms(13, 0.2) * fontScale,
      fontWeight: "600",
      color: theme.colors.brand.navy[700],
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: ms(48, 0.1),
    },
    emptyText: {
      fontSize: ms(14, 0.2) * fontScale,
      color: theme.colors.text.muted,
      marginTop: theme.spacing.md,
    },
  });
