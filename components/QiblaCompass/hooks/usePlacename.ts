import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import type { LocationCoordinates } from './useLocation';

export const usePlacename = (coordinates: LocationCoordinates | null) => {
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!coordinates) return;
      setLoading(true);
      try {
        const results = await Location.reverseGeocodeAsync({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        });
        if (cancelled) return;
        if (results && results.length > 0) {
          const r = results[0];
          const parts = [r.city || r.subregion || r.district || r.name].filter(Boolean) as string[];
          setName(parts[0] || null);
        } else {
          setName(null);
        }
      } catch {
        if (!cancelled) setName(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [coordinates]);

  return { name, loading };
};
