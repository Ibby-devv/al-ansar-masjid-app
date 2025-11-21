# Investigation: SWR vs TanStack Query for App-Wide Caching

**Date**: 2025-11-21  
**Author**: GitHub Copilot  
**Status**: Investigation Complete

## Executive Summary

After thorough research and analysis of the current caching implementation, I recommend **NOT adopting SWR or TanStack Query** for this project at this time. The current custom implementation is well-suited for the app's needs, and both libraries would add complexity without significant benefits for the Firebase real-time listener patterns used throughout the app.

## Current Implementation Analysis

### Caching Patterns Identified

1. **useDonation.ts** - One-time fetch with AsyncStorage cache
   - Cache-first approach (instant load from cache)
   - Background update from Firestore
   - Manual cache invalidation
   - ~244 lines of code

2. **useFirebaseData.ts** - Real-time listeners with AsyncStorage cache
   - Cache hydration on mount (instant UI)
   - Real-time Firestore listeners (onSnapshot)
   - Separate `loading` and `updating` states
   - Sophisticated cache timeout handling
   - ~250 lines of code

3. **useCampaigns.ts** - Real-time listener with AsyncStorage cache
   - Cache-first approach
   - Real-time listener with onSnapshot
   - Timestamp serialization/deserialization
   - ~125 lines of code

4. **useEvents.ts** - Real-time listener (no caching)
   - Real-time listener only
   - Query with date filtering
   - ~90 lines of code

5. **useEventCategories.ts** - Real-time listener (no caching)
   - Real-time listener with fallback defaults
   - ~134 lines of code

### Total Caching Code
- **~843 lines** of custom caching logic across 5 hooks
- **11 AsyncStorage operations** in hooks
- All hooks use Firebase real-time listeners (onSnapshot)

## Library Comparison

### SWR (Vercel)

**Pros:**
- Lightweight (~4-15KB)
- Simple API, minimal learning curve
- Good TypeScript support
- Stale-while-revalidate pattern

**Cons:**
- Designed for REST APIs, not real-time listeners
- No built-in support for Firebase onSnapshot
- Would require manual cache mutation on Firebase events
- Less suitable for complex real-time data flows
- Limited mutation support
- Basic offline support

**Verdict**: ❌ **Not suitable** - SWR's REST-focused architecture doesn't align with Firebase real-time listeners

### TanStack Query (React Query)

**Pros:**
- Excellent TypeScript support
- Built-in AsyncStorage persister available
- Advanced cache management
- Powerful DevTools
- Better mutation handling
- Works well with React Native/Expo

**Cons:**
- Larger bundle size (~13-50KB)
- Steeper learning curve
- Still requires manual integration with Firebase listeners
- No native support for onSnapshot patterns
- Would need custom query functions for each Firebase listener
- Potential AsyncStorage bloat with dynamic query keys

**Verdict**: ⚠️ **Viable but overkill** - Could work but adds complexity without major benefits for real-time listener patterns

## Detailed Analysis

### Firebase Real-Time Listener Challenge

Both SWR and TanStack Query are designed around the **fetch-on-demand** paradigm:
1. Call API endpoint
2. Cache response
3. Revalidate on interval/focus

This project uses **Firebase real-time listeners** (onSnapshot):
1. Subscribe to Firestore document/collection
2. Receive updates in real-time
3. Update UI automatically

**Key Incompatibility:**
- Both libraries expect you to **trigger** data fetches
- Firebase listeners are **push-based** - data comes automatically
- Integration requires "faking" queries and manually updating cache when Firebase events fire

### What Would Be Required for Migration

#### For TanStack Query:
```typescript
// Current pattern (simple)
const unsubscribe = db.collection('events').onSnapshot((snapshot) => {
  setEvents(snapshot.docs.map(doc => doc.data()));
});

// TanStack Query pattern (complex)
const { data } = useQuery({
  queryKey: ['events'],
  queryFn: async () => {
    // Can't use onSnapshot in queryFn - need one-time fetch
    const snapshot = await db.collection('events').get();
    return snapshot.docs.map(doc => doc.data());
  },
  // Then SEPARATELY set up real-time listener
});

useEffect(() => {
  const unsubscribe = db.collection('events').onSnapshot((snapshot) => {
    queryClient.setQueryData(['events'], 
      snapshot.docs.map(doc => doc.data())
    );
  });
  return () => unsubscribe();
}, []);
```

This is **more complex** than the current implementation and provides **no real benefit**.

#### For SWR:
```typescript
// Would need similar pattern with useSWRMutation or manual mutate calls
const { data, mutate } = useSWR('events', fetcher);

useEffect(() => {
  const unsubscribe = db.collection('events').onSnapshot((snapshot) => {
    mutate(snapshot.docs.map(doc => doc.data()), { revalidate: false });
  });
  return () => unsubscribe();
}, []);
```

Again, **more complex** with no clear advantage.

### Benefits of Current Implementation

1. **Tailored to Firebase** - Direct onSnapshot integration
2. **Lightweight** - No additional bundle weight
3. **Already working** - Stable, tested, production-ready
4. **Type-safe** - Full TypeScript support with strict mode
5. **Sophisticated patterns** - Cache-first with background updates
6. **Offline-first** - AsyncStorage persistence already implemented
7. **Flexible** - Each hook optimized for its specific use case

### What Would Be Gained

