import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fonts, radii } from "../theme";
import { PrimaryButton, SecondaryButton } from "../components/UI";

// TODO for Claude Code: this is a two-screen cut-down of the prototype's five-screen
// flow (welcome, who, age, hardest situations, what would help). Port the remaining
// three screens from OnboardingScreen in App.jsx, and persist the answers to
// accounts.onboarding_answers so Home can use them to personalise "Today's cues".
export default function OnboardingScreen({ navigation }) {
  const [step, setStep] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progress}>
        {[0, 1].map((i) => (
          <View key={i} style={[styles.progressBar, i <= step && { backgroundColor: colors.sageDeep }]} />
        ))}
      </View>

      <View style={styles.body}>
        {step === 0 && (
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 44, marginBottom: 18 }}>🌿</Text>
            <Text style={styles.h1}>Welcome to SEN Cues</Text>
            <Text style={styles.sub}>Practical words and strategies for the moments that can feel hardest.</Text>
          </View>
        )}
        {step === 1 && (
          <View>
            <Text style={[styles.h2, { textAlign: "center" }]}>Who are you supporting?</Text>
            <View style={{ gap: 10 }}>
              {["Parent", "Carer"].map((w) => (
                <Pressable key={w} style={styles.choiceButton}>
                  <Text style={styles.choiceText}>{w}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {step < 1 ? (
          <>
            <Pressable onPress={() => navigation.replace("Tabs")}>
              <Text style={styles.skip}>Skip</Text>
            </Pressable>
            <PrimaryButton style={{ flex: 1 }} onPress={() => setStep(step + 1)}>
              Continue
            </PrimaryButton>
          </>
        ) : (
          <PrimaryButton style={{ flex: 1 }} onPress={() => navigation.replace("Tabs")}>
            Take me to my cues
          </PrimaryButton>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  progress: { flexDirection: "row", gap: 6, paddingHorizontal: 22, paddingTop: 4 },
  progressBar: { flex: 1, height: 4, borderRadius: radii.pill, backgroundColor: colors.line },
  body: { flex: 1, justifyContent: "center", paddingHorizontal: 26 },
  h1: { fontFamily: fonts.display, fontSize: 30, color: colors.charcoal, marginBottom: 12, textAlign: "center" },
  h2: { fontFamily: fonts.display, fontSize: 23, color: colors.charcoal, marginBottom: 20 },
  sub: { fontFamily: fonts.bodyRegular, fontSize: 15.5, lineHeight: 24, color: colors.charcoalSoft, textAlign: "center" },
  choiceButton: { borderWidth: 1.5, borderColor: colors.line, borderRadius: radii.lg, padding: 18, backgroundColor: colors.white },
  choiceText: { fontFamily: fonts.bodyBold, fontSize: 16, textAlign: "center" },
  footer: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 26, paddingBottom: 20 },
  skip: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.charcoalSoft, paddingHorizontal: 6 },
});
