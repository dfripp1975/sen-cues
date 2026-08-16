import React, { useEffect, useState } from "react";
import { View, Text, TextInput, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fonts, radii } from "../theme";
import { ScreenHeader, PrimaryButton } from "../components/UI";
import { supabase } from "../lib/supabase";

// TODO for Claude Code: this covers name + age only. Port every field from
// ProfileForm in the prototype (App.jsx): diagnosis picker, communication
// preferences, sensory preferences, triggers, helps, calming activities, notes.
// Also add delete + a "personalising for" switcher when there's more than one profile.
export default function ProfileFormScreen({ route, navigation }) {
  const { profileId } = route.params || {};
  const [name, setName] = useState("");
  const [age, setAge] = useState("");

  useEffect(() => {
    if (!profileId) return;
    supabase
      .from("child_profiles")
      .select("*")
      .eq("id", profileId)
      .single()
      .then(({ data }) => {
        if (data) {
          setName(data.name || "");
          setAge(data.age || "");
        }
      });
  }, [profileId]);

  const save = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;
    if (profileId) {
      await supabase.from("child_profiles").update({ name, age }).eq("id", profileId);
    } else {
      await supabase.from("child_profiles").insert({ user_id: userData.user.id, name, age });
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={["top"]}>
      <ScreenHeader title={profileId ? "Edit profile" : "New child profile"} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 30 }}>
        <Text style={styles.label}>First name or nickname</Text>
        <TextInput value={name} onChangeText={setName} placeholder="e.g. Sam" style={styles.input} />
        <Text style={styles.label}>Age</Text>
        <TextInput value={age} onChangeText={setAge} placeholder="e.g. 8" style={styles.input} />
        <PrimaryButton onPress={save} style={{ marginTop: 12 }}>
          Save profile
        </PrimaryButton>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.charcoalSoft, marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.sm,
    padding: 12,
    fontFamily: fonts.body,
    fontSize: 14.5,
    backgroundColor: colors.white,
    marginBottom: 14,
  },
});
