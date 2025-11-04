import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PatternOverlay from '../../components/PatternOverlay';
import { Theme } from '../../constants/theme';

// Import custom hooks
import { useFirebaseData } from '../../hooks/useFirebaseData';

export default function LearnScreen(): React.JSX.Element {
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
            <Text style={styles.headerSubtitle}>Islamic Resources</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Coming Soon Content */}
        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="book" size={80} color="#1e3a8a" />
          </View>
          
          <Text style={styles.comingSoonTitle}>Learning Resources Coming Soon</Text>
          
          <Text style={styles.comingSoonText}>
            We&#39;re building a comprehensive Islamic learning center with resources to help you in your daily worship.
          </Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="compass" size={24} color="#10b981" />
              <Text style={styles.featureText}>Qibla Compass</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="book-outline" size={24} color="#10b981" />
              <Text style={styles.featureText}>Quran Reader</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="musical-notes" size={24} color="#10b981" />
              <Text style={styles.featureText}>Audio Recitations</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="chatbubbles" size={24} color="#10b981" />
              <Text style={styles.featureText}>Daily Duas</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="library" size={24} color="#10b981" />
              <Text style={styles.featureText}>Islamic Resources</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="bookmark" size={24} color="#10b981" />
              <Text style={styles.featureText}>Personal Bookmarks</Text>
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={32} color="#1e3a8a" />
            <Text style={styles.infoTitle}>Coming in Next Update</Text>
            <Text style={styles.infoText}>
              We&#39;re working hard to bring you these features. Stay tuned for updates!
            </Text>
          </View>
        </View>
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
  contentContainer: {
    flex: 1,
    backgroundColor: Theme.colors.surface.muted,
    padding: Theme.spacing.lg,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: Theme.spacing.xl,
    marginBottom: Theme.spacing.lg,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresList: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  featureText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#dbeafe',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    textAlign: 'center',
    lineHeight: 20,
  },
});
