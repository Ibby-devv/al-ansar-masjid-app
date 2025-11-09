import LoadingScreen from '@/components/LoadingScreen';
import {
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    useFonts,
} from '@expo-google-fonts/poppins';
import { StripeProvider } from '@stripe/stripe-react-native';
import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, Text as RNText, TextInput as RNTextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import FCMService from '../services/FCMService';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SIKZ2LsKTjvYA4a7qJKDuUEIi0cosiLMk4VSxeMy2DXkHCzjJiwBsk5wpp6NXsBo5dwp0bwUoeMXupsvvZxLuxz008S6hj6Ej';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
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

  // Set global default font to Poppins once fonts are loaded (only once)
  useEffect(() => {
    if (!fontsLoaded) return;
    
    // Ensure defaultProps exists
    // @ts-ignore
    RNText.defaultProps = RNText.defaultProps || {};
    // @ts-ignore
    RNText.defaultProps.style = [RNText.defaultProps.style, { fontFamily: 'Poppins_400Regular' }];

    // @ts-ignore
    RNTextInput.defaultProps = RNTextInput.defaultProps || {};
    // @ts-ignore
    RNTextInput.defaultProps.style = [RNTextInput.defaultProps.style, { fontFamily: 'Poppins_400Regular' }];
  }, [fontsLoaded]);

  return (
    <SafeAreaProvider>
      {!fontsLoaded ? (
        <LoadingScreen />
      ) : (
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="donations" options={{ headerShown: false }} />
        </Stack>
      </StripeProvider>
      )}
    </SafeAreaProvider>
  );
}