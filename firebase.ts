// React Native Firebase Configuration
// Replaces Web SDK with native Firebase modules

import appCheck from '@react-native-firebase/app-check';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';

// Initialize App Check with Debug provider
// For production, use Play Integrity (Android) and DeviceCheck (iOS)
const rnfbProvider = appCheck().newReactNativeFirebaseAppCheckProvider();
rnfbProvider.configure({
  android: {
    provider: __DEV__ ? 'debug' : 'playIntegrity',
  },
  apple: {
    provider: __DEV__ ? 'debug' : 'deviceCheck',
  },
});

appCheck().initializeAppCheck({ provider: rnfbProvider, isTokenAutoRefreshEnabled: true });

// Firestore instance
export const db = firestore();

// Functions instance for australia-southeast1 region
// Correct syntax: functions().app.functions('region')
export const regionalFunctions = functions().app.functions('australia-southeast1');

// Note: React Native Firebase doesn't need explicit initialization
// The native modules are configured via google-services.json
