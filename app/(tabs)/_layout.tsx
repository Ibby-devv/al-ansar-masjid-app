import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  
  // Calculate dynamic tab bar height based on font scale
  // Base: 60dp + insets + extra padding for larger fonts
  const tabBarHeight = Math.max(70 + insets.bottom, 60 * fontScale + insets.bottom);
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.tabBar.activeTint,
        tabBarInactiveTintColor: theme.colors.tabBar.inactiveTint,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar.background,
          borderTopWidth: 1,
          borderTopColor: theme.colors.tabBar.border,
          // Ensure the tab bar clears the device's home indicator / notch area
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: Math.max(8, 4 * fontScale),
          height: tabBarHeight,
        },
        tabBarLabelStyle: {
          fontSize: Math.max(10, 12 * Math.min(fontScale, 1.2)),
          fontWeight: '600',
          marginTop: 4,
          marginBottom: 4,
        },
      }}>
      {/* Learn tab removed */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="donate"
        options={{
          title: 'Donate',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="qibla"
        options={{
          title: 'Qibla',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="menu" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
