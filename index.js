/**
 * App Entry Point
 *
 * This file must be at the root and loaded first to register
 * React Native Firebase background handlers before the app starts.
 */

// Import the FCMService to register the background message handler
// This MUST happen before the app loads
import './services/FCMService';

// Import the background event handler
import './services/NotificationBackgroundHandler';

// Load the expo-router entry point
import 'expo-router/entry';
