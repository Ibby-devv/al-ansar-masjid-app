// masjid-app/hooks/useEvents.ts - React Native Firebase version

import firestore from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import { CACHE_KEYS } from '../constants/cacheKeys';
import { db } from '../firebase';
import { Event } from '../types';
import { getCachedData, setCachedData } from '../utils/cache';
import { DEFAULT_MOSQUE_TZ, parseCivilDate } from '../utils/civilTime';
import { useCivilToday } from './useCivilToday';

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

type SerializedTimestamp = { seconds: number; nanoseconds: number };

const serializeTimestamp = (
  ts?: { seconds: number; nanoseconds: number }
): SerializedTimestamp | undefined =>
  ts ? { seconds: ts.seconds, nanoseconds: ts.nanoseconds } : undefined;

const deserializeTimestamp = (
  data?: SerializedTimestamp
): FirebaseTimestamp | undefined =>
  data ? new firestore.Timestamp(data.seconds, data.nanoseconds) : undefined;

type FirebaseTimestamp = InstanceType<typeof firestore.Timestamp>;

/**
 * Convert Event with Firestore Timestamps to cache-friendly format
 */
const serializeEvent = (event: Event): any => {
  return {
    ...event,
    date: serializeTimestamp(event.date),
    created_at: serializeTimestamp(event.created_at),
    updated_at: serializeTimestamp(event.updated_at),
  };
};

/**
 * Convert cached data back to Event with Firestore Timestamps
 */
const deserializeEvent = (data: any): Event => {
  return {
    ...data,
    date: deserializeTimestamp(data.date),
    created_at: deserializeTimestamp(data.created_at),
    updated_at: deserializeTimestamp(data.updated_at),
  };
};

// ============================================================================
// Hook Implementation
// ============================================================================

export const useEvents = (timeZone: string = DEFAULT_MOSQUE_TZ): UseEventsReturn => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // YYYY-MM-DD in the mosque zone; rolls over at mosque midnight
  const todayCivilDate = useCivilToday(timeZone);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    const loadEvents = async () => {
      try {
        setError(null);

        // 1. Load from cache first (instant)
        // Skip legacy cache entries (no event_date) and events already past.
        const cachedData = await getCachedData<any[]>(CACHE_KEYS.EVENTS);
        if (cachedData && !cancelled) {
          const deserialized = cachedData
            .map(deserializeEvent)
            .filter(
              (e) =>
                typeof e.event_date === 'string' &&
                parseCivilDate(e.event_date) !== null &&
                e.event_date >= todayCivilDate
            );
          if (deserialized.length > 0) {
            setEvents(deserialized);
            setLoading(false);
          }
        }

        if (cancelled) return;

        // 2. Real-time listener for active upcoming events (civil date strings)
        unsubscribe = db
          .collection('events')
          .where('is_active', '==', true)
          .where('event_date', '>=', todayCivilDate)
          .orderBy('event_date', 'asc')
          .orderBy('event_time', 'asc')
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
      cancelled = true;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [todayCivilDate]);

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
