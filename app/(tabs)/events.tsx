import { Ionicons } from '@expo/vector-icons';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useState } from 'react';
import { Image, ScrollView, SectionList, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PatternOverlay from '../../components/PatternOverlay';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import PillButton from '../../components/ui/PillButton';
import SectionHeader from '../../components/ui/SectionHeader';
import { Theme } from '../../constants/theme';

// Import custom hooks
import { useEventCategories } from '../../hooks/useEventCategories'; // ✅ NEW: Import categories hook
import { useEvents } from '../../hooks/useEvents';
import { useFirebaseData } from '../../hooks/useFirebaseData';

export default function EventsScreen(): React.JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Load events and categories from Firebase
  const { upcomingEvents, loading: eventsLoading } = useEvents();
  const { categories, loading: categoriesLoading } = useEventCategories();  // ✅ NEW: Load categories
  const { mosqueSettings } = useFirebaseData();

  // Helpers for prominent date display and relative badges
  const MOSQUE_TZ = mosqueSettings?.timezone || 'Australia/Sydney';

  const getDateParts = (timestamp: FirebaseFirestoreTypes.Timestamp) => {
    const d = timestamp.toDate();
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: MOSQUE_TZ });
    const month = d.toLocaleDateString('en-US', { month: 'short', timeZone: MOSQUE_TZ });
    const day = parseInt(d.toLocaleDateString('en-US', { day: 'numeric', timeZone: MOSQUE_TZ }), 10);
    return { weekday, month, day };
  };

  const startOfDay = useCallback((d: Date) => {
    // Get the date parts in mosque timezone
    const parts = d.toLocaleString('en-US', {
      timeZone: MOSQUE_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour12: false
    }).split(/[,\s:]+/);
    const [m, day, y] = parts[0].split('/');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(day), 0, 0, 0);
  }, [MOSQUE_TZ]);

  const getRelativeBadge = useCallback((timestamp: FirebaseFirestoreTypes.Timestamp): { label: string; bg: string; text: string } | null => {
    try {
      const eventDate = startOfDay(timestamp.toDate());
      const today = startOfDay(new Date());
      const msInDay = 24 * 60 * 60 * 1000;
      const diffDays = Math.round((eventDate.getTime() - today.getTime()) / msInDay);
      if (diffDays === 0) return { label: 'Today', bg: '#f59e0b', text: '#0b1020' }; // amber
      if (diffDays === 1) return { label: 'Tomorrow', bg: '#22c55e', text: '#062012' }; // green
      return null;
    } catch {
      return null;
    }
  }, [startOfDay]);

  // ✅ NEW: Get category colors dynamically
  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      return { bg: category.color_bg, text: category.color_text };
    }
    // Fallback gray
    return { bg: '#e5e7eb', text: '#374151' };
  };

  // ✅ NEW: Get category label dynamically
  const getCategoryLabel = (categoryId: string): string => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.label || categoryId;
  };

  // Filter events by category
  const filteredEvents = useMemo(() => {
    const list = selectedCategory === 'all'
      ? upcomingEvents
      : upcomingEvents.filter(event => event.category === selectedCategory);
    // Optional: sort by date ascending
    return [...list].sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime());
  }, [selectedCategory, upcomingEvents]);

  // ✅ NEW: Build category filter dynamically from Firestore
  const categoryFilters = [
    { id: 'all', label: 'All' },
    ...categories.map(cat => ({ id: cat.id, label: cat.label }))
  ];

  // Group events by day (section headers) using `event.date` only to avoid drift
  const sections = useMemo(() => {
    const map = new Map<string, { date: Date; timestamp: FirebaseFirestoreTypes.Timestamp; items: any[] }>();
    filteredEvents.forEach((ev: any) => {
      const baseTs = ev.date as FirebaseFirestoreTypes.Timestamp;
      const d = baseTs.toDate();
      // Build a grouping key using the mosque timezone calendar day
      const parts = d.toLocaleString('en-US', {
        timeZone: MOSQUE_TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour12: false
      }).split(/[\,\s:]+/);
      const [m, day, y] = parts[0].split('/');
      const keyDate = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(day, 10), 0, 0, 0);
      const key = `${y}-${m}-${day}`;
      if (!map.has(key)) map.set(key, { date: keyDate, timestamp: baseTs, items: [] });
      map.get(key)!.items.push(ev);
    });
    const arr = Array.from(map.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    return arr;
  }, [filteredEvents, MOSQUE_TZ]);

  // Build data for SectionList (sticky headers)
  const sectionListData = useMemo(() => {
    return sections.map((s) => ({
      title: s.date.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
        timeZone: MOSQUE_TZ,
      }),
      date: s.date,
      relBadge: getRelativeBadge(s.timestamp),
      data: s.items,
    }));
  }, [sections, MOSQUE_TZ, getRelativeBadge]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header with Gradient */}
      <LinearGradient
        colors={[Theme.colors.brand.navy[800], Theme.colors.brand.navy[700], Theme.colors.brand.navy[900]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <PatternOverlay
          style={styles.patternOverlay}
          variant="stars"
          opacity={0.05}
          tileSize={28}
          color="rgba(255,255,255,0.7)"
        />
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {mosqueSettings?.name || 'Al Ansar Masjid Yagoona'}
            </Text>
            <View style={styles.headerSubtitleRow}>
              <Ionicons name="calendar" size={16} color={Theme.colors.text.subtle} style={{ marginRight: 6 }} />
              <Text style={styles.headerSubtitle}>Upcoming Events</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Category Filter */}
      <View style={styles.categoryFilterWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoryFilterContent}
        >
          {categoriesLoading ? (
            <Text style={styles.categoryButtonText}>Loading categories...</Text>
          ) : (
            categoryFilters.map(cat => (
              <PillButton
                key={cat.id}
                label={cat.label}
                selected={selectedCategory === cat.id}
                onPress={() => setSelectedCategory(cat.id)}
              />
            ))
          )}
        </ScrollView>
      </View>

      {/* Events List */}
      <View style={styles.eventsContainer}>
        {eventsLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Loading events...</Text>
          </View>
        ) : (
          <SectionList
            sections={sectionListData as any}
            keyExtractor={(item: any) => item.id}
            contentContainerStyle={styles.eventsScrollContent}
            stickySectionHeadersEnabled
            renderSectionHeader={({ section }: any) => (
              <SectionHeader
                title={section.title}
                rightBadge={section.relBadge}
                containerStyle={styles.sectionHeader}
              />
            )}
            renderItem={({ item, section }: any) => {
              const event = item;
              const categoryColors = getCategoryColor(event.category);
              const parts = getDateParts(event.date);
              const relEvent = getRelativeBadge(event.date);
              const showPerEventBadge = !section.relBadge && relEvent;
              return (
                <Card style={styles.eventCard}>
                  {/* Event Image (if provided) */}
                  {event.image_url && (
                    <Image
                      source={{ uri: event.image_url }}
                      style={styles.eventImage}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.cardRow}>
                    {/* Date badge */}
                    <View style={[styles.dateBadge, relEvent ? styles.dateBadgeHighlight : undefined]}>
                      <Text style={styles.dateWeekday}>{parts.weekday.toUpperCase()}</Text>
                      <Text style={styles.dateDay}>{parts.day}</Text>
                      <Text style={styles.dateMonth}>{parts.month.toUpperCase()}</Text>
                    </View>
                    {/* Content */}
                    <View style={styles.cardContent}>
                      <View style={styles.titleRow}>
                        <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
                        <Badge
                          label={getCategoryLabel(event.category)}
                          bgColor={categoryColors.bg}
                          textColor={categoryColors.text}
                        />
                      </View>
                      {/* Prominent time row */}
                      <View style={styles.timeRow}>
                        <View style={{ flex: 1 }} />
                        <View style={styles.timeBadge}>
                          <Ionicons name="time-outline" size={16} color="#1e3a8a" />
                          <Text style={styles.timeBadgeText}>{event.time}</Text>
                        </View>
                      </View>
                      {showPerEventBadge && (
                        <View style={styles.metaRow}>
                          <Badge label={relEvent.label} bgColor={relEvent.bg} textColor={relEvent.text} />
                        </View>
                      )}
                      {event.location && (
                        <View style={styles.metaItem}>
                          <Ionicons name="location-outline" size={16} color={Theme.colors.text.muted} />
                          <Text style={styles.metaText}>{event.location}</Text>
                        </View>
                      )}
                      {event.speaker && (
                        <View style={styles.metaItem}>
                          <Ionicons name="person-outline" size={16} color={Theme.colors.text.muted} />
                          <Text style={styles.metaText}>Speaker: {event.speaker}</Text>
                        </View>
                      )}
                      {event.rsvp_enabled && (
                        <View style={styles.metaItem}>
                          <Ionicons name="people-outline" size={16} color={Theme.colors.text.muted} />
                          <Text style={styles.metaText}>
                            {event.rsvp_count || 0} / {event.rsvp_limit || 'Unlimited'} RSVPs
                          </Text>
                        </View>
                      )}
                      {event.description ? (
                        <Text style={styles.eventDescription} numberOfLines={3}>
                          {event.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </Card>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color="#9ca3af" />
                <Text style={styles.emptyStateTitle}>No Upcoming Events</Text>
                <Text style={styles.emptyStateText}>
                  {selectedCategory === 'all'
                    ? 'Check back soon for new events!'
                    : `No upcoming ${getCategoryLabel(selectedCategory)} events`}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.surface.muted,
  },
  headerGradient: {
    paddingBottom: Theme.spacing.xl,
    borderBottomLeftRadius: Theme.radius.xl,
    borderBottomRightRadius: Theme.radius.xl,
    ...Theme.shadow.header,
  },
  patternOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  headerContent: {
    alignItems: 'center',
  paddingHorizontal: Theme.spacing.lg,
  paddingTop: Theme.spacing.md,
  paddingBottom: Theme.spacing.sm,
  },
  headerTitle: {
  fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
  },
  headerSubtitle: {
  fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryFilterWrapper: {
    backgroundColor: Theme.colors.surface.card,
    marginHorizontal: Theme.spacing.lg,
    borderRadius: Theme.radius.pill,
    padding: 3,
    marginTop: -12,
    marginBottom: 12,
    ...Theme.shadow.soft,
  },
  categoryFilterContent: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignItems: 'center',
    gap: 6,
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.text.muted,
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  eventsContainer: {
    flex: 1,
    backgroundColor: Theme.colors.surface.muted,
  },
  eventsScrollView: {
    flex: 1,
  },
  eventsScrollContent: {
    padding: 15,
    paddingBottom: 30,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text.strong,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Theme.colors.text.muted,
    textAlign: 'center',
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 6,
  },
  eventCard: {
    marginBottom: 12,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#e5e7eb',
    marginBottom: Theme.spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
  },
  dateBadge: {
    width: 72,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Theme.colors.surface.soft,
    borderWidth: 1,
    borderColor: Theme.colors.border.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dateBadgeHighlight: {
    borderColor: Theme.colors.accent.amber,
    backgroundColor: Theme.colors.accent.amberSoft,
  },
  dateWeekday: {
    fontSize: 11,
    color: Theme.colors.text.muted,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dateDay: {
    fontSize: 28,
    color: Theme.colors.text.base,
    fontWeight: '800',
    lineHeight: 32,
  },
  dateMonth: {
    fontSize: 12,
    color: Theme.colors.text.muted,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  eventCategory: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginLeft: 8,
  },
  eventCategoryText: {
    fontSize: 10,
    fontWeight: '800',
  },
  eventTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: Theme.colors.text.strong,
    marginRight: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.accent.blueSoft,
    borderWidth: 1,
    borderColor: Theme.colors.accent.blue,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeBadgeText: {
    marginLeft: 6,
    fontSize: 17,
    fontWeight: '800',
    color: Theme.colors.brand.navy[700],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaText: {
    fontSize: 13,
    color: Theme.colors.text.muted,
    marginLeft: 6,
  },
  relativeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  relativeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  eventDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    lineHeight: 20,
  },
});
