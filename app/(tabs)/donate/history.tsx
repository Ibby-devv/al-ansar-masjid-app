import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DonationAnalyticsCard from "../../../components/DonationAnalyticsCard";
import PillToggle from "../../../components/ui/PillToggle";
import { useTheme } from "../../../contexts/ThemeContext";
import type { AppTheme } from "../../../hooks/useAppTheme";
import { regionalFunctions } from "../../../firebase";
import { useFirebaseData } from "../../../hooks/useFirebaseData";
import { Donation } from "../../../types/donation";

type DonationType = "one-time" | "recurring";


export default function HistoryTab(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [subscriptions, setSubscriptions] = useState<Donation[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<DonationType>("one-time");
  const { mosqueSettings } = useFirebaseData();
  const MOSQUE_TZ = mosqueSettings?.timezone || 'Australia/Sydney';

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

      // Handle Firestore Timestamp object (has toDate method)
      if (timestamp.toDate && typeof timestamp.toDate === "function") {
        date = timestamp.toDate();
      }
      // Handle serialized Firestore Timestamp (seconds/nanoseconds)
      else if (timestamp._seconds !== undefined) {
        date = new Date(timestamp._seconds * 1000);
      }
      else if (timestamp.seconds !== undefined) {
        date = new Date(timestamp.seconds * 1000);
      }
      // Handle ISO string or number
      else {
        date = new Date(timestamp);
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn("Invalid date:", timestamp);
        return "N/A";
      }

      // Format in mosque timezone to show correct local date/time
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
    // Stripe stores amounts in cents, divide by 100
    const dollars = amount / 100;
    return `$${dollars.toFixed(2)}`;
  };

  const renderDonation = (donation: Donation) => (
    <View key={donation.id} style={styles.donationCard}>
      <View style={styles.donationHeader}>
        <View style={styles.donationIcon}>
          <Ionicons name="heart" size={24} color={theme.colors.brand.navy[700]} />
        </View>
        <View style={styles.donationInfo}>
          <Text style={styles.donationType}>
            {donation.donation_type_label || "General Donation"}
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
          <Ionicons name="document-text-outline" size={16} color={theme.colors.text.muted} />
          <Text style={styles.receiptText}>
            Receipt: {donation.receipt_number}
          </Text>
        </View>
      )}

      {donation.stripe_receipt_url && (
        <TouchableOpacity
          style={styles.viewReceiptButton}
          onPress={() => Linking.openURL(donation.stripe_receipt_url!)}
        >
          <Ionicons name="receipt-outline" size={18} color={theme.colors.brand.navy[700]} />
          <Text style={styles.viewReceiptText}>View Receipt</Text>
          <Ionicons name="open-outline" size={14} color={theme.colors.text.muted} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSubscription = (subscription: Donation) => (
    <View key={subscription.id} style={styles.donationCard}>
      <View style={styles.donationHeader}>
        <View style={[styles.donationIcon, styles.recurringIcon]}>
          <Ionicons name="refresh" size={24} color={theme.colors.accent.green} />
        </View>
        <View style={styles.donationInfo}>
          <Text style={styles.donationType}>
            {subscription.donation_type_label || "General Donation"}
          </Text>
          <Text style={styles.donationDate}>
            {subscription.frequency || "Monthly"} • {" "}
            {subscription.status || "Active"}
          </Text>
        </View>
        <Text style={styles.donationAmount}>
          {formatCurrency(subscription.amount)}
        </Text>
      </View>

      <View style={styles.subscriptionBadge}>
        <Text style={styles.subscriptionBadgeText}>💚 Recurring Donation</Text>
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
        {/* Email Input Section */}
        {!hasLoaded && (
          <View style={styles.inputSection}>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={24} color={theme.colors.brand.navy[700]} />
              <Text style={styles.infoText}>
                Enter your email address to view your donation history
              </Text>
            </View>

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="email@example.com"
              placeholderTextColor={theme.colors.text.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[styles.loadButton, loading && styles.loadButtonDisabled]}
              onPress={loadDonations}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.text.inverse} />
              ) : (
                <>
                  <Ionicons name="search" size={20} color={theme.colors.text.inverse} />
                  <Text style={styles.loadButtonText}>Load Donations</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Results Section */}
        {hasLoaded && (
          <>
            {/* Email Display & Change Button */}
            <View style={styles.emailDisplay}>
              <View style={styles.emailInfo}>
                <Ionicons name="mail" size={20} color={theme.colors.text.muted} />
                <Text style={styles.emailText}>{email}</Text>
              </View>
              <TouchableOpacity
                style={styles.changeButton}
                onPress={() => {
                  setHasLoaded(false);
                  setDonations([]);
                  setSubscriptions([]);
                }}
              >
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>
            </View>

            {/* Analytics Card */}
            {(donations.length > 0 || subscriptions.length > 0) && (
              <DonationAnalyticsCard
                donations={donations}
                subscriptions={subscriptions}
              />
            )}

            {/* Tab Switcher */}
            <PillToggle
              options={[
                { key: "one-time", label: `One-Time (${donations.length})` },
                { key: "recurring", label: `Recurring (${subscriptions.length})` },
              ]}
              value={activeTab}
              onChange={(key) => setActiveTab(key as DonationType)}
              style={{ marginBottom: theme.spacing.lg }}
            />

            {/* Donations List */}
            <View style={styles.donationsList}>
              {activeTab === "one-time" &&
                (donations.length > 0 ? (
                  donations.map(renderDonation)
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="heart-outline" size={48} color={theme.colors.border.base} />
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
                      size={48}
                      color={theme.colors.border.base}
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

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.muted,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.xl,
    paddingBottom: 40,
  },
  inputSection: {
    marginBottom: theme.spacing.xl,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.accent.blueSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: theme.typography.body,
    color: theme.colors.brand.navy[700],
    lineHeight: 20,
  },
  label: {
    fontSize: theme.spacing.lg,
    fontWeight: "600",
    color: theme.colors.text.strong,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    fontSize: theme.spacing.lg,
    color: theme.colors.text.strong,
    borderWidth: 2,
    borderColor: theme.colors.border.base,
    marginBottom: theme.spacing.lg,
  },
  loadButton: {
    backgroundColor: theme.colors.brand.navy[700],
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  loadButtonDisabled: {
    backgroundColor: theme.colors.text.muted,
  },
  loadButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.spacing.lg,
    fontWeight: "600",
  },
  emailDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  emailInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flex: 1,
  },
  emailText: {
    fontSize: theme.typography.body,
    color: theme.colors.text.strong,
    fontWeight: "500",
  },
  changeButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    backgroundColor: theme.colors.accent.blueSoft,
    borderRadius: 6,
  },
  changeButtonText: {
    color: theme.colors.brand.navy[700],
    fontSize: theme.typography.body,
    fontWeight: "600",
  },
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radius.md,
    padding: 4,
    marginBottom: theme.spacing.lg,
  },
  tabButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    borderRadius: theme.radius.sm,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.brand.navy[700],
  },
  tabButtonText: {
    fontSize: theme.typography.body,
    fontWeight: "600",
    color: theme.colors.text.muted,
  },
  tabButtonTextActive: {
    color: theme.colors.text.header,
  },
  donationsList: {
    gap: theme.spacing.md,
  },
  donationCard: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    ...theme.shadow.soft,
  },
  donationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  donationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.accent.blueSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
  },
  recurringIcon: {
    backgroundColor: theme.colors.accent.amberSoft,
  },
  donationInfo: {
    flex: 1,
  },
  donationType: {
    fontSize: theme.spacing.lg,
    fontWeight: "600",
    color: theme.colors.text.strong,
    marginBottom: 4,
  },
  donationDate: {
    fontSize: theme.typography.body,
    color: theme.colors.text.muted,
  },
  donationAmount: {
    fontSize: theme.typography.h2,
    fontWeight: "bold",
    color: theme.colors.brand.navy[700],
  },
  receiptRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.soft,
  },
  receiptText: {
    fontSize: 13,
    color: theme.colors.text.muted,
  },
  viewReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.accent.blueSoft,
    borderRadius: theme.radius.sm,
  },
  viewReceiptText: {
    fontSize: theme.typography.body,
    fontWeight: '600',
    color: theme.colors.brand.navy[700],
  },
  subscriptionBadge: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.soft,
  },
  subscriptionBadgeText: {
    fontSize: 13,
    color: theme.colors.accent.green,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: theme.spacing.lg,
    color: theme.colors.text.muted,
    marginTop: theme.spacing.md,
  },
});
