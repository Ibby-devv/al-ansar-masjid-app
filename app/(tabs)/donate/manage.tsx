import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
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
import { useTheme } from '../../../contexts/ThemeContext';
import type { AppTheme } from '../../../hooks/useAppTheme';
import { regionalFunctions } from '../../../firebase';

export default function ManageTab(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
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
            <Ionicons name="settings" size={32} color={theme.colors.brand.navy[700]} />
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
            placeholderTextColor={theme.colors.text.muted}
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
            <ActivityIndicator color={theme.colors.text.inverse} />
          ) : (
            <>
              <Ionicons name="mail" size={24} color={theme.colors.text.inverse} />
              <Text style={styles.sendButtonText}>Send Management Link</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Features List */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="star" size={20} color={theme.colors.accent.amber} /> What You Can Manage
          </Text>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="card" size={24} color={theme.colors.brand.navy[700]} />
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
              <Ionicons name="document-text" size={24} color={theme.colors.brand.navy[700]} />
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
              <Ionicons name="pause-circle" size={24} color={theme.colors.brand.navy[700]} />
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
              <Ionicons name="calendar" size={24} color={theme.colors.brand.navy[700]} />
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
          <Ionicons name="shield-checkmark" size={20} color={theme.colors.accent.green} />
          <Text style={styles.securityText}>
            Secure management powered by Stripe
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.muted,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.xl,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.accent.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.strong,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: theme.spacing.lg,
    color: theme.colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  howItWorksCard: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xxl,
    ...theme.shadow.soft,
  },
  sectionTitle: {
    fontSize: theme.typography.h3,
    fontWeight: 'bold',
    color: theme.colors.text.strong,
    marginBottom: theme.spacing.lg,
  },
  stepsList: {
    gap: theme.spacing.lg,
  },
  step: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.brand.navy[700],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: theme.colors.text.header,
    fontSize: theme.spacing.lg,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: theme.typography.body,
    color: theme.colors.text.base,
    lineHeight: 22,
    paddingTop: 4,
  },
  section: {
    marginBottom: theme.spacing.xxl,
  },
  label: {
    fontSize: theme.spacing.lg,
    fontWeight: '600',
    color: theme.colors.text.strong,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    fontSize: theme.spacing.lg,
    color: theme.colors.text.strong,
    borderWidth: 2,
    borderColor: theme.colors.border.base,
  },
  sendButton: {
    backgroundColor: theme.colors.brand.navy[700],
    borderRadius: theme.radius.md,
    padding: theme.typography.h3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    marginBottom: 32,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.text.muted,
  },
  sendButtonText: {
    color: theme.colors.text.header,
    fontSize: theme.typography.h3,
    fontWeight: 'bold',
  },
  featuresSection: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    ...theme.shadow.soft,
  },
  featureItem: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.soft,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.accent.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: theme.spacing.lg,
    fontWeight: '600',
    color: theme.colors.text.strong,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: theme.typography.body,
    color: theme.colors.text.muted,
    lineHeight: 20,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  securityText: {
    fontSize: theme.typography.body,
    color: theme.colors.text.muted,
  },
});
