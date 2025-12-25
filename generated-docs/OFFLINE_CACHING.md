# Offline Caching & Data Synchronization

## Overview

The app implements a robust offline-first caching strategy for prayer times, Jumu'ah times, and mosque settings. This ensures users can access critical information even without network connectivity, while providing clear visual feedback about data freshness.

## Architecture

### Cache Strategy: Cache-First with Background Sync

1. **Initial Load**: Data is loaded from AsyncStorage cache immediately
2. **Background Sync**: Firestore real-time listeners fetch fresh data in the background
3. **Seamless Updates**: Fresh data replaces cached data when available
4. **Offline Resilience**: Users see cached data if network is unavailable

### Key Components

#### `useFirebaseData` Hook (`hooks/useFirebaseData.ts`)

**Responsibilities:**
- Hydrates UI from AsyncStorage cache on mount
- Establishes Firestore real-time listeners for live updates
- Manages `loading` and `updating` states
- Persists snapshots back to cache
- Handles offline/online transitions gracefully

**State Management:**

| State | Purpose | When True |
|-------|---------|-----------|
| `loading` | Initial data fetch in progress | No data available yet (first launch or no cache) |
| `updating` | Awaiting server snapshot after showing cached data | Cache shown but waiting for fresh data |
| `error` | Listener error occurred | Network failure or Firestore error |

**Cache Detection Logic:**
- Firestore snapshots include `metadata.fromCache` boolean
- `fromCache = true`: Offline snapshot from local persistence
- `fromCache = false`: Server snapshot with fresh data
- Timeout after 5s if only cache snapshots received (offline mode)

#### HomeScreen (`app/(tabs)/index.tsx`)

**User Experience Elements:**

1. **Loading Screen**: Full-screen loader only when no cached data exists
2. **Skeleton Placeholders**: Gray boxes shown during initial load (no cache)
3. **"Updating…" Chip**: Subtle indicator when fetching fresh data with cache visible
4. **Staleness Banner**: Warning when prayer times are from a previous day

## User Experience Flows

### Scenario 1: First Launch (No Cache)

```
[Full-Screen Loader]
    ↓ (cache hydration fails)
[Skeleton Rows/Cards]
    ↓ (Firestore snapshot arrives)
[Real Data Displayed]
```

**States:**
- `loading = true`, `updating = true`
- `loading = false` after first snapshot
- `updating = false` after server snapshot

---

### Scenario 2: Subsequent Launch (Online, Fresh Data)

```
[Cached Data Instantly]
[+ "Updating…" chip appears]
    ↓ (server snapshot arrives ~100-500ms)
[Fresh Data] + [Chip disappears]
```

**States:**
- `loading = false` (cache available)
- `updating = true` → `false` when server snapshot arrives

---

### Scenario 3: Subsequent Launch (Online, Stale Data)

```
[Cached Data Instantly]
[+ "Updating…" chip]
    ↓ (server snapshot arrives)
[Fresh Data]
[No staleness banner - data is current]
```

**Staleness Check:**
```typescript
const isStale = (() => {
  const today = new Date().toISOString().split('T')[0]; // "2025-11-08"
  const last = prayerTimes?.last_updated; // "2025-11-07"
  return last < today; // true if data is before today
})();
```

---

### Scenario 4: Offline Mode (With Cache)

```
[Cached Data Instantly]
[+ "Updating…" chip appears]
    ↓ (5s timeout - no server snapshot)
[Chip disappears]
[Staleness banner appears] (if data is old)
```

**Banner Text:**
> "Prayer times last updated on 07-11-2025."

**States:**
- `loading = false`
- `updating = true` → `false` after 5s timeout
- `isStale = true` if `last_updated < today`

---

### Scenario 5: Network Reconnection

```
[Offline - Staleness Banner Visible]
    ↓ (network returns)
[Firestore listener receives server snapshot]
[Fresh data updates]
[Staleness banner disappears]
```

**Key Point:** Real-time listeners automatically reconnect. No manual refresh needed.

---

## Prayer Times vs Jumu'ah Times

### Prayer Times
- **Update Frequency**: Daily
- **Staleness Check**: Enabled
- **Rationale**: Prayer times change every day based on sun position

### Jumu'ah Times
- **Update Frequency**: Rarely (weeks/months)
- **Staleness Check**: Disabled
- **Rationale**: Jumu'ah schedule is static unless mosque changes policy

```typescript
// Prayer times - show staleness banner
{!updating && isStale && (
  <View style={styles.staleBanner}>
    <Text>Prayer times last updated on {formatDmy(last_updated)}.</Text>
  </View>
)}

// Jumu'ah times - NO staleness banner
{/* Jumu'ah times don't change daily, so we don't check staleness */}
```

---

## Implementation Details

### Cache Storage

**Keys:**
```typescript
const STORAGE_KEYS = {
  prayerTimes: '@cached_prayer_times',
  jumuahTimes: '@cached_jumuah_times',
  mosqueSettings: '@cached_mosque_settings',
};
```

**Write Strategy:**
- Write-through: Every Firestore snapshot is persisted to AsyncStorage
- Fire-and-forget: Cache writes use `.catch(() => {})` to avoid blocking UI

**Read Strategy:**
- Parallel reads on mount via `Promise.all()`
- Individual parse failures don't block other collections
- Malformed cache is silently discarded with console warning

