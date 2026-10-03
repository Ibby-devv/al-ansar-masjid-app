import { useEffect, useState } from 'react';
import { getCivilDateInZone } from '../utils/civilTime';

/**
 * Today's civil date (`YYYY-MM-DD`) in the given timezone.
 * Re-checks every minute so it rolls over at mosque midnight.
 */
export const useCivilToday = (timeZone: string): string => {
  const [today, setToday] = useState<string>(() =>
    getCivilDateInZone(new Date(), timeZone)
  );

  useEffect(() => {
    setToday(getCivilDateInZone(new Date(), timeZone));
    const timer = setInterval(() => {
      setToday(getCivilDateInZone(new Date(), timeZone));
    }, 60000);
    return () => clearInterval(timer);
  }, [timeZone]);

  return today;
};
