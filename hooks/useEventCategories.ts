// masjid-app/hooks/useEventCategories.ts - React Native Firebase version

import { useEffect, useState } from 'react';
import { CACHE_KEYS } from '../constants/cacheKeys';
import { db } from '../firebase';
import { EventCategoriesConfig, EventCategory } from '../types';
import { getCachedData, setCachedData } from '../utils/cache';

interface UseEventCategoriesReturn {
  categories: EventCategory[];
  loading: boolean;
  error: string | null;
}

export const useEventCategories = (): UseEventCategoriesReturn => {
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadCategories = async () => {
      try {
        setError(null);

        // 1. Load from cache first (instant)
        const cachedData = await getCachedData<EventCategory[]>(CACHE_KEYS.EVENT_CATEGORIES);
        if (cachedData) {
          setCategories(cachedData);
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
                
                if (data.categories) {
                  // Filter active categories and sort by order
                  const activeCategories = data.categories
                    .filter((cat: EventCategory) => cat.is_active)
                    .sort((a: EventCategory, b: EventCategory) => a.order - b.order);
                  
                  setCategories(activeCategories);
                  
                  // Update cache
                  await setCachedData(CACHE_KEYS.EVENT_CATEGORIES, activeCategories);
                  
                  console.log('🏷️ Event categories updated:', activeCategories.length);
                } else {
                  // Fallback to default categories
                  setCategories(getDefaultCategories());
                }
              } else {
                // Document doesn't exist, use defaults
                console.warn('⚠️ No event categories found in Firestore, using defaults');
                setCategories(getDefaultCategories());
              }
              
              setLoading(false);
            },
            (err) => {
              console.error('Error listening to event categories:', err);
              setError(err.message);
              setCategories(getDefaultCategories()); // Fallback on error
              setLoading(false);
            }
          );
      } catch (err) {
        console.error('Error setting up categories listener:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setCategories(getDefaultCategories());
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
  };
};

// Fallback default categories (same as admin dashboard)
const getDefaultCategories = (): EventCategory[] => [
  {
    id: 'lecture',
    label: 'Lectures',
    color_bg: '#dbeafe',
    color_text: '#1e40af',
    order: 1,
    is_active: true,
  },
  {
    id: 'community',
    label: 'Community Events',
    color_bg: '#fef3c7',
    color_text: '#92400e',
    order: 2,
    is_active: true,
  },
  {
    id: 'youth',
    label: 'Youth Programs',
    color_bg: '#fce7f3',
    color_text: '#9f1239',
    order: 3,
    is_active: true,
  },
  {
    id: 'women',
    label: "Women's Events",
    color_bg: '#f3e8ff',
    color_text: '#6b21a8',
    order: 4,
    is_active: true,
  },
  {
    id: 'education',
    label: 'Educational',
    color_bg: '#dcfce7',
    color_text: '#15803d',
    order: 5,
    is_active: true,
  },
  {
    id: 'charity',
    label: 'Charity & Fundraising',
    color_bg: '#fff7ed',
    color_text: '#c2410c',
    order: 6,
    is_active: true,
  },
];
