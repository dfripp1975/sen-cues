import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LEARN_ARTICLES } from "../data/content";
import { colors, fonts, radii, shadow } from "../theme";

// TODO: articles are placeholders (title + read time only). Full article body content
// needs writing and either a detail screen or a Supabase-backed CMS table. See CLAUDE.md.
export default function LearnScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={["top"]}>
      <View style={{ paddingHorizontal: 18, paddingTop: 16 }}>
        <Text style={styles.h1}>Learn</Text>
        <Text style={styles.sub}>Short reads, for when you have a spare minute.</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 30, gap: 10 }}>
        {LEARN_ARTICLES.map((a) => (
          <View key={a.id} style={[styles.card, shadow.sm]}>
            <Text style={styles.category}>{a.category}</Text>
            <Text style={styles.title}>{a.title}</Text>
            <Text style={styles.minutes}>Read in {a.minutes} minutes</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: fonts.display, fontSize: 24, color: colors.charcoal, marginBottom: 4 },
  sub: { fontFamily: fonts.bodyRegular, fontSize: 13.5, color: colors.charcoalSoft, marginBottom: 18 },
  card: { backgroundColor: colors.white, borderRadius: radii.lg, padding: 16 },
  category: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: colors.tealDeep, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 5 },
  title: { fontFamily: fonts.display, fontSize: 15.5, color: colors.charcoal, marginBottom: 6 },
  minutes: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.charcoalSoft },
});
