# Proof of Concept: TanStack Query Integration

This document demonstrates what migrating to TanStack Query would look like for one of our hooks.

## Example: Migrating useCampaigns.ts

### Current Implementation (125 lines)

```typescript
// hooks/useCampaigns.ts - CURRENT
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { db } from '../firebase';

const CAMPAIGNS_CACHE_KEY = '@campaigns_cache';

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      // 1. Load from cache first (instant)
      const cachedData = await AsyncStorage.getItem(CAMPAIGNS_CACHE_KEY);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const deserialized = parsed.map(deserializeCampaign);
        setCampaigns(deserialized);
        setLoading(false);
      }

      // 2. Set up real-time listener
      const unsubscribe = db
        .collection('campaigns')
        .where('status', '==', 'active')
        .where('is_visible_in_app', '==', true)
        .orderBy('created_at', 'desc')
        .onSnapshot(async (querySnapshot) => {
          setLoading(false);
          setError(null);

          const loadedCampaigns: Campaign[] = [];
          querySnapshot.forEach((doc) => {
            loadedCampaigns.push({ id: doc.id, ...doc.data() } as Campaign);
          });

          setCampaigns(loadedCampaigns);
          await AsyncStorage.setItem(CAMPAIGNS_CACHE_KEY, JSON.stringify(serialized));
        });

      return () => unsubscribe();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return { campaigns, loading, error };
}
```

**Pros:**
- Clear, straightforward code
- Direct Firebase integration
- Cache-first with real-time updates
- 125 lines including serialization helpers

**Cons:**
- No DevTools
- Manual state management
- No query invalidation helpers

---

### TanStack Query Implementation (200+ lines)

```typescript
// hooks/useCampaigns.ts - WITH TANSTACK QUERY

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { db } from '../firebase';

const CAMPAIGNS_QUERY_KEY = ['campaigns'] as const;

// 1. Need separate fetch function for initial load
async function fetchCampaigns(): Promise<Campaign[]> {
  const querySnapshot = await db
    .collection('campaigns')
    .where('status', '==', 'active')
    .where('is_visible_in_app', '==', true)
    .orderBy('created_at', 'desc')
    .get();

  const campaigns: Campaign[] = [];
  querySnapshot.forEach((doc) => {
    campaigns.push({ id: doc.id, ...doc.data() } as Campaign);
  });

  return campaigns;
}

// 2. Custom hook with real-time listener
export function useCampaigns() {
  const queryClient = useQueryClient();
  
  // Initial query (uses AsyncStorage persister from provider)
  const { data: campaigns = [], isLoading, error } = useQuery({
    queryKey: CAMPAIGNS_QUERY_KEY,
    queryFn: fetchCampaigns,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  // 3. Separate effect for real-time updates
  useEffect(() => {
    const unsubscribe = db
      .collection('campaigns')
      .where('status', '==', 'active')
      .where('is_visible_in_app', '==', true)
      .orderBy('created_at', 'desc')
      .onSnapshot(
        (querySnapshot) => {
          const loadedCampaigns: Campaign[] = [];
          querySnapshot.forEach((doc) => {
            loadedCampaigns.push({ id: doc.id, ...doc.data() } as Campaign);
          });

          // Manually update query cache
          queryClient.setQueryData(CAMPAIGNS_QUERY_KEY, loadedCampaigns);
        },
        (err) => {
          console.error('Firebase listener error:', err);
        }
      );

    return () => unsubscribe();
  }, [queryClient]);

  return {
    campaigns,
    loading: isLoading,
    error: error ? (error as Error).message : null,
  };
}
```

**PLUS: Need to set up provider in app root:**

```typescript
// app/_layout.tsx - ADDITIONAL SETUP REQUIRED
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

// 1. Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// 2. Create persister
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'REACT_QUERY_OFFLINE_CACHE',
});

// 3. Wrap app
export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      {/* Rest of app */}
    </PersistQueryClientProvider>
  );
}
```

**PLUS: Need to set up focus/online managers:**

```typescript
// utils/queryClientSetup.ts - MORE SETUP REQUIRED
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import { onlineManager, focusManager } from '@tanstack/react-query';

// Online detection
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

// Focus detection
function onAppStateChange(status: string) {
  focusManager.setFocused(status === 'active');
}

const subscription = AppState.addEventListener('change', onAppStateChange);

// Cleanup
export function cleanupQueryClient() {
  subscription.remove();
}
```

**Pros:**
- DevTools available
- Standardized API
- Better TypeScript inference in some cases
- Automatic refetch on focus/reconnect (after setup)

