# Recommended Enhancements to Current Caching Implementation

**Status**: Actionable Recommendations  
**Date**: 2025-11-21

Based on the investigation into SWR and TanStack Query, the recommendation is to **keep the current implementation** and enhance it with the following improvements.

## Overview

The current caching implementation is well-designed and production-ready. These enhancements will:
- Standardize caching patterns across hooks
- Add missing caching to hooks that don't have it
- Improve debugging capabilities
- Add cache expiration support
- Reduce code duplication

## Enhancement 1: Shared Cache Utilities

**Goal**: Reduce duplication and standardize cache operations

**Implementation**: Create `utils/cache.ts`

```typescript
// utils/cache.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheOptions {
  /** Maximum age of cached data in milliseconds */
  maxAge?: number;
  /** Whether to log cache operations in development */
  debug?: boolean;
}

export interface CachedData<T> {
  data: T;
  timestamp: number;
  version?: string;
}

/**
 * Get data from AsyncStorage cache
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

    const parsed: CachedData<T> = JSON.parse(cached);
    
    // Check expiration if maxAge is set
    if (options.maxAge) {
      const age = Date.now() - parsed.timestamp;
      if (age > options.maxAge) {
        if (options.debug && __DEV__) {
          console.log(`⏰ Cache expired: ${key} (age: ${Math.round(age / 1000)}s)`);
        }
        await AsyncStorage.removeItem(key);
        return null;
      }
    }

    if (options.debug && __DEV__) {
      console.log(`✅ Cache hit: ${key}`);
    }

    return parsed.data;
  } catch (error) {
    console.error(`Error reading cache for ${key}:`, error);
    return null;
  }
}

/**
 * Set data in AsyncStorage cache
 */
export async function setCachedData<T>(
  key: string,
  data: T,
  options: CacheOptions = {}
): Promise<void> {
  try {
    const cacheEntry: CachedData<T> = {
      data,
      timestamp: Date.now(),
    };

    await AsyncStorage.setItem(key, JSON.stringify(cacheEntry));

    if (options.debug && __DEV__) {
      console.log(`♻️ Cache updated: ${key}`);
    }
  } catch (error) {
    console.error(`Error writing cache for ${key}:`, error);
  }
}

/**
 * Remove data from cache
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
```

**Impact**: 
- Reduces ~30-40 lines of duplicate cache code per hook
- Adds timestamp tracking for all cached data
- Enables cache expiration across the app
- Improves debugging with consistent logging

---

## Enhancement 2: Standardized Cache Keys

**Goal**: Centralize cache key management

**Implementation**: Create `constants/cacheKeys.ts`

```typescript
// constants/cacheKeys.ts

/**
 * Centralized cache key definitions
 * All AsyncStorage cache keys should be defined here
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
  
  // User Preferences (future)
  USER_PREFERENCES: '@user_preferences',
  NOTIFICATION_SETTINGS: '@notification_settings',
} as const;

/**
 * Get cache key type-safely
 */
export function getCacheKey(key: keyof typeof CACHE_KEYS): string {
  return CACHE_KEYS[key];
}

/**
 * Check if a key is a cache key
 */
export function isCacheKey(key: string): boolean {
  return Object.values(CACHE_KEYS).includes(key as any);
}
```

**Impact**:
- Prevents typos in cache keys
- Makes it easy to see all cached data
- Enables bulk operations (e.g., clear all event caches)
- Improves maintainability

---

## Enhancement 3: Add Caching to useEvents

**Goal**: Improve offline experience for events

**Current**: `useEvents.ts` has no caching - shows nothing when offline

**Implementation**: Add AsyncStorage cache like `useCampaigns.ts`

