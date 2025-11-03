import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PatternOverlay from '../../components/PatternOverlay';
import QiblaCompass from '../../components/QiblaCompass';
import { Theme } from '../../constants/theme';

// Import custom hooks
import { useFirebaseData } from '../../hooks/useFirebaseData';

export default function QiblaScreen(): React.JSX.Element {
  const { mosqueSettings } = useFirebaseData();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header with Gradient */}
      <LinearGradient
        colors={[Theme.colors.brand.navy[800], Theme.colors.brand.navy[700], Theme.colors.brand.navy[900]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <PatternOverlay
          style={styles.patternOverlay}
          variant="stars"
          opacity={0.05}
          tileSize={28}
          color="rgba(255,255,255,0.7)"
        />
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {mosqueSettings?.name || 'Al Madina Masjid Yagoona'}
            </Text>
            <Text style={styles.headerSubtitle}>Qibla Direction</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <QiblaCompass />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.surface.muted,
  },
  headerGradient: {
    paddingBottom: Theme.spacing.xl,
    borderBottomLeftRadius: Theme.radius.xl,
    borderBottomRightRadius: Theme.radius.xl,
    ...Theme.shadow.header,
  },
  patternOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Theme.colors.text.inverse,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Theme.colors.text.subtle,
  },
});
