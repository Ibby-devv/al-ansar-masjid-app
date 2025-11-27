/**
 * Centralized cache key definitions
 * All AsyncStorage cache keys should be defined here
 * 
 * This prevents typos, makes it easy to see all cached data,
 * and enables bulk operations like clearing specific cache types.
 */

export const CACHE_KEYS = {
  // Prayer & Mosque Data
  PRAYER_TIMES: '@cached_prayer_times',
  JUMUAH_TIMES: '@cached_jumuah_times',
  MOSQUE_SETTINGS: '@cached_mosque_settings',
  
  // Donations
  DONATION_SETTINGS: '@donation_settings_cache',
  CAMPAIGNS: '@campaigns_cache',
  
  // Events
  EVENTS: '@events_cache',
  EVENT_CATEGORIES: '@event_categories_cache',
  
  // User Preferences (future use)
  USER_PREFERENCES: '@user_preferences',
  NOTIFICATION_SETTINGS: '@notification_settings',
} as const;

/**
 * Get cache key type-safely
 * @param key - The cache key name
 * @returns The cache key string
 */
export function getCacheKey(key: keyof typeof CACHE_KEYS): string {
  return CACHE_KEYS[key];
}

/**
 * Check if a key is a cache key
 * @param key - The key to check
 * @returns True if the key is a cache key
 */
export function isCacheKey(key: string): boolean {
  return Object.values(CACHE_KEYS).includes(key as any);
}
