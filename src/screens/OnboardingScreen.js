import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check } from "lucide-react-native";

import { colors, fonts, radii } from "../theme";
import { PrimaryButton } from "../components/UI";
import { CATEGORIES } from "../data/content";
import { supabase, ensureSession } from "../lib/supabase";

const ROLES = ["Parent", "Carer", "Grandparent or family", "Professional"];
const AGES = ["0–4", "5–7", "8–11", "12–15", "16+", "Prefer not to say"];
const HELP_OPTIONS = [
  "Words to say in the moment",
  "Understanding what may be behind it",
  "Ways to head off tricky moments",
  "Visual tools and routines",
  "Feeling less alone in this",
];

const TOTAL_STEPS = 5;

function OptionButton({ label, emoji, selected, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.choiceButton, selected && styles.choiceButtonSelected]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
        {emoji ? <Text style={{ fontSize: 19 }}>{emoji}</Text> : null}
        <Text style={[styles.choiceText, selected && { color: colors.sageInk }]}>{label}</Text>
      </View>
      {selected && (
        <View style={styles.choiceCheck}>
          <Check size={13} color={colors.white} strokeWidth={3} />
        </View>
      )}
    </Pressable>
  );
}

export default function OnboardingScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState(null);
  const [age, setAge] = useState(null);
  const [hardest, setHardest] = useState([]);
  const [helpWith, setHelpWith] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggle = (list, setList, value) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  // Saving answers (or the fact onboarding was skipped) lets the app go
  // straight to the tabs on future opens. Failing to save never blocks entry.
  const finish = async (answers) => {
    setSaving(true);
    try {
      const session = await ensureSession();
      await supabase.from("accounts").upsert({ user_id: session.user.id, onboarding_answers: answers });
    } catch {
      // Offline or Supabase unreachable — carry on into the app regardless.
    } finally {
      setSaving(false);
      navigation.replace("Tabs");
    }
  };

  const complete = () =>
    finish({ role, age, hardest, help_with: helpWith, completed_at: new Date().toISOString() });
  const skip = () => finish({ skipped: true, completed_at: new Date().toISOString() });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progress}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <View key={i} style={[styles.progressBar, i <= step && { backgroundColor: colors.sageDeep }]} />
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 44, marginBottom: 18 }}>🌿</Text>
            <Text style={styles.h1}>Welcome to SEN Cues</Text>
            <Text style={styles.sub}>Practical words and strategies for the moments that can feel hardest.</Text>
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={[styles.h2, { textAlign: "center" }]}>Who are you supporting a child as?</Text>
            <View style={{ gap: 10 }}>
              {ROLES.map((r) => (
                <OptionButton key={r} label={r} selected={role === r} onPress={() => setRole(r)} />
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={[styles.h2, { textAlign: "center" }]}>How old is your child?</Text>
            <Text style={styles.stepNote}>This helps us show age-appropriate suggestions first.</Text>
            <View style={{ gap: 10 }}>
              {AGES.map((a) => (
                <OptionButton key={a} label={a} selected={age === a} onPress={() => setAge(a)} />
              ))}
            </View>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={[styles.h2, { textAlign: "center" }]}>Which situations feel hardest right now?</Text>
            <Text style={styles.stepNote}>Choose as many as you like — you can explore everything later.</Text>
            <View style={{ gap: 10 }}>
              {CATEGORIES.map((c) => (
                <OptionButton
                  key={c.id}
                  label={c.label}
                  emoji={c.emoji}
                  selected={hardest.includes(c.id)}
                  onPress={() => toggle(hardest, setHardest, c.id)}
                />
              ))}
            </View>
          </View>
        )}

        {step === 4 && (
          <View>
            <Text style={[styles.h2, { textAlign: "center" }]}>What would help you most?</Text>
            <Text style={styles.stepNote}>Choose as many as you like.</Text>
            <View style={{ gap: 10 }}>
              {HELP_OPTIONS.map((h) => (
                <OptionButton key={h} label={h} selected={helpWith.includes(h)} onPress={() => toggle(helpWith, setHelpWith, h)} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step < TOTAL_STEPS - 1 ? (
          <>
            <Pressable onPress={skip} disabled={saving}>
              <Text style={styles.skip}>Skip</Text>
            </Pressable>
            <PrimaryButton style={{ flex: 1 }} onPress={() => setStep(step + 1)}>
              Continue
            </PrimaryButton>
          </>
        ) : (
          <PrimaryButton style={{ flex: 1 }} disabled={saving} onPress={complete}>
            {saving ? "One moment…" : "Take me to my cues"}
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
  body: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 26, paddingVertical: 24 },
  h1: { fontFamily: fonts.display, fontSize: 30, color: colors.charcoal, marginBottom: 12, textAlign: "center" },
  h2: { fontFamily: fonts.display, fontSize: 23, color: colors.charcoal, marginBottom: 8 },
  stepNote: { fontFamily: fonts.bodyRegular, fontSize: 13.5, lineHeight: 19, color: colors.charcoalSoft, textAlign: "center", marginBottom: 18 },
  sub: { fontFamily: fonts.bodyRegular, fontSize: 15.5, lineHeight: 24, color: colors.charcoalSoft, textAlign: "center" },
  choiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: 16,
    backgroundColor: colors.white,
  },
  choiceButtonSelected: { borderColor: colors.sageDeep, backgroundColor: colors.sagePale },
  choiceText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.charcoal, flexShrink: 1 },
  choiceCheck: {
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    backgroundColor: colors.sageDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 26, paddingBottom: 20, paddingTop: 10 },
  skip: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.charcoalSoft, paddingHorizontal: 6 },
});
