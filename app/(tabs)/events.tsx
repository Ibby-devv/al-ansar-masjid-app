import { Ionicons } from '@expo/vector-icons';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useState } from 'react';
import { Image, ScrollView, SectionList, StatusBar, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PatternOverlay from '../../components/PatternOverlay';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import PillButton from '../../components/ui/PillButton';
import SectionHeader from '../../components/ui/SectionHeader';
import { AppTheme, useTheme } from '../../contexts/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';

// Import custom hooks
import { useEventCategories } from '../../hooks/useEventCategories';
import { useEvents } from '../../hooks/useEvents';
import { useFirebaseData } from '../../hooks/useFirebaseData';

export default function EventsScreen(): React.JSX.Element {
  const theme = useTheme();
  const { ms } = useResponsive(); // Get responsive scaling function
  const { fontScale } = useWindowDimensions(); // Get accessibility font scaling
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Memoize styles based on theme and responsive scale
  const styles = useMemo(() => createStyles(theme, ms, fontScale), [theme, ms, fontScale]);
  
  // Load events and categories from Firebase
  const { upcomingEvents, loading: eventsLoading } = useEvents();
  const { categories, loading: categoriesLoading } = useEventCategories();
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
        colors={theme.gradients.header}
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
              <Ionicons name="calendar" size={16} color={theme.colors.text.header} style={{ marginRight: 6 }} />
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
                          <Ionicons name="time-outline" size={16} color={theme.colors.accent.blue} />
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
                          <Ionicons name="location-outline" size={16} color={theme.colors.text.muted} />
                          <Text style={styles.metaText}>{event.location}</Text>
                        </View>
                      )}
                      {event.speaker && (
                        <View style={styles.metaItem}>
                          <Ionicons name="person-outline" size={16} color={theme.colors.text.muted} />
                          <Text style={styles.metaText}>Speaker: {event.speaker}</Text>
                        </View>
                      )}
                      {event.rsvp_enabled && (
                        <View style={styles.metaItem}>
                          <Ionicons name="people-outline" size={16} color={theme.colors.text.muted} />
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
                <Ionicons name="calendar-outline" size={64} color={theme.colors.accent.blue} />
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

const createStyles = (theme: AppTheme, ms: (size: number, factor?: number) => number, fontScale: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.muted,
  },
  headerGradient: {
    paddingBottom: theme.spacing.xl,
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
    ...theme.shadow.header,
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: ms(26, 0.3) * fontScale,
    fontWeight: 'bold',
    color: theme.colors.text.header,
    marginBottom: ms(6, 0.1),
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: ms(16, 0.2) * fontScale,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryFilterWrapper: {
    backgroundColor: theme.colors.surface.card,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
    padding: ms(3, 0.1),
    marginTop: ms(-12, 0.1),
    marginBottom: ms(12, 0.1),
    ...theme.shadow.soft,
  },
  categoryFilterContent: {
    paddingHorizontal: ms(8, 0.1),
    paddingVertical: ms(2, 0.05),
    alignItems: 'center',
    gap: ms(6, 0.1),
  },
  categoryButtonText: {
    fontSize: ms(13, 0.1) * fontScale,
    fontWeight: '600',
    color: theme.colors.text.muted,
  },
  categoryButtonTextActive: {
    color: theme.colors.text.header,
  },
  eventsContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface.muted,
  },
  eventsScrollView: {
    flex: 1,
  },
  eventsScrollContent: {
    padding: ms(15, 0.1),
    paddingBottom: ms(30, 0.1),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(60, 0.1),
    paddingHorizontal: ms(20, 0.1),
  },
  emptyStateTitle: {
    fontSize: ms(18, 0.2) * fontScale,
    fontWeight: 'bold',
    color: theme.colors.text.strong,
    marginTop: ms(16, 0.1),
    marginBottom: ms(8, 0.1),
  },
  emptyStateText: {
    fontSize: ms(14, 0.2) * fontScale,
    color: theme.colors.text.muted,
    textAlign: 'center',
  },
  sectionHeader: {
    marginTop: ms(8, 0.1),
    marginBottom: ms(6, 0.1),
  },
  eventCard: {
    marginBottom: ms(12, 0.1),
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: ms(180, 0.2),
    backgroundColor: theme.colors.border.base,
    marginBottom: theme.spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
  },
  dateBadge: {
    width: ms(72, 0.1),
    paddingVertical: ms(8, 0.1),
    borderRadius: ms(12, 0.1),
    backgroundColor: theme.colors.surface.soft,
    borderWidth: ms(1, 0.05),
    borderColor: theme.colors.border.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(12, 0.1),
  },
  dateBadgeHighlight: {
    borderColor: theme.colors.accent.amber,
    backgroundColor: theme.colors.accent.amberSoft,
  },
  dateWeekday: {
    fontSize: ms(11, 0.1) * fontScale,
    color: theme.colors.text.muted,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dateDay: {
    fontSize: ms(28, 0.3) * fontScale,
    color: theme.colors.text.base,
    fontWeight: '800',
    lineHeight: ms(32, 0.1),
  },
  dateMonth: {
    fontSize: ms(12, 0.1) * fontScale,
    color: theme.colors.text.muted,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: ms(6, 0.1),
  },
  eventCategory: {
    paddingVertical: ms(4, 0.1),
    paddingHorizontal: ms(10, 0.1),
    borderRadius: ms(12, 0.1),
    marginLeft: ms(8, 0.1),
  },
  eventCategoryText: {
    fontSize: ms(10, 0.1) * fontScale,
    fontWeight: '800',
  },
  eventTitle: {
    flex: 1,
    fontSize: ms(17, 0.2) * fontScale,
    fontWeight: '800',
    color: theme.colors.text.strong,
    marginRight: ms(8, 0.1),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(6, 0.1),
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: ms(6, 0.1),
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent.blueSoft,
    borderWidth: ms(1, 0.05),
    borderColor: theme.colors.accent.blue,
    paddingHorizontal: ms(10, 0.1),
    paddingVertical: ms(6, 0.1),
    borderRadius: ms(12, 0.1),
  },
  timeBadgeText: {
    marginLeft: ms(6, 0.1),
    fontSize: ms(16, 0.2) * fontScale,
    fontWeight: '800',
    color: theme.colors.accent.blue,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(6, 0.1),
  },
  metaText: {
    fontSize: ms(13, 0.1) * fontScale,
    color: theme.colors.text.muted,
    marginLeft: ms(6, 0.1),
  },
  relativeBadge: {
    paddingVertical: ms(4, 0.1),
    paddingHorizontal: ms(10, 0.1),
    borderRadius: 999,
  },
  relativeBadgeText: {
    fontSize: ms(12, 0.1) * fontScale,
    fontWeight: '800',
  },
  eventDescription: {
    fontSize: ms(14, 0.2) * fontScale,
    color: theme.colors.text.muted,
    marginTop: ms(4, 0.1),
    lineHeight: ms(20, 0.1),
  },
});
