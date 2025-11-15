// ============================================================================
// HOOK: useCampaigns - with offline caching
// Location: hooks/useCampaigns.ts
// Fetches active campaigns from Firestore - React Native Firebase version
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { db } from '../firebase';

const CAMPAIGNS_CACHE_KEY = '@campaigns_cache';

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
  created_at: any;
  updated_at: any;
}

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
      const cachedData = await AsyncStorage.getItem(CAMPAIGNS_CACHE_KEY);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        setCampaigns(parsed);
        setLoading(false);
        console.log('✅ Campaigns loaded from cache:', parsed.length);
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

            // Update cache
            await AsyncStorage.setItem(
              CAMPAIGNS_CACHE_KEY,
              JSON.stringify(loadedCampaigns)
            );

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
