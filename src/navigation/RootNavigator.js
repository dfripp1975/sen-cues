import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Heart, Wrench, BookOpen, User } from "lucide-react-native";

import HomeScreen from "../screens/HomeScreen";
import CategoryListScreen from "../screens/CategoryListScreen";
import SituationDetailScreen from "../screens/SituationDetailScreen";
import NowModeScreen from "../screens/NowModeScreen";
import MyCuesScreen from "../screens/MyCuesScreen";
import ToolkitScreen from "../screens/ToolkitScreen";
import ToolDetailScreen from "../screens/ToolDetailScreen";
import LearnScreen from "../screens/LearnScreen";
import LearnArticleScreen from "../screens/LearnArticleScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ProfileFormScreen from "../screens/ProfileFormScreen";
import PaywallScreen from "../screens/PaywallScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import { colors, fonts } from "../theme";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Each tab gets its own stack so category → situation navigation keeps that
// tab's back button working correctly, rather than one shared stack for everything.
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="CategoryList" component={CategoryListScreen} />
      <Stack.Screen name="SituationDetail" component={SituationDetailScreen} />
    </Stack.Navigator>
  );
}

function MyCuesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyCuesMain" component={MyCuesScreen} />
      <Stack.Screen name="SituationDetail" component={SituationDetailScreen} />
    </Stack.Navigator>
  );
}

function ToolkitStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ToolkitMain" component={ToolkitScreen} />
      <Stack.Screen name="ToolDetail" component={ToolDetailScreen} />
    </Stack.Navigator>
  );
}

function LearnStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LearnMain" component={LearnScreen} />
      <Stack.Screen name="LearnArticle" component={LearnArticleScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="ProfileForm" component={ProfileFormScreen} />
    </Stack.Navigator>
  );
}

function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.sageDeep,
        tabBarInactiveTintColor: colors.charcoalSoft,
        tabBarStyle: { borderTopColor: colors.line, height: 84, paddingTop: 8 },
        tabBarLabelStyle: { fontFamily: fonts.bodyBold, fontSize: 10.5 },
        tabBarIcon: ({ color, size }) => {
          const icons = { Home, "My cues": Heart, Toolkit: Wrench, Learn: BookOpen, Profile: User };
          const Icon = icons[route.name] || Home;
          return <Icon color={color} size={size ? 20 : 20} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="My cues" component={MyCuesStack} />
      <Tab.Screen name="Toolkit" component={ToolkitStack} />
      <Tab.Screen name="Learn" component={LearnStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

// initialRoute is decided in App.js (while the splash screen is still up) by
// checking whether accounts.onboarding_answers exists for this user.
export default function RootNavigator({ initialRoute = "Onboarding" }) {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Tabs" component={TabsNavigator} />
        <Stack.Screen
          name="NowMode"
          component={NowModeScreen}
          options={{ presentation: "fullScreenModal", animation: "fade" }}
        />
        <Stack.Screen
          name="Paywall"
          component={PaywallScreen}
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
