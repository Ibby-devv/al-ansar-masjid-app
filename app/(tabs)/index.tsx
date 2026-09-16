import { Ionicons } from "@expo/vector-icons";
import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PatternOverlay from "../../components/PatternOverlay";
import NextBanner from "../../components/ui/NextBanner";
import UpdatingBanner from "../../components/ui/UpdatingBanner";

import EmptyState from "../../components/EmptyState";
import LoadingScreen from "../../components/LoadingScreen";

import { useTheme } from "../../contexts/ThemeContext";

import { useFirebaseData } from "../../hooks/useFirebaseData";
import { useResponsive } from "../../hooks/useResponsive";

import { Prayer, calculateIqamaTime } from "../../types";

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
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const { prayerTimes, jumuahTimes, mosqueSettings, loading, updating, error, refetch } =
    useFirebaseData();

  const styles = useMemo(() => createStyles(theme, ms, fontScale), [theme, ms, fontScale]);

  const formatDateTimeDisplay = (timestamp?: FirebaseFirestoreTypes.Timestamp): string | null => {
    if (!timestamp) return null;
    try {
      let date: Date;

      if (typeof timestamp === "object" && timestamp !== null) {
        if ("toDate" in timestamp && typeof timestamp.toDate === "function") {
          date = timestamp.toDate();
        } else if ("seconds" in timestamp && typeof timestamp.seconds === "number") {
          date = new Date((timestamp as { seconds: number }).seconds * 1000);
        } else {
          return null;
        }
      } else {
        return null;
      }

      const d = String(date.getDate()).padStart(2, "0");
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const y = date.getFullYear();
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `${d}-${m}-${y} at ${displayHours}:${minutes} ${ampm}`;
    } catch {
      return null;
    }
  };

  const getStartOfDay = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const isStale = (() => {
    const last = prayerTimes?.last_updated || mosqueSettings?.last_updated;
    if (!last) return false;

    try {
      let lastDate: Date;

      if (typeof last === "object" && last !== null) {
        if ("toDate" in last && typeof last.toDate === "function") {
          lastDate = last.toDate();
        } else if ("seconds" in last && typeof last.seconds === "number") {
          lastDate = new Date((last as { seconds: number }).seconds * 1000);
        } else {
          console.warn("last_updated has unexpected format:", last);
          return false;
        }
      } else {
        console.warn("last_updated is not an object:", last);
        return false;
      }

      const today = new Date();
      const lastDateStartOfDay = getStartOfDay(lastDate);
      const todayStartOfDay = getStartOfDay(today);

      return lastDateStartOfDay.getTime() < todayStartOfDay.getTime();
    } catch (err) {
      console.error("Error checking staleness:", err);
      return false;
    }
  })();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const onRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: (mosqueSettings as { timezone?: string } | null)?.timezone || "Australia/Sydney",
    });
  };

  const MOSQUE_TZ: string =
    (mosqueSettings as { timezone?: string } | null)?.timezone || "Australia/Sydney";

  const getSydneyNowParts = (): {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
  } => {
    const parts = new Intl.DateTimeFormat("en-AU", {
      timeZone: MOSQUE_TZ,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    }).formatToParts(new Date());

    const map: Record<string, number> = {};
    for (const p of parts) {
      if (
        p.type === "year" ||
        p.type === "month" ||
        p.type === "day" ||
        p.type === "hour" ||
        p.type === "minute"
      ) {
        map[p.type] = parseInt(p.value, 10);
      }
    }
    return {
      year: map.year,
      month: map.month,
      day: map.day,
      hour: map.hour,
      minute: map.minute,
    };
  };

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

  const formatMinuteDiff = (diffMins: number): string => {
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    if (hours > 0) {
      return `in ${hours} hr${hours > 1 ? "s" : ""} ${minutes} min`;
    }
    return `in ${minutes} min`;
  };

  const getDisplayedIqamaTime = (prayer: string): string => {
    if (!prayerTimes) return "--:--";

    const record = prayerTimes as unknown as Record<string, string | number | undefined>;
    const adhanTime = record[`${prayer}_adhan`] as string | undefined;
    const iqamaType = (record[`${prayer}_iqama_type`] as "fixed" | "offset" | undefined) || "fixed";
    const fixedIqama = record[`${prayer}_iqama`] as string | undefined;
    const offset = record[`${prayer}_iqama_offset`] as number | undefined;

    return calculateIqamaTime(adhanTime, iqamaType, fixedIqama, offset);
  };

  const getNextPrayer = (): { name: string; time: string; timeRemaining: string } | null => {
    const { hour, minute } = getSydneyNowParts();
    const nowMinutes = hour * 60 + minute;

    const prayerKeys = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
    const schedule = prayerKeys
      .map((key) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        time: getDisplayedIqamaTime(key),
        minutes: parseTimeToMinutes(getDisplayedIqamaTime(key)),
      }))
      .filter((p) => p.minutes !== null) as { name: string; time: string; minutes: number }[];

    for (const p of schedule) {
      if (p.minutes > nowMinutes) {
        const diff = p.minutes - nowMinutes;
        return { name: p.name, time: p.time, timeRemaining: formatMinuteDiff(diff) };
      }
    }

    const fajrTime = getDisplayedIqamaTime("fajr");
    const fajrMinutes = parseTimeToMinutes(fajrTime);
    if (fajrMinutes !== null) {
      const diff = 24 * 60 - nowMinutes + fajrMinutes;
      return { name: "Fajr", time: fajrTime, timeRemaining: formatMinuteDiff(diff) };
    }
    return null;
  };

  const nextPrayer = getNextPrayer();

  if (loading && !prayerTimes && !jumuahTimes && !mosqueSettings) {
    return <LoadingScreen />;
  }

  const prayers: (Prayer & { showIqama: boolean })[] = [
    {
      name: "Fajr",
      adhan: prayerTimes?.fajr_adhan,
      iqama: getDisplayedIqamaTime("fajr"),
      showIqama: true,
    },
    {
      name: "Shuruq",
      adhan: prayerTimes?.shuruq_adhan,
      iqama: undefined,
      showIqama: false,
    },
    {
      name: "Dhuhr",
      adhan: prayerTimes?.dhuhr_adhan,
      iqama: getDisplayedIqamaTime("dhuhr"),
      showIqama: true,
    },
    {
      name: "Asr",
      adhan: prayerTimes?.asr_adhan,
      iqama: getDisplayedIqamaTime("asr"),
      showIqama: true,
    },
    {
      name: "Maghrib",
      adhan: prayerTimes?.maghrib_adhan,
      iqama: getDisplayedIqamaTime("maghrib"),
      showIqama: true,
    },
    {
      name: "Isha",
      adhan: prayerTimes?.isha_adhan,
      iqama: getDisplayedIqamaTime("isha"),
      showIqama: true,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.brand.navy[700]}
            colors={[theme.colors.brand.navy[700]]}
          />
        }
      >
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
            <View style={styles.headerTop}>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => router.push("/settings")}
                accessibilityRole="button"
                accessibilityLabel="Settings"
              >
                <Ionicons name="settings-outline" size={22} color={theme.colors.text.header} />
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
              <Text style={styles.mosqueName} numberOfLines={2}>
                {mosqueSettings?.name || "Al Ansar Masjid"}
              </Text>
              <Text style={styles.currentDate}>{formatDate(currentTime)}</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.prayerCardsContainer}>
          {nextPrayer && (
            <NextBanner
              prayerName={nextPrayer.name}
              prayerTime={nextPrayer.time}
              timeRemaining={nextPrayer.timeRemaining}
            />
          )}
          {!loading && !prayerTimes ? (
            <EmptyState
              variant={error ? "error" : "offline"}
              icon="time-outline"
              title="Prayer Times Unavailable"
              message={
                error ||
                "Please check your internet connection and pull down to refresh. Prayer times will appear when you're back online."
              }
            />
          ) : (
            <View style={styles.prayerTableCard}>
              <View style={[styles.tableRow, styles.tableHeaderRow, styles.tableRowDivider]}>
                <Text style={[styles.rowName, styles.rowHeaderLabel]}>Prayer</Text>
                <Text style={[styles.rowTime, styles.rowHeaderLabel]}>Adhan</Text>
                <Text style={[styles.rowTime, styles.rowHeaderLabel]}>Iqama</Text>
              </View>
              {loading && !prayerTimes ? (
                [0, 1, 2, 3, 4, 5].map((i) => (
                  <View key={`sk-${i}`} style={[styles.tableRow, styles.tableRowDivider]}>
                    <View style={styles.skelName} />
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
                      <Text
                        style={[styles.rowName, isNextPrayer && styles.nextPrayerText]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {prayer.name}
                      </Text>
                      <Text style={styles.rowTime}>{prayer.adhan || "--:--"}</Text>
                      <Text
                        style={[
                          styles.rowTime,
                          prayer.showIqama ? styles.rowIqama : styles.rowIqamaEmpty,
                          isNextPrayer && prayer.showIqama && styles.rowIqamaNext,
                        ]}
                      >
                        {prayer.showIqama ? prayer.iqama || "--:--" : "—"}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {(loading && !jumuahTimes) || (jumuahTimes && jumuahTimes.times.length > 0) ? (
            <View style={[styles.prayerTableCard, styles.jumuahTableCard]}>
              <View style={[styles.tableRow, styles.tableHeaderRow, styles.tableRowDivider]}>
                <Text style={[styles.rowName, styles.rowHeaderLabel]}>{"Jumu'ah"}</Text>
                <Text style={[styles.rowTime, styles.rowHeaderLabel]}>Khutbah</Text>
              </View>
              {loading && !jumuahTimes ? (
                [0].map((i) => (
                  <View key={`j-sk-${i}`} style={styles.tableRow}>
                    <View style={styles.skelName} />
                    <View style={styles.skelTime} />
                  </View>
                ))
              ) : (
                jumuahTimes!.times.map((time, index) => {
                  const isLast = index === jumuahTimes!.times.length - 1;
                  const label =
                    jumuahTimes!.times.length === 1
                      ? "Jumu'ah"
                      : `${getOrdinalSuffix(index + 1)} Jumu'ah`;

                  return (
                    <View
                      key={time.id}
                      style={[styles.tableRow, !isLast && styles.tableRowDivider]}
                    >
                      <Text
                        style={styles.rowName}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {label}
                      </Text>
                      <Text style={[styles.rowTime, styles.rowIqama]}>
                        {time.khutbah || "--:--"}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          ) : null}

          {updating && (prayerTimes || jumuahTimes || mosqueSettings) && (
            <View style={styles.updatingContainer}>
              <UpdatingBanner text="Updating…" />
            </View>
          )}
          {!updating && isStale && prayerTimes && (
            <View style={styles.staleBanner}>
              <Text style={styles.staleBannerText}>
                Prayer times last updated on{" "}
                {formatDateTimeDisplay(
                  prayerTimes?.last_updated || mosqueSettings?.last_updated,
                ) || "a previous day"}
                .
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (
  theme: ReturnType<typeof useTheme>,
  ms: (size: number, factor?: number) => number,
  fontScale: number,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface.muted,
    },
    scrollView: {
      flex: 1,
    },
    headerGradient: {
      paddingBottom: theme.spacing.lg,
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
      padding: ms(6, 0.1),
      borderRadius: theme.spacing.lg,
      backgroundColor: "rgba(255, 255, 255, 0.15)",
    },
    heroSection: {
      alignItems: "center",
      paddingHorizontal: theme.spacing.lg,
      paddingTop: ms(2, 0.1),
      paddingBottom: ms(2, 0.1),
    },
    logoLarge: {
      width: ms(52),
      height: ms(52),
    },
    logoHalo: {
      width: ms(72),
      height: ms(72),
      borderRadius: ms(36),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.06)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.12)",
      marginBottom: theme.spacing.sm,
    },
    mosqueName: {
      fontSize: ms(18, 0.4) * fontScale,
      fontWeight: "700",
      color: theme.colors.text.header,
      marginBottom: ms(2, 0.1),
      textAlign: "center",
    },
    currentDate: {
      fontSize: ms(12, 0.3) * fontScale,
      color: "rgba(255, 255, 255, 0.7)",
      textAlign: "center",
    },
    prayerCardsContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    prayerTableCard: {
      backgroundColor: theme.colors.surface.base,
      borderRadius: theme.radius.lg,
      paddingVertical: theme.spacing.sm,
      ...theme.shadow.soft,
    },
    jumuahTableCard: {
      marginTop: theme.spacing.md,
    },
    tableRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: ms(12, 0.1),
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
    rowName: {
      flex: 1.4,
      fontSize: ms(15, 0.5) * fontScale,
      color: theme.colors.text.strong,
      textAlign: "left",
      fontWeight: "700",
      flexShrink: 1,
    },
    rowTime: {
      flex: 1,
      textAlign: "right",
      fontSize: ms(15, 0.5) * fontScale,
      color: theme.colors.text.base,
      fontWeight: "700",
    },
    rowHeaderLabel: {
      fontSize: ms(11, 0.3) * fontScale,
      color: theme.colors.text.muted,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    rowIqama: {
      color: theme.colors.brand.navy[600],
    },
    rowIqamaEmpty: {
      color: theme.colors.text.muted,
      fontWeight: "400",
    },
    rowIqamaNext: {
      color: theme.colors.brand.gold[600],
    },
    nextPrayerText: {
      color: theme.colors.brand.navy[700],
    },
    staleBanner: {
      backgroundColor: theme.colors.accent.amberSoft,
      borderRadius: ms(8, 0.1),
      paddingHorizontal: ms(12, 0.1),
      paddingVertical: ms(8, 0.1),
      marginTop: ms(12, 0.1),
      borderWidth: 1,
      borderColor: theme.colors.brand.gold[400],
    },
    staleBannerText: {
      fontSize: ms(12, 0.3) * fontScale,
      color: theme.colors.text.strong,
      fontWeight: "600",
    },
    skelName: {
      flex: 1.4,
      height: ms(16),
      borderRadius: ms(4, 0.1),
      backgroundColor: theme.colors.surface.soft,
    },
    skelTime: {
      flex: 1,
      height: ms(18),
      borderRadius: ms(4, 0.1),
      backgroundColor: theme.colors.surface.soft,
      marginHorizontal: ms(4, 0.1),
    },
    updatingContainer: {
      marginTop: ms(12, 0.1),
      alignItems: "center",
    },
  });
