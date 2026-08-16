import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LEARN_ARTICLES } from "../data/content";
import { colors, fonts, radii } from "../theme";
import { ScreenHeader, Chip } from "../components/UI";

export default function LearnArticleScreen({ route, navigation }) {
  const { articleId } = route.params;
  const article = LEARN_ARTICLES.find((a) => a.id === articleId);
  if (!article) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={["top"]}>
      <ScreenHeader title="" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 44 }}>
        <View style={{ flexDirection: "row", gap: 6, marginBottom: 12 }}>
          <Chip tone="teal">{article.category}</Chip>
        </View>
        <Text style={styles.title}>{article.title}</Text>
        <Text style={styles.minutes}>Read in {article.minutes} minutes</Text>

        {article.body?.map((section, i) => (
          <View key={i} style={{ marginTop: i === 0 ? 20 : 22 }}>
            {section.heading ? <Text style={styles.heading}>{section.heading}</Text> : null}
            <Text style={styles.paragraph}>{section.text}</Text>
          </View>
        ))}

        <Text style={styles.footerNote}>
          Every child is different — take what fits and leave what doesn't. This is general information, not medical or
          diagnostic advice.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 25, lineHeight: 32, color: colors.charcoal },
  minutes: { fontFamily: fonts.bodyRegular, fontSize: 12.5, color: colors.charcoalSoft, marginTop: 8 },
  heading: { fontFamily: fonts.display, fontSize: 17.5, color: colors.charcoal, marginBottom: 8 },
  paragraph: { fontFamily: fonts.bodyRegular, fontSize: 15, lineHeight: 24, color: colors.charcoal },
  footerNote: {
    fontFamily: fonts.bodyRegular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.charcoalSoft,
    backgroundColor: colors.sagePale,
    borderRadius: radii.md,
    padding: 14,
    marginTop: 30,
  },
});
