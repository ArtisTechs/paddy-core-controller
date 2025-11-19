import { FontAwesome } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import paddyCoreApi from "@/services/paddyCoreApi";

export default function HomeScreen() {
  const [isConnected, setIsConnected] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(0);

  useEffect(() => {
    paddyCoreApi.connect();

    const listener = (msg: any) => {
      console.log("[HomeScreen] Received message:", msg);

      // Listen for connection status changes
      if (msg?.type === "connection_status") {
        setIsConnected(msg.connected === true);
      }
      // Also set connected when we receive any message (indicating connection is working)
      else if (!isConnected) {
        setIsConnected(true);
      }

      if (msg?.type === "battery") {
        setBatteryLevel(msg.level ?? 0);
      }
    };

    paddyCoreApi.addListener(listener);

    // Set up connection status check
    const checkConnection = () => {
      // If we haven't received any messages after 3 seconds, assume disconnected
      setTimeout(() => {
        if (!isConnected) {
          console.log(
            "[HomeScreen] Connection timeout - assuming disconnected"
          );
          setIsConnected(false);
        }
      }, 3000);
    };

    checkConnection();

    return () => paddyCoreApi.removeListener(listener);
  }, []);

  // Update paddyCoreApi to broadcast connection status
  useEffect(() => {
    // You'll need to modify your paddyCoreApi to emit connection status
    // For now, we'll use a simple interval to check connection
    const interval = setInterval(() => {
      // This is a workaround - ideally paddyCoreApi should expose connection state
      const ws = (paddyCoreApi as any).ws;
      if (ws) {
        const connected = ws.readyState === WebSocket.OPEN;
        if (connected !== isConnected) {
          setIsConnected(connected);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const batIcon = "battery-full";

  const batColor = "#2ecc71";

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {/* Status */}
      <ThemedView style={[styles.card, styles.statusCard]}>
        <View style={styles.statusHeaderRow}>
          <ThemedText type="title">Paddy Core Controller</ThemedText>
        </View>

        <View style={styles.statusRow}>
          <ThemedText style={styles.statusLabel}>Connection</ThemedText>
          <View style={styles.statusRight}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isConnected ? "#22c55e" : "#ef4444" },
              ]}
            />
            <ThemedText style={styles.statusValue}>
              {isConnected ? "Connected" : "Disconnected"}
            </ThemedText>
          </View>
        </View>

        <View style={styles.statusRow}>
          <ThemedText style={styles.statusLabel}>Battery</ThemedText>
          <View style={styles.statusRight}>
            <FontAwesome name={batIcon} size={18} color={batColor} />
          </View>
        </View>
      </ThemedView>

      {/* Movement */}
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle" style={styles.cardTitle}>
          Movement
        </ThemedText>

        <View style={styles.dpadContainer}>
          <View style={styles.padRow}>
            <ControllerButton onPress={() => paddyCoreApi.sendMoveForward()}>
              <FontAwesome name="arrow-up" size={26} color="#EAEAEA" />
            </ControllerButton>
          </View>

          <View style={styles.padRow}>
            <ControllerButton onPress={() => paddyCoreApi.sendMoveLeft()}>
              <FontAwesome name="arrow-left" size={26} color="#EAEAEA" />
            </ControllerButton>

            <ControllerButton primary onPress={() => paddyCoreApi.sendStop()}>
              <FontAwesome name="stop" size={22} color="#FF6B6B" />
            </ControllerButton>

            <ControllerButton onPress={() => paddyCoreApi.sendMoveRight()}>
              <FontAwesome name="arrow-right" size={26} color="#EAEAEA" />
            </ControllerButton>
          </View>

          <View style={styles.padRow}>
            <ControllerButton onPress={() => paddyCoreApi.sendMoveBackward()}>
              <FontAwesome name="arrow-down" size={26} color="#EAEAEA" />
            </ControllerButton>
          </View>
        </View>
      </ThemedView>

      {/* Actions */}
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle" style={styles.cardTitle}>
          Actions
        </ThemedText>

        {/* Horn */}
        <ThemedText style={styles.groupLabel}>Horn</ThemedText>
        <View style={styles.row}>
          <WideButton onPress={() => paddyCoreApi.sendHorn()}>
            <FontAwesome name="bullhorn" size={18} color="#EAEAEA" />
            <ThemedText style={styles.wideButtonText}>Horn</ThemedText>
          </WideButton>
        </View>

        {/* Rice Door */}
        <ThemedText style={styles.groupLabel}>Rice Door</ThemedText>
        <View style={styles.row}>
          <SmallButton onPress={() => paddyCoreApi.sendDoorOpen()}>
            <ThemedText style={styles.smallButtonText}>Open</ThemedText>
          </SmallButton>

          <SmallButton
            variant="danger"
            onPress={() => paddyCoreApi.sendDoorClose()}
          >
            <ThemedText style={styles.smallButtonText}>Close</ThemedText>
          </SmallButton>
        </View>

        {/* Scoop */}
        <ThemedText style={styles.groupLabel}>Front Scoop</ThemedText>
        <View style={styles.row}>
          <SmallButton onPress={() => paddyCoreApi.sendScoopUp()}>
            <ThemedText style={styles.smallButtonText}>Up</ThemedText>
          </SmallButton>
          <SmallButton onPress={() => paddyCoreApi.sendScoopDown()}>
            <ThemedText style={styles.smallButtonText}>Down</ThemedText>
          </SmallButton>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

/* ===========================================================
   CUSTOM BUTTON COMPONENTS
   =========================================================== */

type ControllerButtonProps = {
  children: React.ReactNode;
  onPress: () => void;
  primary?: boolean;
};

function ControllerButton({
  children,
  onPress,
  primary = false,
}: ControllerButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.dpadButton, primary && styles.dpadButtonPrimary]}
    >
      {children}
    </TouchableOpacity>
  );
}

type SmallButtonProps = {
  children: React.ReactNode;
  onPress: () => void;
  variant?: "default" | "danger";
};

function SmallButton({
  children,
  onPress,
  variant = "default",
}: SmallButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.smallButton,
        variant === "danger" && styles.smallButtonDanger,
      ]}
    >
      {children}
    </TouchableOpacity>
  );
}

