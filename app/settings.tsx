import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View, useWindowDimensions } from 'react-native';
import { AppTheme, ThemePreference, useTheme } from '../contexts/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';

export default function SettingsScreen(): React.JSX.Element {
  const theme = useTheme();
  const { preference, updatePreference } = theme;
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  
  // Memoize styles based on theme
  const styles = useMemo(() => createStyles(theme, ms, fontScale), [theme, ms, fontScale]);
  
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
          headerTintColor: theme.colors.text.header,
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
                  <Ionicons name={icons[option] as any} size={ms(22, 0.2)} color={theme.colors.brand.navy[700]} />
                </View>
                <View style={styles.themeTextContainer}>
                  <Text style={styles.themeLabel}>{labels[option]}</Text>
                  <Text style={styles.themeDescription}>{descriptions[option]}</Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={ms(24, 0.2)} color={theme.colors.accent.green} />
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

const createStyles = (theme: AppTheme, ms: (size: number, factor?: number) => number, fontScale: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.muted,
  },
  contentContainer: {
    padding: ms(20, 0.1),
    paddingBottom: ms(40, 0.1),
  },
  sectionTitle: {
    fontSize: ms(28, 0.3) * fontScale,
    fontWeight: 'bold',
    marginBottom: ms(16, 0.1),
    color: theme.colors.text.strong,
  },
  card: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    marginBottom: ms(24, 0.1),
    ...theme.shadow.soft,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ms(16, 0.1),
  },
  themeOptionBorder: {
    borderBottomWidth: ms(1, 0.05),
    borderBottomColor: theme.colors.border.base,
  },
  themeIconContainer: {
    width: ms(40, 0.2),
    height: ms(40, 0.2),
    borderRadius: ms(20, 0.2),
    backgroundColor: theme.colors.accent.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(12, 0.1),
  },
  themeTextContainer: {
    flex: 1,
  },
  themeLabel: {
    fontSize: ms(16, 0.2) * fontScale,
    fontWeight: '600',
    color: theme.colors.text.strong,
    marginBottom: ms(2, 0.05),
  },
  themeDescription: {
    fontSize: ms(13, 0.2) * fontScale,
    color: theme.colors.text.muted,
  },
});