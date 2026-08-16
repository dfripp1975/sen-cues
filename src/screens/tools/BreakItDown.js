import React, { useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { X, Plus, Check } from "lucide-react-native";

import { colors, fonts, radii, shadow } from "../../theme";
import { PrimaryButton, SecondaryButton } from "../../components/UI";
import { BREAKDOWN_PRESETS } from "../../data/content";

// Common tasks come from the shared content database so the steps stay
// consistent with everything else in the app.
const TEMPLATES = Object.entries(BREAKDOWN_PRESETS).map(([task, steps]) => ({
  task: task.charAt(0).toUpperCase() + task.slice(1),
  steps,
}));

export default function BreakItDown() {
  const [task, setTask] = useState("");
  const [steps, setSteps] = useState(["", "", ""]);
  const [runIndex, setRunIndex] = useState(null); // null = editing, number = running that step

  const filledSteps = steps.map((s) => s.trim()).filter((s) => s.length > 0);
  const ready = task.trim().length > 0 && filledSteps.length > 0;

  const updateStep = (i, text) => setSteps((prev) => prev.map((s, idx) => (idx === i ? text : s)));
  const removeStep = (i) => setSteps((prev) => prev.filter((_, idx) => idx !== i));

  // Running mode
  if (runIndex !== null) {
    const finished = runIndex >= filledSteps.length;
    return (
      <View style={{ flex: 1, paddingHorizontal: 18 }}>
        {!finished ? (
          <>
            <Text style={styles.runTask}>{task.trim()}</Text>
            <Text style={styles.runProgress}>
              Step {runIndex + 1} of {filledSteps.length}
            </Text>
            <View style={styles.dotsRow}>
              {filledSteps.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i < runIndex && { backgroundColor: colors.sageDeep },
                    i === runIndex && { backgroundColor: colors.sageDeep, width: 22 },
                  ]}
                />
              ))}
            </View>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <View style={[styles.stepCard, shadow.md]}>
                <Text style={styles.stepText}>{filledSteps[runIndex]}</Text>
              </View>
            </View>
            <View style={{ gap: 10, paddingBottom: 24 }}>
              <PrimaryButton onPress={() => setRunIndex((i) => i + 1)}>Done — next step</PrimaryButton>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {runIndex > 0 && (
                  <SecondaryButton style={{ flex: 1 }} onPress={() => setRunIndex((i) => i - 1)}>
                    Back a step
                  </SecondaryButton>
                )}
                <SecondaryButton style={{ flex: 1 }} onPress={() => setRunIndex(null)}>
                  Stop
                </SecondaryButton>
              </View>
            </View>
          </>
        ) : (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View style={[styles.finishedCard, shadow.lg]}>
              <View style={styles.finishedCheck}>
                <Check size={26} color={colors.sageDeep} strokeWidth={2.6} />
              </View>
              <Text style={styles.finishedText}>That's every step done.</Text>
              <Text style={styles.finishedSub}>{task.trim()} — finished.</Text>
            </View>
            <View style={{ gap: 10, marginTop: 26 }}>
              <PrimaryButton onPress={() => setRunIndex(0)}>Do it again</PrimaryButton>
              <SecondaryButton onPress={() => setRunIndex(null)}>Change the steps</SecondaryButton>
            </View>
          </View>
        )}
      </View>
    );
  }

  // Edit mode
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          A big task like "get ready" may feel like a wall. Broken into small steps, shown one at a time, it can become a
          series of things that each feel doable.
        </Text>

        <Text style={styles.inputLabel}>The task</Text>
        <TextInput
          style={styles.input}
          value={task}
          onChangeText={setTask}
          placeholder="e.g. Getting dressed"
          placeholderTextColor={colors.charcoalSoft}
          maxLength={60}
        />

        <Text style={styles.inputLabel}>The steps, in order</Text>
        <View style={{ gap: 8 }}>
          {steps.map((step, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={step}
                onChangeText={(text) => updateStep(i, text)}
                placeholder={`Step ${i + 1}`}
                placeholderTextColor={colors.charcoalSoft}
                maxLength={80}
              />
              {steps.length > 1 && (
                <Pressable onPress={() => removeStep(i)} style={styles.removeButton} hitSlop={6}>
                  <X size={15} color={colors.charcoalSoft} />
                </Pressable>
              )}
            </View>
          ))}
        </View>
        <Pressable onPress={() => setSteps((prev) => [...prev, ""])} style={styles.addStep}>
          <Plus size={15} color={colors.sageInk} strokeWidth={2.4} />
          <Text style={styles.addStepText}>Add a step</Text>
        </Pressable>

        <Text style={styles.presetLabel}>Or start from a common task</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {TEMPLATES.map((t) => (
            <Pressable
              key={t.task}
              onPress={() => {
                setTask(t.task);
                setSteps([...t.steps]);
              }}
              style={styles.presetChip}
            >
              <Text style={styles.presetChipText}>{t.task}</Text>
            </Pressable>
          ))}
        </View>

        <PrimaryButton style={{ marginTop: 24 }} disabled={!ready} onPress={() => setRunIndex(0)}>
          Start — one step at a time
        </PrimaryButton>
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
  removeButton: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    backgroundColor: colors.creamWarm,
    alignItems: "center",
    justifyContent: "center",
  },
  addStep: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", marginTop: 12, paddingVertical: 4 },
  addStepText: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.sageInk },
  presetLabel: { fontFamily: fonts.bodyRegular, fontSize: 12.5, color: colors.charcoalSoft, marginTop: 18, marginBottom: 8 },
  presetChip: { backgroundColor: colors.sagePale, borderRadius: radii.pill, paddingHorizontal: 13, paddingVertical: 8 },
  presetChipText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.sageInk },
  runTask: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.charcoalSoft, textAlign: "center", marginTop: 6 },
  runProgress: { fontFamily: fonts.display, fontSize: 19, color: colors.charcoal, textAlign: "center", marginTop: 4 },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 12 },
  dot: { width: 8, height: 8, borderRadius: radii.pill, backgroundColor: colors.sagePale },
  stepCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 28,
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { fontFamily: fonts.display, fontSize: 27, color: colors.charcoal, textAlign: "center", lineHeight: 35 },
  finishedCard: { backgroundColor: colors.sagePale, borderRadius: radii.xl, padding: 26, alignItems: "center" },
  finishedCheck: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  finishedText: { fontFamily: fonts.display, fontSize: 22, color: colors.sageInk, textAlign: "center" },
  finishedSub: { fontFamily: fonts.bodyRegular, fontSize: 14, color: colors.charcoalSoft, marginTop: 6, textAlign: "center" },
});
