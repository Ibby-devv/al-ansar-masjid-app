/**
 * Notification Data Helpers
 * 
 * Utilities for processing notification data payloads from FCM.
 * Handles deserialization of timestamp data sent from backend Cloud Functions.
 */

import firestore from '@react-native-firebase/firestore';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

/**
 * Parse a timestamp value from notification data payload.
 * FCM data payloads must have string values, so timestamps come in various formats:
 * - JSON string of {seconds, nanoseconds} object
 * - ISO 8601 date string
 * - Unix timestamp as string (milliseconds or seconds)
 * 
 * @param value - The string value from notification data
 * @returns Firestore Timestamp object or null if parsing fails
 */
export function parseTimestampFromNotificationData(value: string | undefined): FirebaseFirestoreTypes.Timestamp | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  try {
    // Try parsing as JSON object with seconds/nanoseconds
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed.seconds === 'number') {
      const seconds = parsed.seconds;
      const nanoseconds = typeof parsed.nanoseconds === 'number' ? parsed.nanoseconds : 0;
      return new firestore.Timestamp(seconds, nanoseconds);
    }
  } catch {
    // Not JSON, try other formats
  }

  try {
    // Try parsing as ISO 8601 date string
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return firestore.Timestamp.fromDate(date);
    }
  } catch {
    // Not a valid date string
  }

  try {
    // Try parsing as unix timestamp (seconds or milliseconds)
    const num = parseFloat(value);
    if (!isNaN(num) && isFinite(num)) {
      // Heuristic: if number is small, it's likely seconds, otherwise milliseconds
      const timestamp = num < 10000000000 ? num : num / 1000;
      return firestore.Timestamp.fromMillis(timestamp * 1000);
    }
  } catch {
    // Not a valid number
  }

  console.warn('Could not parse timestamp from notification data:', value);
  return null;
}

/**
 * Process notification data payload and deserialize any timestamp fields.
 * This ensures timestamp data sent from backend is properly converted to Timestamp objects.
 * 
 * @param data - Raw notification data from FCM
 * @returns Processed data with timestamps deserialized
 */
export function processNotificationData(data: Record<string, any> | undefined): Record<string, any> {
  if (!data) {
    return {};
  }

  const processed: Record<string, any> = { ...data };

  // Known timestamp fields that might be in notification data
  const timestampFields = [
    'date', 'eventDate', 'startDate', 'endDate', 'start_date', 'end_date',
    'createdAt', 'updatedAt', 'created_at', 'updated_at', 'scheduledAt', 'scheduled_at'
  ];

  // Attempt to deserialize any timestamp fields
  for (const field of timestampFields) {
    if (field in processed && typeof processed[field] === 'string') {
      const timestamp = parseTimestampFromNotificationData(processed[field]);
      if (timestamp) {
        processed[field] = timestamp;
      }
    }
  }

  return processed;
}

/**
 * Format a timestamp for display in notification.
 * Safely handles various timestamp formats.
 * 
 * @param value - Timestamp value (Timestamp object, string, or undefined)
 * @param format - 'date' | 'time' | 'datetime'
 * @returns Formatted string
 */
export function formatTimestampForNotification(
  value: FirebaseFirestoreTypes.Timestamp | string | undefined,
  format: 'date' | 'time' | 'datetime' = 'datetime'
): string {
  let timestamp: FirebaseFirestoreTypes.Timestamp | null = null;

  if (!value) {
    return '';
  }

  // If it's already a Timestamp object
  if (value && typeof value === 'object' && 'seconds' in value && 'toDate' in value) {
    timestamp = value as FirebaseFirestoreTypes.Timestamp;
  } else if (typeof value === 'string') {
    timestamp = parseTimestampFromNotificationData(value);
  }

  if (!timestamp) {
    return String(value);
  }

  const date = timestamp.toDate();

  switch (format) {
    case 'date':
      return date.toLocaleDateString();
    case 'time':
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case 'datetime':
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    default:
      return date.toLocaleString();
  }
}