```typescript
// hooks/useEvents.ts - ENHANCED

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import { db } from '../firebase';
import { Event } from '../types';
import { CACHE_KEYS } from '../constants/cacheKeys';

// Helper to convert Timestamp to serializable format for caching
const serializeEvent = (event: Event): any => {
  return {
    ...event,
    date: { seconds: event.date.seconds, nanoseconds: event.date.nanoseconds },
    created_at: event.created_at ? { seconds: event.created_at.seconds, nanoseconds: event.created_at.nanoseconds } : undefined,
    updated_at: event.updated_at ? { seconds: event.updated_at.seconds, nanoseconds: event.updated_at.nanoseconds } : undefined,
  };
};

// Helper to deserialize cached data back to Timestamp objects
const deserializeEvent = (data: any): Event => {
  return {
    ...data,
    date: new firestore.Timestamp(data.date.seconds, data.date.nanoseconds),
    created_at: data.created_at ? new firestore.Timestamp(data.created_at.seconds, data.created_at.nanoseconds) : undefined,
    updated_at: data.updated_at ? new firestore.Timestamp(data.updated_at.seconds, data.updated_at.nanoseconds) : undefined,
  };
};

export const useEvents = (): UseEventsReturn => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      // 1. Load from cache first (instant)
      const cachedData = await AsyncStorage.getItem(CACHE_KEYS.EVENTS);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        // Deserialize Timestamps from cache
        const deserialized = parsed.map(deserializeEvent);
        setEvents(deserialized);
        setLoading(false);
        console.log('✅ Events loaded from cache:', deserialized.length);
      }

      // 2. Set up real-time listener
      const todayTimestamp = getTodayStartTimestamp();
      
      const unsubscribe = db
        .collection('events')
        .where('is_active', '==', true)
        .where('date', '>=', todayTimestamp)
        .orderBy('date', 'asc')
        .orderBy('time', 'asc')
        .onSnapshot(
          async (querySnapshot) => {
            const loadedEvents: Event[] = [];
            querySnapshot.forEach((doc) => {
              loadedEvents.push({ id: doc.id, ...doc.data() } as Event);
            });
            
            setEvents(loadedEvents);
            setLoading(false);
            
            // Update cache - serialize Timestamps before storing
            const serialized = loadedEvents.map(serializeEvent);
            await AsyncStorage.setItem(
              CACHE_KEYS.EVENTS,
              JSON.stringify(serialized)
            );
            
            console.log('📅 Events updated:', loadedEvents.length);
          },
          (err) => {
            console.error('Error listening to events:', err);
            setError(err.message);
            setLoading(false);
          }
        );

      return () => unsubscribe();
    } catch (err: any) {
      console.error('Error loading events:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const upcomingEvents = events;
  const pastEvents: Event[] = [];

  return {
    events,
    loading,
    error,
    upcomingEvents,
    pastEvents,
  };
};

function getTodayStartTimestamp(): firestore.Timestamp {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return firestore.Timestamp.fromDate(startOfToday);
}
```

**Impact**:
- Events visible when offline
- Faster initial load
- Consistent with other hooks (matches `useCampaigns.ts` pattern)
- Proper Timestamp serialization/deserialization for cache compatibility

---

## Enhancement 4: Add Caching to useEventCategories

**Goal**: Improve offline experience for event categories

**Current**: `useEventCategories.ts` has fallback defaults but no caching

**Implementation**: Add AsyncStorage cache

```typescript
// hooks/useEventCategories.ts - ENHANCED

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { EventCategory, EventCategoriesConfig } from '../types';
import { CACHE_KEYS } from '../constants/cacheKeys';

export const useEventCategories = (): UseEventCategoriesReturn => {
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      // 1. Load from cache first
      const cachedData = await AsyncStorage.getItem(CACHE_KEYS.EVENT_CATEGORIES);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        setCategories(parsed);
        setLoading(false);
        console.log('✅ Event categories loaded from cache:', parsed.length);
      }

      // 2. Set up real-time listener
      const unsubscribe = db
        .collection('eventCategories')
        .doc('default')
        .onSnapshot(
          async (docSnapshot) => {
            if (docSnapshot.exists()) {
              const data = docSnapshot.data() as EventCategoriesConfig;
              
              if (data.categories) {
                const activeCategories = data.categories
                  .filter((cat: EventCategory) => cat.is_active)
                  .sort((a: EventCategory, b: EventCategory) => a.order - b.order);
                
                setCategories(activeCategories);
                
                // Update cache
                await AsyncStorage.setItem(
                  CACHE_KEYS.EVENT_CATEGORIES,
                  JSON.stringify(activeCategories)
                );
                
                console.log('🏷️ Event categories updated:', activeCategories.length);
              } else {
                setCategories(getDefaultCategories());
              }
            } else {
              console.warn('⚠️ No event categories found, using defaults');
              setCategories(getDefaultCategories());
            }
            
            setLoading(false);
          },
          (err) => {
            console.error('Error listening to event categories:', err);
            setError(err.message);
            setCategories(getDefaultCategories());
            setLoading(false);
          }
        );

      return () => unsubscribe();
    } catch (err: any) {
      console.error('Error loading event categories:', err);
      setError(err.message);
      setCategories(getDefaultCategories());
      setLoading(false);
    }
  };

  return {
    categories,
    loading,
    error,
  };
};

// ... rest of file unchanged
```

