// TabTwoScreen.tsx
import { FontAwesome } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import paddyCoreApi from "@/services/paddyCoreApi";

export default function TabTwoScreen() {
  const [frame, setFrame] = useState<string | null>(null);
  const [hornMinutes, setHornMinutes] = useState<string>("");

  useEffect(() => {
    paddyCoreApi.connect();

    const listener = (msg: any) => {
      if (msg?.type === "camera_frame" && msg.data) {
        setFrame(msg.data as string);
      }
    };

    paddyCoreApi.addListener(listener);
    paddyCoreApi.sendCameraStart();

    return () => {
      paddyCoreApi.sendCameraStop();
      paddyCoreApi.removeListener(listener);
      paddyCoreApi.close();
    };
  }, []);

  const handleLeft = () => paddyCoreApi.sendCameraLeft();
  const handleRight = () => paddyCoreApi.sendCameraRight();
  const handleHorn = () => paddyCoreApi.sendHorn();

  const handleSetHornTimer = () => {
    const mins = parseInt(hornMinutes, 10);
    if (!isNaN(mins) && mins > 0) {
      // send timer set command via WS
      paddyCoreApi.sendHornTimerSet(mins);
    }
  };

  const handleClearHornTimer = () => {
    // send timer clear command via WS
    paddyCoreApi.sendHornTimerClear();
    setHornMinutes("");
  };

  return (
    <ThemedView style={styles.screen}>
      {/* Camera area */}
      <View style={styles.cameraContainer}>
        {frame ? (
          <Image
            style={styles.cameraImage}
            resizeMode="contain"
            source={{ uri: `data:image/jpeg;base64,${frame}` }}
          />
        ) : (
          <ThemedText style={styles.cameraLabel}>Camera View</ThemedText>
        )}
      </View>

      {/* Direction + Horn button row */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={styles.controlButton}
          activeOpacity={0.8}
          onPress={handleLeft}
        >
          <FontAwesome name="arrow-left" size={28} color="#EAEAEA" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.hornButton]}
          activeOpacity={0.8}
          onPress={handleHorn}
        >
          <FontAwesome name="bullhorn" size={24} color="#EAEAEA" />
          <ThemedText style={styles.hornLabel}>Horn</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          activeOpacity={0.8}
          onPress={handleRight}
        >
          <FontAwesome name="arrow-right" size={28} color="#EAEAEA" />
        </TouchableOpacity>
      </View>

      {/* Horn timer row */}
      <View style={styles.timerRow}>
        <View style={styles.timerInputWrapper}>
          <ThemedText style={styles.timerLabel}>Horn timer (min)</ThemedText>
          <TextInput
            style={styles.timerInput}
            keyboardType="numeric"
            value={hornMinutes}
            onChangeText={setHornMinutes}
            placeholder="e.g. 5"
            placeholderTextColor="#6b7280"
          />
        </View>

        <TouchableOpacity
          style={[styles.timerButton, styles.setButton]}
          activeOpacity={0.8}
          onPress={handleSetHornTimer}
        >
          <ThemedText style={styles.timerButtonText}>Set</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.timerButton, styles.clearButton]}
          activeOpacity={0.8}
          onPress={handleClearHornTimer}
        >
          <ThemedText style={styles.timerButtonText}>Remove</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: "#020617",
    justifyContent: "space-between",
  },

  cameraContainer: {
    flex: 1,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#1f2937",
    backgroundColor: "#020617",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  cameraLabel: {
    opacity: 0.6,
    fontSize: 16,
  },
  cameraImage: {
    width: "100%",
    height: "100%",
  },

  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 12,
  },

  controlButton: {
    flex: 1,
    height: 70,
    borderRadius: 14,
    backgroundColor: "#111827",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
  },

  hornButton: {
    flex: 1.4,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1e293b",
    borderColor: "#334155",
  },
  hornLabel: {
    fontSize: 16,
    fontWeight: "600",
  },

  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timerInputWrapper: {
    flex: 1.4,
  },
  timerLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 4,
  },
  timerInput: {
    height: 40,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#374151",
    paddingHorizontal: 10,
    color: "#e5e7eb",
    backgroundColor: "#020617",
  },
  timerButton: {
    flex: 0.8,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  setButton: {
    backgroundColor: "#16a34a",
    borderColor: "#15803d",
  },
  clearButton: {
    backgroundColor: "#991b1b",
    borderColor: "#7f1d1d",
  },
  timerButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f9fafb",
  },
});
