/**
 * AsyncStorage Cache Utilities
 * 
 * Provides standardized caching operations for the app.
 * Matches the current app pattern of storing JSON directly without metadata wrapper.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheOptions {
  /** Whether to log cache operations in development */
  debug?: boolean;
}

/**
 * Get data from AsyncStorage cache (matches current app pattern)
 * 
 * @param key - Cache key to retrieve
 * @param options - Cache options (debug logging)
 * @returns Parsed data or null if not found
 */
export async function getCachedData<T>(
  key: string,
  options: CacheOptions = {}
): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) {
      if (options.debug && __DEV__) {
        console.log(`❌ Cache miss: ${key}`);
      }
      return null;
    }

    const parsed: T = JSON.parse(cached);

    if (options.debug && __DEV__) {
      console.log(`✅ Cache hit: ${key}`);
    }

    return parsed;
  } catch (error) {
    console.error(`Error reading cache for ${key}:`, error);
    return null;
  }
}

/**
 * Set data in AsyncStorage cache (matches current app pattern)
 * 
 * @param key - Cache key to set
 * @param data - Data to cache (will be JSON stringified)
 * @param options - Cache options (debug logging)
 */
export async function setCachedData<T>(
  key: string,
  data: T,
  options: CacheOptions = {}
): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));

    if (options.debug && __DEV__) {
      console.log(`♻️ Cache updated: ${key}`);
    }
  } catch (error) {
    console.error(`Error writing cache for ${key}:`, error);
  }
}

/**
 * Remove data from cache
 * 
 * @param key - Cache key to remove
 */
export async function removeCachedData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
    if (__DEV__) {
      console.log(`🗑️ Cache cleared: ${key}`);
    }
  } catch (error) {
    console.error(`Error clearing cache for ${key}:`, error);
  }
}

/**
 * Clear all cached data (useful for logout/reset)
 * Removes all keys starting with '@cached_' or '@'
 */
export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith('@cached_') || key.startsWith('@'));
    await AsyncStorage.multiRemove(cacheKeys);
    if (__DEV__) {
      console.log(`🧹 Cleared ${cacheKeys.length} cache entries`);
    }
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
}
