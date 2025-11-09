import { Stack } from 'expo-router';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';

export default function SettingsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notification Settings',
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: '#1e3a8a',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <NotificationSettingsScreen />
    </>
  );
}