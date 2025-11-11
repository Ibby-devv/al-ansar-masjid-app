import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import DonationAnalyticsCard from "../../../components/DonationAnalyticsCard";
import PillToggle from "../../../components/ui/PillToggle";
import { Theme } from "../../../constants/theme";
import { regionalFunctions } from "../../../firebase";
import { Donation } from "../../../types/donation";

type DonationType = "one-time" | "recurring";


export default function HistoryTab() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [subscriptions, setSubscriptions] = useState<Donation[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<DonationType>("one-time");

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

      // Handle Firestore Timestamp
      if (timestamp.toDate && typeof timestamp.toDate === "function") {
        date = timestamp.toDate();
      }
      // Handle seconds/nanoseconds object
      else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      }
      // Handle ISO string or number
      else {
        date = new Date(timestamp);
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "N/A";
      }

      return date.toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
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
          <Ionicons name="heart" size={24} color="#1e3a8a" />
        </View>
        <View style={styles.donationInfo}>
          <Text style={styles.donationType}>
            {donation.donation_type_label || "General Donation"}
          </Text>
          <Text style={styles.donationDate}>
           {donation.date || formatDate(donation.created_at)}
          </Text>
        </View>
        <Text style={styles.donationAmount}>
          {formatCurrency(donation.amount)}
        </Text>
      </View>

      {donation.receipt_number && (
        <View style={styles.receiptRow}>
          <Ionicons name="document-text-outline" size={16} color="#6b7280" />
          <Text style={styles.receiptText}>
            Receipt: {donation.receipt_number}
          </Text>
        </View>
      )}
    </View>
  );

  const renderSubscription = (subscription: Donation) => (
    <View key={subscription.id} style={styles.donationCard}>
      <View style={styles.donationHeader}>
        <View style={[styles.donationIcon, styles.recurringIcon]}>
          <Ionicons name="refresh" size={24} color="#059669" />
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
              <Ionicons name="information-circle" size={24} color="#1e3a8a" />
              <Text style={styles.infoText}>
                Enter your email address to view your donation history
              </Text>
            </View>

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="email@example.com"
              placeholderTextColor="#9ca3af"
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
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="search" size={20} color="#fff" />
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
                <Ionicons name="mail" size={20} color="#6b7280" />
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
              style={{ marginBottom: Theme.spacing.lg }}
            />

            {/* Donations List */}
            <View style={styles.donationsList}>
              {activeTab === "one-time" &&
                (donations.length > 0 ? (
                  donations.map(renderDonation)
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="heart-outline" size={48} color="#d1d5db" />
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
                      color="#d1d5db"
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.surface.muted,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Theme.spacing.xl,
    paddingBottom: 40,
  },
  inputSection: {
    marginBottom: Theme.spacing.xl,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: Theme.colors.accent.blueSoft,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.xxl,
    gap: Theme.spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: Theme.typography.body,
    color: Theme.colors.brand.navy[700],
    lineHeight: 20,
  },
  label: {
    fontSize: Theme.spacing.lg,
    fontWeight: "600",
    color: Theme.colors.text.strong,
    marginBottom: Theme.spacing.sm,
  },
  input: {
    backgroundColor: Theme.colors.surface.base,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.lg,
    fontSize: Theme.spacing.lg,
    color: Theme.colors.text.strong,
    borderWidth: 2,
    borderColor: Theme.colors.border.base,
    marginBottom: Theme.spacing.lg,
  },
  loadButton: {
    backgroundColor: Theme.colors.brand.navy[700],
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.sm,
  },
  loadButtonDisabled: {
    backgroundColor: Theme.colors.text.muted,
  },
  loadButtonText: {
    color: Theme.colors.text.inverse,
    fontSize: Theme.spacing.lg,
    fontWeight: "600",
  },
  emailDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Theme.colors.surface.base,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  emailInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    flex: 1,
  },
  emailText: {
    fontSize: Theme.typography.body,
    color: Theme.colors.text.strong,
    fontWeight: "500",
  },
  changeButton: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 6,
    backgroundColor: Theme.colors.accent.blueSoft,
    borderRadius: 6,
  },
  changeButtonText: {
    color: Theme.colors.brand.navy[700],
    fontSize: Theme.typography.body,
    fontWeight: "600",
  },
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: Theme.colors.surface.base,
    borderRadius: Theme.radius.md,
    padding: 4,
    marginBottom: Theme.spacing.lg,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    alignItems: "center",
    borderRadius: Theme.radius.sm,
  },
  tabButtonActive: {
    backgroundColor: Theme.colors.brand.navy[700],
  },
  tabButtonText: {
    fontSize: Theme.typography.body,
    fontWeight: "600",
    color: Theme.colors.text.muted,
  },
  tabButtonTextActive: {
    color: Theme.colors.text.inverse,
  },
  donationsList: {
    gap: Theme.spacing.md,
  },
  donationCard: {
    backgroundColor: Theme.colors.surface.base,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.lg,
    ...Theme.shadow.soft,
  },
  donationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  donationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.accent.blueSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Theme.spacing.md,
  },
  recurringIcon: {
    backgroundColor: "#d1fae5",
  },
  donationInfo: {
    flex: 1,
  },
  donationType: {
    fontSize: Theme.spacing.lg,
    fontWeight: "600",
    color: Theme.colors.text.strong,
    marginBottom: 4,
  },
  donationDate: {
    fontSize: Theme.typography.body,
    color: Theme.colors.text.muted,
  },
  donationAmount: {
    fontSize: Theme.typography.h2,
    fontWeight: "bold",
    color: Theme.colors.brand.navy[700],
  },
  receiptRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.surface.soft,
  },
  receiptText: {
    fontSize: 13,
    color: Theme.colors.text.muted,
  },
  subscriptionBadge: {
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.surface.soft,
  },
  subscriptionBadgeText: {
    fontSize: 13,
    color: Theme.colors.accent.green,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: Theme.spacing.lg,
    color: Theme.colors.text.muted,
    marginTop: Theme.spacing.md,
  },
});
