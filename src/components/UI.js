import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { colors, fonts, radii, shadow } from "../theme";

export function Chip({ children, tone = "sage" }) {
  const tones = {
    sage: { bg: colors.sagePale, color: colors.sageInk },
    teal: { bg: "rgba(78,123,128,0.14)", color: colors.tealDeep },
    peach: { bg: "rgba(216,155,119,0.20)", color: colors.peachDeep },
  };
  return (
    <View style={[styles.chip, { backgroundColor: tones[tone].bg }]}>
      <Text style={[styles.chipText, { color: tones[tone].color }]}>{children}</Text>
    </View>
  );
}

export function PrimaryButton({ children, onPress, style, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryButton,
        shadow.md,
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.6 },
        style,
      ]}
    >
      <Text style={styles.primaryButtonText}>{children}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ children, onPress, style }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.7 }, style]}>
      <Text style={styles.secondaryButtonText}>{children}</Text>
    </Pressable>
  );
}

export function IconCircleButton({ icon: Icon, onPress, style, color = colors.charcoal }) {
  return (
    <Pressable onPress={onPress} style={[styles.iconCircle, shadow.sm, style]}>
      <Icon size={19} color={color} strokeWidth={2.2} />
    </Pressable>
  );
}

export function ScreenHeader({ title, onBack, right }) {
  return (
    <View style={styles.header}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        {onBack && <IconCircleButton icon={ChevronLeft} onPress={onBack} />}
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

export function EmptyState({ icon: Icon, title, body }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon size={24} color={colors.sageDeep} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: radii.pill,
    alignSelf: "flex-start",
  },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 12.5 },
  primaryButton: {
    backgroundColor: colors.sageDeep,
    borderRadius: radii.lg,
    paddingVertical: 15,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 15.5 },
  secondaryButton: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  secondaryButtonText: { color: colors.charcoal, fontFamily: fonts.bodyBold, fontSize: 15 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
  },
  headerTitle: { fontFamily: fonts.display, fontSize: 21, color: colors.charcoal },
  empty: { alignItems: "center", paddingHorizontal: 30, paddingTop: 48 },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.sagePale,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: { fontFamily: fonts.display, fontSize: 17, color: colors.charcoal, marginBottom: 6 },
  emptyBody: { fontFamily: fonts.bodyRegular, fontSize: 14, color: colors.charcoalSoft, textAlign: "center", lineHeight: 20 },
});
