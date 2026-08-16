import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ListChecks, ArrowRight, Clock, Wrench, Sparkles, Lock, ChevronRight } from "lucide-react-native";

import { colors, fonts, radii, shadow } from "../theme";
import { usePremium } from "../hooks/usePremium";

const TOOLS = [
  { id: "choice", label: "Visual Choice Maker", icon: ListChecks, desc: "Two clear options, nothing more" },
  { id: "firstthen", label: "First / Then", icon: ArrowRight, desc: "Show what's next, simply" },
  { id: "countdown", label: "Countdown", icon: Clock, desc: "A visual sense of time" },
  { id: "breakdown", label: "Break It Down", icon: Wrench, desc: "Turn a big task into small steps" },
  { id: "ai", label: "Create a Cue", icon: Sparkles, desc: "AI-personalised, for anything not yet in the library", premium: true },
];

export default function ToolkitScreen({ navigation }) {
  const { isPremium, openPaywall } = usePremium(navigation);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={["top"]}>
      <View style={{ paddingHorizontal: 18, paddingTop: 16 }}>
        <Text style={styles.h1}>Parent toolkit</Text>
        <Text style={styles.sub}>Small tools for hard moments.</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 30, gap: 10 }}>
        {TOOLS.map((t) => {
          const locked = t.premium && !isPremium;
          return (
            <Pressable
              key={t.id}
              onPress={() => (locked ? openPaywall() : navigation.navigate("ToolDetail", { toolId: t.id }))}
              style={[styles.row, shadow.sm]}
            >
              <View style={[styles.iconWrap, { backgroundColor: t.premium ? "rgba(216,155,119,0.20)" : colors.sagePale }]}>
                <t.icon size={19} color={t.premium ? colors.peachDeep : colors.sageInk} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.label}>{t.label}</Text>
                  {locked && <Lock size={12} color={colors.charcoalSoft} />}
                </View>
                <Text style={styles.desc}>{t.desc}</Text>
              </View>
              <ChevronRight size={17} color={colors.charcoalSoft} />
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: fonts.display, fontSize: 24, color: colors.charcoal, marginBottom: 4 },
  sub: { fontFamily: fonts.bodyRegular, fontSize: 13.5, color: colors.charcoalSoft, marginBottom: 18 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.white, borderRadius: radii.lg, padding: 15 },
  iconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  label: { fontFamily: fonts.bodyBold, fontSize: 14.5 },
  desc: { fontFamily: fonts.bodyRegular, fontSize: 12.5, color: colors.charcoalSoft },
});
