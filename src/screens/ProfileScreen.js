import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Pencil, Plus, Check, Lock } from "lucide-react-native";

import { colors, fonts, radii, shadow } from "../theme";
import { SecondaryButton } from "../components/UI";
import { supabase } from "../lib/supabase";
import { usePremium } from "../hooks/usePremium";

export default function ProfileScreen({ navigation }) {
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const { isPremium, openPaywall } = usePremium(navigation);

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;
    const { data } = await supabase.from("child_profiles").select("*").eq("user_id", userData.user.id).order("created_at");
    setProfiles(data || []);
    const { data: account } = await supabase.from("accounts").select("active_profile_id").eq("user_id", userData.user.id).maybeSingle();
    setActiveProfileId(account?.active_profile_id || null);
  }, []);

  const setActive = useCallback(
    async (id) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      setActiveProfileId(id);
      await supabase.from("accounts").upsert({ user_id: userData.user.id, active_profile_id: id });
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 30 }}>
        <Text style={styles.h1}>Profile</Text>
        <Text style={styles.sub}>Personalise cues to your child, or your children.</Text>

        <Text style={styles.groupLabel}>Child profiles</Text>
        {profiles.length === 0 && (
          <Text style={styles.emptyNote}>No profiles yet. Adding one helps personalise suggestions, it's entirely optional.</Text>
        )}
        <View style={{ gap: 8, marginBottom: 12 }}>
          {profiles.map((p) => {
            const isActive = p.id === activeProfileId;
            return (
              <Pressable key={p.id} onPress={() => navigation.navigate("ProfileForm", { profileId: p.id })} style={[styles.profileRow, shadow.sm]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileName}>
                    {p.name || "Unnamed"} {p.age ? `· ${p.age}` : ""}
                  </Text>
                  <Text style={styles.profileDiagnosis}>{p.diagnosis}</Text>
                  {(profiles.length > 1 || isActive) && (
                    <Pressable
                      onPress={() => setActive(p.id)}
                      disabled={isActive}
                      hitSlop={6}
                      style={[styles.activeChip, isActive && styles.activeChipOn]}
                    >
                      {isActive && <Check size={11} color={colors.sageInk} strokeWidth={3} />}
                      <Text style={[styles.activeChipText, isActive && { color: colors.sageInk }]}>
                        {isActive ? "Personalising for" : "Personalise for this child"}
                      </Text>
                    </Pressable>
                  )}
                </View>
                <Pencil size={15} color={colors.charcoalSoft} />
              </Pressable>
            );
          })}
        </View>
        <SecondaryButton onPress={() => navigation.navigate("ProfileForm", {})}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Plus size={16} color={colors.charcoal} />
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15 }}>Add child profile</Text>
          </View>
        </SecondaryButton>

        <View style={[styles.planCard, { backgroundColor: isPremium ? colors.sagePale : colors.white, marginTop: 22 }, shadow.sm]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
            {isPremium ? <Check size={17} color={colors.sageInk} /> : <Lock size={17} color={colors.charcoalSoft} />}
            <Text style={styles.planTitle}>{isPremium ? "You're on SEN Cues Premium" : "SEN Cues Free plan"}</Text>
          </View>
          <Text style={styles.planDesc}>
            {isPremium ? "Full library, AI Cue Generator and toolkit unlocked." : "A limited library and toolkit. Upgrade for full access."}
          </Text>
          {!isPremium && (
            <SecondaryButton onPress={openPaywall} style={{ marginTop: 12 }}>
              See Premium
            </SecondaryButton>
          )}
        </View>

        <Text style={styles.disclaimer}>
          SEN Cues provides general educational and practical support. Every child is different. The suggestions are not a
          diagnosis or a substitute for professional advice. If there is an immediate risk of serious harm, please contact
          emergency services or a qualified professional.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: fonts.display, fontSize: 24, color: colors.charcoal, marginBottom: 4 },
  sub: { fontFamily: fonts.bodyRegular, fontSize: 13.5, color: colors.charcoalSoft, marginBottom: 18 },
  groupLabel: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.sageDeep, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 },
  emptyNote: { fontFamily: fonts.bodyRegular, fontSize: 13.5, color: colors.charcoalSoft, marginBottom: 12 },
  profileRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.white, borderRadius: radii.md, padding: 14 },
  profileName: { fontFamily: fonts.bodyBold, fontSize: 14.5 },
  profileDiagnosis: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.charcoalSoft },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 8,
  },
  activeChipOn: { backgroundColor: colors.sagePale, borderColor: colors.sagePale },
  activeChipText: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: colors.charcoalSoft },
  planCard: { borderRadius: radii.lg, padding: 18 },
  planTitle: { fontFamily: fonts.display, fontSize: 15.5, color: colors.charcoal },
  planDesc: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.charcoalSoft },
  disclaimer: { fontFamily: fonts.bodyRegular, fontSize: 11.5, color: colors.charcoalSoft, lineHeight: 17, backgroundColor: colors.white, borderRadius: radii.md, padding: 15, marginTop: 22 },
});
