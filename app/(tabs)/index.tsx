import { Ionicons } from "@expo/vector-icons";
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PatternOverlay from "../../components/PatternOverlay";
import NextBanner from "../../components/ui/NextBanner";
import PillToggle from "../../components/ui/PillToggle";
import UpdatingBanner from "../../components/ui/UpdatingBanner";

// Import custom components
import EmptyState from "../../components/EmptyState";
import LoadingScreen from "../../components/LoadingScreen";

// Import theme context
import { useTheme } from "../../contexts/ThemeContext";
import type { AppTheme } from "../../hooks/useAppTheme";

// Import custom hooks
import { useFirebaseData } from "../../hooks/useFirebaseData";

// Import types and utility
import { Prayer, calculateIqamaTime } from "../../types";

type ViewType = "prayer" | "jumuah";

const getOrdinalSuffix = (num: number): string => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return `${num}st`;
  if (j === 2 && k !== 12) return `${num}nd`;
  if (j === 3 && k !== 13) return `${num}rd`;
  return `${num}th`;
};

export default function HomeScreen(): React.JSX.Element {
  const theme = useTheme();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [activeView, setActiveView] = useState<ViewType>("prayer");

  // Load data from Firebase using custom hooks
  const { prayerTimes, jumuahTimes, mosqueSettings, loading, updating, error } = useFirebaseData();
  
  // Memoize styles based on theme
  const styles = useMemo(() => createStyles(theme), [theme]);


  // Format timestamp with both date and time for better context
  const formatDateTimeDisplay = (timestamp?: FirebaseFirestoreTypes.Timestamp): string | null => {
    if (!timestamp) return null;
    try {
      let date: Date;
      
      // Handle both Firestore Timestamp objects and cached plain objects
      if (typeof timestamp === 'object' && timestamp !== null) {
        // Check if it's a Firestore Timestamp with toDate method
        if ('toDate' in timestamp && typeof timestamp.toDate === 'function') {
          date = timestamp.toDate();
        } 
        // Handle cached data (plain object with seconds/nanoseconds)
        else if ('seconds' in timestamp && typeof timestamp.seconds === 'number') {
          date = new Date((timestamp as any).seconds * 1000);
        } 
        else {
          return null;
        }
      } else {
        return null;
      }
      
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = date.getFullYear();
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${d}-${m}-${y} at ${displayHours}:${minutes} ${ampm}`;
    } catch {
      return null;
    }
  };

  // Helper to get start of day for accurate date-only comparisons
  const getStartOfDay = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const isStale = (() => {
    const last = prayerTimes?.last_updated || mosqueSettings?.last_updated;
    if (!last) return false;
    
    try {
      // Handle both Firestore Timestamp objects and cached plain objects
      let lastDate: Date;
      
      if (typeof last === 'object' && last !== null) {
        // Check if it's a Firestore Timestamp with toDate method
        if ('toDate' in last && typeof last.toDate === 'function') {
          lastDate = last.toDate();
        } 
        // Handle cached data (plain object with seconds/nanoseconds)
        else if ('seconds' in last && typeof last.seconds === 'number') {
          lastDate = new Date((last as any).seconds * 1000);
        } 
        // Fallback: not a valid timestamp
        else {
          console.warn('last_updated has unexpected format:', last);
          return false;
        }
      } else {
        console.warn('last_updated is not an object:', last);
        return false;
      }
      
      // Only consider stale if last_updated is before today (not just different)
      const today = new Date();
      
      // Set both to start of day for accurate day comparison
      const lastDateStartOfDay = getStartOfDay(lastDate);
      const todayStartOfDay = getStartOfDay(today);
      
      return lastDateStartOfDay.getTime() < todayStartOfDay.getTime();
    } catch (error) {
      console.error('Error checking staleness:', error);
      return false;
    }
  })();

  // Jumu'ah times don't change daily, so we don't check staleness
  // (unlike prayer times which update every day)

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: (mosqueSettings as any)?.timezone || "Australia/Sydney",
    });
  };

  // Calculate Islamic (Hijri) date
  const getIslamicDate = (date: Date): string => {
    try {
      const islamicDate = new Intl.DateTimeFormat("en-US-u-ca-islamic", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: (mosqueSettings as any)?.timezone || "Australia/Sydney",
      }).format(date);

      return islamicDate;
    } catch (error) {
      console.error("Error formatting Islamic date:", error);
      return "";
    }
  };

  // ====== Timezone-aware helpers (uses mosqueSettings.timezone when available) ======
  const MOSQUE_TZ: string = (mosqueSettings as any)?.timezone || "Australia/Sydney";

  // Get current wall-clock components using Intl parts
  const getSydneyNowParts = (): { year: number; month: number; day: number; hour: number; minute: number } => {
    const parts = new Intl.DateTimeFormat("en-AU", {
      timeZone: MOSQUE_TZ,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    }).formatToParts(new Date());

    const map: Record<string, number> = {} as any;
    for (const p of parts) {
      if (p.type === "year" || p.type === "month" || p.type === "day" || p.type === "hour" || p.type === "minute") {
        map[p.type] = parseInt(p.value, 10);
      }
    }
    return { year: map.year, month: map.month, day: map.day, hour: map.hour, minute: map.minute };
  };

  // Parse a 12-hour time string like "5:30 PM" into minutes since midnight
  const parseTimeToMinutes = (timeString: string | undefined): number | null => {
    if (!timeString) return null;
    const match = timeString.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  // Format a difference in minutes to "X Hours Y Minutes"
  const formatMinuteDiff = (diffMins: number): string => {
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    if (hours > 0) {
      return `${hours} Hour${hours > 1 ? "s" : ""} ${minutes} Minute${minutes !== 1 ? "s" : ""}`;
    }
    return `${minutes} Minute${minutes !== 1 ? "s" : ""}`;
  };

  // Get the displayed iqama time
  const getDisplayedIqamaTime = (prayer: string): string => {
    if (!prayerTimes) return "--:--";

    const adhanTime = (prayerTimes as any)[`${prayer}_adhan`];
    const iqamaType = (prayerTimes as any)[`${prayer}_iqama_type`] || "fixed";
    const fixedIqama = (prayerTimes as any)[`${prayer}_iqama`];
    const offset = (prayerTimes as any)[`${prayer}_iqama_offset`];

    return calculateIqamaTime(adhanTime, iqamaType, fixedIqama, offset);
  };

  // Calculate next prayer using Sydney timezone wall-clock
  const getNextPrayer = (): { name: string; timeRemaining: string } | null => {
    const { hour, minute } = getSydneyNowParts();
    const nowMinutes = hour * 60 + minute;

    const prayerKeys = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
    const schedule = prayerKeys.map((key) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      minutes: parseTimeToMinutes(getDisplayedIqamaTime(key)),
    })).filter((p) => p.minutes !== null) as { name: string; minutes: number }[];

    // Find the first prayer later today
    for (const p of schedule) {
      if (p.minutes > nowMinutes) {
        const diff = p.minutes - nowMinutes;
        return { name: p.name, timeRemaining: formatMinuteDiff(diff) };
      }
    }

    // Otherwise, next prayer is tomorrow's Fajr
    const fajrMinutes = parseTimeToMinutes(getDisplayedIqamaTime("fajr"));
    if (fajrMinutes !== null) {
      const diff = (24 * 60 - nowMinutes) + fajrMinutes;
      return { name: "Fajr", timeRemaining: formatMinuteDiff(diff) };
    }
    return null;
  };

  const nextPrayer = getNextPrayer();

  // Show loading screen ONLY if no cached data yet
  if (loading && !prayerTimes && !jumuahTimes && !mosqueSettings) {
    return <LoadingScreen />;
  }

  // Prayer times array
  const prayers: (Prayer & { icon: string; showIqama: boolean })[] = [
    {
      name: "Fajr",
      adhan: prayerTimes?.fajr_adhan,
      iqama: getDisplayedIqamaTime("fajr"),
      icon: "moon",
      showIqama: true,
    },
    {
      name: "Dhuhr",
      adhan: prayerTimes?.dhuhr_adhan,
      iqama: getDisplayedIqamaTime("dhuhr"),
      icon: "partly-sunny",
      showIqama: true,
    },
    {
      name: "Asr",
      adhan: prayerTimes?.asr_adhan,
      iqama: getDisplayedIqamaTime("asr"),
      icon: "sunny-outline",
      showIqama: true,
    },
    {
      name: "Maghrib",
      adhan: prayerTimes?.maghrib_adhan,
      iqama: getDisplayedIqamaTime("maghrib"),
      icon: "moon-outline",
      showIqama: true,
    },
    {
      name: "Isha",
      adhan: prayerTimes?.isha_adhan,
      iqama: getDisplayedIqamaTime("isha"),
      icon: "moon",
      showIqama: true,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={theme.gradients.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Subtle geometric pattern behind the hero content */}
          <PatternOverlay
            style={styles.patternOverlay}
            variant="stars"
            opacity={0.05}
            tileSize={28}
            color="rgba(255,255,255,0.7)"
          />
          <SafeAreaView edges={["top"]}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => router.push("/settings")}
              >
                <Ionicons name="settings-outline" size={24} color={theme.colors.text.inverse} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.heroSection}>
              <View style={styles.logoHalo}>
                <Image
                  source={require("../../assets/images/ansar_logo_white.png")}
                  style={styles.logoLarge}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.mosqueName}>
                {mosqueSettings?.name || "Al Ansar Masjid"}
              </Text>
              <Text style={styles.currentDate}>{formatDate(currentTime)}</Text>
              <Text style={styles.islamicDate}>{getIslamicDate(currentTime)}</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Toggle Buttons */}
        <PillToggle
          options={[
            { key: "prayer", label: "Prayer Times" },
            { key: "jumuah", label: "Jumu’ah Times" },
          ]}
          value={activeView}
          onChange={(key) => setActiveView(key as ViewType)}
          style={{ marginTop: -12, marginBottom: 12 }}
        />

        {/* Prayer Times View */}
        {activeView === "prayer" && (
          <View style={styles.prayerCardsContainer}>
            {nextPrayer && (
              <NextBanner text={`Next: ${nextPrayer.name} in ${nextPrayer.timeRemaining}`} />
            )}
            {!loading && !prayerTimes ? (
              <EmptyState
                variant={error ? "error" : "offline"}
                icon="time-outline"
                title="Prayer Times Unavailable"
                message={error || "Please check your internet connection and pull down to refresh. Prayer times will appear when you're back online."}
              />
            ) : (
            <View style={styles.prayerTableCard}>
              <View style={[styles.tableRow, styles.tableHeaderRow, styles.tableRowDivider]}>
                <View style={styles.rowLeft} />
                <Text style={[styles.rowTime, styles.rowHeaderLabel]}>Adhan</Text>
                <Text style={[styles.rowTime, styles.rowHeaderLabel]}>Iqama</Text>
              </View>
              {/* Skeleton rows only when loading and NO cached data */}
              {loading && !prayerTimes ? (
                [0,1,2,3,4].map((i) => (
                  <View key={`sk-${i}`} style={[styles.tableRow, styles.tableRowDivider]}> 
                    <View style={styles.rowLeft}>
                      <View style={[styles.iconCircleSmall, { opacity: 0.4 }]} />
                      <View style={styles.skelName} />
                    </View>
                    <View style={styles.skelTime} />
                    <View style={styles.skelTime} />
                  </View>
                ))
              ) : (
              prayers.map((prayer, index) => {
                const isNextPrayer = nextPrayer?.name === prayer.name;
                const isLast = index === prayers.length - 1;

                return (
                  <View
                    key={prayer.name}
                    style={[
                      styles.tableRow,
                      isNextPrayer && styles.nextRow,
                      !isLast && styles.tableRowDivider,
                    ]}
                  >
                    <View style={styles.rowLeft}>
                      <View style={[styles.iconCircleSmall, isNextPrayer && styles.iconCircleActive]}>
                        <Ionicons
                          name={prayer.icon as any}
                          size={18}
                          color={isNextPrayer ? theme.colors.brand.gold[600] : theme.colors.accent.blue}
                        />
                      </View>
                      <Text style={[styles.rowName, isNextPrayer && styles.nextPrayerText]}>
                        {prayer.name}
                      </Text>
                    </View>
                    <Text style={styles.rowTime}>{prayer.adhan || "--:--"}</Text>
                    <Text style={[styles.rowTime, styles.rowIqama]}>
                      {prayer.showIqama ? prayer.iqama || "--:--" : ""}
                    </Text>
                  </View>
                );
              })
              )}
            </View>
            )}
            {/* Show subtle updating indicator below the table */}
            {updating && (prayerTimes || jumuahTimes || mosqueSettings) && (
              <View style={styles.updatingContainer}>
                <UpdatingBanner text="Updating…" />
              </View>
            )}
            {/* Staleness banner when data is old AND we're not currently updating */}
            {!updating && isStale && prayerTimes && (
              <View style={styles.staleBanner}>
                <Text style={styles.staleBannerText}>
                  Prayer times last updated on {formatDateTimeDisplay(prayerTimes?.last_updated || mosqueSettings?.last_updated) || 'a previous day'}.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Jumu'ah Times View */}
        {activeView === "jumuah" && (
          <View style={styles.jumuahCardsContainer}>
            {/* No staleness banner for Jumu'ah - times don't change daily */}
            {/* Skeleton cards only when loading and NO cached data */}
            {loading && !jumuahTimes ? (
              [0].map((i) => (
                <View key={`j-sk-${i}`} style={styles.jumuahCard}>
                  <View style={styles.jumuahHeader}>
                    <View style={[styles.iconCircleSmall, { width: 40, height: 40, opacity: 0.35 }]} />
                    <View style={styles.jumuahSkelTitle} />
                  </View>
                  <View style={styles.jumuahTimeRow}>
                    <View style={styles.jumuahSkelLine} />
                    <View style={styles.jumuahSkelLine} />
                  </View>
                </View>
              ))
            ) : !jumuahTimes ? (
              <EmptyState
                variant={error ? "error" : "offline"}
                icon="calendar-outline"
                title="Jumu'ah Times Unavailable"
                message={error || "Please check your internet connection and pull down to refresh. Jumu'ah times will appear when you're back online."}
              />
            ) : (
              jumuahTimes.times.map((time, index) => (
                <View key={time.id} style={styles.jumuahCard}>
                  <View style={styles.jumuahHeader}>
                    <Ionicons name="calendar" size={24} color={theme.colors.brand.gold[600]} />
                    <Text style={styles.jumuahCardTitle}>
                      {jumuahTimes.times.length === 1
                        ? "Jumu'ah"
                        : `${getOrdinalSuffix(index + 1)} Jumu'ah`}
                    </Text>
                  </View>
                  <View style={styles.jumuahTimeRow}>
                    <Text style={styles.jumuahLabel}>Khutbah</Text>
                    <Text style={styles.jumuahTime}>{time.khutbah}</Text>
                  </View>
                </View>
              ))
            )}
            {/* Show subtle updating indicator below the cards */}
            {updating && (prayerTimes || jumuahTimes || mosqueSettings) && (
              <View style={styles.updatingContainer}>
                <UpdatingBanner text="Updating…" />
              </View>
            )}  
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.muted,
  },
  scrollView: {
    flex: 1,
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
  headerTop: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  settingsButton: {
    padding: 6,
    borderRadius: theme.spacing.lg,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  heroSection: {
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 6,
    paddingBottom: 4,
  },
  logoLarge: {
    width: 90,
    height: 90,
    marginBottom: 10,
  },
  logoHalo: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: theme.spacing.sm,
  },
  mosqueName: {
    fontSize: theme.typography.h1,
    fontWeight: "bold",
    color: theme.colors.text.inverse,
    marginBottom: 4,
    textAlign: "center",
  },
  currentDate: {
    fontSize: 13,
    color: theme.colors.text.subtle,
    marginBottom: 1,
    textAlign: "center",
  },
  islamicDate: {
    fontSize: theme.typography.small,
    color: theme.colors.text.subtle,
    textAlign: "center",
  },
  prayerCardsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  prayerTableCard: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.sm,
    ...theme.shadow.soft,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
  },
  tableHeaderRow: {
    backgroundColor: theme.colors.surface.soft,
  },
  tableRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.base,
  },
  nextRow: {
    backgroundColor: theme.colors.accent.amberSoft,
  },
  rowLeft: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircleSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.accent.blueSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.sm,
  },
  rowName: {
    fontSize: theme.typography.h3,
    color: theme.colors.text.strong,
    fontWeight: "700",
  },
  rowTime: {
    flex: 1,
    textAlign: "center",
    fontSize: theme.typography.h3,
    color: theme.colors.text.base,
    fontWeight: "700",
  },
  rowHeaderLabel: {
    fontSize: theme.typography.small,
    color: theme.colors.text.muted,
    fontWeight: "800",
  },
  rowIqama: {
    color: theme.colors.brand.navy[700],
  },
  prayerCard: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: 14,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.soft,
  },
  nextPrayerCard: {
    backgroundColor: theme.colors.accent.amberSoft,
    borderWidth: 2,
    borderColor: theme.colors.brand.gold[400],
    shadowColor: theme.colors.brand.gold[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  prayerCardHeader: {
    marginBottom: 10,
  },
  prayerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.accent.blueSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  iconCircleActive: {
    backgroundColor: theme.colors.accent.amberSoft,
  },
  prayerCardName: {
    fontSize: theme.typography.h3,
    fontWeight: "700",
    color: theme.colors.text.strong,
    flex: 1,
  },
  nextPrayerText: {
    color: theme.colors.brand.gold[600],
  },
  nextBadge: {
    backgroundColor: theme.colors.brand.gold[600],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: 10,
  },
  nextBadgeText: {
    color: theme.colors.text.inverse,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  countdownText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.brand.gold[600],
    marginLeft: 46,
  },
  prayerCardTimes: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface.soft,
    borderRadius: 10,
    padding: 10,
  },
  timeBlock: {
    flex: 1,
    alignItems: "center",
  },
  timeDivider: {
    width: 1,
    height: 35,
    backgroundColor: theme.colors.border.soft,
    marginHorizontal: 6,
  },
  timeLabel: {
    fontSize: 11,
    color: theme.colors.text.muted,
    marginTop: 3,
    marginBottom: 1,
  },
  timeValue: {
    fontSize: theme.spacing.lg,
    fontWeight: "700",
    color: theme.colors.text.strong,
  },
  iqamaTime: {
    color: theme.colors.brand.navy[700],
  },
  jumuahCardsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  jumuahCard: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: 14,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.soft,
  },
  jumuahHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  jumuahCardTitle: {
    fontSize: theme.typography.h3,
    fontWeight: "700",
    color: theme.colors.text.strong,
    marginLeft: 10,
    flex: 1,
  },
  jumuahTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.surface.soft,
    borderRadius: 10,
    padding: theme.spacing.md,
  },
  jumuahLabel: {
    fontSize: theme.typography.body,
    color: theme.colors.text.muted,
    fontWeight: "500",
  },
  jumuahTime: {
    fontSize: theme.typography.h2,
    fontWeight: "700",
    color: theme.colors.brand.navy[700],
  },
  staleBanner: {
    backgroundColor: theme.colors.accent.amberSoft,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.colors.brand.gold[400],
  },
  staleBannerText: {
    fontSize: 12,
    color: theme.colors.text.strong,
    fontWeight: '600',
  },
  skelName: {
    width: 60,
    height: 16,
    borderRadius: 4,
    backgroundColor: theme.colors.surface.soft,
  },
  skelTime: {
    flex: 1,
    height: 18,
    borderRadius: 4,
    backgroundColor: theme.colors.surface.soft,
    marginHorizontal: 4,
  },
  jumuahSkelTitle: {
    flex: 1,
    height: 20,
    borderRadius: 6,
    backgroundColor: theme.colors.surface.soft,
    marginLeft: 10,
  },
  jumuahSkelLine: {
    width: 90,
    height: 22,
    borderRadius: 6,
    backgroundColor: theme.colors.surface.soft,
  },
  updatingContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
});
