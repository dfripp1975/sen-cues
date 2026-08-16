import React, { useEffect, useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check } from "lucide-react-native";

import { colors, fonts, radii } from "../theme";
import { ScreenHeader, PrimaryButton, SecondaryButton } from "../components/UI";
import { supabase } from "../lib/supabase";

const DIAGNOSIS_OPTIONS = [
  "Not diagnosed / Prefer not to say",
  "Autism",
  "ADHD",
  "Autism and ADHD",
  "Speech, language or communication needs",
  "Sensory processing differences",
  "Learning disability",
  "PDA profile",
  "Waiting for assessment",
  "Other",
];

// Tappable suggestions per field — tapping adds/removes the phrase from the
// free-text value (comma-separated), so parents can mix chips and their own words.
const SUGGESTIONS = {
  comm_prefs: ["Short, direct sentences", "Needs extra time to respond", "Pictures and visuals help", "Uses signs or Makaton", "Prefers fewer questions"],
  sensory_prefs: ["Sensitive to noise", "Sensitive to bright light", "Dislikes certain textures", "Seeks movement", "Likes deep pressure"],
  triggers: ["Sudden changes of plan", "Loud or busy places", "Being rushed", "Moving between activities", "Being told no"],
  helps: ["A warning before changes", "Counting down", "Being offered choices", "A quiet space", "Knowing what comes next"],
  calming: ["Slow breaths together", "A favourite object", "Quiet time alone", "Firm hugs or a weighted blanket", "Music or headphones"],
};

function splitValue(value) {
  return (value || "").split(",").map((s) => s.trim()).filter(Boolean);
}

