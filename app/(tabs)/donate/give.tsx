// ============================================================================
// DONATION SCREEN - SIMPLIFIED WITH PAYMENT SHEET + CAMPAIGNS
// ============================================================================

import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as StripeTypes from "@stripe/stripe-react-native";
import { useStripe } from "@stripe/stripe-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CampaignCard from "../../../components/CampaignCard";
import DonationErrorModal, { DonationError } from "../../../components/DonationErrorModal";
import DonationSuccessModal from "../../../components/DonationSuccessModal";
import EmptyState from "../../../components/EmptyState";
import GeneralDonationCard from "../../../components/GeneralDonationCard";
import { useTheme } from "../../../contexts/ThemeContext";
import { Campaign, useCampaigns } from "../../../hooks/useCampaigns";
import { useDonation } from "../../../hooks/useDonation";
import { useFirebaseData } from "../../../hooks/useFirebaseData";
import { useResponsive } from "../../../hooks/useResponsive";
import { DonationFormData } from "../../../types/donation";
type ThemeFromHook = ReturnType<typeof useTheme>;


export default function GiveTab(): React.JSX.Element | null {
  const theme = useTheme();
  const { ms } = useResponsive(); // Get responsive scaling function
  const { fontScale } = useWindowDimensions(); // Get accessibility font scaling
  const { mosqueSettings } = useFirebaseData();
  const { campaigns } = useCampaigns();
  const { settings, loading, error, createDonation, createSubscription } =
    useDonation();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  
  // Memoize styles based on theme and responsive scale
  const styles = useMemo(() => createStyles(theme, ms, fontScale), [theme, ms, fontScale]);

  // Form state
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedTypeLabel, setSelectedTypeLabel] = useState<string>("");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<
    "weekly" | "fortnightly" | "monthly" | "yearly"
  >("monthly");

  // Ref for custom amount input
  const customAmountInputRef = useRef<TextInput>(null);

  // Donor info
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");

  // Processing state
  const [processing, setProcessing] = useState(false);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{
    amount: number;
    isRecurring: boolean;
    frequency?: string;
    donationType: string;
    campaignName?: string;
  } | null>(null);

  // Error modal state
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorData, setErrorData] = useState<DonationError | null>(null);

  // Parse error into DonationError type
  const parseError = (err: any): DonationError => {
    // Network errors
    if (err.message?.toLowerCase().includes('network') || 
        err.message?.toLowerCase().includes('connection') ||
        err.code === 'unavailable') {
      return {
        type: 'network',
        message: 'Network connection failed',
        originalError: err,
      };
    }

    // Validation errors
    if (err.code === 'invalid-argument' || 
        err.message?.toLowerCase().includes('invalid') ||
        err.message?.toLowerCase().includes('minimum')) {
      return {
        type: 'validation',
        message: err.message || 'Invalid information provided',
        originalError: err,
      };
    }

    // Payment errors (Stripe)
    if (err.code === 'card_declined' ||
        err.message?.toLowerCase().includes('card') ||
        err.message?.toLowerCase().includes('payment') ||
        err.message?.toLowerCase().includes('declined')) {
      return {
        type: 'payment',
        message: err.message || 'Payment declined',
        originalError: err,
      };
    }

    // Server errors
    if (err.code === 'internal' || 
        err.code === 'functions/internal' ||
        err.message?.toLowerCase().includes('server')) {
      return {
        type: 'server',
        message: 'Server error occurred',
        originalError: err,
      };
    }

    // Unknown errors
    return {
      type: 'unknown',
      message: err.message || 'An unexpected error occurred',
      originalError: err,
    };
  };

  // Initialize selected type
  useEffect(() => {
    if (settings && settings.donation_types.length > 0) {
      const firstEnabled = settings.donation_types.find((t) => t.enabled);
      if (firstEnabled) {
        setSelectedType(firstEnabled.id);
        setSelectedTypeLabel(firstEnabled.label);
      }
    }
  }, [settings]);

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      if (showDonationForm) {
        handleBackToCampaigns();
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [showDonationForm]);

  const handlePresetAmount = (value: number) => {
    setAmount(value.toString());
    setCustomAmount("");
    setShowCustomInput(false);
  };

  const handleCustomAmount = (text: string) => {
    setCustomAmount(text);
    setAmount("");
  };

  const handleCustomAmountButtonPress = () => {
    setShowCustomInput(true);
    setAmount("");
    // Focus the input after a short delay to ensure it's rendered
    setTimeout(() => {
      customAmountInputRef.current?.focus();
    }, 100);
  };

  const getDisplayAmount = (): number => {
    if (customAmount) return parseFloat(customAmount) || 0;
    if (amount) return parseFloat(amount) || 0;
    return 0;
  };

  const validateForm = (): boolean => {
    const displayAmount = getDisplayAmount();
    // Use configured minimum amount, default to 1 if not set
    const minAmount = settings?.minimum_amount ?? 1;

    if (!selectedType) {
      Alert.alert("Error", "Please select a donation type");
      return false;
    }

    if (displayAmount <= 0) {
      Alert.alert("Error", "Please enter a valid donation amount");
      return false;
    }

    if (displayAmount < minAmount) {
      Alert.alert("Error", `Minimum donation is $${minAmount.toFixed(2)}`);
      return false;
    }

    if (!isAnonymous && !donorName.trim()) {
      Alert.alert("Error", "Please enter your name or select Anonymous");
      return false;
    }

    // Email required for recurring donations (cannot be anonymous)
    if (isRecurring && (isAnonymous || !donorEmail.trim() || !donorEmail.includes("@"))) {
      Alert.alert(
        "Email Required",
        "A valid email address is required for recurring donations so you can manage your subscription. Please uncheck 'Donate Anonymously'."
      );
      return false;
    }

    return true;
  };

  const handleDonate = async () => {
    if (!validateForm()) return;

    setProcessing(true);

    try {
      const donationData: DonationFormData = {
        amount: getDisplayAmount(),
        donationType: selectedType,
        donationTypeLabel: selectedTypeLabel,
        isRecurring,
        frequency: isRecurring ? frequency : undefined,
        donorName: isAnonymous ? "Anonymous" : donorName.trim(),
        // Send empty string for anonymous instead of fake email
        // This prevents duplicate customer creation in Stripe
        donorEmail: isAnonymous ? "" : donorEmail.trim(),
        donorPhone: "",
        donorMessage: undefined,
        campaignId: selectedCampaign?.id || undefined,
      };

      // Create payment intent or subscription
      const result = isRecurring
        ? await createSubscription(donationData)
        : await createDonation(donationData);

      // Initialize Payment Sheet
      const applePayOptions = Platform.OS === "ios"
        ? { merchantCountryCode: "AU" as const }
        : undefined;

      // Google Pay configuration with approved merchant ID
      const googlePayOptions = Platform.OS === "android"
        ? { 
            merchantCountryCode: "AU" as const, 
            testEnv: false, 
            currencyCode: "AUD" as const,
            merchantName: "Al Ansar Masjid",
            buttonType: StripeTypes.PlatformPay.ButtonType.Donate, 
            // Your approved Google Pay merchant ID
            existingPaymentMethodRequired: false
          }
        : undefined;

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: result.clientSecret,
        merchantDisplayName: mosqueSettings?.name || "Al Ansar Masjid",
        applePay: applePayOptions,
        googlePay: googlePayOptions,
        defaultBillingDetails: {
          name: isAnonymous ? "Anonymous" : donorName.trim(),
          email: donorEmail.trim() || undefined,
          address: {
            country: "AU",
          }
        },
        returnURL: "alansar://payment-complete",
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // Present Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        // User cancelled or error occurred
        if (presentError.code !== "Canceled") {
          throw new Error(presentError.message);
        }
        setProcessing(false);
        return;
      }

      // Success!
      setSuccessModalData({
        amount: getDisplayAmount(),
        isRecurring,
        frequency: isRecurring ? frequency : undefined,
        donationType: selectedTypeLabel,
        campaignName: selectedCampaign?.title,
      });
      setShowSuccessModal(true);
      
      // Reset form
      setAmount("");
      setCustomAmount("");
      setShowCustomInput(false);
      setDonorName("");
      setDonorEmail("");
      setIsAnonymous(false);
      setIsRecurring(false);
    } catch (err: any) {
      const parsedError = parseError(err);
      setErrorData(parsedError);
      setShowErrorModal(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleCampaignPress = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowDonationForm(true);
  };

  const handleGeneralDonationPress = () => {
    setSelectedCampaign(null);
    setShowDonationForm(true);
  };

  const handleBackToCampaigns = () => {
    setShowDonationForm(false);
    setSelectedCampaign(null);
    // Reset form
    setAmount("");
    setCustomAmount("");
    setShowCustomInput(false);
    setDonorName("");
    setDonorEmail("");
    setIsAnonymous(false);
    setIsRecurring(false);
  };

  if (loading && !settings) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand.navy[700]} />
          <Text style={styles.loadingText}>Loading donation options...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show empty state when no settings data available after loading
  if (!loading && !settings) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <StatusBar barStyle="dark-content" />
        <EmptyState
          variant={error ? "error" : "offline"}
          title="Unable to Load Donation Settings"
          message={error || "Please check your internet connection and try again. Donation options will appear when you're back online."}
        />
      </SafeAreaView>
    );
  }

  // Check if we should show campaigns view or donation form
  const shouldShowCampaigns = campaigns.length > 0 && !showDonationForm;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Content */}
          <View style={styles.contentContainer}>
            {/* Show Campaigns View */}
            {shouldShowCampaigns && (
              <>
                <Text style={styles.sectionTitle}>Support a Campaign</Text>

                {/* General Donation Card (always first) */}
                <GeneralDonationCard onPress={handleGeneralDonationPress} />

                {/* Campaign Cards */}
                {campaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onPress={() => handleCampaignPress(campaign)}
                  />
                ))}
              </>
            )}

            {/* Show Donation Form (original form) */}
            {(!shouldShowCampaigns || showDonationForm) && (
              <>
                {/* Back button if came from campaigns */}
                {showDonationForm && campaigns.length > 0 && (
                  <View style={styles.backButtonContainer}>
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={handleBackToCampaigns}
                    >
                      <View style={styles.backButtonContent}>
                        <Ionicons name="arrow-back-circle" size={28} color={theme.colors.brand.navy[600]} />
                        <View>
                          <Text style={styles.backButtonText}>Back to Campaigns</Text>
                          <Text style={styles.backButtonSubtext}>Choose a different cause</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Show selected campaign info if applicable */}
                {selectedCampaign && (
                  <View style={styles.selectedCampaignBanner}>
                    <View style={styles.campaignBannerIcon}>
                      <Ionicons name="heart" size={20} color={theme.colors.brand.navy[700]} />
                    </View>
                    <View style={styles.campaignBannerText}>
                      <Text style={styles.campaignBannerLabel}>Donating to</Text>
                      <Text style={styles.selectedCampaignText}>
                        {selectedCampaign.title}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Original donation form */}
                {/* Donation Type Dropdown */}
                {!selectedCampaign && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="list" size={20} color={theme.colors.brand.navy[700]} />
                      <Text style={styles.label}>Donation Type *</Text>
                    </View>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={selectedType}
                        onValueChange={(value, index) => {
                          setSelectedType(value);
                          const type = settings!.donation_types.find(
                            (t) => t.id === value
                          );
                          if (type) setSelectedTypeLabel(type.label);
                        }}
                        style={styles.picker}
                        itemStyle={styles.pickerItem}
                        mode={Platform.OS === 'android' ? 'dropdown' : undefined}
                        dropdownIconColor={theme.colors.text.muted}
                      >
                        {settings!.donation_types
                          .filter((type) => type.enabled)
                          .map((type) => (
                            <Picker.Item
                              key={type.id}
                              label={type.label}
                              value={type.id}
                            />
                          ))}
                      </Picker>
                    </View>
                  </View>
                )}

                {/* Amount Selection */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="cash" size={20} color={theme.colors.brand.gold[600]} />
                    <Text style={styles.label}>Amount (AUD) *</Text>
                  </View>
                  <View style={styles.amountGrid}>
                    {settings!.preset_amounts.map((presetAmount) => (
                      <TouchableOpacity
                        key={presetAmount}
                        style={[
                          styles.amountButton,
                          amount === presetAmount.toString() &&
                            styles.amountButtonSelected,
                        ]}
                        onPress={() => handlePresetAmount(presetAmount)}
                      >
                        <Text
                          style={[
                            styles.amountButtonText,
                            amount === presetAmount.toString() &&
                              styles.amountButtonTextSelected,
                          ]}
                        >
                          ${presetAmount}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {!showCustomInput ? (
                    <TouchableOpacity
                      style={styles.customAmountButton}
                      onPress={handleCustomAmountButtonPress}
                    >
                      <Ionicons name="create-outline" size={20} color={theme.colors.brand.navy[600]} />
                      <Text style={styles.customAmountButtonText}>
                        Enter custom amount
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TextInput
                      ref={customAmountInputRef}
                      style={styles.input}
                      placeholder="Enter custom amount"
                      placeholderTextColor={theme.colors.text.muted}
                      keyboardType="numeric"
                      value={customAmount}
                      onChangeText={handleCustomAmount}
                    />
                  )}
                </View>

                {/* Recurring Toggle */}
                <View style={styles.recurringSection}>
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => {
                      const newValue = !isRecurring;
                      setIsRecurring(newValue);
                      if (newValue && isAnonymous) {
                        setIsAnonymous(false); // Auto-uncheck anonymous
                      }
                    }}
                  >
                    <Ionicons
                      name={isRecurring ? "checkbox" : "square-outline"}
                      size={24}
                      color={theme.colors.brand.navy[700]}
                    />
                    <Text style={styles.checkboxLabel}>Make this recurring</Text>
                  </TouchableOpacity>

                  {/* Frequency Buttons */}
                  {isRecurring && (
                    <View style={styles.frequencyButtonsContainer}>
                      <Text style={styles.frequencyLabel}>Choose frequency:</Text>
                      <View style={styles.frequencyButtonsGrid}>
                        {settings!.recurring_frequencies
                          .filter((freq) => freq.enabled)
                          .map((freq) => (
                            <TouchableOpacity
                              key={freq.id}
                              style={[
                                styles.frequencyButton,
                                frequency === freq.id &&
                                  styles.frequencyButtonSelected,
                              ]}
                              onPress={() => setFrequency(freq.id as any)}
                            >
                              <Text
                                style={[
                                  styles.frequencyButtonText,
                                  frequency === freq.id &&
                                    styles.frequencyButtonTextSelected,
                                ]}
                              >
                                {freq.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                      </View>
                    </View>
                  )}
                </View>

                {/* Anonymous Toggle */}
                <View style={styles.anonymousSection}>
                  <TouchableOpacity
                    style={[
                      styles.checkboxRow,
                      isRecurring && styles.checkboxRowDisabled,
                    ]}
                    onPress={() => {
                      if (!isRecurring) {
                        setIsAnonymous(!isAnonymous);
                      }
                    }}
                    disabled={isRecurring}
                  >
                    <Ionicons
                      name={isAnonymous ? "checkbox" : "square-outline"}
                      size={24}
                      color={theme.colors.brand.navy[700]}
                    />
                    <Text
                      style={[
                        styles.checkboxLabel,
                        isRecurring && styles.checkboxLabelDisabled,
                      ]}
                    >
                      Donate anonymously
                      {isRecurring && " (Not available for recurring)"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Donor Information */}
                {(!isAnonymous || isRecurring) && (
                  <View style={styles.donorInfoSection}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="person" size={20} color={theme.colors.brand.navy[700]} />
                      <Text style={styles.label}>Your Information</Text>
                    </View>

                    <TextInput
                      style={styles.input}
                      placeholder="Full Name *"
                      placeholderTextColor={theme.colors.text.muted}
                      value={donorName}
                      onChangeText={setDonorName}
                      autoCapitalize="words"
                      numberOfLines={1}
                    />

                    <TextInput
                      style={styles.input}
                      placeholder={isRecurring ? "Email *" : "Email (optional)"}
                      placeholderTextColor={theme.colors.text.muted}
                      value={donorEmail}
                      onChangeText={setDonorEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      numberOfLines={1}
                    />

                    {isRecurring && (
                      <View style={styles.infoBox}>
                        <Ionicons
                          name="information-circle"
                          size={20}
                          color={theme.colors.brand.navy[700]}
                        />
                        <Text style={styles.infoText}>
                          Email required to manage your recurring donation
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Payment Methods Info */}
                <View style={styles.paymentMethodsInfo}>
                  <Text style={styles.paymentMethodsTitle}>We accept:</Text>
                  <View style={styles.paymentMethodsIcons}>
                    {Platform.OS === "ios" && (
                      <View style={styles.paymentMethodBadge}>
                        <Ionicons name="logo-apple" size={20} color="#000" />
                        <Text style={styles.paymentMethodText}>Apple Pay</Text>
                      </View>
                    )}
                    {Platform.OS === "android" && (
                      <View style={styles.paymentMethodBadge}>
                        <Ionicons
                          name="logo-google"
                          size={20}
                          color="#4285F4"
                        />
                        <Text style={styles.paymentMethodText}>Google Pay</Text>
                      </View>
                    )}
                    <View style={styles.paymentMethodBadge}>
                      <Ionicons name="card" size={20} color={theme.colors.brand.navy[700]} />
                      <Text style={styles.paymentMethodText}>Card</Text>
                    </View>
                  </View>
                </View>

                {/* Donate Button */}
                <TouchableOpacity
                  style={[
                    styles.donateButton,
                    processing && styles.donateButtonDisabled,
                  ]}
                  onPress={handleDonate}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="heart" size={24} color="#fff" />
                      <Text style={styles.donateButtonText}>
                        Donate ${getDisplayAmount().toFixed(2)}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Security Note */}
                <View style={styles.securityNote}>
                  <Ionicons name="shield-checkmark" size={20} color={theme.colors.accent.green} />
                  <Text style={styles.securityText}>
                    Secure payment powered by Stripe
                  </Text>
                </View>

                {/* TEST ERROR BUTTONS - Remove in production */}
                {__DEV__ && (
                  <View style={{ marginTop: ms(20), gap: ms(10, 0.1) }}>
                    <TouchableOpacity
                      style={{ backgroundColor: '#ef4444', padding: ms(12, 0.1), borderRadius: ms(8, 0.1) }}
                      onPress={() => {
                        setErrorData({
                          type: 'payment',
                          message: 'Your card was declined',
                        });
                        setShowErrorModal(true);
                      }}
                    >
                      <Text style={{ color: 'white', textAlign: 'center', fontSize: ms(14, 0.2) * fontScale }}>Test Payment Error</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ backgroundColor: '#f59e0b', padding: ms(12, 0.1), borderRadius: ms(8, 0.1) }}
                      onPress={() => {
                        setErrorData({
                          type: 'network',
                          message: 'Network connection failed',
                        });
                        setShowErrorModal(true);
                      }}
                    >
                      <Text style={{ color: 'white', textAlign: 'center', fontSize: ms(14, 0.2) * fontScale }}>Test Network Error</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ backgroundColor: '#8b5cf6', padding: ms(12, 0.1), borderRadius: ms(8, 0.1) }}
                      onPress={() => {
                        setErrorData({
                          type: 'validation',
                          message: 'Minimum donation is $5',
                        });
                        setShowErrorModal(true);
                      }}
                    >
                      <Text style={{ color: 'white', textAlign: 'center', fontSize: ms(14, 0.2) * fontScale }}>Test Validation Error</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <DonationSuccessModal
        visible={showSuccessModal && !!successModalData}
        onClose={() => {
          setShowSuccessModal(false);
          setShowDonationForm(false);
          setSelectedCampaign(null);
          setSuccessModalData(null);
        }}
        amount={successModalData?.amount || 0}
        isRecurring={successModalData?.isRecurring || false}
        frequency={successModalData?.frequency}
        donationType={successModalData?.donationType || ''}
        campaignName={successModalData?.campaignName}
      />

      {/* Error Modal */}
      <DonationErrorModal
        visible={showErrorModal && !!errorData}
        onClose={() => {
          setShowErrorModal(false);
          setErrorData(null);
        }}
        onRetry={() => {
          setShowErrorModal(false);
          handleDonate();
        }}
        error={errorData}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemeFromHook, ms: (size: number, factor?: number) => number, fontScale: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.muted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.surface.muted,
  },
  loadingText: {
    marginTop: theme.spacing.lg,
    fontSize: ms(16, 0.2) * fontScale,
    color: theme.colors.text.muted,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: theme.spacing.xxl,
    paddingBottom: 40,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface.muted,
    padding: theme.spacing.xl,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: ms(22, 0.3) * fontScale,
    fontWeight: "bold",
    color: theme.colors.text.strong,
    marginBottom: theme.spacing.xl,
  },
  backButtonContainer: {
    marginBottom: theme.spacing.xxl,
  },
  backButton: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    ...theme.shadow.soft,
  },
  backButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  backButtonText: {
    fontSize: theme.spacing.lg,
    fontWeight: "700",
    color: theme.colors.brand.navy[700],
  },
  backButtonSubtext: {
    fontSize: theme.typography.small,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  selectedCampaignBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.accent.amberSoft,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.xxl,
    borderLeftWidth: ms(4, 0.1),
    borderLeftColor: theme.colors.brand.gold[600],
    ...theme.shadow.soft,
  },
  campaignBannerIcon: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: theme.colors.surface.base,
    alignItems: "center",
    justifyContent: "center",
  },
  campaignBannerText: {
    flex: 1,
  },
  campaignBannerLabel: {
    fontSize: theme.typography.small,
    color: theme.colors.text.muted,
    marginBottom: 2,
  },
  selectedCampaignText: {
    fontSize: theme.spacing.lg,
    fontWeight: "700",
    color: theme.colors.brand.gold[600],
  },
  section: {
    marginBottom: theme.spacing.xxl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.spacing.lg,
    fontWeight: "600",
    color: theme.colors.text.strong,
  },
  pickerContainer: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radius.md,
    borderWidth: ms(2, 0.05),
    borderColor: theme.colors.border.base,
    overflow: "hidden",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: Platform.OS === 'android' ? 2 : 0,
  },
  picker: {
    height: Platform.OS === 'android' ? 56 : 44,
    color: theme.colors.text.strong,
    backgroundColor: 'transparent',
    paddingVertical: Platform.OS === 'android' ? 8 : 0,
  },
  pickerItem: {
    fontSize: ms(16, 0.2) * fontScale,
    color: theme.colors.text.strong,
    height: ms(44),
  },
  amountGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  amountButton: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    alignItems: "center",
    borderWidth: ms(2, 0.05),
    borderColor: theme.colors.border.base,
  },
  amountButtonSelected: {
    borderColor: theme.colors.brand.navy[700],
    backgroundColor: theme.colors.brand.navy[700],
  },
  amountButtonText: {
    fontSize: ms(18, 0.3) * fontScale,
    fontWeight: "bold",
    color: theme.colors.text.strong,
  },
  amountButtonTextSelected: {
    color: theme.colors.text.header,
  },
  input: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    fontSize: ms(16, 0.2) * fontScale,
    color: theme.colors.text.strong,
    marginBottom: theme.spacing.md,
    borderWidth: ms(2, 0.05),
    borderColor: theme.colors.border.base,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  recurringSection: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadow.soft,
  },
  anonymousSection: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadow.soft,
  },
  donorInfoSection: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadow.soft,
  },
  checkboxLabel: {
    fontSize: ms(16, 0.2) * fontScale,
    fontWeight: "600",
    color: theme.colors.text.strong,
  },
  frequencyButtonsContainer: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: ms(1, 0.05),
    borderTopColor: theme.colors.border.base,
  },
  frequencyLabel: {
    fontSize: ms(14, 0.2) * fontScale,
    fontWeight: "600",
    color: theme.colors.text.muted,
    marginBottom: theme.spacing.md,
  },
  frequencyButtonsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  frequencyButton: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: theme.colors.surface.muted,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    alignItems: "center",
    borderWidth: ms(2, 0.05),
    borderColor: theme.colors.border.base,
  },
  frequencyButtonSelected: {
    backgroundColor: theme.colors.accent.blueSoft,
    borderColor: theme.colors.brand.navy[700],
  },
  frequencyButtonText: {
    fontSize: ms(16, 0.2) * fontScale,
    fontWeight: "600",
    color: theme.colors.text.strong,
  },
  frequencyButtonTextSelected: {
    color: theme.colors.brand.navy[700],
    fontWeight: "700",
  },
  paymentMethodsInfo: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  paymentMethodsTitle: {
    fontSize: ms(14, 0.2) * fontScale,
    fontWeight: "600",
    color: theme.colors.text.muted,
    marginBottom: theme.spacing.md,
  },
  paymentMethodsIcons: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  paymentMethodBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface.soft,
    borderRadius: theme.radius.sm,
  },
  paymentMethodText: {
    fontSize: ms(13, 0.1) * fontScale,
    fontWeight: "600",
    color: theme.colors.text.strong,
  },
  donateButton: {
    backgroundColor: theme.colors.brand.navy[700],
    borderRadius: theme.radius.md,
    padding: theme.typography.h3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md,
    ...theme.shadow.header,
  },
  donateButtonDisabled: {
    backgroundColor: theme.colors.text.muted,
    shadowOpacity: 0,
    elevation: 0,
  },
  donateButtonText: {
    color: theme.colors.text.header,
    fontSize: theme.typography.h3,
    fontWeight: "bold",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  securityText: {
    fontSize: theme.typography.body,
    color: theme.colors.text.muted,
  },
  checkboxRowDisabled: {
    opacity: 0.5,
  },
  checkboxLabelDisabled: {
    color: theme.colors.text.muted,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.accent.blueSoft,
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: ms(13, 0.1) * fontScale,
    color: theme.colors.brand.navy[700],
    lineHeight: ms(18, 0.1),
  },
  customAmountButton: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    borderWidth: ms(2, 0.05),
    borderColor: theme.colors.border.base,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  customAmountButtonText: {
    fontSize: theme.spacing.lg,
    fontWeight: "600",
    color: theme.colors.brand.navy[700],
  },
});
