import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

interface SLATimerProps {
  remaining: string;
  isBreached?: boolean;
  isResolved?: boolean;
  compact?: boolean;
}

export default function SLATimer({
  remaining,
  isBreached,
  isResolved,
  compact,
}: SLATimerProps) {
  const paddingStyle = compact ? styles.compactPadding : styles.normalPadding;

  if (isResolved) {
    return (
      <View style={[styles.container, styles.resolved, paddingStyle]}>
        <Feather
          name="check-circle"
          size={compact ? 18 : 22}
          color="#16A34A"
        />
        <View>
          <Text
            style={[
              styles.resolvedTitle,
              compact && styles.compactTitle,
            ]}
          >
            Issue Resolved
          </Text>
          <Text style={styles.resolvedSubtitle}>
            Resolved within SLA timeline
          </Text>
        </View>
      </View>
    );
  }

  if (isBreached) {
    return (
      <View style={[styles.container, styles.breached, paddingStyle]}>
        <Feather
          name="alert-triangle"
          size={compact ? 18 : 22}
          color="#DC2626"
        />
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.breachedTitle,
              compact && styles.compactTitle,
            ]}
          >
            SLA Breached
          </Text>
          <Text style={styles.breachedSubtitle}>
            Escalated to District Officer
          </Text>
        </View>

        <View style={styles.overdueBadge}>
          <Text style={styles.overdueText}>OVERDUE</Text>
        </View>
      </View>
    );
  }

  const isWarning =
    remaining.startsWith("0h") ||
    remaining.startsWith("1h") ||
    remaining.startsWith("2h");

  return (
    <View
      style={[
        styles.container,
        isWarning ? styles.warning : styles.normal,
        paddingStyle,
      ]}
    >
      <Feather
        name="clock"
        size={compact ? 18 : 22}
        color={isWarning ? "#EA580C" : "#1E3A8A"}
      />

      <View>
        <Text
          style={[
            styles.dueLabel,
            compact && { fontSize: 12 },
          ]}
        >
          Resolution due in
        </Text>
        <Text
          style={[
            styles.remainingText,
            isWarning && styles.warningText,
            compact && { fontSize: 15 },
          ]}
        >
          {remaining}
        </Text>
      </View>

      <View
        style={[
          styles.statusBadge,
          isWarning ? styles.urgentBadge : styles.onTrackBadge,
        ]}
      >
        <Text
          style={[
            styles.statusText,
            isWarning && styles.urgentText,
          ]}
        >
          {isWarning ? "URGENT" : "ON TRACK"}
        </Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
    container: {
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
  
    normalPadding: {
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
  
    compactPadding: {
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
  
    /* ---------- RESOLVED ---------- */
    resolved: {
      backgroundColor: "#F0FDF4",
      borderWidth: 1,
      borderColor: "#BBF7D0",
    },
    resolvedTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#15803D",
    },
    resolvedSubtitle: {
      fontSize: 11,
      color: "#86EFAC",
    },
  
    /* ---------- BREACHED ---------- */
    breached: {
      backgroundColor: "#FEF2F2",
      borderWidth: 1.5,
      borderColor: "#FECACA",
    },
    breachedTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#DC2626",
    },
    breachedSubtitle: {
      fontSize: 11,
      color: "#FCA5A5",
    },
    overdueBadge: {
      backgroundColor: "#DC2626",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 20,
    },
    overdueText: {
      color: "white",
      fontSize: 10,
      fontWeight: "600",
    },
  
    /* ---------- NORMAL ---------- */
    normal: {
      backgroundColor: "#EFF6FF",
      borderWidth: 1,
      borderColor: "#BFDBFE",
    },
  
    warning: {
      backgroundColor: "#FFF7ED",
      borderWidth: 1,
      borderColor: "#FED7AA",
    },
  
    dueLabel: {
      fontSize: 13,
      color: "#6B7280",
    },
  
    remainingText: {
      fontSize: 17,
      fontWeight: "700",
      color: "#1E3A8A",
    },
  
    warningText: {
      color: "#C2410C",
    },
  
    statusBadge: {
      marginLeft: "auto",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 20,
    },
  
    onTrackBadge: {
      backgroundColor: "#DBEAFE",
    },
  
    urgentBadge: {
      backgroundColor: "#FED7AA",
    },
  
    statusText: {
      fontSize: 10,
      fontWeight: "600",
      color: "#1D4ED8",
    },
  
    urgentText: {
      color: "#C2410C",
    },
  
    compactTitle: {
      fontSize: 13,
    },
  });