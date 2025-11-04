import LoadingScreen from '@/components/LoadingScreen';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { StripeProvider } from '@stripe/stripe-react-native';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Text as RNText, TextInput as RNTextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import FCMService from '../services/FCMService';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SIKZ2LsKTjvYA4a7qJKDuUEIi0cosiLMk4VSxeMy2DXkHCzjJiwBsk5wpp6NXsBo5dwp0bwUoeMXupsvvZxLuxz008S6hj6Ej';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  useEffect(() => {
    // Initialize FCM on app startup
    initializeFCM();
  }, []);

  const initializeFCM = async () => {
    try {
      await FCMService.initialize();
    } catch (error) {
      console.error('❌ Failed to initialize FCM:', error);
    }
  };

  // Set global default font to Poppins once fonts are loaded
  if (fontsLoaded) {
    // Ensure defaultProps exists
    // @ts-ignore
    RNText.defaultProps = RNText.defaultProps || {};
    // @ts-ignore
    RNText.defaultProps.style = [RNText.defaultProps.style, { fontFamily: 'Poppins_400Regular' }];

    // @ts-ignore
    RNTextInput.defaultProps = RNTextInput.defaultProps || {};
    // @ts-ignore
    RNTextInput.defaultProps.style = [RNTextInput.defaultProps.style, { fontFamily: 'Poppins_400Regular' }];
  }

  return (
    <SafeAreaProvider>
      {!fontsLoaded ? (
        <LoadingScreen />
      ) : (
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="donations" options={{ headerShown: false }} />
        </Stack>
      </StripeProvider>
      )}
    </SafeAreaProvider>
  );
}