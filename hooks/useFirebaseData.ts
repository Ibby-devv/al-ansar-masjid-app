import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { JumuahTimes, MosqueSettings, PrayerTimes } from '../types';

interface UseFirebaseDataReturn {
  prayerTimes: PrayerTimes | null;
  jumuahTimes: JumuahTimes | null;
  mosqueSettings: MosqueSettings | null;
  loading: boolean;
  /** True when we are attempting to get a fresh live snapshot after showing cached data */
  updating: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const STORAGE_KEYS = {
  prayerTimes: '@cached_prayer_times',
  jumuahTimes: '@cached_jumuah_times',
  mosqueSettings: '@cached_mosque_settings',
} as const;

export const useFirebaseData = (): UseFirebaseDataReturn => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [jumuahTimes, setJumuahTimes] = useState<JumuahTimes | null>(null);
  const [mosqueSettings, setMosqueSettings] = useState<MosqueSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  // Separate from `loading` so cached data can render while we still seek live snapshot.
  const [updating, setUpdating] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribePrayer: () => void;
    let unsubscribeJumuah: () => void;
    let unsubscribeSettings: () => void;
    let didSetFromCache = false;
    let hasServerSnapshot = false;
    let cacheOnlyTimer: ReturnType<typeof setTimeout> | null = null;

    const startCacheOnlyTimeout = () => {
      if (!cacheOnlyTimer) {
        cacheOnlyTimer = setTimeout(() => {
          setUpdating(false);
        }, 5000);
      }
    };

    const clearCacheOnlyTimeout = () => {
      if (cacheOnlyTimer) {
        clearTimeout(cacheOnlyTimer);
        cacheOnlyTimer = null;
      }
    };

    const handleSnapshot = (
      data: PrayerTimes | JumuahTimes | MosqueSettings,
      setter: (data: any) => void,
      storageKey: string,
      fromCache: boolean,
      logName: string
    ) => {
      setter(data);
      AsyncStorage.setItem(storageKey, JSON.stringify(data)).catch(() => {});
      console.log(`${logName} updated from Firebase`);
      
      setLoading(false);
      
      if (!fromCache) {
        hasServerSnapshot = true;
        setUpdating(false);
        clearCacheOnlyTimeout();
      } else if (!didSetFromCache) {
        setUpdating(true);
        startCacheOnlyTimeout();
      } else {
        startCacheOnlyTimeout();
      }
    };

    const handleError = (err: Error, logName: string) => {
      console.error(`Error listening to ${logName}:`, err);
      setError(err.message);
      setLoading(false);
      
      if (didSetFromCache && !hasServerSnapshot) {
        setTimeout(() => setUpdating(false), 5000);
      } else {
        setUpdating(false);
      }
      clearCacheOnlyTimeout();
    };

    try {
      setError(null);

      // 1) Attempt to hydrate from cache for instant UI
      (async () => {
        try {
          const [ptRaw, jtRaw, msRaw] = await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.prayerTimes),
            AsyncStorage.getItem(STORAGE_KEYS.jumuahTimes),
            AsyncStorage.getItem(STORAGE_KEYS.mosqueSettings),
          ]);

          let hadAny = false;
          if (ptRaw) {
            try {
              const parsed: PrayerTimes = JSON.parse(ptRaw);
              setPrayerTimes(parsed);
              hadAny = true;
            } catch {
              console.warn('Failed parsing cached prayerTimes');
            }
          }

          if (jtRaw) {
            try {
              const parsed: JumuahTimes = JSON.parse(jtRaw);
              setJumuahTimes(parsed);
              hadAny = true;
            } catch {
              console.warn('Failed parsing cached jumuahTimes');
            }
          }

          if (msRaw) {
            try {
              const parsed: MosqueSettings = JSON.parse(msRaw);
              setMosqueSettings(parsed);
              hadAny = true;
            } catch {
              console.warn('Failed parsing cached mosqueSettings');
            }
          }

          if (hadAny) {
            setLoading(false); // We can render immediately
            didSetFromCache = true;
            setUpdating(true); // Still awaiting first live snapshot
          } else {
            // No cache, remain in loading + updating state until first snapshot
            setUpdating(true);
          }
        } catch (cacheErr) {
          console.warn('Cache hydration failed', cacheErr);
        }
      })();

      // Real-time listener for prayer times
      unsubscribePrayer = db
        .collection('prayerTimes')
        .doc('current')
        .onSnapshot(
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              const fromCache = docSnapshot.metadata.fromCache;
              handleSnapshot(
                docSnapshot.data() as PrayerTimes,
                setPrayerTimes,
                STORAGE_KEYS.prayerTimes,
                fromCache,
                'Prayer times'
              );
            } else {
              setLoading(false);
            }
          },
          (err) => handleError(err as Error, 'prayer times')
        );

      // Real-time listener for Jumuah times
      unsubscribeJumuah = db
        .collection('jumuahTimes')
        .doc('current')
        .onSnapshot(
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              const fromCache = docSnapshot.metadata.fromCache;
              handleSnapshot(
                docSnapshot.data() as JumuahTimes,
                setJumuahTimes,
                STORAGE_KEYS.jumuahTimes,
                fromCache,
                'Jumuah times'
              );
            } else {
              setLoading(false);
            }
          },
          (err) => handleError(err as Error, 'Jumuah times')
        );

      // Real-time listener for mosque settings
      unsubscribeSettings = db
        .collection('mosqueSettings')
        .doc('info')
        .onSnapshot(
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              const fromCache = docSnapshot.metadata.fromCache;
              handleSnapshot(
                docSnapshot.data() as MosqueSettings,
                setMosqueSettings,
                STORAGE_KEYS.mosqueSettings,
                fromCache,
                'Mosque settings'
              );
            } else {
              setLoading(false);
            }
          },
          (err) => handleError(err as Error, 'mosque settings')
        );
    } catch (err) {
      console.error('Error setting up listeners:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
      setUpdating(false);
    }

    // Cleanup function - unsubscribe from all listeners when component unmounts
    return () => {
      if (unsubscribePrayer) unsubscribePrayer();
      if (unsubscribeJumuah) unsubscribeJumuah();
      if (unsubscribeSettings) unsubscribeSettings();
      clearCacheOnlyTimeout();
      console.log('Unsubscribed from Firebase listeners');
    };
  }, []);

  // Manual refetch function (for pull-to-refresh)
  // Note: With real-time listeners, this happens automatically,
  // but we keep this for the pull-to-refresh gesture
  const loadData = async (): Promise<void> => {
    // With listeners, data updates automatically
    // This function is kept for compatibility with pull-to-refresh
    console.log('Manual refresh triggered (listeners handle updates automatically)');
  };

  return {
    prayerTimes,
    jumuahTimes,
    mosqueSettings,
    loading,
    updating,
    error,
    refetch: loadData
  };
};
