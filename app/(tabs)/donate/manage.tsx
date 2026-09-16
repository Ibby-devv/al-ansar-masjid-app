import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import {
  BlockLabel,
  Panel,
  PrimaryButton,
  ScreenIntro,
} from "../../../components/ui/calm";
import { AppTheme, useTheme } from "../../../contexts/ThemeContext";
import { regionalFunctions } from "../../../firebase";
import { useResponsive } from "../../../hooks/useResponsive";

const CAPABILITIES = [
  {
    icon: "card-outline" as const,
    title: "Payment method",
    description: "Update your card or change how you pay",
  },
  {
    icon: "document-text-outline" as const,
    title: "Invoices & receipts",
    description: "View and download payment receipts",
  },
  {
    icon: "pause-circle-outline" as const,
    title: "Pause or cancel",
    description: "Temporarily pause or stop recurring gifts",
  },
];

export default function ManageTab(): React.JSX.Element {
  const theme = useTheme();
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(
    () => createStyles(theme, ms, fontScale),
    [theme, ms, fontScale]
  );

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestLink = async (): Promise<void> => {
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const requestManagementLink = regionalFunctions.httpsCallable(
        "requestManagementLink"
      );

      await requestManagementLink({ email: email.trim() });

      Alert.alert(
        "Check your email",
        "We sent you a link to manage your recurring donations.",
        [{ text: "OK" }]
      );

      setEmail("");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to send link";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenIntro
          title="Manage recurring gifts"
          subtitle="Update, pause, or cancel your recurring donations anytime."
        />

        <Panel>
          <BlockLabel>Your email</BlockLabel>
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

          <PrimaryButton
            label="Send management link"
            onPress={() => {
              void handleRequestLink();
            }}
            loading={loading}
            icon="mail-outline"
          />

          <View style={styles.block}>
            <BlockLabel>How it works</BlockLabel>
            <View style={styles.stepsList}>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>1</Text>
                <Text style={styles.stepText}>
                  Enter the email you used for your recurring donation
                </Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>2</Text>
                <Text style={styles.stepText}>
                  We&apos;ll send you a secure link to your email
                </Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>3</Text>
                <Text style={styles.stepText}>
                  Open the link to access your Stripe Customer Portal
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.block}>
            <BlockLabel>What you can manage</BlockLabel>
            {CAPABILITIES.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.capabilityRow,
                  index === CAPABILITIES.length - 1 && styles.capabilityRowLast,
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={ms(18, 0.2)}
                  color={theme.colors.icon.brand}
                />
                <View style={styles.capabilityCopy}>
                  <Text style={styles.capabilityTitle}>{item.title}</Text>
                  <Text style={styles.capabilityDescription}>
                    {item.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Panel>

        <View style={styles.securityNote}>
          <Ionicons
            name="shield-checkmark"
            size={ms(14, 0.2)}
            color={theme.colors.accent.green}
          />
          <Text style={styles.securityText}>
            Secure management powered by Stripe
          </Text>
        </View>
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
      paddingBottom: 40,
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
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.base,
    },
    block: {
      paddingTop: theme.spacing.xl,
      marginTop: theme.spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.soft,
    },
    stepsList: {
      gap: theme.spacing.md,
    },
    step: {
      flexDirection: "row",
      gap: theme.spacing.md,
      alignItems: "flex-start",
    },
    stepNumber: {
      width: ms(22, 0.15),
      fontSize: ms(13, 0.2) * fontScale,
      fontWeight: "700",
      color: theme.colors.icon.brand,
    },
    stepText: {
      flex: 1,
      fontSize: ms(13, 0.2) * fontScale,
      color: theme.colors.text.base,
      lineHeight: ms(20, 0.15),
    },
    capabilityRow: {
      flexDirection: "row",
      gap: theme.spacing.md,
      alignItems: "flex-start",
      paddingVertical: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.soft,
    },
    capabilityRowLast: {
      borderBottomWidth: 0,
      paddingBottom: 0,
    },
    capabilityCopy: {
      flex: 1,
      minWidth: 0,
    },
    capabilityTitle: {
      fontSize: ms(14, 0.2) * fontScale,
      fontWeight: "600",
      color: theme.colors.text.strong,
      marginBottom: ms(2, 0.05),
    },
    capabilityDescription: {
      fontSize: ms(12, 0.15) * fontScale,
      color: theme.colors.text.muted,
      lineHeight: ms(17, 0.15),
    },
    securityNote: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xl,
    },
    securityText: {
      fontSize: ms(12, 0.15) * fontScale,
      color: theme.colors.text.muted,
    },
  });
