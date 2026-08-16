import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sparkles } from "lucide-react-native";

import { colors, fonts, radii } from "../theme";
import { PrimaryButton, SecondaryButton } from "../components/UI";

// TODO for Claude Code: this is a placeholder. The prototype's Paywall component
// (App.jsx) has the full plan-picker UI (monthly £4.99 / yearly £39.99, feature
// list). Real subscriptions need RevenueCat: `npx expo install react-native-purchases`,
// configure products in App Store Connect + Google Play Console first, then wire
// purchase/restore here and update accounts.is_premium via RevenueCat webhook
// (don't just set it client-side, that can be bypassed).
export default function PaywallScreen({ navigation }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream, justifyContent: "flex-end" }}>
      <View style={styles.sheet}>
        <View style={styles.iconWrap}>
          <Sparkles size={22} color="#4A2E1C" />
        </View>
        <Text style={styles.h1}>SEN Cues Premium</Text>
        <Text style={styles.sub}>Full support, whenever you need it.</Text>
        <PrimaryButton onPress={() => navigation.goBack()}>Start free trial</PrimaryButton>
        <SecondaryButton onPress={() => navigation.goBack()} style={{ marginTop: 10 }}>
          Not now
        </SecondaryButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sheet: { backgroundColor: colors.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, alignItems: "center" },
  iconWrap: { width: 52, height: 52, borderRadius: radii.pill, backgroundColor: colors.peach, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  h1: { fontFamily: fonts.display, fontSize: 22, color: colors.charcoal, marginBottom: 6 },
  sub: { fontFamily: fonts.bodyRegular, fontSize: 13.5, color: colors.charcoalSoft, marginBottom: 20 },
});
