import { PrayerTimes as AdhanPrayerTimes, CalculationMethod, Coordinates } from 'adhan';
import { useEffect, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import { db } from '../firebase';
import { MosqueSettings, PrayerTimes } from '../types';
import { getCurrentTimeInMosqueTimezone } from '../utils/timezone';

export const useAutoFetchPrayerTimes = (
  prayerTimes: PrayerTimes | null,
  mosqueSettings: MosqueSettings | null
) => {
  const [isFetching, setIsFetching] = useState(false);
  const [lastFetchAttempt, setLastFetchAttempt] = useState<Date | null>(null);

  // Helper to get start of day for accurate date-only comparisons
  const getStartOfDay = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  useEffect(() => {
    // Only run if we have the necessary data
    if (!prayerTimes || !mosqueSettings) return;
    if (!mosqueSettings.latitude || !mosqueSettings.longitude) return;

    // Check if we should fetch prayer times
    const shouldFetch = checkIfShouldFetchPrayerTimes();
    
    if (shouldFetch) {
      fetchAndUpdateAllPrayerTimes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prayerTimes, mosqueSettings]);

  const checkIfShouldFetchPrayerTimes = (): boolean => {
    if (!prayerTimes) return false;

    // Use mosque's current time for staleness check (falls back to local time if no timezone)
    const mosqueTimezone = mosqueSettings?.timezone;
    const today = getCurrentTimeInMosqueTimezone(mosqueTimezone);
    const todayStartOfDay = getStartOfDay(today);
    
    // Don't fetch if we already tried today (use proper date comparison)
    if (lastFetchAttempt) {
      const lastAttemptStartOfDay = getStartOfDay(lastFetchAttempt);
      if (lastAttemptStartOfDay.getTime() === todayStartOfDay.getTime()) {
        return false;
      }
    }

    // Check if prayer times were already updated today
    const lastUpdate = prayerTimes.last_updated;
    
    if (lastUpdate) {
      // Use proper date comparison instead of string comparison
      const lastUpdateDate = lastUpdate.toDate();
      const lastUpdateStartOfDay = getStartOfDay(lastUpdateDate);
      
      if (lastUpdateStartOfDay.getTime() >= todayStartOfDay.getTime()) {
        console.log('Prayer times already updated today');
        return false;
      }
    }

    return true;
  };

  const fetchAndUpdateAllPrayerTimes = async (): Promise<void> => {
    if (isFetching || !mosqueSettings) return;

    const mosqueTimezone = mosqueSettings.timezone;
    setIsFetching(true);
    setLastFetchAttempt(getCurrentTimeInMosqueTimezone(mosqueTimezone));

    try {
      console.log('🕌 Auto-calculating prayer times using adhan package...');
      
      // Set up coordinates and calculation parameters
      const coordinates = new Coordinates(
        mosqueSettings.latitude!,
        mosqueSettings.longitude!
      );
      
      // Use the calculation method directly from settings (now using adhan package naming)
      const methodName = mosqueSettings.calculation_method || 'MuslimWorldLeague';
      const params = CalculationMethod[methodName as keyof typeof CalculationMethod]();
      
      // Calculate prayer times for today (in mosque's timezone)
      const date = getCurrentTimeInMosqueTimezone(mosqueTimezone);
      const adhanPrayerTimes = new AdhanPrayerTimes(coordinates, date, params);

      // Convert Date objects to 12-hour format strings in mosque's timezone
      const formatTime = (date: Date): string => {
        if (!mosqueTimezone) {
          // Fallback to local formatting if no timezone set
          let hours = date.getHours();
          const minutes = date.getMinutes();
          const period = hours >= 12 ? 'PM' : 'AM';
          
          if (hours > 12) {
            hours -= 12;
          } else if (hours === 0) {
            hours = 12;
          }

          const minutesStr = minutes.toString().padStart(2, '0');
          return `${hours}:${minutesStr} ${period}`;
        }

        // Format time in mosque's timezone
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: mosqueTimezone,
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        return formatter.format(date);
      };

      // Get current prayer times from Firebase
      const prayerTimesDoc = await db
        .collection('prayerTimes')
        .doc('current')
        .get();
      
      const currentPrayerTimes = prayerTimesDoc.data() as PrayerTimes;

      // Update ALL Adhan times, keep existing Iqama settings
      const updatedPrayerTimes: PrayerTimes = {
        ...currentPrayerTimes,
        fajr_adhan: formatTime(adhanPrayerTimes.fajr),
        dhuhr_adhan: formatTime(adhanPrayerTimes.dhuhr),
        asr_adhan: formatTime(adhanPrayerTimes.asr),
        maghrib_adhan: formatTime(adhanPrayerTimes.maghrib),
        isha_adhan: formatTime(adhanPrayerTimes.isha),
        last_updated: firestore.Timestamp.now()
      };

      await db
        .collection('prayerTimes')
        .doc('current')
        .set(updatedPrayerTimes);

      console.log(`✅ Prayer times auto-calculated using ${methodName}:
        Fajr: ${formatTime(adhanPrayerTimes.fajr)}
        Dhuhr: ${formatTime(adhanPrayerTimes.dhuhr)}
        Asr: ${formatTime(adhanPrayerTimes.asr)}
        Maghrib: ${formatTime(adhanPrayerTimes.maghrib)}
        Isha: ${formatTime(adhanPrayerTimes.isha)}
      `);
    } catch (error) {
      console.error('❌ Error auto-calculating prayer times:', error);
    } finally {
      setIsFetching(false);
    }
  };

  return { isFetching };
};
