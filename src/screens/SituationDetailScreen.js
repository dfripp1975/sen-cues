import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { Heart, AlertTriangle, MessageCircle, X, ListChecks, Sparkles, ArrowRight, Check } from "lucide-react-native";

import { SITUATIONS } from "../data/content";
import { colors, fonts, radii, shadow } from "../theme";
import { ScreenHeader, Chip, IconCircleButton } from "../components/UI";
import { useFavourites } from "../hooks/useFavourites";

function Section({ label, icon: Icon, children }) {
  return (
    <View style={{ marginTop: 22 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <Icon size={16} color={colors.tealDeep} />
        <Text style={styles.sectionLabel}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

function QuickCueReveal({ cue }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} style={[styles.quickCard, shadow.md, { marginTop: 6 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Sparkles size={14} color="#4A2E1C" />
          <Text style={styles.quickEyebrow}>Quick cue</Text>
        </View>
        <Text style={styles.quickPrompt}>Give me the one thing to say</Text>
      </Pressable>
    );
  }
  return (
    <View style={[styles.quickCard, shadow.lg, { marginTop: 6 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Sparkles size={14} color="#4A2E1C" />
        <Text style={styles.quickEyebrow}>Say this</Text>
      </View>
      <Text style={styles.quickCue}>"{cue}"</Text>
      <Pressable onPress={() => setOpen(false)} style={styles.closeChip}>
        <Text style={styles.closeChipText}>Close</Text>
      </Pressable>
    </View>
  );
}

export default function SituationDetailScreen({ route, navigation }) {
  const { situationId } = route.params;
  const situation = SITUATIONS.find((s) => s.id === situationId);
  const { favourites, toggleFavourite } = useFavourites();
  const [copiedIdx, setCopiedIdx] = useState(-1);
  const isFav = favourites.has(situationId);

  const copy = async (text, i) => {
    await Clipboard.setStringAsync(text);
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(-1), 1400);
  };

  if (!situation) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={["top"]}>
      <ScreenHeader
        title={situation.title}
        onBack={() => navigation.goBack()}
        right={
          <IconCircleButton
            icon={Heart}
            onPress={() => toggleFavourite(situationId)}
            color={isFav ? colors.peachDeep : colors.charcoal}
          />
        }
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}>
        <View style={{ flexDirection: "row", gap: 6, marginBottom: 4 }}>
          <Chip tone="sage">Age {situation.age}</Chip>
          {isFav && <Chip tone="peach">Saved</Chip>}
        </View>

        <Section label="What may be happening" icon={AlertTriangle}>
          <Text style={styles.paragraph}>{situation.whatMayBeHappening}</Text>
        </Section>

        <Section label="What can I say" icon={MessageCircle}>
          <View style={{ gap: 8 }}>
            {situation.say.map((phrase, i) => (
              <View key={i} style={[styles.rowCard, shadow.sm]}>
                <Text style={styles.rowText}>"{phrase}"</Text>
                <Pressable onPress={() => copy(phrase, i)} style={styles.copyButton}>
                  {copiedIdx === i ? <Check size={15} color={colors.sageInk} /> : <Text style={styles.copyText}>COPY</Text>}
                </Pressable>
              </View>
            ))}
          </View>
        </Section>

        <Section label="What to avoid saying" icon={X}>
          <View style={{ gap: 10 }}>
            {situation.avoid.map((pair, i) => (
              <View key={i} style={[styles.avoidCard, shadow.sm]}>
                <Text style={styles.avoidInstead}>"{pair.instead}"</Text>
                <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
                  <ArrowRight size={15} color={colors.sageInk} />
                  <Text style={styles.avoidTry}>"{pair.tryThis}"</Text>
                </View>
              </View>
            ))}
          </View>
        </Section>

        <Section label="What can I do" icon={ListChecks}>
          <View style={{ gap: 8 }}>
            {situation.doThis.map((item, i) => (
              <View key={i} style={[styles.doRow, shadow.sm]}>
                <View style={styles.doCheck}>
                  <Check size={12} color={colors.sageInk} />
                </View>
                <Text style={styles.rowText}>{item}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section label="Why this may help" icon={Sparkles}>
          <Text style={[styles.paragraph, styles.whyBox]}>{situation.why}</Text>
        </Section>

        <Section label="If that doesn't work" icon={ArrowRight}>
          <View style={{ gap: 8 }}>
            {situation.nextStep.map((item, i) => (
              <Text key={i} style={styles.nextStep}>
                {item}
              </Text>
            ))}
          </View>
        </Section>

        <QuickCueReveal cue={situation.quickCue} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontFamily: fonts.bodyBold, fontSize: 12.5, letterSpacing: 0.4, textTransform: "uppercase", color: colors.tealDeep },
  paragraph: { fontFamily: fonts.bodyRegular, fontSize: 15, lineHeight: 23, color: colors.charcoal },
  rowCard: { backgroundColor: colors.white, borderRadius: radii.md, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  rowText: { fontFamily: fonts.bodyRegular, fontSize: 14.5, lineHeight: 20, flex: 1 },
  copyButton: { backgroundColor: colors.sagePale, borderRadius: 10, width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  copyText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.sageInk },
  avoidCard: { backgroundColor: colors.white, borderRadius: radii.md, padding: 14 },
  avoidInstead: { fontFamily: fonts.bodyRegular, fontSize: 13.5, color: colors.charcoalSoft, textDecorationLine: "line-through" },
  avoidTry: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.sageInk, flex: 1 },
  doRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: colors.white, borderRadius: radii.md, padding: 13 },
  doCheck: { width: 20, height: 20, borderRadius: radii.pill, backgroundColor: colors.sagePale, alignItems: "center", justifyContent: "center", marginTop: 1 },
  whyBox: { backgroundColor: colors.sagePale, borderRadius: radii.md, padding: 15, color: colors.charcoalSoft, fontSize: 14.5 },
  nextStep: { fontFamily: fonts.bodyRegular, fontSize: 14.5, lineHeight: 21, color: colors.charcoal, paddingLeft: 14, borderLeftWidth: 2.5, borderLeftColor: colors.teal },
  quickCard: { borderRadius: radii.lg, padding: 20, backgroundColor: colors.peach },
  quickEyebrow: { fontFamily: fonts.bodyBold, fontSize: 12.5, letterSpacing: 0.4, textTransform: "uppercase", color: "#4A2E1C", opacity: 0.85 },
  quickPrompt: { fontFamily: fonts.display, fontSize: 18.5, color: "#4A2E1C" },
  quickCue: { fontFamily: fonts.display, fontSize: 22, color: "#4A2E1C", lineHeight: 30 },
  closeChip: { marginTop: 14, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.4)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  closeChipText: { fontFamily: fonts.bodyBold, fontSize: 13, color: "#4A2E1C" },
});
