import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

import { colors, fonts, radii, shadow } from "../../theme";
import { PrimaryButton, SecondaryButton } from "../../components/UI";

const PRESET_MINUTES = [1, 2, 3, 5, 10];

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function CountdownTool() {
  const [totalSeconds, setTotalSeconds] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) return undefined;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const start = (minutes) => {
    const seconds = minutes * 60;
    setTotalSeconds(seconds);
    setSecondsLeft(seconds);
    setRunning(true);
  };

  const reset = () => {
    setRunning(false);
    setTotalSeconds(null);
    setSecondsLeft(null);
  };

  // Not started yet
  if (totalSeconds === null) {
    return (
      <View style={{ flex: 1, paddingHorizontal: 18 }}>
        <Text style={styles.intro}>
          Time is invisible, and "five more minutes" may not mean much on its own. A countdown they can watch makes the end
          of an activity feel predictable rather than sudden.
        </Text>
        <Text style={styles.inputLabel}>How long?</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {PRESET_MINUTES.map((m) => (
            <Pressable key={m} onPress={() => start(m)} style={[styles.durationChip, shadow.sm]}>
              <Text style={styles.durationNumber}>{m}</Text>
              <Text style={styles.durationUnit}>{m === 1 ? "minute" : "minutes"}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.tip}>
          Before you start, it can help to say what happens when the timer ends: "When the countdown finishes, it's time to
          put shoes on."
        </Text>
      </View>
    );
  }

  // Finished
  if (secondsLeft === 0) {
    return (
      <View style={{ flex: 1, paddingHorizontal: 18, justifyContent: "center" }}>
        <View style={[styles.finishedCard, shadow.lg]}>
          <Text style={styles.finishedEyebrow}>All done</Text>
          <Text style={styles.finishedText}>The countdown has finished.</Text>
        </View>
        <View style={{ gap: 10, marginTop: 26 }}>
          <PrimaryButton onPress={reset}>Start another countdown</PrimaryButton>
        </View>
      </View>
    );
  }

  // Running or paused
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  return (
    <View style={{ flex: 1, paddingHorizontal: 18 }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={styles.time}>{formatTime(secondsLeft)}</Text>
        {!running && <Text style={styles.pausedNote}>Paused</Text>}
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${Math.max(progress * 100, 2)}%` }]} />
        </View>
      </View>
      <View style={{ gap: 10, paddingBottom: 24 }}>
        <PrimaryButton onPress={() => setRunning((r) => !r)}>{running ? "Pause" : "Carry on"}</PrimaryButton>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <SecondaryButton
            style={{ flex: 1 }}
            onPress={() => {
              setTotalSeconds((t) => t + 60);
              setSecondsLeft((s) => s + 60);
            }}
          >
            Add a minute
          </SecondaryButton>
          <SecondaryButton style={{ flex: 1 }} onPress={reset}>
            Stop
          </SecondaryButton>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { fontFamily: fonts.bodyRegular, fontSize: 14, lineHeight: 21, color: colors.charcoalSoft, marginBottom: 20 },
  inputLabel: { fontFamily: fonts.bodyBold, fontSize: 12.5, letterSpacing: 0.4, textTransform: "uppercase", color: colors.tealDeep, marginBottom: 10 },
  durationChip: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    width: 96,
    paddingVertical: 16,
    alignItems: "center",
  },
  durationNumber: { fontFamily: fonts.display, fontSize: 26, color: colors.charcoal },
  durationUnit: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.charcoalSoft, marginTop: 2 },
  tip: { fontFamily: fonts.bodyRegular, fontSize: 12.5, lineHeight: 18, color: colors.charcoalSoft, marginTop: 22 },
  time: { fontFamily: fonts.display, fontSize: 76, color: colors.charcoal },
  pausedNote: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.charcoalSoft, marginTop: 2 },
  barTrack: {
    width: "100%",
    height: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.sagePale,
    marginTop: 28,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: radii.pill, backgroundColor: colors.sageDeep },
  finishedCard: { backgroundColor: colors.peach, borderRadius: radii.xl, padding: 26, alignItems: "center" },
  finishedEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 12.5,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#4A2E1C",
    opacity: 0.85,
    marginBottom: 8,
  },
  finishedText: { fontFamily: fonts.display, fontSize: 24, color: "#4A2E1C", textAlign: "center", lineHeight: 31 },
});
