import { Ionicons } from "@expo/vector-icons";
import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
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
import { useEvents } from "../../hooks/useEvents";
import { useFirebaseData } from "../../hooks/useFirebaseData";
import { useResponsive } from "../../hooks/useResponsive";
import type { Event } from "../../types";

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

  const { upcomingEvents, loading: eventsLoading } = useEvents();
  const { categories, loading: categoriesLoading, hasRealData } =
    useEventCategories();
  const { mosqueSettings } = useFirebaseData();

  const MOSQUE_TZ = mosqueSettings?.timezone || "Australia/Sydney";

  const getDateParts = (timestamp: FirebaseFirestoreTypes.Timestamp) => {
    const d = timestamp.toDate();
    const weekday = d.toLocaleDateString("en-US", {
      weekday: "short",
      timeZone: MOSQUE_TZ,
    });
    const month = d.toLocaleDateString("en-US", {
      month: "short",
      timeZone: MOSQUE_TZ,
    });
    const day = parseInt(
      d.toLocaleDateString("en-US", { day: "numeric", timeZone: MOSQUE_TZ }),
      10
    );
    return { weekday, month, day };
  };

  const startOfDay = useCallback(
    (d: Date) => {
      const parts = d
        .toLocaleString("en-US", {
          timeZone: MOSQUE_TZ,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour12: false,
        })
        .split(/[,\s:]+/);
      const [m, day, y] = parts[0].split("/");
      return new Date(parseInt(y), parseInt(m) - 1, parseInt(day), 0, 0, 0);
    },
    [MOSQUE_TZ]
  );

  const getRelativeBadge = useCallback(
    (
      timestamp: FirebaseFirestoreTypes.Timestamp
    ): { label: string; tone: "today" | "tomorrow" } | null => {
      try {
        const eventDate = startOfDay(timestamp.toDate());
        const today = startOfDay(new Date());
        const msInDay = 24 * 60 * 60 * 1000;
        const diffDays = Math.round(
          (eventDate.getTime() - today.getTime()) / msInDay
        );
        if (diffDays === 0) return { label: "Today", tone: "today" };
        if (diffDays === 1) return { label: "Tomorrow", tone: "tomorrow" };
        return null;
      } catch {
        return null;
      }
    },
    [startOfDay]
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

  const formatEventDate = (
    timestamp: FirebaseFirestoreTypes.Timestamp
  ): string => {
    return timestamp.toDate().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: MOSQUE_TZ,
    });
  };

  const filteredEvents = useMemo(() => {
    const list =
      selectedCategory === "all"
        ? upcomingEvents
        : upcomingEvents.filter((event) => event.category === selectedCategory);
    return [...list].sort(
      (a, b) => a.date.toDate().getTime() - b.date.toDate().getTime()
    );
  }, [selectedCategory, upcomingEvents]);

  const categoryFilters = [
    { id: "all", label: "All" },
    ...categories.map((cat) => ({ id: cat.id, label: cat.label })),
  ];

  const sections = useMemo(() => {
    const map = new Map<
      string,
      {
        date: Date;
        timestamp: FirebaseFirestoreTypes.Timestamp;
        items: typeof upcomingEvents;
      }
    >();
    filteredEvents.forEach((ev) => {
      const baseTs = ev.date as FirebaseFirestoreTypes.Timestamp;
      const d = baseTs.toDate();
      const parts = d
        .toLocaleString("en-US", {
          timeZone: MOSQUE_TZ,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour12: false,
        })
        .split(/[,\s:]+/);
      const [m, day, y] = parts[0].split("/");
      const keyDate = new Date(
        parseInt(y, 10),
        parseInt(m, 10) - 1,
        parseInt(day, 10),
        0,
        0,
        0
      );
      const key = `${y}-${m}-${day}`;
      if (!map.has(key))
        map.set(key, { date: keyDate, timestamp: baseTs, items: [] });
      map.get(key)!.items.push(ev);
    });
    return Array.from(map.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
  }, [filteredEvents, MOSQUE_TZ]);

  const sectionListData = useMemo(() => {
    return sections.map((s) => ({
      title: s.date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: MOSQUE_TZ,
      }),
      date: s.date,
      relBadge: getRelativeBadge(s.timestamp),
      data: s.items,
    }));
  }, [sections, MOSQUE_TZ, getRelativeBadge]);

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
              const parts = getDateParts(event.date);
              const relEvent = getRelativeBadge(event.date);
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
                          <Text style={styles.timeText}>{event.time}</Text>
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
          selectedEvent ? formatEventDate(selectedEvent.date) : ""
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
