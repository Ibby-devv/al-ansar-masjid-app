// ============================================================================
// DONATION TYPES
// Location: src/types/donation.ts
// ============================================================================

import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface DonationType {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface DonationSettings {
  donation_types: DonationType[];
  preset_amounts: number[];
  minimum_amount: number;
  recurring_frequencies: {
    id: string;
    label: string;
    enabled: boolean;
  }[];
  receipt_enabled: boolean;
  receipt_prefix: string;
}

export interface DonationFormData {
  amount: number;
  donationType: string;
  donationTypeLabel: string;
  isRecurring: boolean;
  frequency?: 'weekly' | 'fortnightly' | 'monthly' | 'yearly';
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  donorMessage?: string;
  campaignId?: string;
}

export interface Donation {
  id: string;
  receipt_number: string;
  donor_name: string;
  donor_email: string;
  amount: number;
  currency: string;
  donation_type_label: string;
  is_recurring: boolean;
  frequency?: string;
  status?: string
  payment_status: 'succeeded' | 'pending' | 'failed';
  date: FirebaseFirestoreTypes.Timestamp;
  created_at: FirebaseFirestoreTypes.Timestamp;
  stripe_receipt_url?: string | null;
}

export interface RecurringDonation {
  id: string;
  donor_name: string;
  donor_email: string;
  amount: number;
  currency: string;
  donation_type_label: string;
  frequency: string;
  status: 'active' | 'paused' | 'cancelled';
  next_payment_date: FirebaseFirestoreTypes.Timestamp;
  stripe_subscription_id: string;
  created_at: FirebaseFirestoreTypes.Timestamp;
  updated_at: FirebaseFirestoreTypes.Timestamp;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface SubscriptionResponse {
  clientSecret: string;
  subscriptionId: string;
  customerId: string;
}
