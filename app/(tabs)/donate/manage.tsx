import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Theme } from '../../../constants/theme';
import { regionalFunctions } from '../../../firebase';

export default function ManageTab() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestLink = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const requestManagementLink = regionalFunctions.httpsCallable('requestManagementLink');

      await requestManagementLink({ email: email.trim() });

      Alert.alert(
        'Check Your Email! 📧',
        'We sent you a link to manage your recurring donations.',
        [{ text: 'OK' }]
      );

      setEmail('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="settings" size={32} color={Theme.colors.brand.navy[700]} />
          </View>
          <Text style={styles.headerTitle}>Manage Your Donations</Text>
          <Text style={styles.headerSubtitle}>
            Update, pause, or cancel your recurring donations anytime
          </Text>
        </View>

        {/* How it Works */}
        <View style={styles.howItWorksCard}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepsList}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Enter the email you used for your recurring donation
              </Text>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                We&apos;ll send you a secure link to your email
              </Text>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Click the link to access your Stripe Customer Portal
              </Text>
            </View>
          </View>
        </View>

        {/* Email Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Your Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Send Link Button */}
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={handleRequestLink}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="mail" size={24} color="#fff" />
              <Text style={styles.sendButtonText}>Send Management Link</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Features List */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="star" size={20} color={Theme.colors.accent.amber} /> What You Can Manage
          </Text>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="card" size={24} color={Theme.colors.brand.navy[700]} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Payment Method</Text>
              <Text style={styles.featureDescription}>
                Update your card details or change payment methods
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="document-text" size={24} color={Theme.colors.brand.navy[700]} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Invoices & Receipts</Text>
              <Text style={styles.featureDescription}>
                View and download all your payment receipts
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="pause-circle" size={24} color={Theme.colors.brand.navy[700]} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Pause or Cancel</Text>
              <Text style={styles.featureDescription}>
                Temporarily pause or cancel your recurring donations
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="calendar" size={24} color={Theme.colors.brand.navy[700]} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Payment History</Text>
              <Text style={styles.featureDescription}>
                See all past payments and upcoming charges
              </Text>
            </View>
          </View>
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={20} color={Theme.colors.accent.green} />
          <Text style={styles.securityText}>
            Secure management powered by Stripe
          </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Theme.spacing.xl,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xxl,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.colors.accent.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Theme.colors.text.strong,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: Theme.spacing.lg,
    color: Theme.colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: Theme.spacing.lg,
  },
  howItWorksCard: {
    backgroundColor: Theme.colors.surface.base,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.xl,
    marginBottom: Theme.spacing.xxl,
    ...Theme.shadow.soft,
  },
  sectionTitle: {
    fontSize: Theme.typography.h3,
    fontWeight: 'bold',
    color: Theme.colors.text.strong,
    marginBottom: Theme.spacing.lg,
  },
  stepsList: {
    gap: Theme.spacing.lg,
  },
  step: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.brand.navy[700],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: Theme.colors.text.inverse,
    fontSize: Theme.spacing.lg,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: Theme.typography.body,
    color: Theme.colors.text.base,
    lineHeight: 22,
    paddingTop: 4,
  },
  section: {
    marginBottom: Theme.spacing.xxl,
  },
  label: {
    fontSize: Theme.spacing.lg,
    fontWeight: '600',
    color: Theme.colors.text.strong,
    marginBottom: Theme.spacing.sm,
  },
  input: {
    backgroundColor: Theme.colors.surface.base,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.lg,
    fontSize: Theme.spacing.lg,
    color: Theme.colors.text.strong,
    borderWidth: 2,
    borderColor: Theme.colors.border.base,
  },
  sendButton: {
    backgroundColor: Theme.colors.brand.navy[700],
    borderRadius: Theme.radius.md,
    padding: Theme.typography.h3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.md,
    marginBottom: 32,
  },
  sendButtonDisabled: {
    backgroundColor: Theme.colors.text.muted,
  },
  sendButtonText: {
    color: Theme.colors.text.inverse,
    fontSize: Theme.typography.h3,
    fontWeight: 'bold',
  },
  featuresSection: {
    backgroundColor: Theme.colors.surface.base,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.xl,
    marginBottom: Theme.spacing.xl,
    ...Theme.shadow.soft,
  },
  featureItem: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
    paddingBottom: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border.soft,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: Theme.radius.sm,
    backgroundColor: Theme.colors.accent.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: Theme.spacing.lg,
    fontWeight: '600',
    color: Theme.colors.text.strong,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: Theme.typography.body,
    color: Theme.colors.text.muted,
    lineHeight: 20,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
  },
  securityText: {
    fontSize: Theme.typography.body,
    color: Theme.colors.text.muted,
  },
});
