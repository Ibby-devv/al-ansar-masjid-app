import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Clipboard,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import {
  ListRow,
  Panel,
  PrimaryButton,
  ScreenIntro,
} from "../components/ui/calm";
import { useTheme, type AppTheme } from "../contexts/ThemeContext";
import { useResponsive } from "../hooks/useResponsive";
import FCMService from "../services/FCMService";
import NotificationService from "../services/NotificationService";

const STORAGE_KEY = "@notification_settings_enabled";

export default function NotificationSettingsScreen(): React.JSX.Element {
  const theme = useTheme();
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(
    () => createStyles(theme, ms, fontScale),
    [theme, ms, fontScale]
  );
  const [enabled, setEnabled] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState("");
  const [channels, setChannels] = useState<
    { id: string; name: string; importance?: number }[]
  >([]);

  const loadLocalSettings = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached !== null) {
        setEnabled(cached === "true");
      }

      const localValue = cached !== null ? cached === "true" : true;
      try {
        await FCMService.updateNotificationSettings(localValue);
      } catch (error) {
        console.warn("Background sync failed (silent):", error);
      }
    } catch (error) {
      console.error("Error loading local settings:", error);
    }
  }, []);

  const loadDiagnosticInfo = useCallback(async () => {
    try {
      const osVersion = Platform.Version;
      const deviceId = await FCMService.getDeviceId();
      const permissionGranted =
        await NotificationService.areNotificationsEnabled();
      const ch =
        Platform.OS === "android" ? await NotificationService.getChannels() : [];
      setChannels(ch);
      const token = await AsyncStorage.getItem("@diag_fcm_token");
      const suffix = token ? token.slice(-8) : "";
      const regAt = await AsyncStorage.getItem("@diag_token_registered_at");
      const fg = await AsyncStorage.getItem(
        "@diag_last_foreground_notification_at"
      );
      const bg = await AsyncStorage.getItem(
        "@diag_last_background_notification_at"
      );
      const connectionStr = "Check manually";
      let batteryStr = "N/A on iOS";
      if (Platform.OS === "android") {
        const bo = await NotificationService.isBatteryOptimizationEnabled();
        if (bo === null) batteryStr = "Unknown";
        else
          batteryStr = bo
            ? "Enabled (may delay background delivery)"
            : "Disabled";
      }

      setDiagnosticInfo(
        `Android API: ${osVersion}\n` +
          `Device ID: ${deviceId.substring(0, 12)}...\n` +
          `System Permission: ${permissionGranted ? "GRANTED" : "DENIED"}\n` +
          `Connectivity: ${connectionStr}\n` +
          `${Platform.OS === "android" ? `Battery Optimization: ${batteryStr}\n` : ""}` +
          `FCM Token Suffix: ${suffix || "(none)"}\n` +
          `Token Registered At: ${regAt ? new Date(regAt).toLocaleString() : "(unknown)"}\n` +
          `Last Foreground Notif: ${fg ? new Date(fg).toLocaleString() : "—"}\n` +
          `Last Background Notif: ${bg ? new Date(bg).toLocaleString() : "—"}`
      );
    } catch (error) {
      console.error("Error loading diagnostic info:", error);
      setDiagnosticInfo("Error loading info");
    }
  }, []);

  useEffect(() => {
    if (showDiagnostics) {
      loadDiagnosticInfo();
    }
  }, [showDiagnostics, loadDiagnosticInfo]);

  useEffect(() => {
    loadLocalSettings();
  }, [loadLocalSettings]);

  const toggleNotifications = async (value: boolean): Promise<void> => {
    setEnabled(value);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, String(value));
      await FCMService.updateNotificationSettings(value);
    } catch (error) {
      console.warn(
        "Toggle sync failed (silent; will retry on next mount or action):",
        error
      );
    }
  };

  const testLocalNotification = async (): Promise<void> => {
    try {
      const permissionGranted =
        await NotificationService.areNotificationsEnabled();

      if (!permissionGranted) {
        const apiLevel =
          typeof Platform.Version === "number"
            ? Platform.Version
            : parseInt(String(Platform.Version), 10);
        const isAndroid13Plus = apiLevel >= 33;

        Alert.alert(
          "Permission Denied",
          `System notification permission is DENIED.\n\n` +
            `Android API ${apiLevel}${isAndroid13Plus ? " (Android 13+)" : ""}\n\n` +
            `${isAndroid13Plus ? "Android 13+ requires POST_NOTIFICATIONS permission in AndroidManifest.xml.\n\n" : ""}` +
            `Would you like to open system settings to enable notifications?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => NotificationService.openSettings(),
            },
          ]
        );
        return;
      }

      await NotificationService.displayNotification({
        title: "Test Notification",
        body: "If you see this, local notifications work! The issue is likely with FCM delivery or background priority.",
        channelId: "general",
      });

      Alert.alert(
        "Test Sent",
        "Check if you saw the notification appear. If yes, the Notifee rendering path works. If no, check device notification settings.",
        [{ text: "OK" }]
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Test notification failed:", error);
      Alert.alert("Test Failed", `Error: ${message}`);
    }
  };

  const switchTrack = {
    false: theme.colors.border.base,
    true: theme.colors.brand.navy[700],
  };

  return (
    <View>
      <ScreenIntro
        title="Notifications"
        subtitle="Events, campaigns, and prayer updates"
      />

      <Panel flush style={styles.panel}>
        <ListRow
          title="Enable Notifications"
          subtitle="Get notified about new events, campaigns, and prayer time updates"
          icon="notifications-outline"
          showChevron={false}
          last
          right={
            <Switch
              value={enabled}
              onValueChange={toggleNotifications}
              trackColor={switchTrack}
              thumbColor="#ffffff"
              accessibilityLabel="Enable notifications"
            />
          }
        />
      </Panel>

      <Text style={styles.note}>
        You can change this anytime. When disabled, you won&apos;t receive
        notifications from the mosque.
      </Text>

      <Panel flush style={[styles.panel, styles.diagnosticsToggle]}>
        <ListRow
          title="Show Diagnostics"
          subtitle="Tools for troubleshooting notification delivery"
          icon="construct-outline"
          showChevron={false}
          last
          right={
            <Switch
              value={showDiagnostics}
              onValueChange={setShowDiagnostics}
              trackColor={switchTrack}
              thumbColor="#ffffff"
              accessibilityLabel="Show diagnostics"
            />
          }
        />
      </Panel>

      {showDiagnostics ? (
        <View style={styles.diagnosticSection}>
          <ScreenIntro
            title="Diagnostics"
            subtitle="Device and delivery snapshot"
          />

          <Panel style={styles.diagPanel}>
            <Text style={styles.diagnosticText}>
              {diagnosticInfo || "Loading…"}
            </Text>
          </Panel>

          <View style={styles.actionsStack}>
            <PrimaryButton
              label="Open App Settings"
              onPress={() => NotificationService.openSettings()}
            />
            {Platform.OS === "android" ? (
              <PrimaryButton
                label="Battery Optimization"
                onPress={() =>
                  NotificationService.openBatteryOptimizationSettings()
                }
              />
            ) : null}
            <PrimaryButton
              label="Copy FCM Token"
              onPress={async () => {
                try {
                  const token =
                    (await AsyncStorage.getItem("@diag_fcm_token")) || "";
                  if (!token) {
                    Alert.alert(
                      "No Token",
                      "No cached FCM token yet. Try enabling notifications or restarting."
                    );
                    return;
                  }
                  Clipboard.setString(token);
                  Alert.alert("Copied", "FCM token copied to clipboard.");
                } catch (e: unknown) {
                  const message =
                    e instanceof Error ? e.message : "Unknown error";
                  Alert.alert("Copy Failed", message);
                }
              }}
            />
            <PrimaryButton
              label="Test Local Notification"
              onPress={testLocalNotification}
            />
          </View>

          {Platform.OS === "android" ? (
            <Panel style={styles.diagPanel}>
              <Text style={styles.channelsTitle}>Channels</Text>
              {channels.length === 0 ? (
                <Text style={styles.diagnosticText}>
                  No channels or unable to fetch.
                </Text>
              ) : (
                channels.map((ch, index) => (
                  <View
                    key={ch.id}
                    style={[
                      styles.channelRow,
                      index === channels.length - 1 && styles.channelRowLast,
                    ]}
                  >
                    <View style={styles.channelCopy}>
                      <Text style={styles.diagnosticText}>
                        {ch.name} ({ch.id})
                      </Text>
                      <Text style={styles.channelMeta}>
                        importance: {String(ch.importance)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.smallBtn}
                      onPress={() =>
                        NotificationService.openChannelSettings(ch.id)
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${ch.name} channel settings`}
                    >
                      <Text style={styles.smallBtnText}>Open</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </Panel>
          ) : null}

          <Text style={styles.diagnosticHint}>
            Use this to verify if notifications can display on your device. If
            the test works but FCM doesn&apos;t, the issue is with message
            delivery or background priority.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (
  theme: AppTheme,
  ms: (size: number, factor?: number) => number,
  fontScale: number
) =>
  StyleSheet.create({
    panel: {
      marginBottom: theme.spacing.sm,
    },
    note: {
      fontSize: ms(12, 0.2) * fontScale,
      color: theme.colors.text.subtle,
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.md,
      lineHeight: ms(18, 0.2) * fontScale,
      textAlign: "center",
    },
    diagnosticsToggle: {
      marginTop: theme.spacing.md,
    },
    diagnosticSection: {
      marginTop: theme.spacing.xl,
      paddingTop: theme.spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.soft,
    },
    diagPanel: {
      marginBottom: theme.spacing.md,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
    diagnosticText: {
      fontSize: ms(12, 0.2) * fontScale,
      fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
      color: theme.colors.text.base,
      lineHeight: ms(18, 0.2) * fontScale,
    },
    actionsStack: {
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    channelsTitle: {
      fontSize: ms(12, 0.15) * fontScale,
      fontWeight: "600",
      letterSpacing: 0.4,
      textTransform: "uppercase",
      color: theme.colors.text.muted,
      marginBottom: theme.spacing.sm,
    },
    channelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: ms(8, 0.05),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.soft,
      gap: theme.spacing.sm,
    },
    channelRowLast: {
      borderBottomWidth: 0,
    },
    channelCopy: {
      flex: 1,
      minWidth: 0,
    },
    channelMeta: {
      fontSize: ms(11, 0.15) * fontScale,
      fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
      color: theme.colors.text.subtle,
      marginTop: ms(2, 0.05),
    },
    smallBtn: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.icon.brand,
      backgroundColor: theme.colors.accent.blueSoft,
      paddingVertical: ms(6, 0.05),
      paddingHorizontal: ms(12, 0.1),
      borderRadius: theme.radius.pill,
    },
    smallBtnText: {
      color: theme.colors.icon.brand,
      fontSize: ms(12, 0.2) * fontScale,
      fontWeight: "600",
    },
    diagnosticHint: {
      fontSize: ms(11, 0.2) * fontScale,
      color: theme.colors.text.subtle,
      textAlign: "center",
      lineHeight: ms(16, 0.2) * fontScale,
    },
  });