**Impact**:
- Categories cached for offline use
- Faster load times
- Consistent pattern across all hooks

---

## Enhancement 5: Cache Cleanup on App Start

**Goal**: Prevent AsyncStorage bloat

**Implementation**: Add cache management in `app/_layout.tsx`

```typescript
// app/_layout.tsx - Add cache cleanup

import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootLayout() {
  useEffect(() => {
    // Clean up old cache entries on app start
    cleanupOldCaches();
  }, []);

  return (
    // ... existing layout
  );
}

async function cleanupOldCaches(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const now = Date.now();
    const maxAge = 1000 * 60 * 60 * 24 * 7; // 7 days
    
    for (const key of keys) {
      if (key.startsWith('@cached_') || key.startsWith('@')) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.timestamp && (now - parsed.timestamp) > maxAge) {
              await AsyncStorage.removeItem(key);
              console.log(`🧹 Cleaned old cache: ${key}`);
            }
          } catch {
            // If parsing fails, it's old format - skip
          }
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning caches:', error);
  }
}
```

**Impact**:
- Prevents AsyncStorage from growing unbounded
- Removes stale data automatically
- Improves app performance over time

---

## Implementation Priority

### High Priority (Do First)
1. ✅ **Cache Keys Constant** - Easy, high impact, no risk
2. ✅ **Add Caching to useEvents** - Improves offline experience
3. ✅ **Add Caching to useEventCategories** - Completes offline support

### Medium Priority (Do Second)
4. ⚠️ **Shared Cache Utilities** - Moderate refactor, reduces duplication
5. ⚠️ **Cache Cleanup** - Prevents long-term issues

### Low Priority (Nice to Have)
6. 📊 **Cache DevTools** - Debug utilities for development
7. 📈 **Cache Metrics** - Track hit/miss rates

---

## Testing Checklist

After implementing enhancements:

- [ ] Test offline mode with airplane mode enabled
- [ ] Verify cached data loads instantly on app restart
- [ ] Test cache expiration (if implemented)
- [ ] Verify real-time updates still work
- [ ] Check AsyncStorage size doesn't grow unbounded
- [ ] Test pull-to-refresh still works
- [ ] Verify no TypeScript errors
- [ ] Run `npm run lint` - should pass

---

## Benefits Summary

### Code Quality
- **Reduced duplication**: -100+ lines across hooks
- **Standardized patterns**: All hooks follow same approach
- **Better debugging**: Consistent logging

### User Experience
- **Faster load times**: Cache-first approach for all data
- **Better offline experience**: All data available offline
- **Reduced data usage**: Less Firestore reads

### Maintainability
- **Centralized cache management**: Easy to find and update
- **Type-safe cache keys**: Prevents typos
- **Easier to add features**: Utilities ready to use

---

## No Migration Needed

Unlike migrating to SWR or TanStack Query, these enhancements:
- ✅ **Build on existing patterns** - no architectural changes
- ✅ **Can be done incrementally** - one hook at a time
- ✅ **Low risk** - no library dependencies
- ✅ **Backward compatible** - existing code keeps working
- ✅ **Small changes** - ~50-100 lines per hook

---

## Conclusion

These enhancements provide **similar benefits to SWR/TanStack Query** (standardization, better caching, debugging) **without the costs** (bundle size, complexity, learning curve, migration effort).

**Recommendation**: Implement high-priority items first, then evaluate medium-priority items based on team capacity.
