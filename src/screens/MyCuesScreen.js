import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Heart } from "lucide-react-native";

import { CATEGORIES, SITUATIONS } from "../data/content";
import { colors, fonts } from "../theme";
import { EmptyState } from "../components/UI";
import CueTile from "../components/CueTile";
import { useFavourites } from "../hooks/useFavourites";

export default function MyCuesScreen({ navigation }) {
  const { favourites, toggleFavourite } = useFavourites();
  const saved = SITUATIONS.filter((s) => favourites.has(s.id));
  const grouped = CATEGORIES.map((cat) => ({ cat, items: saved.filter((s) => s.category === cat.id) })).filter(
    (g) => g.items.length > 0
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={["top"]}>
      <View style={{ paddingHorizontal: 18, paddingTop: 16 }}>
        <Text style={styles.h1}>My cues</Text>
        <Text style={styles.sub}>Everything you've saved, in one place.</Text>
      </View>
      {saved.length === 0 ? (
        <EmptyState icon={Heart} title="Nothing saved yet" body="Tap the heart on any cue to keep it here for quick access next time." />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 30, gap: 22 }}>
          {grouped.map(({ cat, items }) => (
            <View key={cat.id} style={{ gap: 10 }}>
              <Text style={styles.groupLabel}>
                {cat.emoji} {cat.label}
              </Text>
              <View style={{ gap: 14 }}>
                {items.map((s, i) => (
                  <CueTile
                    key={s.id}
                    situation={s}
                    favourite
                    locked={false}
                    tone={i % 2 === 0 ? "sage" : "teal"}
                    onOpen={() => navigation.navigate("SituationDetail", { situationId: s.id })}
                    onToggleFav={toggleFavourite}
                  />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: fonts.display, fontSize: 24, color: colors.charcoal, marginBottom: 4 },
  sub: { fontFamily: fonts.bodyRegular, fontSize: 13.5, color: colors.charcoalSoft, marginBottom: 6 },
  groupLabel: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.sageDeep, textTransform: "uppercase", letterSpacing: 0.4 },
});
