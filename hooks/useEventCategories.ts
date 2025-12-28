// masjid-app/hooks/useEventCategories.ts - React Native Firebase version

import { useEffect, useState } from 'react';
import { CACHE_KEYS } from '../constants/cacheKeys';
import { db } from '../firebase';
import { EventCategoriesConfig, EventCategory } from '../types';
import { getCachedData, setCachedData } from '../utils/cache';

// ============================================================================
// Hook Interface
// ============================================================================

interface UseEventCategoriesReturn {
  categories: EventCategory[];
  loading: boolean;
  error: string | null;
  hasRealData: boolean; // True if categories from Firestore/cache
}

/**
 * Hook to load event categories
 * - Filters only show when hasRealData is true
 * - Event badges use category.label from this data, or show raw ID if not found
 */
export const useEventCategories = (): UseEventCategoriesReturn => {
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasRealData, setHasRealData] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadCategories = async () => {
      try {
        setError(null);

        // 1. Load from cache first (instant)
        const cachedData = await getCachedData<EventCategory[]>(CACHE_KEYS.EVENT_CATEGORIES);
        if (cachedData && cachedData.length > 0) {
          setCategories(cachedData);
          setHasRealData(true);
          setLoading(false);
          console.log('✅ Event categories loaded from cache:', cachedData.length);
        }
        
        // 2. Set up real-time listener for event categories
        unsubscribe = db
          .collection('eventCategories')
          .doc('default')
          .onSnapshot(
            async (docSnapshot) => {
              if (docSnapshot.exists()) {
                const data = docSnapshot.data() as EventCategoriesConfig;
                
                if (data.categories && data.categories.length > 0) {
                  // Filter active categories and sort by order
                  const activeCategories = data.categories
                    .filter((cat: EventCategory) => cat.is_active)
                    .sort((a: EventCategory, b: EventCategory) => a.order - b.order);
                  
                  setCategories(activeCategories);
                  setHasRealData(true);
                  await setCachedData(CACHE_KEYS.EVENT_CATEGORIES, activeCategories);
                  console.log('🏷️ Event categories updated:', activeCategories.length);
                }
              }
              
              setLoading(false);
            },
            (err) => {
              console.error('Error listening to event categories:', err);
              setError(err.message);
              setLoading(false);
            }
          );
      } catch (err) {
        console.error('Error setting up categories listener:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    loadCategories();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
        console.log('Unsubscribed from event categories listener');
      }
    };
  }, []);

  return {
    categories,
    loading,
    error,
    hasRealData,
  };
};