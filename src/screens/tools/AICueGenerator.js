import React, { useEffect, useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Sparkles, AlertTriangle, MessageCircle, ListChecks, X, ArrowRight, Check } from "lucide-react-native";

import { colors, fonts, radii, shadow } from "../../theme";
import { PrimaryButton, SecondaryButton } from "../../components/UI";
import { supabase, ensureSession } from "../../lib/supabase";

// Builds the profile context string sent to the Edge Function. Only fields the
// parent has actually filled in are included; the default "not diagnosed"
// value is treated the same as leaving it blank.
function buildProfileContext(profile) {
  if (!profile) return undefined;
  const lines = [];
  if (profile.name) lines.push(`Name: ${profile.name}`);
  if (profile.age) lines.push(`Age: ${profile.age}`);
  if (profile.diagnosis && profile.diagnosis !== "Not diagnosed / Prefer not to say") lines.push(`Diagnosis (parent-reported): ${profile.diagnosis}`);
  if (profile.comm_prefs) lines.push(`Communication preferences: ${profile.comm_prefs}`);
  if (profile.sensory_prefs) lines.push(`Sensory preferences: ${profile.sensory_prefs}`);
  if (profile.triggers) lines.push(`Common triggers: ${profile.triggers}`);
  if (profile.helps) lines.push(`Things that help: ${profile.helps}`);
  if (profile.calming) lines.push(`Calming activities: ${profile.calming}`);
  if (profile.notes) lines.push(`Notes from the parent: ${profile.notes}`);
  if (lines.length === 0) return undefined;
  return `Child profile, shared by the parent:\n${lines.join("\n")}`;
}

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

