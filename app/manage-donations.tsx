import { Redirect } from "expo-router";

// Alias route to handle alansar://manage-donations deep links
// Redirects to the Manage Subscriptions screen
export default function ManageDonationsAlias(): React.JSX.Element {
  return <Redirect href="/(tabs)/donate/manage" />;
}