---

### Timeout Management

**Cache-Only Timeout:**
```typescript
const startCacheOnlyTimeout = () => {
  if (!cacheOnlyTimer) {
    cacheOnlyTimer = setTimeout(() => {
      setUpdating(false);
    }, 5000);
  }
};
```

**Purpose:** Prevent infinite "Updating…" indicator when offline

**Behavior:**
- Starts when cache snapshot received
- Cleared immediately on server snapshot
- After 5s, `updating` becomes `false` → staleness banner appears (if data old)

---

### Error Handling

**Listener Errors:**
```typescript
const handleError = (err: Error, logName: string) => {
  console.error(`Error listening to ${logName}:`, err);
  setError(err.message);
  setLoading(false);
  
  if (didSetFromCache && !hasServerSnapshot) {
    setTimeout(() => setUpdating(false), 5000);
  } else {
    setUpdating(false);
  }
  clearCacheOnlyTimeout();
};
```

**Resilience:**
- Errors don't crash the app
- Cached data remains visible
- `error` state is set but doesn't block UI
- 5s grace period before hiding "Updating…" chip

---

## Code Quality

### DRY Principle
Eliminated duplicate code via shared handlers:

```typescript
const handleSnapshot = (
  data: PrayerTimes | JumuahTimes | MosqueSettings,
  setter: (data: any) => void,
  storageKey: string,
  fromCache: boolean,
  logName: string
) => {
  setter(data);
  AsyncStorage.setItem(storageKey, JSON.stringify(data)).catch(() => {});
  console.log(`${logName} updated from Firebase`);
  
  setLoading(false);
  
  if (!fromCache) {
    hasServerSnapshot = true;
    setUpdating(false);
    clearCacheOnlyTimeout();
  } else if (!didSetFromCache) {
    setUpdating(true);
    startCacheOnlyTimeout();
  } else {
    startCacheOnlyTimeout();
  }
};
```

**Usage:**
```typescript
unsubscribePrayer = db.collection('prayerTimes').doc('current').onSnapshot(
  (docSnapshot) => {
    if (docSnapshot.exists()) {
      handleSnapshot(
        docSnapshot.data() as PrayerTimes,
        setPrayerTimes,
        STORAGE_KEYS.prayerTimes,
        docSnapshot.metadata.fromCache,
        'Prayer times'
      );
    }
  },
  (err) => handleError(err as Error, 'prayer times')
);
```

---

## Testing Scenarios

### Manual Testing Checklist

- [ ] **First launch (no cache)**: See loading screen → skeleton → data
- [ ] **Second launch (online)**: See cached data → subtle chip → fresh data
- [ ] **Airplane mode on startup**: See cached data → "Updating…" for 5s → staleness banner (if old)
- [ ] **Turn off airplane mode**: Banner disappears when network returns
- [ ] **Old cached prayer times**: Staleness banner shows date
- [ ] **Old cached Jumu'ah times**: NO staleness banner
- [ ] **Kill app with airplane mode, restart**: Cached data visible immediately
- [ ] **Network interruption mid-session**: App continues working with cached data

### Expected Behavior

| Test Case | Expected Result |
|-----------|----------------|
| Fresh install | Loading screen → skeleton → data |
| Cached + online | Data instantly → chip briefly → fresh data |
| Cached + offline | Data instantly → chip 5s → banner (if stale) |
| Reconnect | Banner disappears, fresh data loads |
| Old prayer times | "Last updated on DD-MM-YYYY" |
| Old Jumu'ah | No banner |

---

## Future Enhancements

### Potential Improvements

1. **Cache Expiration**
   - Add TTL (time-to-live) to cached data
   - Force refresh if cache is > 7 days old

2. **Manual Refresh**
   - Pull-to-refresh gesture
   - Explicit "Refresh" button in settings

3. **Cache Size Management**
   - Limit cache size
   - Clear old entries automatically

4. **Retry Logic**
   - Exponential backoff for failed listeners
   - Manual retry button in error state

5. **Analytics**
   - Track cache hit rate
   - Monitor offline usage patterns

---

## Related Files

- `hooks/useFirebaseData.ts` - Core caching logic
- `app/(tabs)/index.tsx` - HomeScreen UI and state rendering
- `services/FCMService.ts` - Notification settings caching
- `screens/NotificationSettingsScreen.tsx` - Optimistic toggle with cache
- `components/ui/UpdatingBanner.tsx` - Subtle shimmer indicator

---

## Maintenance Notes

### When to Update

- **Adding new collections**: Follow the same `handleSnapshot`/`handleError` pattern
- **Changing cache keys**: Migrate existing cached data or clear on app update
- **Modifying staleness logic**: Update both calculation and banner text

### Performance Considerations

- AsyncStorage reads are async but fast (~10-50ms)
- Firestore snapshots with cache enabled are near-instant offline
- Multiple listeners are efficient (Firestore multiplexes connections)
- Cache writes are fire-and-forget (non-blocking)

### Known Limitations

- No cache versioning (schema changes require app restart or cache clear)
- Single shared `hasServerSnapshot` flag (first server snapshot across ANY collection clears updating state)
- 5s timeout is hardcoded (consider making configurable)

---

**Last Updated**: November 8, 2025  
**Author**: Development Team  
**Related PRs**: Notification caching, Prayer times optimization
