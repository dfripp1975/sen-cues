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
import { ensureSession } from "./src/lib/supabase";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [frauncesLoaded] = useFraunces({ Fraunces_500Medium, Fraunces_600SemiBold });
  const [jakartaLoaded] = useJakarta({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
  });
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    ensureSession()
      .catch((e) => console.warn("Session error", e))
      .finally(() => setSessionReady(true));
  }, []);

  const ready = frauncesLoaded && jakartaLoaded && sessionReady;

  const onLayout = useCallback(async () => {
    if (ready) await SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }} onLayout={onLayout}>
      <StatusBar style="dark" />
      <RootNavigator />
    </View>
  );
}
