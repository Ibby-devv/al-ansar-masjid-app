// masjid-app/hooks/useEvents.ts - React Native Firebase version

import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import { db } from '../firebase';
import { Event } from '../types';

interface UseEventsReturn {
  events: Event[];
  loading: boolean;
  error: string | null;
  upcomingEvents: Event[];
  pastEvents: Event[];
}

export const useEvents = (): UseEventsReturn => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: () => void;

    try {
      setError(null);

      // Get today's start of day as Firestore Timestamp for comparison
      const getTodayStartTimestamp = (): firestore.Timestamp => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return firestore.Timestamp.fromDate(startOfToday);
      };

      const todayTimestamp = getTodayStartTimestamp();
      console.log('Fetching events from date:', todayTimestamp.toDate());

      // Real-time listener for active upcoming events only
      unsubscribe = db
        .collection('events')
        .where('is_active', '==', true)
        .where('date', '>=', todayTimestamp)
        .orderBy('date', 'asc')
        .orderBy('time', 'asc')
        .onSnapshot(
          (querySnapshot) => {
            const loadedEvents: Event[] = [];
            querySnapshot.forEach((doc) => {
              loadedEvents.push({ id: doc.id, ...doc.data() } as Event);
            });
            
            setEvents(loadedEvents);
            setLoading(false);
            console.log('Upcoming events loaded:', loadedEvents.length);
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
