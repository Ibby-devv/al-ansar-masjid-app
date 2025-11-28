import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Clipboard, Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTheme, type AppTheme } from '../contexts/ThemeContext';
import FCMService from '../services/FCMService';
import NotificationService from '../services/NotificationService';

const STORAGE_KEY = '@notification_settings_enabled';

export default function NotificationSettingsScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme.colorScheme]);
  const [enabled, setEnabled] = useState(true);
  // No server-loading spinner; local is source of truth and UI updates instantly
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState('');
  const [channels, setChannels] = useState<{ id: string; name: string; importance?: number }[]>([]);
  // Removed explicit netInfo & batteryOpt states from render; values are embedded directly in diagnosticInfo string.
  // We no longer surface sync errors to the user; local value is source of truth.

  // (moved below, after loadLocalSettings definition)

  // (moved below, after loadDiagnosticInfo)

  const loadLocalSettings = useCallback(async () => {
    try {
      // Load from local storage immediately (source of truth)
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached !== null) {
        setEnabled(cached === 'true');
      }
      // If no local value exists, default is true (already set in state)

      // Push local value to server in background to keep server in sync
      const localValue = cached !== null ? cached === 'true' : true;
      try {
        await FCMService.updateNotificationSettings(localValue);
      } catch (error) {
        console.warn('Background sync failed (silent):', error);
      }
    } catch (error) {
      console.error('Error loading local settings:', error);
      // Still default to true on error
    }
  }, []);

  const loadDiagnosticInfo = useCallback(async () => {
    try {
      // Diagnostics v2.0 gathers a holistic snapshot for notification troubleshooting.
      // Fields included:
      // - Android API level / iOS version
      // - Device ID (partial) for correlating with backend fcmTokens doc
      // - System permission status (fast failure root cause)
      // - Connectivity state (offline devices won't receive FCM)
      // - Battery optimization (Android may defer background delivery)
      // - Token suffix + registration timestamp (verify most recent refresh)
      // - Last foreground/background notification timestamps (recency of delivery)
      // - Channel definitions w/ importance (misconfigured importance causes silent deliveries)
      const osVersion = Platform.Version;
      const deviceId = await FCMService.getDeviceId();
      const permissionGranted = await NotificationService.areNotificationsEnabled();
      // Channels (Android)
      const ch = Platform.OS === 'android' ? await NotificationService.getChannels() : [];
      setChannels(ch);
      // Token suffix & registration time
  const token = await AsyncStorage.getItem('@diag_fcm_token');
  const suffix = token ? token.slice(-8) : '';
  const regAt = await AsyncStorage.getItem('@diag_token_registered_at');
      // Last received timestamps
  const fg = await AsyncStorage.getItem('@diag_last_foreground_notification_at');
  const bg = await AsyncStorage.getItem('@diag_last_background_notification_at');
      // Connectivity
      let connectionStr = 'Check manually';
      // Note: Network detection requires expo-network which needs dev build
      // For now, users can check connectivity manually
      // Battery optimization (Android-only, best-effort)
      let batteryStr = 'N/A on iOS';
      if (Platform.OS === 'android') {
        const bo = await NotificationService.isBatteryOptimizationEnabled();
        if (bo === null) batteryStr = 'Unknown';
        else batteryStr = bo ? 'Enabled (may delay background delivery)' : 'Disabled';
      }
      
      setDiagnosticInfo(
        `Android API: ${osVersion}\n` +
        `Device ID: ${deviceId.substring(0, 12)}...\n` +
        `System Permission: ${permissionGranted ? '✅ GRANTED' : '❌ DENIED'}\n` +
        `Connectivity: ${connectionStr}\n` +
        `${Platform.OS === 'android' ? `Battery Optimization: ${batteryStr}\n` : ''}` +
        `FCM Token Suffix: ${suffix || '(none)'}\n` +
        `Token Registered At: ${regAt ? new Date(regAt).toLocaleString() : '(unknown)'}\n` +
        `Last Foreground Notif: ${fg ? new Date(fg).toLocaleString() : '—'}\n` +
        `Last Background Notif: ${bg ? new Date(bg).toLocaleString() : '—'}`
      );
    } catch (error) {
      console.error('Error loading diagnostic info:', error);
      setDiagnosticInfo('Error loading info');
    }
  }, []);

  // Load diagnostics when diagnostics toggle changes
  useEffect(() => {
    if (showDiagnostics) {
      loadDiagnosticInfo();
    }
  }, [showDiagnostics, loadDiagnosticInfo]);

  // Load settings only on mount - local storage is source of truth
  useEffect(() => {
    loadLocalSettings();
  }, [loadLocalSettings]);

  const toggleNotifications = async (value: boolean) => {
    // Optimistic update - update UI and local storage immediately
    setEnabled(value);
    
    try {
      // 1. Update local storage first (source of truth)
      await AsyncStorage.setItem(STORAGE_KEY, String(value));
      
      // 2. Best-effort server sync (non-blocking; no spinner)
      await FCMService.updateNotificationSettings(value);
    } catch (error) {
      console.warn('Toggle sync failed (silent; will retry on next mount or action):', error);
    }
  };

  const testLocalNotification = async () => {
    try {
      console.log('🧪 Testing local notification...');
      
      // First check if system permission is granted
      const permissionGranted = await NotificationService.areNotificationsEnabled();
      
      if (!permissionGranted) {
        const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : parseInt(String(Platform.Version), 10);
        const isAndroid13Plus = apiLevel >= 33;
        
        Alert.alert(
          'Permission Denied',
          `System notification permission is DENIED.\n\n` +
          `Android API ${apiLevel}${isAndroid13Plus ? ' (Android 13+)' : ''}\n\n` +
          `${isAndroid13Plus ? 'Android 13+ requires POST_NOTIFICATIONS permission in AndroidManifest.xml.\n\n' : ''}` +
          `Would you like to open system settings to enable notifications?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => NotificationService.openSettings() 
            }
          ]
        );
        return;
      }

      // Try displaying a test notification
      await NotificationService.displayNotification({
        title: '🧪 Test Notification',
        body: 'If you see this, local notifications work! The issue is likely with FCM delivery or background priority.',
        channelId: 'general',
      });

      Alert.alert(
        'Test Sent',
        'Check if you saw the notification appear. If yes, the Notifee rendering path works. If no, check device notification settings.',
        [{ text: 'OK' }]
      );

      console.log('✅ Test notification sent');
    } catch (error: any) {
      console.error('❌ Test notification failed:', error);
      Alert.alert('Test Failed', `Error: ${error?.message || 'Unknown error'}`);
    }
  };

  return (
    <View>
      <Text style={styles.title}>Notifications</Text>
      
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.textContainer}>
            <Text style={styles.label}>Enable Notifications</Text>
            <Text style={styles.subtitle}>
              Get notified about new events, campaigns, and prayer time updates
            </Text>
          </View>
          <View style={styles.toggleContainer}>
            <Switch
              value={enabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: theme.colors.surface.muted, true: theme.colors.accent.blue }}
              thumbColor={enabled ? '#ffffff' : theme.colors.text.subtle}
            />
          </View>
        </View>
      </View>

      {/* We intentionally do not show a visible error banner for sync failures.
          Local storage is authoritative; server will catch up via silent retry. */}

      <Text style={styles.note}>
        You can change this setting anytime. When disabled, you won&apos;t receive any notifications from the mosque.
      </Text>

      {/* Diagnostics Toggle */}
      <View style={[styles.card, { marginTop: 20 }]}>
        <View style={styles.row}>
          <View style={styles.textContainer}>
            <Text style={styles.label}>Show Diagnostics</Text>
            <Text style={styles.subtitle}>
              Display diagnostic tools for troubleshooting notifications
            </Text>
          </View>
          <Switch
            value={showDiagnostics}
            onValueChange={setShowDiagnostics}
            trackColor={{ false: theme.colors.surface.muted, true: theme.colors.accent.blue }}
            thumbColor={showDiagnostics ? '#ffffff' : theme.colors.text.subtle}
          />
        </View>
      </View>

      {/* Diagnostic Section */}
      {showDiagnostics && (
        <View style={styles.diagnosticSection}>
          <Text style={styles.diagnosticTitle}>🔧 Diagnostics</Text>
          
          <View style={styles.diagnosticCard}>
            <Text style={styles.diagnosticText}>{diagnosticInfo || 'Loading...'}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.text.muted }]} 
              onPress={() => NotificationService.openSettings()}
            >
              <Text style={styles.actionButtonText}>Open App Settings</Text>
            </TouchableOpacity>
            {Platform.OS === 'android' && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.colors.iconBackground.version }]} 
                onPress={() => NotificationService.openBatteryOptimizationSettings()}
              >
                <Text style={styles.actionButtonText}>Battery Optimization</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.accent.green }]} 
              onPress={async () => {
                try {
                  const token = (await AsyncStorage.getItem('@diag_fcm_token')) || '';
                  if (!token) {
                    Alert.alert('No Token', 'No cached FCM token yet. Try enabling notifications or restarting.');
                    return;
                  }
                  Clipboard.setString(token);
                  Alert.alert('Copied', 'FCM token copied to clipboard.');
                } catch (e: any) {
                  Alert.alert('Copy Failed', e?.message || 'Unknown error');
                }
              }}
            >
              <Text style={styles.actionButtonText}>Copy FCM Token</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.progress.complete }]} 
              onPress={testLocalNotification}
            >
              <Text style={styles.actionButtonText}>🧪 Test Local</Text>
            </TouchableOpacity>
          </View>

          {/* Channels list (Android) */}
          {Platform.OS === 'android' && (
            <View style={[styles.diagnosticCard, { marginTop: 12 }]}> 
              <Text style={[styles.diagnosticText, { fontWeight: '700', marginBottom: 6 }]}>Channels</Text>
              {channels.length === 0 ? (
                <Text style={styles.diagnosticText}>No channels or unable to fetch.</Text>
              ) : (
                channels.map((ch) => (
                  <View key={ch.id} style={styles.channelRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.diagnosticText}>{ch.name} ({ch.id})</Text>
                      <Text style={[styles.diagnosticText, { color: theme.colors.text.subtle }]}>importance: {String(ch.importance)}</Text>
                    </View>
                    <TouchableOpacity 
                      style={[styles.smallBtn]}
                      onPress={() => NotificationService.openChannelSettings(ch.id)}
                    >
                      <Text style={styles.smallBtnText}>Open</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          <Text style={styles.diagnosticHint}>
            Use this to verify if notifications can display on your device. If the test works but FCM doesn&apos;t, the issue is with message delivery or background priority.
          </Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.soft,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: theme.colors.text.base,
  },
  card: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  toggleContainer: {
    width: 51,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.base,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.muted,
    lineHeight: 20,
  },
  note: {
    fontSize: 12,
    color: theme.colors.text.subtle,
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 18,
  },
  diagnosticSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.base,
  },
  diagnosticTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: theme.colors.text.base,
  },
  diagnosticCard: {
    backgroundColor: theme.colors.surface.muted,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.soft,
  },
  diagnosticText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: theme.colors.text.base,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.soft,
  },
  smallBtn: {
    backgroundColor: theme.colors.accent.blue,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  smallBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  diagnosticHint: {
    fontSize: 11,
    color: theme.colors.text.subtle,
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
  },
});