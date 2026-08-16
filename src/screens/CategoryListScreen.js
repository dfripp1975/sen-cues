import React from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CATEGORIES, SITUATIONS } from "../data/content";
import { colors } from "../theme";
import { ScreenHeader } from "../components/UI";
import CueTile from "../components/CueTile";
import { useFavourites } from "../hooks/useFavourites";
import { usePremium } from "../hooks/usePremium";

const FREE_LIMIT = 2;

export default function CategoryListScreen({ route, navigation }) {
  const { categoryId } = route.params;
  const category = CATEGORIES.find((c) => c.id === categoryId);
  const items = SITUATIONS.filter((s) => s.category === categoryId);
  const { favourites, toggleFavourite } = useFavourites();
  const { isPremium, openPaywall } = usePremium(navigation);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={["top"]}>
      <ScreenHeader title={category?.label} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 30, gap: 22 }}>
        {items.map((s, i) => {
          const locked = !isPremium && i >= FREE_LIMIT;
          return (
            <CueTile
              key={s.id}
              situation={s}
              favourite={favourites.has(s.id)}
              locked={locked}
              tone={i % 2 === 0 ? "sage" : "teal"}
              onOpen={(isLocked) =>
                isLocked ? openPaywall() : navigation.navigate("SituationDetail", { situationId: s.id })
              }
              onToggleFav={toggleFavourite}
            />
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