type WideButtonProps = {
  children: React.ReactNode;
  onPress: () => void;
};

function WideButton({ children, onPress }: WideButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.wideButton}
    >
      {children}
    </TouchableOpacity>
  );
}

/* ===========================================================
   STYLES
   =========================================================== */
const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 32,
    gap: 12,
    backgroundColor: "#020617",
  },

  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#020617",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#1f2937",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
    gap: 10,
  },

  statusCard: {
    backgroundColor: "#030712",
  },

  cardTitle: { marginBottom: 6 },

  statusHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  statusLabel: { fontSize: 14, opacity: 0.7 },
  statusRight: { flexDirection: "row", alignItems: "center" },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  statusValue: { fontSize: 14, fontWeight: "600" },

  dpadContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 10,
  },
  padRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 18,
  },
  dpadButton: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#374151",
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  dpadButtonPrimary: {
    backgroundColor: "#3b1f21",
    borderColor: "#7f1d1d",
  },

  row: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },

  groupLabel: {
    fontSize: 13,
    opacity: 0.75,
    marginTop: 10,
    marginBottom: 4,
  },

  smallButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#111827",
    borderColor: "#374151",
    alignItems: "center",
  },
  smallButtonDanger: {
    backgroundColor: "#3f1d1d",
    borderColor: "#7f1d1d",
  },
  smallButtonText: { fontSize: 15, fontWeight: "600" },

  wideButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#1e293b",
    borderColor: "#334155",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  wideButtonText: { fontSize: 15, fontWeight: "600" },
});
