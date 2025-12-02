import LoadingScreen from '@/components/LoadingScreen';
import {
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    useFonts,
} from '@expo-google-fonts/poppins';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StripeProvider } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState, Text as RNText, TextInput as RNTextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../contexts/ThemeContext';
import FCMService from '../services/FCMService';

const STRIPE_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.stripePublishableKey;

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

    // Monitor cache size on app startup
    monitorCacheSize();

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

  /**
   * Monitor AsyncStorage cache size on app startup
   * Logs cache statistics in development mode
   */
  const monitorCacheSize = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('@cached_') || key.startsWith('@'));
      
      if (__DEV__) {
        console.log(`📊 AsyncStorage cache entries: ${cacheKeys.length}`);
        
        // Optionally log cache keys for debugging
        if (cacheKeys.length > 0) {
          console.log('Cache keys:', cacheKeys);
        }
      }
      
      // Future enhancement: Implement LRU or size-based eviction if needed
      // For now, real-time listeners keep data fresh, so old entries are overwritten
    } catch (error) {
      console.error('Error monitoring cache:', error);
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
      <ThemeProvider>
        <StatusBar style="auto" />
        {!fontsLoaded ? (
          <LoadingScreen />
        ) : (
        <StripeProvider
          publishableKey={STRIPE_PUBLISHABLE_KEY}
          merchantIdentifier="merchant.com.alansarmasjid.app"
          urlScheme="alansar"
        >
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="donations" options={{ headerShown: false }} />
          </Stack>
        </StripeProvider>
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}