import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import FCMService from '../services/FCMService';
import NotificationService from '../services/NotificationService';

export default function NotificationSettingsScreen() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState('');

  useEffect(() => {
    loadSettings();
    if (showDiagnostics) {
      loadDiagnosticInfo();
    }
  }, [showDiagnostics]);

  const loadSettings = async () => {
    try {
      const isEnabled = await FCMService.getNotificationSettings();
      setEnabled(isEnabled);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDiagnosticInfo = async () => {
    try {
      const osVersion = Platform.Version;
      const appVersion = DeviceInfo.getVersion();
      const deviceId = await FCMService.getDeviceId();
      const permissionGranted = await NotificationService.areNotificationsEnabled();
      
      setDiagnosticInfo(
        `Android API: ${osVersion}\n` +
        `App: ${appVersion}\n` +
        `Device ID: ${deviceId.substring(0, 12)}...\n` +
        `System Permission: ${permissionGranted ? '✅ GRANTED' : '❌ DENIED'}`
      );
    } catch (error) {
      console.error('Error loading diagnostic info:', error);
      setDiagnosticInfo('Error loading info');
    }
  };

  const toggleNotifications = async (value: boolean) => {
    setEnabled(value);
    
    try {
      await FCMService.updateNotificationSettings(value);
    } catch (error) {
      console.error('Error updating settings:', error);
      // Revert the switch if update failed
      setEnabled(!value);
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

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.textContainer}>
            <Text style={styles.label}>Enable Notifications</Text>
            <Text style={styles.subtitle}>
              Get notified about new events, campaigns, and prayer time updates
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={enabled ? '#007AFF' : '#f4f3f4'}
          />
        </View>
      </View>

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
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={showDiagnostics ? '#007AFF' : '#f4f3f4'}
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

          <TouchableOpacity 
            style={styles.testButton} 
            onPress={testLocalNotification}
          >
            <Text style={styles.testButtonText}>🧪 Test Local Notification</Text>
          </TouchableOpacity>

          <Text style={styles.diagnosticHint}>
            Use this to verify if notifications can display on your device. If the test works but FCM doesn&apos;t, the issue is with message delivery or background priority.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  card: {
    backgroundColor: '#fff',
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
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  note: {
    fontSize: 12,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 18,
  },
  diagnosticSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  diagnosticTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  diagnosticCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  diagnosticText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#495057',
    lineHeight: 18,
  },
  testButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  diagnosticHint: {
    fontSize: 11,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
  },
});