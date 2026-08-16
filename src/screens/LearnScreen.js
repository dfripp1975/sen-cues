import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight } from "lucide-react-native";

import { LEARN_ARTICLES } from "../data/content";
import { colors, fonts, radii, shadow } from "../theme";

export default function LearnScreen({ navigation }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={["top"]}>
      <View style={{ paddingHorizontal: 18, paddingTop: 16 }}>
        <Text style={styles.h1}>Learn</Text>
        <Text style={styles.sub}>Short reads, for when you have a spare minute.</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 30, gap: 10 }}>
        {LEARN_ARTICLES.map((a) => (
          <Pressable
            key={a.id}
            onPress={() => navigation.navigate("LearnArticle", { articleId: a.id })}
            style={({ pressed }) => [styles.card, shadow.sm, pressed && { opacity: 0.85 }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.category}>{a.category}</Text>
              <Text style={styles.title}>{a.title}</Text>
              <Text style={styles.minutes}>Read in {a.minutes} minutes</Text>
            </View>
            <ChevronRight size={17} color={colors.charcoalSoft} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: fonts.display, fontSize: 24, color: colors.charcoal, marginBottom: 4 },
  sub: { fontFamily: fonts.bodyRegular, fontSize: 13.5, color: colors.charcoalSoft, marginBottom: 18 },
  card: { backgroundColor: colors.white, borderRadius: radii.lg, padding: 16, flexDirection: "row", alignItems: "center", gap: 10 },
  category: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: colors.tealDeep, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 5 },
  title: { fontFamily: fonts.display, fontSize: 15.5, color: colors.charcoal, marginBottom: 6 },
  minutes: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.charcoalSoft },
});
