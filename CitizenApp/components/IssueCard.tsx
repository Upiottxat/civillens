import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import StatusBadge, { IssueStatus } from "./StatusBadge";

export interface Issue {
  id: string;
  title: string;
  location: string;
  status: IssueStatus;
  category: string;
  categoryIcon: string;
  slaRemaining: string;
  slaWarning?: boolean;
  time: string;
  ticketId: string;
}

interface IssueCardProps {
  issue: Issue;
  onPress: () => void;
}

function IssueCard({
  issue,
  onPress,
}: IssueCardProps) {
  const isBreached = issue.status === "breached";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.container,
        isBreached && { borderColor: "#FECACA" },
      ]}
    >
      {/* Top Row */}
      <View style={styles.topRow}>
        <View style={styles.leftContent}>
          {/* Category Icon */}
          <View style={styles.categoryIcon}>
            <Text style={{ fontSize: 18 }}>
              {issue.categoryIcon}
            </Text>
          </View>

          {/* Title + Location */}
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={2}>
              {issue.title}
            </Text>

            <View style={styles.locationRow}>
              <Feather name="map-pin" size={10} color="#9CA3AF" />
              <Text
                style={styles.location}
                numberOfLines={1}
              >
                {issue.location}
              </Text>
            </View>
          </View>
        </View>

        <Feather
          name="chevron-right"
          size={16}
          color="#C4C9D4"
        />
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom Row */}
      <View style={styles.bottomRow}>
        <StatusBadge status={issue.status} size="sm" />

        <View style={styles.slaRow}>
          <Feather
            name="clock"
            size={11}
            color={isBreached ? "#DC2626" : "#6B7280"}
          />
          <Text
            style={[
              styles.slaText,
              isBreached && styles.breachedText,
            ]}
          >
            {isBreached
              ? "Overdue"
              : `${issue.slaRemaining} left`}
          </Text>
        </View>
      </View>

      {/* Ticket ID */}
      <Text style={styles.ticketId}>
        {issue.ticketId}
      </Text>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
    container: {
      backgroundColor: "white",
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: "#ECEEF2",
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    leftContent: {
      flexDirection: "row",
      gap: 10,
      flex: 1,
    },
    categoryIcon: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: "#EEF2FF",
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: 13,
      fontWeight: "600",
      color: "#1A2340",
      marginBottom: 3,
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    location: {
      fontSize: 11,
      color: "#9CA3AF",
      flexShrink: 1,
    },
    divider: {
      height: 1,
      backgroundColor: "#F3F4F6",
      marginVertical: 10,
    },
    bottomRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    slaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    slaText: {
      fontSize: 11,
      color: "#6B7280",
    },
    breachedText: {
      color: "#DC2626",
      fontWeight: "600",
    },
    ticketId: {
      fontSize: 10,
      color: "#C4C9D4",
      marginTop: 6,
      fontFamily: "monospace",
    },
  });

export default IssueCard;