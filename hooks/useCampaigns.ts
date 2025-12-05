// ============================================================================
// HOOK: useCampaigns - with offline caching
// Location: hooks/useCampaigns.ts
// Fetches active campaigns from Firestore - React Native Firebase version
// ============================================================================

import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import { CACHE_KEYS } from '../constants/cacheKeys';
import { db } from '../firebase';
import { getCachedData, setCachedData } from '../utils/cache';

export interface Campaign {
  id: string;
  title: string;
  description: string;
  goal_amount: number; // in cents
  current_amount: number; // in cents
  currency: string;
  start_date: FirebaseFirestoreTypes.Timestamp;
  end_date: FirebaseFirestoreTypes.Timestamp;
  status: 'active' | 'completed' | 'paused';
  image_url?: string;
  is_visible_in_app: boolean;
  created_at: FirebaseFirestoreTypes.Timestamp;
  updated_at: FirebaseFirestoreTypes.Timestamp;
}

// Helper to convert Timestamp to serializable format for caching
const serializeCampaign = (campaign: Campaign): any => {
  return {
    ...campaign,
    start_date: { seconds: campaign.start_date.seconds, nanoseconds: campaign.start_date.nanoseconds },
    end_date: { seconds: campaign.end_date.seconds, nanoseconds: campaign.end_date.nanoseconds },
    created_at: { seconds: campaign.created_at.seconds, nanoseconds: campaign.created_at.nanoseconds },
    updated_at: { seconds: campaign.updated_at.seconds, nanoseconds: campaign.updated_at.nanoseconds },
  };
};

// Helper to safely create Timestamp from cached data with validation
const safeTimestamp = (data: any, fallback?: FirebaseFirestoreTypes.Timestamp): FirebaseFirestoreTypes.Timestamp => {
  if (
    data &&
    typeof data.seconds === 'number' &&
    typeof data.nanoseconds === 'number'
  ) {
    return new firestore.Timestamp(data.seconds, data.nanoseconds);
  }
  // Fallback to current time or provided fallback if data is invalid
  return fallback ?? firestore.Timestamp.now();
};

// Helper to deserialize cached data back to Timestamp objects
const deserializeCampaign = (data: any): Campaign => {
  return {
    ...data,
    start_date: safeTimestamp(data.start_date),
    end_date: safeTimestamp(data.end_date),
    created_at: safeTimestamp(data.created_at),
    updated_at: safeTimestamp(data.updated_at),
  };
};

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      // 1. Load from cache first (instant)
      const cachedData = await getCachedData<any[]>(CACHE_KEYS.CAMPAIGNS);
      if (cachedData) {
        // Deserialize Timestamps from cache
        const deserialized = cachedData.map(deserializeCampaign);
        setCampaigns(deserialized);
        setLoading(false);
        console.log('✅ Campaigns loaded from cache:', deserialized.length);
      }

      // 2. Then fetch from Firestore (background update)
      const unsubscribe = db
        .collection('campaigns')
        .where('status', '==', 'active')
        .where('is_visible_in_app', '==', true)
        .orderBy('created_at', 'desc')
        .onSnapshot(
          async (querySnapshot) => {
            setLoading(false);
            setError(null);

            const loadedCampaigns: Campaign[] = [];
            querySnapshot.forEach((doc) => {
              loadedCampaigns.push({ id: doc.id, ...doc.data() } as Campaign);
            });

            setCampaigns(loadedCampaigns);

            // Update cache - serialize Timestamps before storing
            const serialized = loadedCampaigns.map(serializeCampaign);
            await setCachedData(CACHE_KEYS.CAMPAIGNS, serialized);

            const fromCache = querySnapshot.metadata.fromCache;
            console.log(
              fromCache
                ? '📦 Campaigns from cache (offline):'
                : '✅ Campaigns updated from server:',
              loadedCampaigns.length
            );
          },
          (err) => {
            console.error('❌ Error loading campaigns:', err);
            setError(err.message);
            setLoading(false);
          }
        );

      return () => unsubscribe();
    } catch (err: any) {
      console.error('❌ Error in loadCampaigns:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return { campaigns, loading, error };
}
