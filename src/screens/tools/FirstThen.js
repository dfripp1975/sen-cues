import React, { useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { ArrowDown, Check } from "lucide-react-native";

import { colors, fonts, radii, shadow } from "../../theme";
import { PrimaryButton, SecondaryButton } from "../../components/UI";

export default function FirstThen() {
  const [first, setFirst] = useState("");
  const [then, setThen] = useState("");
  const [showing, setShowing] = useState(false);
  const [firstDone, setFirstDone] = useState(false);

  const ready = first.trim().length > 0 && then.trim().length > 0;

  if (showing) {
    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 30, flexGrow: 1 }}>
        <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
          <View style={[styles.panel, shadow.md, { backgroundColor: colors.sage, opacity: firstDone ? 0.45 : 1 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.panelEyebrow}>First</Text>
              {firstDone && (
                <View style={styles.doneBadge}>
                  <Check size={13} color={colors.sageDeep} strokeWidth={3} />
                </View>
              )}
            </View>
            <Text style={[styles.panelText, firstDone && { textDecorationLine: "line-through" }]}>{first.trim()}</Text>
          </View>

          <View style={{ alignItems: "center" }}>
            <View style={styles.arrowCircle}>
              <ArrowDown size={20} color={colors.charcoal} strokeWidth={2.4} />
            </View>
          </View>

          <View style={[styles.panel, shadow.md, { backgroundColor: colors.peach }]}>
            <Text style={[styles.panelEyebrow, { color: "#4A2E1C" }]}>Then</Text>
            <Text style={[styles.panelText, { color: "#4A2E1C" }]}>{then.trim()}</Text>
          </View>

          {firstDone && <Text style={styles.nowNote}>Now it's time for: {then.trim()}</Text>}
        </View>

        <View style={{ gap: 10 }}>
          {!firstDone ? (
            <PrimaryButton onPress={() => setFirstDone(true)}>The first thing is done</PrimaryButton>
          ) : (
            <PrimaryButton
              onPress={() => {
                setFirstDone(false);
                setShowing(false);
                setFirst("");
                setThen("");
              }}
            >
              Start again
            </PrimaryButton>
          )}
          <SecondaryButton
            onPress={() => {
              setShowing(false);
              setFirstDone(false);
            }}
          >
            Change the words
          </SecondaryButton>
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Knowing what comes next can make a hard task feel more possible. "First" is the thing that needs to happen, "Then"
          is the thing they're looking forward to.
        </Text>

        <Text style={styles.inputLabel}>First</Text>
        <TextInput
          style={styles.input}
          value={first}
          onChangeText={setFirst}
          placeholder="e.g. Brush teeth"
          placeholderTextColor={colors.charcoalSoft}
          maxLength={60}
        />

        <Text style={styles.inputLabel}>Then</Text>
        <TextInput
          style={styles.input}
          value={then}
          onChangeText={setThen}
          placeholder="e.g. Story with Mum"
          placeholderTextColor={colors.charcoalSoft}
          maxLength={60}
        />

        <PrimaryButton style={{ marginTop: 12 }} disabled={!ready} onPress={() => setShowing(true)}>
          Show first / then
        </PrimaryButton>
        <Text style={styles.tip}>
          Try keeping the words short and concrete, and point at each card as you say it out loud.
        </Text>
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
  tip: { fontFamily: fonts.bodyRegular, fontSize: 12.5, lineHeight: 18, color: colors.charcoalSoft, textAlign: "center", marginTop: 12 },
  panel: { borderRadius: radii.xl, padding: 22, minHeight: 120, justifyContent: "center", gap: 8 },
  panelEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 12.5,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.85)",
  },
  panelText: { fontFamily: fonts.display, fontSize: 25, color: colors.white, lineHeight: 32 },
  doneBadge: {
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowCircle: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  nowNote: { fontFamily: fonts.display, fontSize: 18, color: colors.charcoal, textAlign: "center", marginTop: 8 },
});
