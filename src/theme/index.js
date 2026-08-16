// Design tokens carried over from the SEN Cues prototype.
// Fonts are loaded via expo-font in App.js (Fraunces = display, Plus Jakarta Sans = body).

export const colors = {
  cream: "#FBF8F2",
  creamWarm: "#F2ECDF",
  sagePale: "#E7EDE2",
  sage: "#8FA888",
  sageDeep: "#5D7A5F",
  sageInk: "#35452F",
  teal: "#4E7B80",
  tealDeep: "#35595D",
  charcoal: "#33322C",
  charcoalSoft: "#6B6A61",
  peach: "#EFC3A6",
  peachDeep: "#D89B77",
  white: "#FFFFFF",
  line: "rgba(51,50,44,0.12)",
};

export const fonts = {
  display: "Fraunces_600SemiBold",
  displayMedium: "Fraunces_500Medium",
  body: "PlusJakartaSans_500Medium",
  bodyBold: "PlusJakartaSans_700Bold",
  bodyRegular: "PlusJakartaSans_400Regular",
};

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 22,
  pill: 999,
};

export const shadow = {
  sm: {
    shadowColor: "#33322C",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  md: {
    shadowColor: "#35452F",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  lg: {
    shadowColor: "#35452F",
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
};
