// ============================================================================
// Civil time helpers (mosque time-system)
//
// Ported from mosque_app_functions/functions/src/utils/iqamaSchedule.ts so the
// app and Cloud Functions agree on:
//   - civil date  -> `YYYY-MM-DD` string (a calendar day, not an instant)
//   - civil clock -> `HH:mm` string (minutes since midnight, not an instant)
//   - display     -> dates as `DD-MM-YYYY`, instants as `DD-MM-YYYY HH:mm`
// ============================================================================

/** Fallback when mosque settings have not loaded yet. */
export const DEFAULT_MOSQUE_TZ = "Australia/Sydney";

const MINUTES_PER_DAY = 24 * 60;

const WEEKDAYS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

export interface ZonedDateTime extends CalendarDate {
  hour: number;
  minute: number;
}

// ----------------------------------------------------------------------------
// Civil dates
// ----------------------------------------------------------------------------

/**
 * Add calendar days using UTC so month/year rollover is correct
 * (Jan 31 + 1 → Feb 1, Dec 31 + 1 → Jan 1).
 */
export function addCalendarDays(
  year: number,
  month: number,
  day: number,
  days: number
): CalendarDate {
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

export function compareCalendarDates(a: CalendarDate, b: CalendarDate): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

/**
 * Compare two `YYYY-MM-DD` strings. Zero-padded ISO dates sort
 * lexicographically, so a plain string comparison is correct.
 */
export function compareCivilDates(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/** Civil date, `YYYY-MM-DD`. This is a calendar day, not an instant. */
export function formatCivilDate(date: CalendarDate): string {
  const year = date.year.toString().padStart(4, "0");
  const month = date.month.toString().padStart(2, "0");
  const day = date.day.toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseCivilDate(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() + 1 !== month ||
    utc.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

/** Add days to a `YYYY-MM-DD` string. Returns null if the input is invalid. */
export function addCivilDays(value: string, days: number): string | null {
  const parsed = parseCivilDate(value);
  if (!parsed) return null;
  return formatCivilDate(
    addCalendarDays(parsed.year, parsed.month, parsed.day, days)
  );
}

/** User-visible civil date: `DD-MM-YYYY`. */
export function formatCivilDateDisplay(date: CalendarDate): string {
  const month = date.month.toString().padStart(2, "0");
  const day = date.day.toString().padStart(2, "0");
  return `${day}-${month}-${date.year}`;
}

/** `YYYY-MM-DD` → `DD-MM-YYYY`. Returns the input unchanged if it is invalid. */
export function formatCivilDateStringDisplay(value: string): string {
  const parsed = parseCivilDate(value);
  return parsed ? formatCivilDateDisplay(parsed) : value;
}

/** Weekday for a civil date. Calendar math only, no timezone involved. */
function weekdayIndex(date: CalendarDate): number {
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}

/** Long weekday for a civil date (e.g. Sunday). */
export function weekdayLong(date: CalendarDate): string {
  return WEEKDAYS_LONG[weekdayIndex(date)];
}

/** Short weekday for a civil date (e.g. Sun). */
export function weekdayShort(date: CalendarDate): string {
  return WEEKDAYS_LONG[weekdayIndex(date)].slice(0, 3);
}

/** Short month name for a civil date (e.g. Oct). */
export function monthShort(date: CalendarDate): string {
  return MONTHS_SHORT[date.month - 1];
}

/** `Saturday, 04-10-2026` */
export function formatCivilDateHeading(date: CalendarDate): string {
  return `${weekdayLong(date)}, ${formatCivilDateDisplay(date)}`;
}

// ----------------------------------------------------------------------------
// Instants in a timezone
// ----------------------------------------------------------------------------

export function getZonedDateTimeParts(
  date: Date,
  timeZone: string
): ZonedDateTime {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes): number => {
    const part = parts.find((p) => p.type === type);
    return part ? parseInt(part.value, 10) : 0;
  };

  let hour = read("hour");
  // Some ICU builds still report midnight as 24
  if (hour === 24) hour = 0;

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour,
    minute: read("minute"),
  };
}

/** Alias used by the shared time-system contract. */
export const zonedParts = getZonedDateTimeParts;

/** Today's civil date (`YYYY-MM-DD`) in a timezone. */
export function getCivilDateInZone(instant: Date, timeZone: string): string {
  return formatCivilDate(getZonedDateTimeParts(instant, timeZone));
}

/** User-visible instant in a zone: `DD-MM-YYYY HH:mm` (hourCycle h23). */
export function formatInstantDisplay(instant: Date, timeZone: string): string {
  const parts = getZonedDateTimeParts(instant, timeZone);
  const hour = parts.hour.toString().padStart(2, "0");
  const minute = parts.minute.toString().padStart(2, "0");
  return `${formatCivilDateDisplay(parts)} ${hour}:${minute}`;
}

// ----------------------------------------------------------------------------
// Civil clock
// ----------------------------------------------------------------------------

/**
 * Parse a 12-hour time string (e.g. "5:30 AM") to minutes since midnight.
 * Does not interpret the value in a timezone.
 */
export function parseTimeToMinutes(timeStr: string): number | null {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;

  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

/** Storage clock: minutes since midnight → `HH:mm`. */
export function formatClock(totalMinutes: number): string {
  const minutes =
    ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hour = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const minute = (minutes % 60).toString().padStart(2, "0");
  return `${hour}:${minute}`;
}

/**
 * Parse a civil clock. Accepts `HH:mm` and `h:mm AM/PM`.
 * Returns minutes since midnight, or null if invalid.
 */
export function parseClock(value: string): number | null {
  const trimmed = value.trim();
  const twentyFour = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (twentyFour) {
    const hours = parseInt(twentyFour[1], 10);
    const minutes = parseInt(twentyFour[2], 10);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return hours * 60 + minutes;
  }
  return parseTimeToMinutes(trimmed);
}

/** UI clock: minutes since midnight → `h:mm AM`. */
export function formatClockDisplay(totalMinutes: number): string {
  const minutes =
    ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const period = hour24 >= 12 ? "PM" : "AM";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
}

/** Display a stored clock string (`HH:mm`); falls back to the raw value. */
export function formatClockStringDisplay(value: string | null | undefined): string {
  if (!value) return "";
  const minutes = parseClock(value);
  return minutes == null ? value : formatClockDisplay(minutes);
}