#### With TanStack Query:
- DevTools for debugging queries ✅
- Automatic refetch on window focus ⚠️ (requires manual setup for React Native)
- Standardized query invalidation ⚠️ (already handled well)
- Optimistic updates ⚠️ (not currently needed)
- Better mutation handling ⚠️ (minimal mutations in this app)

#### With SWR:
- Simplified API for simple fetches ❌ (but we use real-time listeners)
- Automatic revalidation ❌ (not applicable to real-time data)
- Focus/network detection ⚠️ (requires manual setup)

### What Would Be Lost

1. **Simplicity** - Current code is straightforward and clear
2. **Direct listener control** - No abstraction layer
3. **Optimized patterns** - Each hook tailored to its needs
4. **Bundle size** - Avoid 13-50KB additional package
5. **Maintenance burden** - No need to learn/maintain library
6. **Flexibility** - Current implementation can be easily customized

## Cost-Benefit Analysis

### Migration Effort
- Rewrite 5 hooks with Firebase listener integration
- Test all data flows and offline scenarios
- Update error handling patterns
- Configure AsyncStorage persister (TanStack Query)
- Set up focus/online managers for React Native
- Debug cache invalidation issues
- Estimated: **3-5 days** of development

### Ongoing Maintenance
- Keep library updated
- Monitor bundle size
- Debug library-specific issues
- Maintain abstraction layer over Firebase

### Value Delivered
- Minimal - Current implementation works well
- DevTools would be nice-to-have but not essential
- No performance improvement expected
- No new features enabled

## Recommendations

### Primary Recommendation: ❌ Do NOT Migrate

**Reasons:**
1. Current implementation is well-designed and working
2. Firebase real-time listeners are fundamentally incompatible with SWR/TanStack Query's design
3. Migration would add complexity without meaningful benefits
4. Bundle size would increase by 13-50KB
5. No performance or feature improvements expected
6. Development time better spent on features

### Alternative: ✅ Enhance Current Implementation

Instead of migrating, consider these improvements:

#### 1. Add Cache Utilities
Create shared utilities for common patterns:

```typescript
// utils/cache.ts
export async function getCachedData<T>(key: string): Promise<T | null> {
  const cached = await AsyncStorage.getItem(key);
  return cached ? JSON.parse(cached) : null;
}

export async function setCachedData<T>(key: string, data: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}
```

#### 2. Standardize Cache Keys
```typescript
// constants/cacheKeys.ts
export const CACHE_KEYS = {
  PRAYER_TIMES: '@cached_prayer_times',
  JUMUAH_TIMES: '@cached_jumuah_times',
  MOSQUE_SETTINGS: '@cached_mosque_settings',
  DONATION_SETTINGS: '@donation_settings_cache',
  CAMPAIGNS: '@campaigns_cache',
} as const;
```

#### 3. Add Debug Logging
```typescript
// utils/cacheDebug.ts
const DEBUG = __DEV__;

export function logCacheHit(key: string): void {
  if (DEBUG) console.log(`✅ Cache hit: ${key}`);
}

export function logCacheMiss(key: string): void {
  if (DEBUG) console.log(`❌ Cache miss: ${key}`);
}

export function logCacheUpdate(key: string): void {
  if (DEBUG) console.log(`♻️ Cache updated: ${key}`);
}
```

#### 4. Add Events/EventCategories Caching
Currently, `useEvents.ts` and `useEventCategories.ts` don't use AsyncStorage caching. Add it for consistency:

```typescript
// Similar pattern to useCampaigns.ts
const EVENTS_CACHE_KEY = '@events_cache';
const EVENT_CATEGORIES_CACHE_KEY = '@event_categories_cache';
```

#### 5. Consider Cache Expiration
Add timestamp-based cache expiration:

```typescript
interface CachedData<T> {
  data: T;
  timestamp: number;
}

export async function getCachedDataWithExpiry<T>(
  key: string, 
  maxAge: number = 1000 * 60 * 60 // 1 hour default
): Promise<T | null> {
  const cached = await AsyncStorage.getItem(key);
  if (!cached) return null;
  
  const { data, timestamp }: CachedData<T> = JSON.parse(cached);
  const age = Date.now() - timestamp;
  
  if (age > maxAge) {
    await AsyncStorage.removeItem(key);
    return null;
  }
  
  return data;
}
```

### When to Reconsider

Reconsider SWR or TanStack Query if:
1. **Architecture changes** - Moving away from Firebase real-time listeners to REST APIs
2. **Complex mutations needed** - Optimistic updates, rollbacks, etc.
3. **Large team** - Standardization becomes more valuable
4. **Multiple data sources** - Mixing Firebase with REST APIs extensively

## Conclusion

The current caching implementation is **well-architected**, **production-ready**, and **optimized for Firebase real-time listeners**. Neither SWR nor TanStack Query would provide meaningful benefits for this use case, and both would add unnecessary complexity and bundle size.

**Recommendation**: Keep the current implementation and enhance it with the suggested improvements above.

## References

- [TanStack Query React Native Docs](https://tanstack.com/query/latest/docs/framework/react/react-native)
- [SWR vs TanStack Query Comparison 2025](https://dev.to/rigalpatel001/react-query-or-swr-which-is-best-in-2025-2oa3)
- [React Query vs SWR Performance Comparison](https://markaicode.com/react-query-vs-swr-2025-performance-comparison/)
- [TanStack Query AsyncStorage Persister](https://tanstack.com/query/v4/docs/framework/react/plugins/createAsyncStoragePersister)

---

**Status**: Investigation complete - No action recommended
