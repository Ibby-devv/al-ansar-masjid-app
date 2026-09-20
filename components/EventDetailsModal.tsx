import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { PrimaryButton } from "./ui/calm";
import { AppTheme, useTheme } from "../contexts/ThemeContext";
import { useResponsive } from "../hooks/useResponsive";
import type { Event } from "../types";

interface EventDetailsModalProps {
  visible: boolean;
  event: Event | null;
  categoryLabel: string;
  categoryColors: { bg: string; text: string };
  formattedDate: string;
  onClose: () => void;
}

export default function EventDetailsModal({
  visible,
  event,
  categoryLabel,
  categoryColors,
  formattedDate,
  onClose,
}: EventDetailsModalProps): React.JSX.Element | null {
  const theme = useTheme();
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(
    () => createStyles(theme, ms, fontScale),
    [theme, ms, fontScale]
  );

  if (!event) {
    return (
      <Modal visible={false} transparent onRequestClose={onClose}>
        <View />
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss event details"
        />
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Event details
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={styles.closeButton}
            >
              <Ionicons
                name="close"
                size={ms(22, 0.2)}
                color={theme.colors.text.muted}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {event.image_url ? (
              <Image
                source={{ uri: event.image_url }}
                style={styles.image}
                resizeMode="cover"
                accessibilityLabel={`${event.title} image`}
              />
            ) : null}

            <View style={styles.titleRow}>
              <Text style={styles.title}>{event.title}</Text>
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
                  {categoryLabel}
                </Text>
              </View>
            </View>

            <View style={styles.metaBlock}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="calendar-outline"
                  size={ms(16, 0.15)}
                  color={theme.colors.icon.muted}
                />
                <Text style={styles.metaText}>{formattedDate}</Text>
              </View>

              <View style={styles.metaItem}>
                <Ionicons
                  name="time-outline"
                  size={ms(16, 0.15)}
                  color={theme.colors.icon.muted}
                />
                <Text style={styles.metaText}>{event.time}</Text>
              </View>

              {event.location ? (
                <View style={styles.metaItem}>
                  <Ionicons
                    name="location-outline"
                    size={ms(16, 0.15)}
                    color={theme.colors.icon.muted}
                  />
                  <Text style={styles.metaText}>{event.location}</Text>
                </View>
              ) : null}

              {event.speaker ? (
                <View style={styles.metaItem}>
                  <Ionicons
                    name="person-outline"
                    size={ms(16, 0.15)}
                    color={theme.colors.icon.muted}
                  />
                  <Text style={styles.metaText}>{event.speaker}</Text>
                </View>
              ) : null}

              {event.rsvp_enabled ? (
                <View style={styles.metaItem}>
                  <Ionicons
                    name="people-outline"
                    size={ms(16, 0.15)}
                    color={theme.colors.icon.muted}
                  />
                  <Text style={styles.metaText}>
                    {event.rsvp_count || 0} / {event.rsvp_limit || "Unlimited"}{" "}
                    RSVPs
                  </Text>
                </View>
              ) : null}
            </View>

            {event.description ? (
              <Text style={styles.description}>{event.description}</Text>
            ) : null}

            <PrimaryButton
              label="Close"
              onPress={onClose}
              style={styles.closeCta}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (
  theme: AppTheme,
  ms: (size: number, factor?: number) => number,
  fontScale: number
) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
      justifyContent: "center",
      alignItems: "center",
      padding: theme.spacing.xl,
    },
    container: {
      backgroundColor: theme.colors.surface.base,
      borderRadius: theme.radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.soft,
      width: "100%",
      maxWidth: ms(500, 0.3),
      maxHeight: "90%",
      overflow: "hidden",
      zIndex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.soft,
    },
    headerTitle: {
      flex: 1,
      fontSize: ms(13, 0.2) * fontScale,
      fontWeight: "600",
      color: theme.colors.text.muted,
      letterSpacing: -0.1,
    },
    closeButton: {
      padding: ms(4, 0.05),
    },
    scrollView: {
      flexGrow: 1,
    },
    content: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    image: {
      width: "100%",
      height: ms(160, 0.2),
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.border.base,
      marginBottom: theme.spacing.lg,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    title: {
      flex: 1,
      fontSize: ms(20, 0.25) * fontScale,
      fontWeight: "700",
      color: theme.colors.text.strong,
      letterSpacing: -0.3,
    },
    categoryChip: {
      borderRadius: theme.radius.pill,
      paddingHorizontal: ms(8, 0.1),
      paddingVertical: ms(4, 0.05),
      maxWidth: ms(110, 0.2),
      flexShrink: 0,
    },
    categoryChipText: {
      fontSize: ms(10, 0.15) * fontScale,
      fontWeight: "600",
    },
    metaBlock: {
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.spacing.sm,
    },
    metaText: {
      flex: 1,
      fontSize: ms(14, 0.2) * fontScale,
      color: theme.colors.text.strong,
      lineHeight: ms(20, 0.2),
    },
    description: {
      fontSize: ms(14, 0.2) * fontScale,
      color: theme.colors.text.muted,
      lineHeight: ms(21, 0.2),
      marginBottom: theme.spacing.xl,
    },
    closeCta: {
      marginTop: theme.spacing.sm,
    },
  });
