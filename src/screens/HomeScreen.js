import React, { useMemo, useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from "react-native";
import { Search, ArrowRight } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CATEGORIES, SITUATIONS } from "../data/content";
import { colors, fonts, radii, shadow } from "../theme";
import CueTile from "../components/CueTile";
import { useFavourites } from "../hooks/useFavourites";

export default function HomeScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const { favourites, toggleFavourite } = useFavourites();

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return SITUATIONS.filter(
      (s) => s.title.toLowerCase().includes(q) || s.tags.some((t) => t.includes(q)) || s.whatMayBeHappening.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [query]);

  const dailyCues = useMemo(() => {
    const picks = ["getting-dressed", "school-refusal", "bedtime"];
    return SITUATIONS.filter((s) => picks.includes(s.id));
  }, []);

  const openSituation = (s) => navigation.navigate("SituationDetail", { situationId: s.id });
  const openCategory = (c) => navigation.navigate("CategoryList", { categoryId: c.id });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ paddingHorizontal: 18, paddingTop: 12 }}>
          <Text style={styles.greeting}>Hello</Text>
          <Text style={styles.h1}>What's happening right now?</Text>
          <Text style={styles.sub}>Choose what you're dealing with and we'll help you find the words.</Text>

          <View style={styles.searchWrap}>
            <Search size={17} color={colors.charcoalSoft} style={{ marginRight: 8 }} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Describe what's happening…"
              placeholderTextColor={colors.charcoalSoft}
              style={styles.searchInput}
            />
          </View>

          {query.trim() ? (
            <View style={{ marginBottom: 18, gap: 8 }}>
              {results.length === 0 ? (
                <Text style={styles.noResults}>No exact matches yet. Try Create a Cue in the Toolkit.</Text>
              ) : (
                results.map((r) => (
                  <Pressable key={r.id} onPress={() => openSituation(r)} style={[styles.resultRow, shadow.sm]}>
                    <Text style={styles.resultText}>{r.title}</Text>
                    <ArrowRight size={16} color={colors.charcoalSoft} />
                  </Pressable>
                ))
              )}
            </View>
          ) : null}

          <Pressable onPress={() => navigation.navigate("NowMode")} style={[styles.nowButton, shadow.lg]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nowEyebrow}>Right now</Text>
              <Text style={styles.nowTitle}>I need help right now</Text>
            </View>
            <View style={styles.nowArrow}>
              <ArrowRight size={19} color={colors.white} />
            </View>
          </Pressable>
        </View>

        {!query.trim() && (
          <>
            <Text style={styles.sectionTitle}>Today's cues</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, gap: 12, paddingBottom: 26 }}>
              {dailyCues.map((c, i) => (
                <CueTile
                  key={c.id}
                  situation={c}
                  compact
                  favourite={favourites.has(c.id)}
                  locked={false}
                  tone={i % 2 === 0 ? "sage" : "teal"}
                  onOpen={() => openSituation(c)}
                  onToggleFav={toggleFavourite}
                />
              ))}
            </ScrollView>

            <View style={{ paddingHorizontal: 18 }}>
              <Text style={[styles.sectionTitle, { paddingHorizontal: 0, marginBottom: 12 }]}>Browse by situation</Text>
              <View style={styles.grid}>
                {CATEGORIES.map((cat) => (
                  <Pressable key={cat.id} onPress={() => openCategory(cat)} style={[styles.catCard, shadow.sm]}>
                    <Text style={{ fontSize: 26 }}>{cat.emoji}</Text>
                    <Text style={styles.catLabel}>{cat.label}</Text>
                    <Text style={styles.catBlurb}>{cat.blurb}</Text>
                    <Text style={styles.catCount}>{SITUATIONS.filter((s) => s.category === cat.id).length} cues</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  greeting: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.sageDeep, marginBottom: 4 },
  h1: { fontFamily: fonts.display, fontSize: 26, color: colors.charcoal, marginBottom: 4, lineHeight: 32 },
  sub: { fontFamily: fonts.bodyRegular, fontSize: 14, color: colors.charcoalSoft, marginBottom: 18 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 15,
    height: 48,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 14.5, color: colors.charcoal },
  noResults: { fontFamily: fonts.bodyRegular, fontSize: 13.5, color: colors.charcoalSoft },
  resultRow: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultText: { fontFamily: fonts.bodyBold, fontSize: 14 },
  nowButton: {
    borderRadius: radii.lg,
    padding: 20,
    backgroundColor: colors.tealDeep,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },
  nowEyebrow: { fontFamily: fonts.bodyBold, fontSize: 11.5, letterSpacing: 0.5, textTransform: "uppercase", color: "rgba(255,255,255,0.85)", marginBottom: 3 },
  nowTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.white },
  nowArrow: { width: 42, height: 42, borderRadius: radii.pill, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontFamily: fonts.display, fontSize: 16.5, color: colors.charcoal, paddingHorizontal: 18, marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  catCard: { width: "47.5%", backgroundColor: colors.white, borderRadius: radii.lg, padding: 15, gap: 6 },
  catLabel: { fontFamily: fonts.display, fontSize: 15, color: colors.charcoal },
  catBlurb: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.charcoalSoft },
  catCount: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.sageDeep, letterSpacing: 0.3 },
});
