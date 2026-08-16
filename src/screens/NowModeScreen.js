import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Shield, X } from "lucide-react-native";

import { NOW_MODE } from "../data/content";
import { colors, fonts, radii } from "../theme";

export default function NowModeScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const steps = ["pause", "say", "avoid", "next"];

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Text style={styles.eyebrow}>Now mode</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeButton} hitSlop={10}>
          <X size={18} color={colors.white} />
        </Pressable>
      </View>

      <View style={styles.body}>
        {step === 0 && (
          <View style={{ alignItems: "center" }}>
            <View style={styles.pauseIcon}>
              <Shield size={38} color={colors.white} strokeWidth={1.6} />
            </View>
            <Text style={styles.h1}>{NOW_MODE.pause.heading}</Text>
            <Text style={styles.bodyText}>{NOW_MODE.pause.body}</Text>
          </View>
        )}
        {step === 1 && (
          <View>
            <Text style={[styles.h2, { textAlign: "center" }]}>Try this</Text>
            {NOW_MODE.tryThis.map((t, i) => (
              <View key={i} style={styles.pill}>
                <Text style={styles.pillText}>{t}</Text>
              </View>
            ))}
          </View>
        )}
        {step === 2 && (
          <View>
            <Text style={[styles.h2, { textAlign: "center" }]}>What can I say?</Text>
            {NOW_MODE.say.map((s, i) => (
              <View key={i} style={styles.sayCard}>
                <Text style={styles.sayText}>"{s}"</Text>
              </View>
            ))}
            <Text style={[styles.avoidLabel, { textAlign: "center" }]}>What should I avoid?</Text>
            <View style={styles.avoidWrap}>
              {NOW_MODE.avoid.map((a, i) => (
                <View key={i} style={styles.avoidPill}>
                  <Text style={styles.avoidPillText}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        {step === 3 && (
          <View>
            <Text style={[styles.h2, { textAlign: "center" }]}>Still struggling?</Text>
            {NOW_MODE.next.map((n, i) => (
              <View key={i} style={styles.pill}>
                <Text style={[styles.pillText, { fontSize: 14.5, fontFamily: fonts.bodyRegular, textAlign: "left" }]}>{n}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {step > 0 && (
          <Pressable onPress={() => setStep(step - 1)} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        )}
        {step < steps.length - 1 ? (
          <Pressable onPress={() => setStep(step + 1)} style={styles.nextButton}>
            <Text style={styles.nextButtonText}>{step === 0 ? "Show me what to try" : "Next"}</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => navigation.goBack()} style={styles.nextButton}>
            <Text style={styles.nextButtonText}>I'm okay now</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.tealDeep },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 6 },
  eyebrow: { fontFamily: fonts.bodyBold, fontSize: 12.5, letterSpacing: 0.5, textTransform: "uppercase", color: "rgba(255,255,255,0.75)" },
  closeButton: { width: 38, height: 38, borderRadius: radii.pill, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" },
  body: { flex: 1, justifyContent: "center", paddingHorizontal: 26 },
  pauseIcon: { width: 90, height: 90, borderRadius: radii.pill, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center", marginBottom: 26, alignSelf: "center" },
  h1: { fontFamily: fonts.display, fontSize: 26, color: colors.white, marginBottom: 14, textAlign: "center" },
  h2: { fontFamily: fonts.display, fontSize: 22, color: colors.white, marginBottom: 18 },
  bodyText: { fontFamily: fonts.bodyRegular, fontSize: 16, lineHeight: 25, color: "rgba(255,255,255,0.92)", textAlign: "center" },
  pill: { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: radii.lg, padding: 16, marginBottom: 10 },
  pillText: { fontFamily: fonts.bodyBold, fontSize: 16.5, color: colors.white, textAlign: "center" },
  sayCard: { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: radii.lg, padding: 20, marginBottom: 12 },
  sayText: { fontFamily: fonts.display, fontSize: 19, color: colors.white, textAlign: "center", lineHeight: 27 },
  avoidLabel: { fontFamily: fonts.bodyBold, fontSize: 12.5, textTransform: "uppercase", letterSpacing: 0.4, color: "rgba(255,255,255,0.7)", marginTop: 20, marginBottom: 10 },
  avoidWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7, justifyContent: "center" },
  avoidPill: { backgroundColor: "rgba(255,255,255,0.10)", borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 6 },
  avoidPillText: { fontFamily: fonts.bodyRegular, fontSize: 12.5, color: colors.white },
  footer: { flexDirection: "row", gap: 10, paddingHorizontal: 26, paddingBottom: 20 },
  backButton: { borderWidth: 1.5, borderColor: "rgba(255,255,255,0.35)", borderRadius: radii.lg, paddingVertical: 15, paddingHorizontal: 20 },
  backButtonText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.white },
  nextButton: { flex: 1, backgroundColor: colors.white, borderRadius: radii.lg, paddingVertical: 15, alignItems: "center" },
  nextButtonText: { fontFamily: fonts.bodyBold, fontSize: 15.5, color: colors.tealDeep },
});
