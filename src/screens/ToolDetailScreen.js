import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fonts } from "../theme";
import { ScreenHeader } from "../components/UI";

// TODO for Claude Code: this is the biggest remaining gap. Port each tool from
// the prototype (App.jsx): VisualChoiceMaker, FirstThen, Countdown (setInterval
// works the same in RN, swap div/button for View/Pressable), BreakItDown, and
// AICueGenerator (call the generate-cue Supabase Edge Function with the user's
// session access token in the Authorization header, not api.anthropic.com directly).
const TOOL_LABELS = {
  choice: "Visual Choice Maker",
  firstthen: "First / Then",
  countdown: "Countdown",
  breakdown: "Break It Down",
  ai: "Create a Cue",
};

export default function ToolDetailScreen({ route, navigation }) {
  const { toolId } = route.params;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={["top"]}>
      <ScreenHeader title={TOOL_LABELS[toolId]} onBack={() => navigation.goBack()} />
      <View style={styles.placeholder}>
        <Text style={styles.text}>This tool still needs porting from the prototype. See the TODO comment at the top of this file.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30 },
  text: { fontFamily: fonts.bodyRegular, fontSize: 14, color: colors.charcoalSoft, textAlign: "center", lineHeight: 21 },
});
