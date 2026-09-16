import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack } from "expo-router";
import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Vibration,
  View,
  useWindowDimensions,
} from "react-native";
import { ListRow, Panel, ScreenIntro } from "../components/ui/calm";
import {
  AppTheme,
  ThemePreference,
  useTheme,
} from "../contexts/ThemeContext";
import { useResponsive } from "../hooks/useResponsive";
import NotificationSettingsScreen from "../screens/NotificationSettingsScreen";

const THEME_OPTIONS: {
  key: ThemePreference;
  label: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}[] = [
  {
    key: "auto",
    label: "System Default",
    description: "Follows your device settings",
    icon: "phone-portrait-outline",
  },
  {
    key: "light",
    label: "Light Mode",
    description: "Always use light theme",
    icon: "sunny-outline",
  },
  {
    key: "dark",
    label: "Dark Mode",
    description: "Always use dark theme",
    icon: "moon-outline",
  },
];

export default function SettingsScreen(): React.JSX.Element {
  const theme = useTheme();
  const { preference, updatePreference } = theme;
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();

  const styles = useMemo(
    () => createStyles(theme, ms, fontScale),
    [theme, ms, fontScale]
  );

  const triggerHaptic = async (): Promise<void> => {
    try {
      if (Platform.OS === "ios") {
        await Haptics.selectionAsync();
      } else if (Platform.OS === "android") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Vibration.vibrate(10);
      }
    } catch {
      if (Platform.OS === "android") {
        Vibration.vibrate(10);
      }
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Settings",
          headerBackTitle: "Back",
          headerStyle: {
            backgroundColor: theme.colors.brand.navy[700],
          },
          headerTintColor: theme.colors.text.header,
          headerTitleStyle: {
            fontWeight: "600",
          },
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <ScreenIntro
          title="Appearance"
          subtitle="Choose how the app looks"
        />
        <Panel flush style={styles.panel}>
          {THEME_OPTIONS.map((option, index) => (
            <ListRow
              key={option.key}
              title={option.label}
              subtitle={option.description}
              icon={option.icon}
              selected={preference === option.key}
              showChevron={false}
              onPress={async () => {
                await triggerHaptic();
                updatePreference(option.key);
              }}
              last={index === THEME_OPTIONS.length - 1}
            />
          ))}
        </Panel>

        <View style={styles.notificationsBlock}>
          <NotificationSettingsScreen />
        </View>
      </ScrollView>
    </>
  );
}

const createStyles = (
  theme: AppTheme,
  ms: (size: number, factor?: number) => number,
  _fontScale: number
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface.muted,
    },
    contentContainer: {
      padding: theme.spacing.lg,
      paddingBottom: ms(40, 0.1),
    },
    panel: {
      marginBottom: theme.spacing.sm,
    },
    notificationsBlock: {
      marginTop: theme.spacing.xl,
    },
  });
