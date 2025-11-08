import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Theme } from "../../constants/theme";

type NextBannerProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  text: string;
  style?: ViewStyle | ViewStyle[];
};

export default function NextBanner({ icon = "flash", text, style }: NextBannerProps) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name={icon as any} size={24} color={Theme.colors.brand.gold[600]} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Theme.colors.accent.amberSoft,
    borderColor: Theme.colors.brand.gold[400] || Theme.colors.accent.amber,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    marginBottom: 12,
  },
  text: {
    color: "#92400e",
    fontSize: 16,
    fontWeight: "800",
  },
});
