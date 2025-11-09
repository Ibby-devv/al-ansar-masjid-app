// ============================================================================
// DONATION HOOK - React Native Firebase version with offline caching
// Location: src/hooks/useDonation.ts
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { db, regionalFunctions } from '../firebase';
import {
  Donation,
  DonationFormData,
  DonationSettings,
  PaymentIntentResponse,
  SubscriptionResponse
} from '../types/donation';

const SETTINGS_CACHE_KEY = '@donation_settings_cache';

export const useDonation = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<DonationSettings | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);

  // Get regional functions instance
  const functions = regionalFunctions;

  // Load donation settings with cache-first approach (one-time fetch)
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // 1. Load from cache first (instant)
        const cachedData = await AsyncStorage.getItem(SETTINGS_CACHE_KEY);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          setSettings(parsed);
          setLoading(false);
          console.log('✅ Donation settings loaded from cache');
        }

        // 2. Then fetch once from Firestore (no real-time listener)
        const docSnapshot = await db
          .collection('donationSettings')
          .doc('config')
          .get();

        setLoading(false);

        if (docSnapshot.exists()) {
          const freshData = docSnapshot.data() as DonationSettings;
          
          // Only update if data actually changed (prevent unnecessary re-renders)
          const dataChanged = JSON.stringify(freshData) !== JSON.stringify(cachedData ? JSON.parse(cachedData) : null);
          
          if (dataChanged) {
            setSettings(freshData);

            // Update cache
            await AsyncStorage.setItem(
              SETTINGS_CACHE_KEY,
              JSON.stringify(freshData)
            );

            console.log('✅ Donation settings updated from server');
          } else {
            console.log('📦 Donation settings unchanged');
          }
        } else {
          console.error('❌ Donation settings document not found');
        }
      } catch (err: any) {
        console.error('❌ Error loading donation settings:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Create one-time donation
  const createDonation = async (formData: DonationFormData): Promise<PaymentIntentResponse> => {
    setLoading(true);
    setError(null);

    try {
      console.log('📤 Creating payment intent...');
      
      const createPaymentIntent = functions.httpsCallable('createPaymentIntent');

      const payload = {
        amount: Math.round(formData.amount * 100), // Convert to cents
        donor_name: formData.donorName,
        donor_email: formData.donorEmail,
        donor_phone: formData.donorPhone,
        donation_type_id: formData.donationType,
        donation_type_label: formData.donationTypeLabel,
        campaign_id: formData.campaignId || "",
        donor_message: formData.donorMessage,
      };

      console.log('📦 Payload:', payload);

      const result = await createPaymentIntent(payload);
      const data = result.data as PaymentIntentResponse;

      console.log('✅ Payment intent created:', data.paymentIntentId);
      
      setLoading(false);
      return data;
    } catch (err: any) {
      console.error('❌ Error creating payment intent:');
      console.error('   Code:', err.code);
      console.error('   Message:', err.message);
      console.error('   Details:', err.details);
      
      setLoading(false);
      
      // Better error messages
      let errorMessage = 'Failed to create donation';
      
      if (err.code === 'functions/unauthenticated') {
        errorMessage = 'Authentication required';
      } else if (err.code === 'functions/permission-denied') {
        errorMessage = 'Permission denied';
      } else if (err.code === 'functions/not-found') {
        errorMessage = 'Payment service not available';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Create recurring donation
  const createSubscription = async (formData: DonationFormData): Promise<SubscriptionResponse> => {
    setLoading(true);
    setError(null);

    try {
      if (!formData.frequency) {
        throw new Error('Frequency is required for recurring donations');
      }

      console.log('📤 Creating subscription...');

      const createSubscriptionFunc = functions.httpsCallable('createSubscription');

      const payload = {
        amount: Math.round(formData.amount * 100), // Convert to cents
        frequency: formData.frequency,
        donor_name: formData.donorName,
        donor_email: formData.donorEmail,
        donor_phone: formData.donorPhone,
        donation_type_id: formData.donationType,
        donation_type_label: formData.donationTypeLabel,
        campaign_id: formData.campaignId || ""
      };

      console.log('📦 Payload:', payload);

      const result = await createSubscriptionFunc(payload);
      const data = result.data as SubscriptionResponse;

      console.log('✅ Subscription created:', data.subscriptionId);

      setLoading(false);
      return data;
    } catch (err: any) {
      console.error('❌ Error creating subscription:');
      console.error('   Code:', err.code);
      console.error('   Message:', err.message);
      console.error('   Details:', err.details);
      
      setLoading(false);
      
      // Better error messages
      let errorMessage = 'Failed to create subscription';
      
      if (err.code === 'functions/unauthenticated') {
        errorMessage = 'Authentication required';
      } else if (err.code === 'functions/permission-denied') {
        errorMessage = 'Permission denied';
      } else if (err.code === 'functions/not-found') {
        errorMessage = 'Subscription service not available';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Load user's donations (if authenticated)
  const loadUserDonations = async (email: string) => {
    try {
      const snapshot = await db
        .collection('donations')
        .where('donor_email', '==', email)
        .orderBy('created_at', 'desc')
        .get();

      const userDonations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Donation[];

      setDonations(userDonations);
    } catch (err: any) {
      console.error('❌ Error loading donations:', err);
    }
  };

  // Subscribe to real-time donation updates
  const subscribeToDonations = (email: string) => {
    return db
      .collection('donations')
      .where('donor_email', '==', email)
      .orderBy('created_at', 'desc')
      .onSnapshot((snapshot) => {
        const userDonations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Donation[];

        setDonations(userDonations);
      });
  };

  return {
    loading,
    error,
    settings,
    donations,
    createDonation,
    createSubscription,
    loadUserDonations,
    subscribeToDonations,
  };
};
