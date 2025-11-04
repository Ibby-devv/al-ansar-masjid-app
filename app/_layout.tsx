import { StripeProvider } from '@stripe/stripe-react-native';
import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import FCMService from '../services/FCMService';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SIKZ2LsKTjvYA4a7qJKDuUEIi0cosiLMk4VSxeMy2DXkHCzjJiwBsk5wpp6NXsBo5dwp0bwUoeMXupsvvZxLuxz008S6hj6Ej';

export default function RootLayout() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Initialize FCM on app startup
    initializeFCM();

    // Update lastSeen when app comes to foreground
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground - update lastSeen
        FCMService.updateLastSeen();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const initializeFCM = async () => {
    try {
      await FCMService.initialize();
      // Update lastSeen after successful initialization
      await FCMService.updateLastSeen();
    } catch (error) {
      console.error('❌ Failed to initialize FCM:', error);
    }
  };

  return (
    <SafeAreaProvider>
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="donations" options={{ headerShown: false }} />
        </Stack>
      </StripeProvider>
    </SafeAreaProvider>
  );
}