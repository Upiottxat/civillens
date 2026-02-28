import React from "react";
import { View, Text, StyleSheet } from "react-native";

export type IssueStatus =
  | "submitted"
  | "assigned"
  | "in-progress"
  | "resolved"
  | "breached";

const STATUS_CONFIG: Record<
  IssueStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  submitted: {
    label: "Submitted",
    bg: "#F3F4F6",
    text: "#4B5563",
    dot: "#9CA3AF",
  },
  assigned: {
    label: "Assigned",
    bg: "#EFF6FF",
    text: "#1D4ED8",
    dot: "#3B82F6",
  },
  "in-progress": {
    label: "In Progress",
    bg: "#FFF7ED",
    text: "#C2410C",
    dot: "#F97316",
  },
  resolved: {
    label: "Resolved",
    bg: "#F0FDF4",
    text: "#15803D",
    dot: "#22C55E",
  },
  breached: {
    label: "SLA Breached",
    bg: "#FEF2F2",
    text: "#DC2626",
    dot: "#EF4444",
  },
};

interface StatusBadgeProps {
  status: IssueStatus;
  size?: "sm" | "md";
}

export default function StatusBadge({
  status,
  size = "sm",
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const isSmall = size === "sm";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          paddingVertical: isSmall ? 3 : 4,
          paddingHorizontal: isSmall ? 8 : 10,
        },
      ]}
    >
      <View
        style={[
          styles.dot,
          {
            backgroundColor: config.dot,
            width: isSmall ? 6 : 7,
            height: isSmall ? 6 : 7,
          },
        ]}
      />
      <Text
        style={[
          styles.label,
          {
            color: config.text,
            fontSize: isSmall ? 11 : 12,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 20,
      gap: 5,
      alignSelf: "flex-start",
    },
    dot: {
      borderRadius: 50,
    },
    label: {
      fontWeight: "600",
    },
  });