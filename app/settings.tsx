import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { useTheme, ThemePreference } from '../contexts/ThemeContext';
import type { AppTheme } from '../hooks/useAppTheme';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';

export default function SettingsScreen(): React.JSX.Element {
  const theme = useTheme();
  const { preference, updatePreference } = theme;
  
  // Memoize styles based on theme
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const triggerHaptic = async (): Promise<void> => {
    try {
      if (Platform.OS === 'ios') {
        await Haptics.selectionAsync();
      } else if (Platform.OS === 'android') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Vibration.vibrate(10);
      }
    } catch {
      if (Platform.OS === 'android') {
        Vibration.vibrate(10);
      }
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Settings',
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: theme.colors.brand.navy[700],
          },
          headerTintColor: theme.colors.text.inverse,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Appearance Section */}
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.card}>
          {(['auto', 'light', 'dark'] as ThemePreference[]).map((option, index, arr) => {
            const isSelected = preference === option;
            const icons: Record<ThemePreference, string> = {
              auto: 'phone-portrait-outline',
              light: 'sunny-outline',
              dark: 'moon-outline',
            };
            const labels: Record<ThemePreference, string> = {
              auto: 'System Default',
              light: 'Light Mode',
              dark: 'Dark Mode',
            };
            const descriptions: Record<ThemePreference, string> = {
              auto: 'Follows your device settings',
              light: 'Always use light theme',
              dark: 'Always use dark theme',
            };
            
            const isLast = index === arr.length - 1;
            
            return (
              <TouchableOpacity
                key={option}
                style={[styles.themeOption, !isLast && styles.themeOptionBorder]}
                onPress={async () => {
                  await triggerHaptic();
                  updatePreference(option);
                }}
              >
                <View style={styles.themeIconContainer}>
                  <Ionicons name={icons[option] as any} size={22} color={theme.colors.brand.navy[700]} />
                </View>
                <View style={styles.themeTextContainer}>
                  <Text style={styles.themeLabel}>{labels[option]}</Text>
                  <Text style={styles.themeDescription}>{descriptions[option]}</Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.accent.green} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* Notification Settings - Embedded from NotificationSettingsScreen */}
        <NotificationSettingsScreen />
      </ScrollView>
    </>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.muted,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.text.strong,
  },
  card: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    marginBottom: 24,
    ...theme.shadow.soft,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  themeOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.base,
  },
  themeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.accent.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  themeTextContainer: {
    flex: 1,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.strong,
    marginBottom: 2,
  },
  themeDescription: {
    fontSize: 13,
    color: theme.colors.text.muted,
  },
});