// masjid-app/hooks/useEvents.ts - React Native Firebase version

import firestore from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import { CACHE_KEYS } from '../constants/cacheKeys';
import { db } from '../firebase';
import { Event } from '../types';
import { getCachedData, setCachedData } from '../utils/cache';

interface UseEventsReturn {
  events: Event[];
  loading: boolean;
  error: string | null;
  upcomingEvents: Event[];
  pastEvents: Event[];
}

// ============================================================================
// Serialization Helpers for Firestore Timestamps
// ============================================================================

/**
 * Convert Event with Firestore Timestamps to cache-friendly format
 */
const serializeEvent = (event: Event): any => {
  return {
    ...event,
    date: { seconds: event.date.seconds, nanoseconds: event.date.nanoseconds },
    created_at: event.created_at ? { seconds: event.created_at.seconds, nanoseconds: event.created_at.nanoseconds } : undefined,
    updated_at: event.updated_at ? { seconds: event.updated_at.seconds, nanoseconds: event.updated_at.nanoseconds } : undefined,
  };
};

/**
 * Convert cached data back to Event with Firestore Timestamps
 */
const deserializeEvent = (data: any): Event => {
  return {
    ...data,
    date: new firestore.Timestamp(data.date.seconds, data.date.nanoseconds),
    created_at: data.created_at ? new firestore.Timestamp(data.created_at.seconds, data.created_at.nanoseconds) : undefined,
    updated_at: data.updated_at ? new firestore.Timestamp(data.updated_at.seconds, data.updated_at.nanoseconds) : undefined,
  };
};

// ============================================================================
// Hook Implementation
// ============================================================================

export const useEvents = (): UseEventsReturn => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: () => void;

    const loadEvents = async () => {
      try {
        setError(null);

        // 1. Load from cache first (instant)
        const cachedData = await getCachedData<any[]>(CACHE_KEYS.EVENTS);
        if (cachedData) {
          // Deserialize Timestamps from cache
          const deserialized = cachedData.map(deserializeEvent);
          setEvents(deserialized);
          setLoading(false);
          console.log('✅ Events loaded from cache:', deserialized.length);
        }

        // 2. Get today's start of day as Firestore Timestamp for comparison
        const getTodayStartTimestamp = (): ReturnType<typeof firestore.Timestamp.fromDate> => {
          const now = new Date();
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          return firestore.Timestamp.fromDate(startOfToday);
        };

        const todayTimestamp = getTodayStartTimestamp();
        console.log('Fetching events from date:', todayTimestamp.toDate());

        // 3. Set up real-time listener for active upcoming events
        unsubscribe = db
          .collection('events')
          .where('is_active', '==', true)
          .where('date', '>=', todayTimestamp)
          .orderBy('date', 'asc')
          .orderBy('time', 'asc')
          .onSnapshot(
            async (querySnapshot) => {
              const loadedEvents: Event[] = [];
              querySnapshot.forEach((doc) => {
                loadedEvents.push({ id: doc.id, ...doc.data() } as Event);
              });
              
              setEvents(loadedEvents);
              setLoading(false);
              
              // Update cache - serialize Timestamps before storing
              const serialized = loadedEvents.map(serializeEvent);
              await setCachedData(CACHE_KEYS.EVENTS, serialized);
              
              console.log('📅 Events updated:', loadedEvents.length);
            },
            (err) => {
              console.error('Error listening to events:', err);
              setError(err.message);
              setLoading(false);
            }
          );
      } catch (err) {
        console.error('Error setting up events listener:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    loadEvents();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
        console.log('Unsubscribed from events listener');
      }
    };
  }, []);

  // Since we're only fetching upcoming events, upcomingEvents = events
  const upcomingEvents = events;
  
  // pastEvents will always be empty now (we don't fetch them)
  const pastEvents: Event[] = [];

  return {
    events,
    loading,
    error,
    upcomingEvents,
    pastEvents,
  };
};
