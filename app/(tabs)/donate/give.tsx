// ============================================================================
// DONATION SCREEN — Direction A (calm, amount-first)
// ============================================================================

import { Ionicons } from "@expo/vector-icons";
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
  Switch,
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
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const { mosqueSettings } = useFirebaseData();
  const { campaigns } = useCampaigns();
  const { settings, loading, error, createDonation, createSubscription } =
    useDonation();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const styles = useMemo(
    () => createStyles(theme, ms, fontScale),
    [theme, ms, fontScale]
  );

  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedTypeLabel, setSelectedTypeLabel] = useState<string>("");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<
    "weekly" | "fortnightly" | "monthly" | "yearly"
  >("monthly");

  const customAmountInputRef = useRef<TextInput>(null);

  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");

  const [processing, setProcessing] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{
    amount: number;
    isRecurring: boolean;
    frequency?: string;
    donationType: string;
    campaignName?: string;
  } | null>(null);

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorData, setErrorData] = useState<DonationError | null>(null);

  const parseError = (err: any): DonationError => {
    if (
      err.message?.toLowerCase().includes("network") ||
      err.message?.toLowerCase().includes("connection") ||
      err.code === "unavailable"
    ) {
      return {
        type: "network",
        message: "Network connection failed",
        originalError: err,
      };
    }

    if (
      err.code === "invalid-argument" ||
      err.message?.toLowerCase().includes("invalid") ||
      err.message?.toLowerCase().includes("minimum")
    ) {
      return {
        type: "validation",
        message: err.message || "Invalid information provided",
        originalError: err,
      };
    }

    if (
      err.code === "card_declined" ||
      err.message?.toLowerCase().includes("card") ||
      err.message?.toLowerCase().includes("payment") ||
      err.message?.toLowerCase().includes("declined")
    ) {
      return {
        type: "payment",
        message: err.message || "Payment declined",
        originalError: err,
      };
    }

    if (
      err.code === "internal" ||
      err.code === "functions/internal" ||
      err.message?.toLowerCase().includes("server")
    ) {
      return {
        type: "server",
        message: "Server error occurred",
        originalError: err,
      };
    }

    return {
      type: "unknown",
      message: err.message || "An unexpected error occurred",
      originalError: err,
    };
  };

  // Auto-select general donation type — no type picker in UI.
  // Specific causes are modeled as campaigns instead.
  useEffect(() => {
    if (!settings?.donation_types?.length) return;

    const enabled = settings.donation_types.filter((t) => t.enabled);
    const general =
      enabled.find((t) => /general/i.test(t.id) || /general/i.test(t.label)) ||
      enabled[0];

    if (general) {
      setSelectedType(general.id);
      setSelectedTypeLabel(general.label || "General donation");
    }
  }, [settings]);

  useEffect(() => {
    const backAction = () => {
      if (showDonationForm) {
        handleBackToCampaigns();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [showDonationForm]);

  const handlePresetAmount = (value: number) => {
    setAmount(value.toString());
    setCustomAmount("");
  };

  const handleCustomAmount = (text: string) => {
    setCustomAmount(text);
    setAmount("");
  };

  const getDisplayAmount = (): number => {
    if (customAmount) return parseFloat(customAmount) || 0;
    if (amount) return parseFloat(amount) || 0;
    return 0;
  };

  const formatDisplayAmount = (value: number): string => {
    if (!value) return "0";
    return value.toLocaleString("en-AU", {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2,
    });
  };

  const validateForm = (): boolean => {
    const displayAmount = getDisplayAmount();
    const minAmount = settings?.minimum_amount ?? 1;

    if (!selectedType) {
      Alert.alert("Error", "Donation settings are incomplete. Please try again later.");
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
      Alert.alert("Error", "Please enter your name or choose anonymous");
      return false;
    }

    if (
      isRecurring &&
      (isAnonymous || !donorEmail.trim() || !donorEmail.includes("@"))
    ) {
      Alert.alert(
        "Email Required",
        "A valid email address is required for recurring donations so you can manage your subscription."
      );
      return false;
    }

    return true;
  };

  const handleDonate = async () => {
    if (!validateForm()) return;

    setProcessing(true);

    try {
      const resolvedTypeLabel =
        selectedCampaign?.title || selectedTypeLabel || "General donation";

      const donationData: DonationFormData = {
        amount: getDisplayAmount(),
        donationType: selectedType,
        donationTypeLabel: resolvedTypeLabel,
        isRecurring,
        frequency: isRecurring ? frequency : undefined,
        donorName: isAnonymous ? "Anonymous" : donorName.trim(),
        donorEmail: isAnonymous ? "" : donorEmail.trim(),
        donorPhone: "",
        donorMessage: undefined,
        campaignId: selectedCampaign?.id || undefined,
      };

      const result = isRecurring
        ? await createSubscription(donationData)
        : await createDonation(donationData);

      const applePayOptions =
        Platform.OS === "ios"
          ? { merchantCountryCode: "AU" as const }
          : undefined;

      const googlePayOptions =
        Platform.OS === "android"
          ? {
              merchantCountryCode: "AU" as const,
              testEnv: false,
              currencyCode: "AUD" as const,
              merchantName: "Al Ansar Masjid",
              buttonType: StripeTypes.PlatformPay.ButtonType.Donate,
              existingPaymentMethodRequired: false,
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
          },
        },
        returnURL: "alansar://payment-complete",
      });

      if (initError) {
        throw new Error(initError.message);
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== "Canceled") {
          throw new Error(presentError.message);
        }
        setProcessing(false);
        return;
      }

      setSuccessModalData({
        amount: getDisplayAmount(),
        isRecurring,
        frequency: isRecurring ? frequency : undefined,
        donationType: resolvedTypeLabel,
        campaignName: selectedCampaign?.title,
      });
      setShowSuccessModal(true);

      setAmount("");
      setCustomAmount("");
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
    setAmount("");
    setCustomAmount("");
    setDonorName("");
    setDonorEmail("");
    setIsAnonymous(false);
    setIsRecurring(false);
  };

  const handleRecurringChange = (recurring: boolean) => {
    setIsRecurring(recurring);
    if (recurring && isAnonymous) {
      setIsAnonymous(false);
    }
  };

  const handleAnonymousChange = (value: boolean) => {
    if (isRecurring) return;
    setIsAnonymous(value);
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

  if (!loading && !settings) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <StatusBar barStyle="dark-content" />
        <EmptyState
          variant={error ? "error" : "offline"}
          title="Unable to Load Donation Settings"
          message={
            error ||
            "Please check your internet connection and try again. Donation options will appear when you're back online."
          }
        />
      </SafeAreaView>
    );
  }

  const shouldShowCampaigns = campaigns.length > 0 && !showDonationForm;
  const showForm = !shouldShowCampaigns || showDonationForm;
  const showDonorFields = !isAnonymous || isRecurring;
  const displayAmount = getDisplayAmount();
  const enabledFrequencies = settings!.recurring_frequencies.filter(
    (freq) => freq.enabled
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        {shouldShowCampaigns && (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.contentContainer}>
              <View style={styles.intro}>
                <Text style={styles.introTitle}>Support a cause</Text>
                <Text style={styles.introSubtitle}>
                  Choose a campaign, or give to general mosque funds.
                </Text>
              </View>

              <GeneralDonationCard onPress={handleGeneralDonationPress} />

              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onPress={() => handleCampaignPress(campaign)}
                />
              ))}
            </View>
          </ScrollView>
        )}

        {showForm && (
          <View style={styles.flex}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.formScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.contentContainer}>
                {showDonationForm && campaigns.length > 0 && (
                  <TouchableOpacity
                    style={styles.backLink}
                    onPress={handleBackToCampaigns}
                    accessibilityRole="button"
                    accessibilityLabel="Back to causes"
                  >
                    <Ionicons
                      name="chevron-back"
                      size={ms(18, 0.2)}
                      color={theme.colors.brand.navy[700]}
                    />
                    <Text style={styles.backLinkText}>Back to causes</Text>
                  </TouchableOpacity>
                )}

                {selectedCampaign ? (
                  <View style={styles.causeChip}>
                    <View style={styles.causeChipDot} />
                    <Text style={styles.causeChipText} numberOfLines={1}>
                      {selectedCampaign.title}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.intro}>
                    <Text style={styles.introTitle}>Make a donation</Text>
                    <Text style={styles.introSubtitle}>
                      Support Al Ansar’s daily operations and community
                      programs.
                    </Text>
                  </View>
                )}

                <View style={styles.panel}>
                  <View style={styles.amountFocus}>
                    <Text style={styles.eyebrow}>Your gift</Text>
                    <Text style={styles.amountDisplay}>
                      <Text style={styles.amountCurrency}>$</Text>
                      {formatDisplayAmount(displayAmount)}
                    </Text>
                  </View>

                  <View style={styles.amountGrid}>
                    {settings!.preset_amounts.map((presetAmount) => {
                      const selected =
                        !customAmount && amount === presetAmount.toString();
                      return (
                        <TouchableOpacity
                          key={presetAmount}
                          style={[
                            styles.amountButton,
                            selected && styles.amountButtonSelected,
                          ]}
                          onPress={() => handlePresetAmount(presetAmount)}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                        >
                          <Text
                            style={[
                              styles.amountButtonText,
                              selected && styles.amountButtonTextSelected,
                            ]}
                          >
                            ${presetAmount}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.customAmountRow}>
                    <Text style={styles.customAmountPrefix}>$</Text>
                    <TextInput
                      ref={customAmountInputRef}
                      style={styles.customAmountInput}
                      placeholder="Or enter custom amount"
                      placeholderTextColor={theme.colors.text.subtle}
                      keyboardType="numeric"
                      value={customAmount}
                      onChangeText={handleCustomAmount}
                    />
                  </View>

                  <View style={styles.block}>
                    <Text style={styles.blockLabel}>Frequency</Text>
                    <View style={styles.segment}>
                      <TouchableOpacity
                        style={[
                          styles.segmentItem,
                          !isRecurring && styles.segmentItemSelected,
                        ]}
                        onPress={() => handleRecurringChange(false)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: !isRecurring }}
                      >
                        <Text
                          style={[
                            styles.segmentText,
                            !isRecurring && styles.segmentTextSelected,
                          ]}
                        >
                          One-time
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.segmentItem,
                          isRecurring && styles.segmentItemSelected,
                        ]}
                        onPress={() => handleRecurringChange(true)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isRecurring }}
                      >
                        <Text
                          style={[
                            styles.segmentText,
                            isRecurring && styles.segmentTextSelected,
                          ]}
                        >
                          Recurring
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {isRecurring && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.freqRow}
                      >
                        {enabledFrequencies.map((freq) => {
                          const selected = frequency === freq.id;
                          return (
                            <TouchableOpacity
                              key={freq.id}
                              style={[
                                styles.freqChip,
                                selected && styles.freqChipSelected,
                              ]}
                              onPress={() =>
                                setFrequency(
                                  freq.id as
                                    | "weekly"
                                    | "fortnightly"
                                    | "monthly"
                                    | "yearly"
                                )
                              }
                              accessibilityRole="button"
                              accessibilityState={{ selected }}
                            >
                              <Text
                                style={[
                                  styles.freqChipText,
                                  selected && styles.freqChipTextSelected,
                                ]}
                              >
                                {freq.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    )}
                  </View>

                  <View style={styles.block}>
                    <View style={styles.toggleRow}>
                      <View style={styles.toggleCopy}>
                        <Text style={styles.toggleLabel}>
                          Give anonymously
                        </Text>
                        <Text style={styles.toggleHint}>
                          {isRecurring
                            ? "Not available for recurring gifts"
                            : "Your name won’t appear on records"}
                        </Text>
                      </View>
                      <Switch
                        value={isAnonymous}
                        onValueChange={handleAnonymousChange}
                        disabled={isRecurring}
                        trackColor={{
                          false: theme.colors.border.base,
                          true: theme.colors.brand.navy[700],
                        }}
                        thumbColor={theme.colors.surface.base}
                        ios_backgroundColor={theme.colors.border.base}
                      />
                    </View>
                  </View>

                  {showDonorFields && (
                    <View style={styles.block}>
                      <Text style={styles.blockLabel}>Your details</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Full name"
                        placeholderTextColor={theme.colors.text.subtle}
                        value={donorName}
                        onChangeText={setDonorName}
                        autoCapitalize="words"
                      />
                      <TextInput
                        style={[styles.input, styles.inputLast]}
                        placeholder={
                          isRecurring ? "Email (required)" : "Email (optional)"
                        }
                        placeholderTextColor={theme.colors.text.subtle}
                        value={donorEmail}
                        onChangeText={setDonorEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      {isRecurring && (
                        <View style={styles.infoBox}>
                          <Ionicons
                            name="information-circle"
                            size={ms(18, 0.2)}
                            color={theme.colors.brand.navy[700]}
                          />
                          <Text style={styles.infoText}>
                            Email is required to manage your recurring donation
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {__DEV__ && (
                  <View style={styles.devButtons}>
                    <TouchableOpacity
                      style={[styles.devButton, styles.devButtonPayment]}
                      onPress={() => {
                        setErrorData({
                          type: "payment",
                          message: "Your card was declined",
                        });
                        setShowErrorModal(true);
                      }}
                    >
                      <Text style={styles.devButtonText}>
                        Test Payment Error
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.devButton, styles.devButtonNetwork]}
                      onPress={() => {
                        setErrorData({
                          type: "network",
                          message: "Network connection failed",
                        });
                        setShowErrorModal(true);
                      }}
                    >
                      <Text style={styles.devButtonText}>
                        Test Network Error
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.devButton, styles.devButtonValidation]}
                      onPress={() => {
                        setErrorData({
                          type: "validation",
                          message: "Minimum donation is $5",
                        });
                        setShowErrorModal(true);
                      }}
                    >
                      <Text style={styles.devButtonText}>
                        Test Validation Error
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.ctaBar}>
              <TouchableOpacity
                style={[
                  styles.donateButton,
                  processing && styles.donateButtonDisabled,
                ]}
                onPress={handleDonate}
                disabled={processing}
                accessibilityRole="button"
                accessibilityLabel={`Donate ${displayAmount.toFixed(2)} dollars`}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="heart"
                      size={ms(20, 0.2)}
                      color={theme.colors.brand.gold[400]}
                    />
                    <Text style={styles.donateButtonText}>
                      Donate ${displayAmount.toFixed(2)}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <View style={styles.securityNote}>
                <Ionicons
                  name="shield-checkmark"
                  size={ms(14, 0.2)}
                  color={theme.colors.accent.green}
                />
                <Text style={styles.securityText}>
                  Secure payment powered by Stripe
                </Text>
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

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
        donationType={successModalData?.donationType || ""}
        campaignName={successModalData?.campaignName}
      />

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

const createStyles = (
  theme: ThemeFromHook,
  ms: (size: number, factor?: number) => number,
  fontScale: number
) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
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
      paddingBottom: theme.spacing.xxl,
    },
    formScrollContent: {
      flexGrow: 1,
      paddingBottom: ms(24, 0.1),
    },
    contentContainer: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.lg,
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
    backLink: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: ms(2, 0.05),
      marginBottom: theme.spacing.md,
      paddingVertical: ms(4, 0.05),
    },
    backLinkText: {
      fontSize: ms(14, 0.2) * fontScale,
      fontWeight: "500",
      color: theme.colors.brand.navy[700],
    },
    causeChip: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: theme.spacing.sm,
      maxWidth: "100%",
      backgroundColor: theme.colors.accent.amberSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(217, 119, 6, 0.25)",
      borderRadius: theme.radius.pill,
      paddingVertical: ms(8, 0.1),
      paddingHorizontal: ms(12, 0.1),
      marginBottom: theme.spacing.lg,
    },
    causeChipDot: {
      width: ms(7, 0.05),
      height: ms(7, 0.05),
      borderRadius: ms(4, 0.05),
      backgroundColor: theme.colors.brand.gold[600],
    },
    causeChipText: {
      flexShrink: 1,
      fontSize: ms(13, 0.2) * fontScale,
      fontWeight: "600",
      color: theme.colors.brand.gold[600],
    },
    panel: {
      backgroundColor: theme.colors.surface.base,
      borderRadius: theme.radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.soft,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.md,
    },
    amountFocus: {
      alignItems: "center",
      paddingBottom: theme.spacing.xl,
      marginBottom: theme.spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.soft,
    },
    eyebrow: {
      fontSize: ms(11, 0.15) * fontScale,
      fontWeight: "500",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: theme.colors.text.muted,
      marginBottom: ms(6, 0.05),
    },
    amountDisplay: {
      fontSize: ms(40, 0.35) * fontScale,
      fontWeight: "700",
      color: theme.colors.brand.navy[800],
      letterSpacing: -1,
    },
    amountCurrency: {
      fontSize: ms(22, 0.3) * fontScale,
      fontWeight: "600",
      color: theme.colors.text.muted,
    },
    amountGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    amountButton: {
      flexGrow: 1,
      flexBasis: "30%",
      minWidth: "28%",
      backgroundColor: theme.colors.surface.soft,
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing.lg,
      alignItems: "center",
      borderWidth: ms(1.5, 0.05),
      borderColor: theme.colors.border.base,
    },
    amountButtonSelected: {
      borderColor: theme.colors.brand.navy[700],
      backgroundColor: theme.colors.brand.navy[700],
    },
    amountButtonText: {
      fontSize: ms(15, 0.2) * fontScale,
      fontWeight: "600",
      color: theme.colors.text.strong,
    },
    amountButtonTextSelected: {
      color: theme.colors.text.header,
    },
    customAmountRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.surface.soft,
      borderRadius: theme.radius.md,
      borderWidth: ms(1.5, 0.05),
      borderColor: theme.colors.border.base,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: Platform.OS === "ios" ? theme.spacing.md : theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    customAmountPrefix: {
      fontSize: ms(16, 0.2) * fontScale,
      fontWeight: "600",
      color: theme.colors.text.muted,
    },
    customAmountInput: {
      flex: 1,
      fontSize: ms(15, 0.2) * fontScale,
      fontWeight: "500",
      color: theme.colors.text.strong,
      paddingVertical: theme.spacing.sm,
    },
    block: {
      paddingTop: theme.spacing.xl,
      marginTop: theme.spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.soft,
    },
    blockLabel: {
      fontSize: ms(11, 0.15) * fontScale,
      fontWeight: "500",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: theme.colors.text.muted,
      marginBottom: theme.spacing.md,
    },
    segment: {
      flexDirection: "row",
      backgroundColor: theme.colors.surface.muted,
      borderRadius: theme.radius.md,
      padding: ms(3, 0.05),
      gap: ms(2, 0.05),
    },
    segmentItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: ms(10, 0.1),
      borderRadius: ms(10, 0.1),
    },
    segmentItemSelected: {
      backgroundColor: theme.colors.surface.base,
      ...theme.shadow.soft,
    },
    segmentText: {
      fontSize: ms(13, 0.2) * fontScale,
      fontWeight: "500",
      color: theme.colors.text.muted,
    },
    segmentTextSelected: {
      color: theme.colors.brand.navy[800],
      fontWeight: "600",
    },
    freqRow: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.md,
    },
    freqChip: {
      borderWidth: ms(1.5, 0.05),
      borderColor: theme.colors.border.base,
      backgroundColor: theme.colors.surface.base,
      borderRadius: theme.radius.pill,
      paddingVertical: ms(8, 0.1),
      paddingHorizontal: ms(14, 0.1),
    },
    freqChipSelected: {
      borderColor: theme.colors.brand.gold[600],
      backgroundColor: theme.colors.accent.amberSoft,
    },
    freqChipText: {
      fontSize: ms(13, 0.2) * fontScale,
      fontWeight: "500",
      color: theme.colors.text.muted,
    },
    freqChipTextSelected: {
      color: theme.colors.brand.gold[600],
      fontWeight: "600",
    },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing.md,
    },
    toggleCopy: {
      flex: 1,
      minWidth: 0,
    },
    toggleLabel: {
      fontSize: ms(15, 0.2) * fontScale,
      fontWeight: "500",
      color: theme.colors.text.strong,
    },
    toggleHint: {
      marginTop: ms(2, 0.05),
      fontSize: ms(12, 0.15) * fontScale,
      color: theme.colors.text.muted,
    },
    input: {
      backgroundColor: theme.colors.surface.soft,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: Platform.OS === "ios" ? theme.spacing.md : theme.spacing.sm,
      fontSize: ms(15, 0.2) * fontScale,
      color: theme.colors.text.strong,
      marginBottom: theme.spacing.md,
      borderWidth: ms(1.5, 0.05),
      borderColor: theme.colors.border.base,
    },
    inputLast: {
      marginBottom: 0,
    },
    infoBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.accent.blueSoft,
      padding: theme.spacing.md,
      borderRadius: theme.radius.sm,
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    infoText: {
      flex: 1,
      fontSize: ms(12, 0.15) * fontScale,
      color: theme.colors.brand.navy[700],
      lineHeight: ms(17, 0.15),
    },
    ctaBar: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      backgroundColor: theme.colors.surface.muted,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.soft,
    },
    donateButton: {
      backgroundColor: theme.colors.brand.navy[800],
      borderRadius: theme.radius.lg,
      paddingVertical: theme.spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.sm,
      ...theme.shadow.header,
    },
    donateButtonDisabled: {
      backgroundColor: theme.colors.text.muted,
      shadowOpacity: 0,
      elevation: 0,
    },
    donateButtonText: {
      color: theme.colors.text.header,
      fontSize: ms(16, 0.2) * fontScale,
      fontWeight: "600",
    },
    securityNote: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.md,
    },
    securityText: {
      fontSize: ms(12, 0.15) * fontScale,
      color: theme.colors.text.muted,
    },
    devButtons: {
      marginTop: theme.spacing.xl,
      gap: theme.spacing.sm,
    },
    devButton: {
      padding: theme.spacing.md,
      borderRadius: theme.radius.sm,
    },
    devButtonPayment: {
      backgroundColor: "#ef4444",
    },
    devButtonNetwork: {
      backgroundColor: "#f59e0b",
    },
    devButtonValidation: {
      backgroundColor: "#8b5cf6",
    },
    devButtonText: {
      color: "#fff",
      textAlign: "center",
      fontSize: ms(14, 0.2) * fontScale,
    },
  });