export default function AICueGenerator() {
  const [situation, setSituation] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(-1);

  // Load the active child profile (falling back to the most recently updated
  // one) so generated cues can be personalised.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await ensureSession();
        const uid = session.user.id;
        const { data: account } = await supabase.from("accounts").select("active_profile_id").eq("user_id", uid).maybeSingle();
        let found = null;
        if (account?.active_profile_id) {
          const { data } = await supabase.from("child_profiles").select("*").eq("id", account.active_profile_id).maybeSingle();
          found = data;
        }
        if (!found) {
          const { data } = await supabase
            .from("child_profiles")
            .select("*")
            .eq("user_id", uid)
            .order("updated_at", { ascending: false })
            .limit(1);
          found = data?.[0] || null;
        }
        if (!cancelled) setProfile(found);
      } catch {
        // Personalisation is optional — generating still works without a profile.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // ensureSession guarantees a signed-in session; functions.invoke then
      // sends its access token in the Authorization header automatically, so
      // the Anthropic key stays server-side in the Edge Function.
      await ensureSession();
      const { data, error: fnError } = await supabase.functions.invoke("generate-cue", {
        body: {
          situation: situation.trim(),
          profileContext: buildProfileContext(profile),
        },
      });
      if (fnError || !data || data.error) throw fnError || new Error(data?.error || "Empty response");
      setResult(data);
    } catch {
      setError("We couldn't create a cue just now. Please check your connection and try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text, i) => {
    await Clipboard.setStringAsync(text);
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(-1), 1400);
  };

  if (result) {
    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}>
        <Text style={styles.resultSituation}>"{situation.trim()}"</Text>

        {result.whatMayBeHappening ? (
          <Section label="What may be happening" icon={AlertTriangle}>
            <Text style={styles.paragraph}>{result.whatMayBeHappening}</Text>
          </Section>
        ) : null}

        {result.say?.length ? (
          <Section label="What can I say" icon={MessageCircle}>
            <View style={{ gap: 8 }}>
              {result.say.map((phrase, i) => (
                <View key={i} style={[styles.rowCard, shadow.sm]}>
                  <Text style={styles.rowText}>"{phrase}"</Text>
                  <Pressable onPress={() => copy(phrase, i)} style={styles.copyButton}>
                    {copiedIdx === i ? <Check size={15} color={colors.sageInk} /> : <Text style={styles.copyText}>COPY</Text>}
                  </Pressable>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        {result.doThis?.length ? (
          <Section label="What can I do" icon={ListChecks}>
            <View style={{ gap: 8 }}>
              {result.doThis.map((item, i) => (
                <View key={i} style={[styles.doRow, shadow.sm]}>
                  <View style={styles.doCheck}>
                    <Check size={12} color={colors.sageInk} />
                  </View>
                  <Text style={styles.rowText}>{item}</Text>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        {result.avoid?.length ? (
          <Section label="What to avoid" icon={X}>
            <View style={{ gap: 8 }}>
              {result.avoid.map((item, i) => (
                <View key={i} style={[styles.doRow, shadow.sm]}>
                  <View style={[styles.doCheck, { backgroundColor: colors.creamWarm }]}>
                    <X size={12} color={colors.peachDeep} />
                  </View>
                  <Text style={styles.rowText}>{item}</Text>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        {result.why ? (
          <Section label="Why this may help" icon={Sparkles}>
            <Text style={[styles.paragraph, styles.whyBox]}>{result.why}</Text>
          </Section>
        ) : null}

        {result.nextTime ? (
          <Section label="Next time" icon={ArrowRight}>
            <Text style={styles.nextStep}>{result.nextTime}</Text>
          </Section>
        ) : null}

        {result.quickCue ? (
          <View style={[styles.quickCard, shadow.md, { marginTop: 26 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Sparkles size={14} color="#4A2E1C" />
              <Text style={styles.quickEyebrow}>Quick cue</Text>
            </View>
            <Text style={styles.quickCue}>"{result.quickCue}"</Text>
          </View>
        ) : null}

        <Text style={styles.disclaimer}>
          Created with AI. These are general ideas to try, not medical, diagnostic or professional advice. If you're
          worried, speak to your GP, health visitor or SENCO.
        </Text>

        <SecondaryButton
          style={{ marginTop: 16 }}
          onPress={() => {
            setResult(null);
            setSituation("");
          }}
        >
          Create another cue
        </SecondaryButton>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Describe what's happening in your own words, and we'll put together a cue for it — what may be going on, what you
          could say and do, and what to avoid.
          {profile?.name ? ` Suggestions will be shaped around ${profile.name}'s profile.` : ""}
        </Text>

        <Text style={styles.inputLabel}>What's happening?</Text>
        <TextInput
          style={styles.textArea}
          value={situation}
          onChangeText={setSituation}
          placeholder="e.g. He won't get out of the bath and it's nearly bedtime. Asking again just makes it worse."
          placeholderTextColor={colors.charcoalSoft}
          multiline
          maxLength={600}
          textAlignVertical="top"
        />
        <Text style={styles.counter}>{situation.length}/600</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <PrimaryButton style={{ marginTop: 10 }} disabled={loading || situation.trim().length < 10} onPress={generate}>
          {loading ? "Creating your cue…" : "Create my cue"}
        </PrimaryButton>
        {loading && <ActivityIndicator color={colors.sageDeep} style={{ marginTop: 18 }} />}
        <Text style={styles.tip}>This usually takes a few seconds. The more detail you give, the more specific the cue can be.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  intro: { fontFamily: fonts.bodyRegular, fontSize: 14, lineHeight: 21, color: colors.charcoalSoft, marginBottom: 20 },
  inputLabel: { fontFamily: fonts.bodyBold, fontSize: 12.5, letterSpacing: 0.4, textTransform: "uppercase", color: colors.tealDeep, marginBottom: 7 },
  textArea: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.charcoal,
    minHeight: 130,
    lineHeight: 21,
  },
  counter: { fontFamily: fonts.bodyRegular, fontSize: 11.5, color: colors.charcoalSoft, alignSelf: "flex-end", marginTop: 5 },
  error: { fontFamily: fonts.bodyRegular, fontSize: 13.5, lineHeight: 19, color: colors.peachDeep, marginTop: 8 },
  tip: { fontFamily: fonts.bodyRegular, fontSize: 12.5, lineHeight: 18, color: colors.charcoalSoft, textAlign: "center", marginTop: 14 },
  resultSituation: { fontFamily: fonts.display, fontSize: 18, lineHeight: 25, color: colors.charcoal, marginTop: 4 },
  sectionLabel: { fontFamily: fonts.bodyBold, fontSize: 12.5, letterSpacing: 0.4, textTransform: "uppercase", color: colors.tealDeep },
  paragraph: { fontFamily: fonts.bodyRegular, fontSize: 15, lineHeight: 23, color: colors.charcoal },
  rowCard: { backgroundColor: colors.white, borderRadius: radii.md, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  rowText: { fontFamily: fonts.bodyRegular, fontSize: 14.5, lineHeight: 20, flex: 1 },
  copyButton: { backgroundColor: colors.sagePale, borderRadius: 10, width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  copyText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.sageInk },
  doRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: colors.white, borderRadius: radii.md, padding: 13 },
  doCheck: { width: 20, height: 20, borderRadius: radii.pill, backgroundColor: colors.sagePale, alignItems: "center", justifyContent: "center", marginTop: 1 },
  whyBox: { backgroundColor: colors.sagePale, borderRadius: radii.md, padding: 15, color: colors.charcoalSoft, fontSize: 14.5 },
  nextStep: { fontFamily: fonts.bodyRegular, fontSize: 14.5, lineHeight: 21, color: colors.charcoal, paddingLeft: 14, borderLeftWidth: 2.5, borderLeftColor: colors.teal },
  quickCard: { borderRadius: radii.lg, padding: 20, backgroundColor: colors.peach },
  quickEyebrow: { fontFamily: fonts.bodyBold, fontSize: 12.5, letterSpacing: 0.4, textTransform: "uppercase", color: "#4A2E1C", opacity: 0.85 },
  quickCue: { fontFamily: fonts.display, fontSize: 22, color: "#4A2E1C", lineHeight: 30 },
  disclaimer: { fontFamily: fonts.bodyRegular, fontSize: 12, lineHeight: 18, color: colors.charcoalSoft, marginTop: 24, textAlign: "center" },
});
