import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../theme";
import { ScreenHeader } from "../components/UI";
import VisualChoiceMaker from "./tools/VisualChoiceMaker";
import FirstThen from "./tools/FirstThen";
import CountdownTool from "./tools/CountdownTool";
import BreakItDown from "./tools/BreakItDown";
import AICueGenerator from "./tools/AICueGenerator";

// Access to "Create a Cue" (the AI tool) is gated in ToolkitScreen — it sends
// non-premium users to the Paywall instead of navigating here.
const TOOLS = {
  choice: { title: "Visual Choice Maker", Component: VisualChoiceMaker },
  firstthen: { title: "First / Then", Component: FirstThen },
  countdown: { title: "Countdown", Component: CountdownTool },
  breakdown: { title: "Break It Down", Component: BreakItDown },
  ai: { title: "Create a Cue", Component: AICueGenerator },
};

export default function ToolDetailScreen({ route, navigation }) {
  const tool = TOOLS[route.params.toolId];
  if (!tool) return null;
  const { title, Component } = tool;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={["top"]}>
      <ScreenHeader title={title} onBack={() => navigation.goBack()} />
      <Component navigation={navigation} />
    </SafeAreaView>
  );
}
