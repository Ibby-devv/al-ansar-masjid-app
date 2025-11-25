/**
 * Get current time in the mosque's timezone
 * @param mosqueTimezone IANA timezone identifier (e.g., "Australia/Brisbane")
 * @returns Date object representing current time in mosque's timezone
 */
export const getCurrentTimeInMosqueTimezone = (mosqueTimezone?: string): Date => {
  if (!mosqueTimezone) {
    // Fallback to user's local time if no timezone is set
    return new Date();
  }

  try {
    const now = new Date();
    
    // Get the date/time components in the mosque's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: mosqueTimezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const mosqueTime: Record<string, number> = {};
    
    parts.forEach((part) => {
      if (part.type !== 'literal') {
        mosqueTime[part.type] = parseInt(part.value, 10);
      }
    });

    // Create a Date in UTC that represents the mosque's local time
    // We use Date.UTC to avoid timezone interpretation
    const mosqueLocalAsUTC = Date.UTC(
      mosqueTime.year,
      mosqueTime.month - 1, // JavaScript months are 0-indexed
      mosqueTime.day,
      mosqueTime.hour,
      mosqueTime.minute,
      mosqueTime.second
    );

    // Return a Date object. Although it will display in user's timezone when printed,
    // the numeric value (getTime()) represents the mosque's local time for comparison purposes
    return new Date(mosqueLocalAsUTC);
  } catch (error) {
    console.error('Error converting to mosque timezone:', error);
    // Fallback to user's local time on error
    return new Date();
  }
};
