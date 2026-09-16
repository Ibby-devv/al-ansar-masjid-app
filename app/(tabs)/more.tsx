import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  Vibration,
  View,
  useWindowDimensions,
} from "react-native";
import DeviceInfo from "react-native-device-info";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyState from "../../components/EmptyState";
import PatternOverlay from "../../components/PatternOverlay";
import {
  ListRow,
  Panel,
  ScreenIntro,
} from "../../components/ui/calm";
import InstagramIcon from "../../components/ui/InstagramIcon";
import { AppTheme, useTheme } from "../../contexts/ThemeContext";
import { useFirebaseData } from "../../hooks/useFirebaseData";
import { useResponsive } from "../../hooks/useResponsive";

type AboutRow = {
  key: string;
  title: string;
  subtitle: string;
  hint?: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress?: () => void;
};

export default function MoreScreen(): React.JSX.Element {
  const theme = useTheme();
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const { mosqueSettings, loading, error } = useFirebaseData();

  const styles = useMemo(
    () => createStyles(theme, ms, fontScale),
    [theme, ms, fontScale]
  );

  const appVersion = DeviceInfo.getVersion();
  const buildNumber = DeviceInfo.getBuildNumber();

  const toDisplayDomain = (raw?: string): string => {
    if (!raw) return "";
    try {
      const u = raw.startsWith("http") ? new URL(raw) : new URL(`https://${raw}`);
      return u.host + (u.pathname && u.pathname !== "/" ? u.pathname : "");
    } catch {
      return raw;
    }
  };

  const extractHandle = (raw?: string): string => {
    if (!raw) return "";
    const v = raw.trim();
    if (v.startsWith("@")) return v.slice(1);
    try {
      if (v.startsWith("http")) {
        const u = new URL(v);
        const parts = u.pathname.split("/").filter(Boolean);
        return parts[0] || "";
      }
      if (v.startsWith("www.")) return v.slice(4);
      if (v.includes("/")) return v.split("/")[0];
      return v;
    } catch {
      return v.replace(/^www\./, "");
    }
  };

  const triggerHaptic = async (): Promise<void> => {
    try {
      if (Platform.OS === "ios") {
        await Haptics.selectionAsync();
      } else if (Platform.OS === "android") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Vibration.vibrate(10);
      }
    } catch {
      if (Platform.OS === "android") {
        Vibration.vibrate(10);
      }
    }
  };

  const handlePress = async (
    type: "phone" | "email" | "website" | "map" | "facebook" | "instagram"
  ): Promise<void> => {
    await triggerHaptic();
    let url = "";

    switch (type) {
      case "phone":
        if (mosqueSettings?.phone) {
          url = `tel:${mosqueSettings.phone.replace(/[^0-9]/g, "")}`;
        }
        break;
      case "email":
        if (mosqueSettings?.email) {
          url = `mailto:${mosqueSettings.email}`;
        }
        break;
      case "website":
        if (mosqueSettings?.website) {
          url = mosqueSettings.website.startsWith("http")
            ? mosqueSettings.website
            : `https://${mosqueSettings.website}`;
        }
        break;
      case "map":
        if (mosqueSettings?.address) {
          const encodedAddress = encodeURIComponent(mosqueSettings.address);
          url = `https://maps.google.com/?q=${encodedAddress}`;
        }
        break;
      case "facebook": {
        const fb = (mosqueSettings as { facebook?: string } | null)?.facebook;
        if (fb) {
          const webUrl = fb.startsWith("http") ? fb : `https://facebook.com/${fb}`;
          const appUrl = `fb://facewebmodal/f?href=${encodeURIComponent(webUrl)}`;
          try {
            const can = await Linking.canOpenURL(appUrl);
            url = can ? appUrl : webUrl;
          } catch {
            url = webUrl;
          }
        }
        break;
      }
      case "instagram": {
        const raw = (mosqueSettings as { instagram?: string } | null)?.instagram;
        if (raw) {
          const handle = extractHandle(raw);
          const webUrl = raw.startsWith("http")
            ? raw
            : `https://instagram.com/${handle || raw}`;
          const appUrl = handle ? `instagram://user?username=${handle}` : "";
          try {
            if (appUrl) {
              const can = await Linking.canOpenURL(appUrl);
              url = can ? appUrl : webUrl;
            } else {
              url = webUrl;
            }
          } catch {
            url = webUrl;
          }
        }
        break;
      }
    }

    if (url) {
      Linking.openURL(url).catch((err) =>
        console.error("Error opening link:", err)
      );
    }
  };

  const facebook = (mosqueSettings as { facebook?: string } | null)?.facebook;
  const instagram = (mosqueSettings as { instagram?: string } | null)?.instagram;
  const hasConnect = Boolean(facebook || instagram);

  const aboutRows: AboutRow[] = [];
  if (mosqueSettings?.address) {
    aboutRows.push({
      key: "address",
      title: "Address",
      subtitle: mosqueSettings.address,
      hint: "Opens Google Maps",
      icon: "location-outline",
      onPress: () => {
        void handlePress("map");
      },
    });
  }
  if (mosqueSettings?.phone) {
    aboutRows.push({
      key: "phone",
      title: "Phone",
      subtitle: mosqueSettings.phone,
      hint: "Opens dialer",
      icon: "call-outline",
      onPress: () => {
        void handlePress("phone");
      },
    });
  }
  if (mosqueSettings?.email) {
    aboutRows.push({
      key: "email",
      title: "Email",
      subtitle: mosqueSettings.email,
      hint: "Compose email",
      icon: "mail-outline",
      onPress: () => {
        void handlePress("email");
      },
    });
  }
  if (mosqueSettings?.website) {
    aboutRows.push({
      key: "website",
      title: "Website",
      subtitle: toDisplayDomain(mosqueSettings.website),
      hint: "Opens in browser",
      icon: "globe-outline",
      onPress: () => {
        void handlePress("website");
      },
    });
  }
  if (mosqueSettings?.imam) {
    aboutRows.push({
      key: "imam",
      title: "Imam",
      subtitle: mosqueSettings.imam,
      icon: "ribbon-outline",
    });
  }

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
            <Text style={styles.headerTitle}>More</Text>
            <Text style={styles.headerSubtitle}>
              About {mosqueSettings?.name || "Al Ansar"}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {!loading && !mosqueSettings ? (
          <EmptyState
            variant={error ? "error" : "offline"}
            icon="information-circle-outline"
            title="Mosque Information Unavailable"
            message={
              error ||
              "Please check your internet connection and try again. Mosque details will appear when you're back online."
            }
          />
        ) : mosqueSettings ? (
          <>
            <ScreenIntro
              title="About"
              subtitle="Masjid details and contact"
            />
            {aboutRows.length > 0 ? (
              <Panel flush style={styles.panel}>
                {aboutRows.map((row, index) => (
                  <ListRow
                    key={row.key}
                    title={row.title}
                    subtitle={row.subtitle}
                    hint={row.hint}
                    icon={row.icon}
                    onPress={row.onPress}
                    last={index === aboutRows.length - 1}
                  />
                ))}
              </Panel>
            ) : null}

            {hasConnect ? (
              <>
                <ScreenIntro
                  title="Connect"
                  subtitle="Follow us for updates"
                  style={styles.sectionIntro}
                />
                <Panel flush style={styles.panel}>
                  {facebook ? (
                    <ListRow
                      title="Facebook"
                      subtitle="Follow us on Facebook"
                      hint={toDisplayDomain(facebook)}
                      icon="logo-facebook"
                      iconColor="#1877F2"
                      iconBackground={theme.colors.accent.blueSoft}
                      onPress={() => handlePress("facebook")}
                      last={!instagram}
                    />
                  ) : null}
                  {instagram ? (
                    <ListRow
                      title="Instagram"
                      subtitle="Follow us on Instagram"
                      hint={`@${extractHandle(instagram)}`}
                      iconNode={<InstagramIcon size={ms(20, 0.2)} />}
                      onPress={() => handlePress("instagram")}
                      last
                    />
                  ) : null}
                </Panel>
              </>
            ) : null}
          </>
        ) : null}

        <ScreenIntro
          title="App"
          subtitle="Version and developer"
          style={mosqueSettings ? styles.sectionIntro : undefined}
        />
        <Panel flush style={styles.panel}>
          <ListRow
            title="Version"
            subtitle={`${appVersion}${buildNumber ? ` (${buildNumber})` : ""}`}
            icon="shield-checkmark-outline"
          />
          <ListRow
            title="Developed by"
            subtitle="Ibrahim Eter"
            icon="code-slash-outline"
            last
          />
        </Panel>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Built for the Muslim community
          </Text>
          <Text style={styles.footerSubtext}>
            © 2025 Al Ansar Masjid Yagoona
          </Text>
        </View>
      </ScrollView>
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
    headerContent: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: ms(22, 0.25) * fontScale,
      fontWeight: "600",
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
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: ms(40, 0.1),
    },
    sectionIntro: {
      marginTop: theme.spacing.xl,
    },
    panel: {
      marginBottom: theme.spacing.sm,
    },
    footer: {
      marginTop: theme.spacing.xl,
      paddingTop: theme.spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.soft,
      alignItems: "center",
    },
    footerText: {
      fontSize: ms(13, 0.2) * fontScale,
      color: theme.colors.text.muted,
      marginBottom: ms(4, 0.05),
      textAlign: "center",
    },
    footerSubtext: {
      fontSize: ms(12, 0.15) * fontScale,
      color: theme.colors.text.subtle,
      textAlign: "center",
    },
  });