function SuggestionChips({ suggestions, value, onChange }) {
  const parts = splitValue(value);
  const toggle = (s) => {
    const next = parts.includes(s) ? parts.filter((p) => p !== s) : [...parts, s];
    onChange(next.join(", "));
  };
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
      {suggestions.map((s) => {
        const selected = parts.includes(s);
        return (
          <Pressable key={s} onPress={() => toggle(s)} style={[styles.chip, selected && styles.chipSelected]}>
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{s}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Field({ label, hint, value, onChange, placeholder, suggestions, multiline }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.charcoalSoft}
        style={[styles.input, multiline && styles.inputMultiline]}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
      />
      {suggestions ? <SuggestionChips suggestions={suggestions} value={value} onChange={onChange} /> : null}
    </View>
  );
}

export default function ProfileFormScreen({ route, navigation }) {
  const { profileId } = route.params || {};
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [diagnosis, setDiagnosis] = useState(DIAGNOSIS_OPTIONS[0]);
  const [commPrefs, setCommPrefs] = useState("");
  const [sensoryPrefs, setSensoryPrefs] = useState("");
  const [triggers, setTriggers] = useState("");
  const [helps, setHelps] = useState("");
  const [calming, setCalming] = useState("");
  const [notes, setNotes] = useState("");
  const [makeActive, setMakeActive] = useState(false);
  const [wasActive, setWasActive] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: account } = await supabase.from("accounts").select("active_profile_id").eq("user_id", userData.user.id).maybeSingle();

      if (profileId) {
        const { data } = await supabase.from("child_profiles").select("*").eq("id", profileId).single();
        if (data) {
          setName(data.name || "");
          setAge(data.age || "");
          setDiagnosis(data.diagnosis || DIAGNOSIS_OPTIONS[0]);
          setCommPrefs(data.comm_prefs || "");
          setSensoryPrefs(data.sensory_prefs || "");
          setTriggers(data.triggers || "");
          setHelps(data.helps || "");
          setCalming(data.calming || "");
          setNotes(data.notes || "");
        }
        const active = account?.active_profile_id === profileId;
        setMakeActive(active);
        setWasActive(active);
      } else {
        // A brand new profile becomes the personalising one by default when
        // there isn't one already — most parents only add one child.
        setMakeActive(!account?.active_profile_id);
      }
    })();
  }, [profileId]);

  const setActiveProfile = async (userId, id) => {
    await supabase.from("accounts").upsert({ user_id: userId, active_profile_id: id });
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const fields = {
        name,
        age,
        diagnosis,
        comm_prefs: commPrefs,
        sensory_prefs: sensoryPrefs,
        triggers,
        helps,
        calming,
        notes,
      };
      let id = profileId;
      if (profileId) {
        await supabase.from("child_profiles").update(fields).eq("id", profileId);
      } else {
        const { data } = await supabase
          .from("child_profiles")
          .insert({ user_id: userData.user.id, ...fields })
          .select("id")
          .single();
        id = data?.id;
      }
      if (id && makeActive && !wasActive) {
        await setActiveProfile(userData.user.id, id);
      } else if (id && !makeActive && wasActive) {
        await setActiveProfile(userData.user.id, null);
      }
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete this profile?",
      `This removes ${name.trim() || "this child"}'s profile and the details in it. It can't be undone.`,
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // The schema sets accounts.active_profile_id to null automatically
            // if the deleted profile was the active one.
            await supabase.from("child_profiles").delete().eq("id", profileId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={["top"]}>
      <ScreenHeader title={profileId ? "Edit profile" : "New child profile"} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>
            Everything here is optional — fill in as much or as little as feels right. It's only used to shape suggestions,
            and only you can see it.
          </Text>

          <Field label="First name or nickname" value={name} onChange={setName} placeholder="e.g. Sam" />
          <Field label="Age" value={age} onChange={setAge} placeholder="e.g. 8" />

          <Text style={styles.label}>Diagnosis</Text>
          <Text style={styles.hint}>Never required — suggestions work either way.</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
            {DIAGNOSIS_OPTIONS.map((d) => {
              const selected = diagnosis === d;
              return (
                <Pressable key={d} onPress={() => setDiagnosis(d)} style={[styles.chip, selected && styles.chipSelected]}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{d}</Text>
                </Pressable>
              );
            })}
          </View>

          <Field
            label="How they communicate"
            hint="Tap any that fit, or write your own."
            value={commPrefs}
            onChange={setCommPrefs}
            placeholder="e.g. Short sentences work best"
            suggestions={SUGGESTIONS.comm_prefs}
            multiline
          />
          <Field
            label="Sensory preferences"
            value={sensoryPrefs}
            onChange={setSensoryPrefs}
            placeholder="e.g. Finds hand dryers very hard"
            suggestions={SUGGESTIONS.sensory_prefs}
            multiline
          />
          <Field
            label="Common triggers"
            value={triggers}
            onChange={setTriggers}
            placeholder="e.g. Turning the tablet off"
            suggestions={SUGGESTIONS.triggers}
            multiline
          />
          <Field
            label="Things that help"
            value={helps}
            onChange={setHelps}
            placeholder="e.g. A five-minute warning"
            suggestions={SUGGESTIONS.helps}
            multiline
          />
          <Field
            label="Calming activities"
            value={calming}
            onChange={setCalming}
            placeholder="e.g. Watching the washing machine"
            suggestions={SUGGESTIONS.calming}
            multiline
          />
          <Field
            label="Anything else"
            hint="Whatever you'd tell a new teacher or babysitter."
            value={notes}
            onChange={setNotes}
            placeholder="e.g. Loves dinosaurs — mentioning them helps"
            multiline
          />

          <Pressable onPress={() => setMakeActive((v) => !v)} style={styles.activeRow}>
            <View style={[styles.checkbox, makeActive && styles.checkboxOn]}>
              {makeActive && <Check size={13} color={colors.white} strokeWidth={3} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.activeTitle}>Personalise suggestions for this child</Text>
              <Text style={styles.activeDesc}>The AI cue tool will use this profile to shape its ideas.</Text>
            </View>
          </Pressable>

          <PrimaryButton onPress={save} disabled={saving} style={{ marginTop: 18 }}>
            {saving ? "Saving…" : "Save profile"}
          </PrimaryButton>

          {profileId && (
            <SecondaryButton onPress={confirmDelete} style={{ marginTop: 10 }}>
              <Text style={styles.deleteText}>Delete this profile</Text>
            </SecondaryButton>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  intro: { fontFamily: fonts.bodyRegular, fontSize: 13.5, lineHeight: 20, color: colors.charcoalSoft, marginBottom: 18 },
  label: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.charcoalSoft, marginBottom: 6 },
  hint: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.charcoalSoft, marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.sm,
    padding: 12,
    fontFamily: fonts.body,
    fontSize: 14.5,
    color: colors.charcoal,
    backgroundColor: colors.white,
    marginBottom: 10,
  },
  inputMultiline: { minHeight: 66, lineHeight: 20 },
  chip: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipSelected: { backgroundColor: colors.sageDeep, borderColor: colors.sageDeep },
  chipText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.charcoal },
  chipTextSelected: { color: colors.white, fontFamily: fonts.bodyBold },
  activeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.sagePale,
    borderRadius: radii.md,
    padding: 14,
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.sageDeep,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: colors.sageDeep },
  activeTitle: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.sageInk },
  activeDesc: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.charcoalSoft, marginTop: 2 },
  deleteText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.peachDeep },
});