**Cons:**
- **~200+ lines vs 125 lines** for same functionality
- Requires 3 additional packages:
  - `@tanstack/react-query` (~40KB)
  - `@tanstack/react-query-persist-client` (~10KB)
  - `@tanstack/query-async-storage-persister` (~5KB)
  - Total: **~55KB** additional bundle size
- Need to set up providers in app root
- Need to configure focus/online managers
- Still need manual Firebase listener integration
- Two data sources (query + listener) that need to stay in sync
- More complex mental model
- Additional learning curve for team

---

## Side-by-Side Comparison

| Aspect | Current Implementation | TanStack Query |
|--------|----------------------|----------------|
| **Lines of code** | 125 | 200+ (plus setup) |
| **Dependencies** | 0 additional | 3 packages |
| **Bundle size impact** | 0 KB | +55 KB |
| **Setup complexity** | None | Provider + managers |
| **Firebase integration** | Direct | Manual cache updates |
| **Real-time updates** | Built-in | Manual via listener |
| **Cache persistence** | AsyncStorage direct | AsyncStorage via persister |
| **DevTools** | None | Available |
| **Learning curve** | Minimal | Moderate |
| **Maintainability** | Simple, clear | More abstractions |

---

## Installation Cost

### Current: Just use the hook
```typescript
import { useCampaigns } from '@/hooks/useCampaigns';

function MyComponent() {
  const { campaigns, loading, error } = useCampaigns();
  // Use data
}
```

### With TanStack Query: Multiple setup steps
```bash
# 1. Install dependencies
npm install @tanstack/react-query @tanstack/react-query-persist-client @tanstack/query-async-storage-persister

# 2. Set up providers in app root
# 3. Configure focus/online managers
# 4. Set up DevTools (optional)
# 5. Migrate each hook
# 6. Test all flows
```

---

## Real-World Example: Events with Filtering

What if we want to add filtering to events?

### Current Approach
```typescript
// Add to useEvents.ts
export const useEvents = (categoryFilter?: string) => {
  useEffect(() => {
    let query = db.collection('events')
      .where('is_active', '==', true)
      .where('date', '>=', todayTimestamp);
    
    if (categoryFilter) {
      query = query.where('category', '==', categoryFilter);
    }
    
    const unsubscribe = query.onSnapshot(/* ... */);
    return () => unsubscribe();
  }, [categoryFilter]);
};
```

**Simple, straightforward.**

### TanStack Query Approach
```typescript
export const useEvents = (categoryFilter?: string) => {
  const queryClient = useQueryClient();
  
  // Need unique query key per filter combination
  const queryKey = ['events', categoryFilter] as const;
  
  const { data } = useQuery({
    queryKey,
    queryFn: () => fetchEvents(categoryFilter),
  });
  
  // Separate listener per filter!
  useEffect(() => {
    let query = db.collection('events')
      .where('is_active', '==', true)
      .where('date', '>=', todayTimestamp());
    
    if (categoryFilter) {
      query = query.where('category', '==', categoryFilter);
    }
    
    const unsubscribe = query.onSnapshot((snapshot) => {
      queryClient.setQueryData(queryKey, /* ... */);
    });
    
    return () => unsubscribe();
  }, [categoryFilter, queryClient]);
};
```

**More complex, multiple listeners per filter combination.**

---

## Memory and Performance Considerations

### Current Implementation
- 1 listener per hook instance
- State managed by React
- AsyncStorage writes throttled manually

### TanStack Query
- 1 query cache entry per unique query key
- 1 listener per unique query key
- Query cache persisted to AsyncStorage
- Potential cache bloat with dynamic keys
- Additional memory for query cache metadata

**Example Cache Bloat Scenario:**
```typescript
// User searches for campaigns
useCampaigns('search-term-1'); // New cache entry
useCampaigns('search-term-2'); // Another cache entry
useCampaigns('search-term-3'); // Another cache entry
// ... cache grows unbounded until cleanup
```

This is a known issue: https://github.com/TanStack/query/discussions/6788

---

## Conclusion

This POC demonstrates that **TanStack Query adds significant complexity** without providing meaningful benefits for Firebase real-time listener patterns.

### What We'd Gain:
- DevTools (nice to have)
- Standardized API (minimal benefit for 5 hooks)
- Better refetch on focus (requires manual setup anyway)

### What We'd Lose:
- **Simplicity** - 60% more code
- **Bundle size** - +55KB
- **Direct Firebase integration** - now abstracted and manual
- **Flexibility** - forced into query paradigm

### Recommendation:
**Keep current implementation.** It's simpler, smaller, and better suited to Firebase real-time listeners.
