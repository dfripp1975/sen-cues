import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Heart, MessageCircle, ChevronRight, Lock } from "lucide-react-native";
import { colors, fonts, radii, shadow } from "../theme";
import { CATEGORIES } from "../data/content";

function truncate(text, n) {
  if (!text) return "";
  return text.length > n ? text.slice(0, n).replace(/\s+\S*$/, "") + "…" : text;
}

export default function CueTile({ situation, favourite, locked, tone = "sage", onOpen, onToggleFav, compact }) {
  const bg = tone === "teal" ? colors.teal : colors.sage;
  const bgDeep = tone === "teal" ? colors.tealDeep : colors.sageDeep;
  const catLabel = CATEGORIES.find((c) => c.id === situation.category)?.label || "";

  return (
    <View style={{ width: compact ? 172 : "100%" }}>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: bgDeep, borderRadius: radii.xl, opacity: 0.55, transform: [{ rotate: "-3.5deg" }, { scale: 0.965 }] },
        ]}
      />
      <Pressable
        onPress={() => onOpen(locked)}
        style={({ pressed }) => [
          styles.card,
          shadow.md,
          { backgroundColor: bg, minHeight: compact ? 132 : 148, padding: compact ? 16 : 20 },
          pressed && { opacity: 0.92 },
        ]}
      >
        <Text style={styles.eyebrow}>
          {catLabel} · Age {situation.age}
        </Text>
        <Text style={[styles.title, { fontSize: compact ? 16.5 : 19.5 }]}>{situation.title}</Text>
        {!compact && <Text style={styles.body}>{truncate(situation.whatMayBeHappening, 96)}</Text>}
        <View style={styles.footer}>
          <Pressable onPress={() => onToggleFav(situation.id)} style={styles.heartButton} hitSlop={8}>
            <Heart size={14} color={colors.white} fill={favourite ? colors.white : "transparent"} />
          </Pressable>
          <MessageCircle size={15} color="rgba(255,255,255,0.7)" />
          <View style={{ marginLeft: "auto" }}>
            {locked ? <Lock size={15} color={colors.white} /> : <ChevronRight size={17} color={colors.white} />}
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.xl, justifyContent: "flex-start" },
  eyebrow: { fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 0.4, textTransform: "uppercase", color: "rgba(255,255,255,0.78)", marginBottom: 6 },
  title: { fontFamily: fonts.display, color: colors.white, lineHeight: 24, marginBottom: 7 },
  body: { fontFamily: fonts.bodyRegular, fontSize: 12.5, lineHeight: 18, color: "rgba(255,255,255,0.88)", marginBottom: 12 },
  footer: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: "auto" },
  heartButton: {
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
});
