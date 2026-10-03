import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  SectionList,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EventDetailsModal from "../../components/EventDetailsModal";
import PatternOverlay from "../../components/PatternOverlay";
import { Chip, Panel } from "../../components/ui/calm";
import { AppTheme, useTheme } from "../../contexts/ThemeContext";
import { useEventCategories } from "../../hooks/useEventCategories";
import { useCivilToday } from "../../hooks/useCivilToday";
import { useEvents } from "../../hooks/useEvents";
import { useFirebaseData } from "../../hooks/useFirebaseData";
import { useResponsive } from "../../hooks/useResponsive";
import type { Event } from "../../types";
import {
  DEFAULT_MOSQUE_TZ,
  addCivilDays,
  compareCivilDates,
  formatCivilDateHeading,
  formatClockStringDisplay,
  monthShort,
  parseCivilDate,
  parseClock,
  weekdayShort,
} from "../../utils/civilTime";

export default function EventsScreen(): React.JSX.Element {
  const theme = useTheme();
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const styles = useMemo(
    () => createStyles(theme, ms, fontScale),
    [theme, ms, fontScale]
  );

  const { mosqueSettings } = useFirebaseData();
  const MOSQUE_TZ = mosqueSettings?.timezone || DEFAULT_MOSQUE_TZ;

  const { upcomingEvents, loading: eventsLoading } = useEvents(MOSQUE_TZ);
  const { categories, loading: categoriesLoading, hasRealData } =
    useEventCategories();

  // Mosque civil "today" (YYYY-MM-DD); string compare, no ms arithmetic
  const todayCivilDate = useCivilToday(MOSQUE_TZ);
  const tomorrowCivilDate = useMemo(
    () => addCivilDays(todayCivilDate, 1),
    [todayCivilDate]
  );

  const getDateParts = (eventDate: string) => {
    const parsed = parseCivilDate(eventDate);
    if (!parsed) return { weekday: "", month: "", day: "" };
    return {
      weekday: weekdayShort(parsed),
      month: monthShort(parsed),
      day: String(parsed.day),
    };
  };

  const getRelativeBadge = useCallback(
    (eventDate: string): { label: string; tone: "today" | "tomorrow" } | null => {
      if (eventDate === todayCivilDate) return { label: "Today", tone: "today" };
      if (eventDate === tomorrowCivilDate) {
        return { label: "Tomorrow", tone: "tomorrow" };
      }
      return null;
    },
    [todayCivilDate, tomorrowCivilDate]
  );

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    if (category) {
      return { bg: category.color_bg, text: category.color_text };
    }
    return { bg: theme.colors.surface.soft, text: theme.colors.text.muted };
  };

  const getCategoryLabel = (categoryId: string): string => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.label || "Unknown";
  };

  /** `Saturday, 04-10-2026` for a `YYYY-MM-DD` civil date */
  const formatEventDate = (eventDate: string): string => {
    const parsed = parseCivilDate(eventDate);
    return parsed ? formatCivilDateHeading(parsed) : eventDate;
  };

  const filteredEvents = useMemo(() => {
    const list = (
      selectedCategory === "all"
        ? upcomingEvents
        : upcomingEvents.filter((event) => event.category === selectedCategory)
    ).filter(
      (event) =>
        typeof event.event_date === "string" &&
        parseCivilDate(event.event_date) !== null
    );
    const clockMinutes = (value?: string): number =>
      (value ? parseClock(value) : null) ?? 24 * 60;
    return [...list].sort((a, b) => {
      const byDate = compareCivilDates(a.event_date, b.event_date);
      if (byDate !== 0) return byDate;
      return clockMinutes(a.event_time) - clockMinutes(b.event_time);
    });
  }, [selectedCategory, upcomingEvents]);

  const categoryFilters = [
    { id: "all", label: "All" },
    ...categories.map((cat) => ({ id: cat.id, label: cat.label })),
  ];

  // Group by civil event_date (already sorted ascending)
  const sectionListData = useMemo(() => {
    const map = new Map<string, Event[]>();
    filteredEvents.forEach((ev) => {
      const list = map.get(ev.event_date);
      if (list) list.push(ev);
      else map.set(ev.event_date, [ev]);
    });
    return Array.from(map.entries()).map(([eventDate, items]) => ({
      title: formatEventDate(eventDate),
      eventDate,
      relBadge: getRelativeBadge(eventDate),
      data: items,
    }));
  }, [filteredEvents, getRelativeBadge]);

  const renderRelativeChip = (
    badge: { label: string; tone: "today" | "tomorrow" } | null
  ) => {
    if (!badge) return null;
    return (
      <View
        style={[
          styles.relativeChip,
          badge.tone === "today"
            ? styles.relativeChipToday
            : styles.relativeChipTomorrow,
        ]}
      >
        <Text
          style={[
            styles.relativeChipText,
            badge.tone === "today"
              ? styles.relativeChipTextToday
              : styles.relativeChipTextTomorrow,
          ]}
        >
          {badge.label}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

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
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Events</Text>
            <Text style={styles.headerSubtitle}>
              Upcoming at {mosqueSettings?.name || "Al Ansar"}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {hasRealData && (
        <View style={styles.categoryFilter}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryFilterContent}
          >
            {categoriesLoading ? (
              <Text style={styles.categoryLoadingText}>Loading categories…</Text>
            ) : (
              categoryFilters.map((cat) => (
                <Chip
                  key={cat.id}
                  label={cat.label}
                  selected={selectedCategory === cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                />
              ))
            )}
          </ScrollView>
        </View>
      )}

      <View style={styles.eventsContainer}>
        {eventsLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={theme.colors.icon.brand} />
            <Text style={styles.emptyStateText}>Loading events…</Text>
          </View>
        ) : (
          <SectionList
            sections={sectionListData as any}
            keyExtractor={(item: any) => item.id}
            contentContainerStyle={styles.eventsScrollContent}
            stickySectionHeadersEnabled
            renderSectionHeader={({ section }: any) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle} numberOfLines={2}>
                  {section.title}
                </Text>
                {renderRelativeChip(section.relBadge)}
              </View>
            )}
            renderItem={({ item, section }: any) => {
              const event = item;
              const categoryColors = getCategoryColor(event.category);
              const parts = getDateParts(event.event_date);
              const relEvent = getRelativeBadge(event.event_date);
              const showPerEventBadge = !section.relBadge && relEvent;

              return (
                <Pressable
                  onPress={() => setSelectedEvent(event)}
                  accessibilityRole="button"
                  accessibilityLabel={`View details for ${event.title}`}
                  style={({ pressed }) => [
                    pressed ? styles.eventCardPressed : null,
                  ]}
                >
                  <Panel compact style={styles.eventCard}>
                    {event.image_url ? (
                      <Image
                        source={{ uri: event.image_url }}
                        style={styles.eventImage}
                        resizeMode="cover"
                      />
                    ) : null}
                    <View style={styles.cardRow}>
                      <View
                        style={[
                          styles.dateBadge,
                          relEvent ? styles.dateBadgeHighlight : undefined,
                        ]}
                      >
                        <Text style={styles.dateWeekday}>
                          {parts.weekday.toUpperCase()}
                        </Text>
                        <Text style={styles.dateDay}>{parts.day}</Text>
                        <Text style={styles.dateMonth}>
                          {parts.month.toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.cardContent}>
                        <View style={styles.titleRow}>
                          <Text style={styles.eventTitle} numberOfLines={2}>
                            {event.title}
                          </Text>
                          <View
                            style={[
                              styles.categoryChip,
                              { backgroundColor: categoryColors.bg },
                            ]}
                          >
                            <Text
                              style={[
                                styles.categoryChipText,
                                { color: categoryColors.text },
                              ]}
                              numberOfLines={1}
                            >
                              {getCategoryLabel(event.category)}
                            </Text>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={ms(18, 0.2)}
                            color={theme.colors.icon.muted}
                            style={styles.chevron}
                          />
                        </View>

                        <View style={styles.timeRow}>
                          <Ionicons
                            name="time-outline"
                            size={ms(15, 0.2)}
                            color={theme.colors.icon.muted}
                          />
                          <Text style={styles.timeText}>
                            {formatClockStringDisplay(event.event_time)}
                          </Text>
                          {showPerEventBadge
                            ? renderRelativeChip(relEvent)
                            : null}
                        </View>

                        {event.location ? (
                          <View style={styles.metaItem}>
                            <Ionicons
                              name="location-outline"
                              size={ms(14, 0.15)}
                              color={theme.colors.icon.muted}
                            />
                            <Text style={styles.metaText}>{event.location}</Text>
                          </View>
                        ) : null}

                        {event.speaker ? (
                          <View style={styles.metaItem}>
                            <Ionicons
                              name="person-outline"
                              size={ms(14, 0.15)}
                              color={theme.colors.icon.muted}
                            />
                            <Text style={styles.metaText}>{event.speaker}</Text>
                          </View>
                        ) : null}

                        {event.rsvp_enabled ? (
                          <View style={styles.metaItem}>
                            <Ionicons
                              name="people-outline"
                              size={ms(14, 0.15)}
                              color={theme.colors.icon.muted}
                            />
                            <Text style={styles.metaText}>
                              {event.rsvp_count || 0} /{" "}
                              {event.rsvp_limit || "Unlimited"} RSVPs
                            </Text>
                          </View>
                        ) : null}

                        {event.description ? (
                          <Text
                            style={styles.eventDescription}
                            numberOfLines={3}
                          >
                            {event.description}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </Panel>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons
                  name="calendar-outline"
                  size={ms(48, 0.2)}
                  color={theme.colors.icon.subtle}
                />
                <Text style={styles.emptyStateTitle}>No upcoming events</Text>
                <Text style={styles.emptyStateText}>
                  {selectedCategory === "all"
                    ? "Check back soon for new events."
                    : `No upcoming ${getCategoryLabel(selectedCategory)} events.`}
                </Text>
              </View>
            }
          />
        )}
      </View>

      <EventDetailsModal
        visible={!!selectedEvent}
        event={selectedEvent}
        categoryLabel={
          selectedEvent ? getCategoryLabel(selectedEvent.category) : ""
        }
        categoryColors={
          selectedEvent
            ? getCategoryColor(selectedEvent.category)
            : { bg: theme.colors.surface.soft, text: theme.colors.text.muted }
        }
        formattedDate={
          selectedEvent ? formatEventDate(selectedEvent.event_date) : ""
        }
        onClose={() => setSelectedEvent(null)}
      />
    </View>
  );
}

const createStyles = (
  theme: AppTheme,
  ms: (size: number, factor?: number) => number,
  fontScale: number
) =>
  StyleSheet.create({
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
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    headerContent: {
      alignItems: "center",
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
    headerTitle: {
      fontSize: ms(24, 0.3) * fontScale,
      fontWeight: "700",
      color: theme.colors.text.header,
      marginBottom: ms(4, 0.05),
      textAlign: "center",
      letterSpacing: -0.3,
    },
    headerSubtitle: {
      fontSize: ms(13, 0.2) * fontScale,
      color: "rgba(255, 255, 255, 0.72)",
      textAlign: "center",
    },
    categoryFilter: {
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
    categoryFilterContent: {
      paddingHorizontal: theme.spacing.lg,
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    categoryLoadingText: {
      fontSize: ms(13, 0.2) * fontScale,
      color: theme.colors.text.muted,
      fontWeight: "500",
    },
    eventsContainer: {
      flex: 1,
      backgroundColor: theme.colors.surface.muted,
    },
    eventsScrollContent: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: ms(32, 0.1),
      flexGrow: 1,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.surface.muted,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.soft,
      marginBottom: theme.spacing.sm,
    },
    sectionTitle: {
      flex: 1,
      minWidth: 0,
      fontSize: ms(13, 0.2) * fontScale,
      fontWeight: "600",
      color: theme.colors.text.muted,
      letterSpacing: -0.1,
    },
    relativeChip: {
      borderRadius: theme.radius.pill,
      paddingHorizontal: ms(10, 0.1),
      paddingVertical: ms(4, 0.05),
      flexShrink: 0,
    },
    relativeChipToday: {
      backgroundColor: theme.colors.accent.amberSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.brand.gold[600],
    },
    relativeChipTomorrow: {
      backgroundColor: theme.colors.accent.blueSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.icon.brand,
    },
    relativeChipText: {
      fontSize: ms(11, 0.15) * fontScale,
      fontWeight: "600",
    },
    relativeChipTextToday: {
      color: theme.colors.brand.gold[600],
    },
    relativeChipTextTomorrow: {
      color: theme.colors.icon.brand,
    },
    eventCard: {
      marginBottom: theme.spacing.md,
    },
    eventCardPressed: {
      opacity: 0.85,
    },
    eventImage: {
      width: "100%",
      height: ms(140, 0.2),
      backgroundColor: theme.colors.border.base,
      borderRadius: theme.radius.md,
      marginBottom: theme.spacing.md,
    },
    cardRow: {
      flexDirection: "row",
    },
    dateBadge: {
      width: ms(58, 0.15),
      paddingVertical: ms(8, 0.1),
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface.soft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.soft,
      alignItems: "center",
      justifyContent: "center",
      marginRight: theme.spacing.md,
      flexShrink: 0,
    },
    dateBadgeHighlight: {
      borderColor: "rgba(217, 119, 6, 0.35)",
      backgroundColor: theme.colors.accent.amberSoft,
    },
    dateWeekday: {
      fontSize: ms(10, 0.15) * fontScale,
      color: theme.colors.text.muted,
      fontWeight: "600",
      letterSpacing: 0.4,
    },
    dateDay: {
      fontSize: ms(22, 0.25) * fontScale,
      color:
        theme.colorScheme === "dark"
          ? theme.colors.icon.brand
          : theme.colors.brand.navy[800],
      fontWeight: "700",
      lineHeight: ms(26, 0.2),
    },
    dateMonth: {
      fontSize: ms(10, 0.15) * fontScale,
      color: theme.colors.text.muted,
      fontWeight: "600",
    },
    cardContent: {
      flex: 1,
      minWidth: 0,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    eventTitle: {
      flex: 1,
      fontSize: ms(16, 0.2) * fontScale,
      fontWeight: "600",
      color: theme.colors.text.strong,
      letterSpacing: -0.2,
    },
    categoryChip: {
      borderRadius: theme.radius.pill,
      paddingHorizontal: ms(8, 0.1),
      paddingVertical: ms(4, 0.05),
      maxWidth: ms(100, 0.2),
      flexShrink: 0,
    },
    categoryChipText: {
      fontSize: ms(10, 0.15) * fontScale,
      fontWeight: "600",
    },
    chevron: {
      marginTop: ms(2, 0.05),
      flexShrink: 0,
    },
    timeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
    timeText: {
      flex: 1,
      fontSize: ms(14, 0.2) * fontScale,
      fontWeight: "600",
      color: theme.colors.text.strong,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      marginBottom: ms(4, 0.05),
    },
    metaText: {
      flex: 1,
      fontSize: ms(13, 0.2) * fontScale,
      color: theme.colors.text.muted,
    },
    eventDescription: {
      marginTop: theme.spacing.sm,
      fontSize: ms(13, 0.2) * fontScale,
      color: theme.colors.text.muted,
      lineHeight: ms(19, 0.2),
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: ms(64, 0.1),
      paddingHorizontal: theme.spacing.xl,
      gap: theme.spacing.sm,
    },
    emptyStateTitle: {
      fontSize: ms(16, 0.2) * fontScale,
      fontWeight: "600",
      color: theme.colors.text.strong,
      marginTop: theme.spacing.sm,
    },
    emptyStateText: {
      fontSize: ms(13, 0.2) * fontScale,
      color: theme.colors.text.muted,
      textAlign: "center",
      lineHeight: ms(18, 0.2),
    },
  });
