import React, { useEffect, useState, useCallback } from "react";
import { View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import {
  useFonts as useFraunces,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
} from "@expo-google-fonts/fraunces";
import {
  useFonts as useJakarta,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";

import RootNavigator from "./src/navigation/RootNavigator";
import { colors } from "./src/theme";
import { supabase, ensureSession } from "./src/lib/supabase";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [frauncesLoaded] = useFraunces({ Fraunces_500Medium, Fraunces_600SemiBold });
  const [jakartaLoaded] = useJakarta({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
  });
  // Decided while the splash screen is still up, so returning users go
  // straight to the tabs without an onboarding flash.
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const session = await ensureSession();
        const { data } = await supabase
          .from("accounts")
          .select("onboarding_answers")
          .eq("user_id", session.user.id)
          .maybeSingle();
        setInitialRoute(data?.onboarding_answers ? "Tabs" : "Onboarding");
      } catch (e) {
        console.warn("Session error", e);
        setInitialRoute("Onboarding");
      }
    })();
  }, []);

  const ready = frauncesLoaded && jakartaLoaded && initialRoute !== null;

  const onLayout = useCallback(async () => {
    if (ready) await SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }} onLayout={onLayout}>
      <StatusBar style="dark" />
      <RootNavigator initialRoute={initialRoute} />
    </View>
  );
}
