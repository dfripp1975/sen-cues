import React, { useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Check } from "lucide-react-native";

import { colors, fonts, radii, shadow } from "../../theme";
import { PrimaryButton, SecondaryButton } from "../../components/UI";

const PRESETS = [
  ["Red cup", "Blue cup"],
  ["Bath first", "Pyjamas first"],
  ["Walk", "Buggy"],
  ["Apple", "Banana"],
];

export default function VisualChoiceMaker() {
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [showing, setShowing] = useState(false);
  const [chosen, setChosen] = useState(null);

  const ready = optionA.trim().length > 0 && optionB.trim().length > 0;

  if (showing) {
    const options = [
      { key: "a", label: optionA.trim(), bg: colors.sage, bgDeep: colors.sageDeep },
      { key: "b", label: optionB.trim(), bg: colors.teal, bgDeep: colors.tealDeep },
    ];
    return (
      <View style={{ flex: 1, paddingHorizontal: 18 }}>
        <Text style={styles.showPrompt}>Which one would you like?</Text>
        <View style={{ flex: 1, justifyContent: "center", gap: 22 }}>
          {options.map((opt) => {
            const isChosen = chosen === opt.key;
            const dimmed = chosen && !isChosen;
            return (
              <View key={opt.key} style={{ opacity: dimmed ? 0.35 : 1 }}>
                <View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: opt.bgDeep, borderRadius: radii.xl, opacity: 0.55, transform: [{ rotate: "-3.5deg" }, { scale: 0.965 }] },
                  ]}
                />
                <Pressable
                  onPress={() => setChosen(opt.key)}
                  disabled={!!chosen}
                  style={({ pressed }) => [styles.choiceCard, shadow.md, { backgroundColor: opt.bg }, pressed && { opacity: 0.92 }]}
                >
                  <Text style={styles.choiceText}>{opt.label}</Text>
                  {isChosen && (
                    <View style={styles.chosenBadge}>
                      <Check size={16} color={opt.bgDeep} strokeWidth={3} />
                    </View>
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
        {chosen && (
          <Text style={styles.chosenNote}>
            {chosen === "a" ? optionA.trim() : optionB.trim()} it is.
          </Text>
        )}
        <View style={{ gap: 10, paddingBottom: 24 }}>
          {chosen && <PrimaryButton onPress={() => setChosen(null)}>Choose again</PrimaryButton>}
          <SecondaryButton
            onPress={() => {
              setShowing(false);
              setChosen(null);
            }}
          >
            Change the options
          </SecondaryButton>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          An open question like "what do you want?" may feel overwhelming for some children. Two clear options can make the
          decision feel manageable, and give them a real say.
        </Text>

        <Text style={styles.inputLabel}>Choice one</Text>
        <TextInput
          style={styles.input}
          value={optionA}
          onChangeText={setOptionA}
          placeholder="e.g. Red cup"
          placeholderTextColor={colors.charcoalSoft}
          maxLength={40}
        />

        <Text style={styles.inputLabel}>Choice two</Text>
        <TextInput
          style={styles.input}
          value={optionB}
          onChangeText={setOptionB}
          placeholder="e.g. Blue cup"
          placeholderTextColor={colors.charcoalSoft}
          maxLength={40}
        />

        <Text style={styles.presetLabel}>Or start from a common pair</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {PRESETS.map(([a, b]) => (
            <Pressable
              key={a}
              onPress={() => {
                setOptionA(a);
                setOptionB(b);
              }}
              style={styles.presetChip}
            >
              <Text style={styles.presetChipText}>
                {a} / {b}
              </Text>
            </Pressable>
          ))}
        </View>

        <PrimaryButton style={{ marginTop: 24 }} disabled={!ready} onPress={() => setShowing(true)}>
          Show the choices
        </PrimaryButton>
        <Text style={styles.tip}>Then hand the phone over, or hold it where they can see both options clearly.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  intro: { fontFamily: fonts.bodyRegular, fontSize: 14, lineHeight: 21, color: colors.charcoalSoft, marginBottom: 20 },
  inputLabel: { fontFamily: fonts.bodyBold, fontSize: 12.5, letterSpacing: 0.4, textTransform: "uppercase", color: colors.tealDeep, marginBottom: 7 },
  input: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.charcoal,
    marginBottom: 16,
  },
  presetLabel: { fontFamily: fonts.bodyRegular, fontSize: 12.5, color: colors.charcoalSoft, marginTop: 4, marginBottom: 8 },
  presetChip: {
    backgroundColor: colors.sagePale,
    borderRadius: radii.pill,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  presetChipText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.sageInk },
  tip: { fontFamily: fonts.bodyRegular, fontSize: 12.5, lineHeight: 18, color: colors.charcoalSoft, textAlign: "center", marginTop: 12 },
  showPrompt: { fontFamily: fonts.display, fontSize: 24, color: colors.charcoal, textAlign: "center", marginTop: 10 },
  choiceCard: {
    borderRadius: radii.xl,
    minHeight: 130,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  choiceText: { fontFamily: fonts.display, fontSize: 27, color: colors.white, textAlign: "center", lineHeight: 34 },
  chosenBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  chosenNote: { fontFamily: fonts.display, fontSize: 18, color: colors.charcoal, textAlign: "center", marginBottom: 18 },
});
