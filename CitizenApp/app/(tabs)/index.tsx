import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import IssueCard, { Issue } from "../../components/IssueCard";

export const mockIssues: Issue[] = [
  {
    id: "1",
    title: "Broken Streetlight on MG Road",
    location: "MG Road, Sector 14, Gurugram",
    status: "in-progress",
    category: "Streetlight",
    categoryIcon: "💡",
    slaRemaining: "10h 24m",
    slaWarning: true,
    time: "2 hours ago",
    ticketId: "#CVL-2024-00341",
  },
  {
    id: "2",
    title: "Water Leakage near Central Park",
    location: "Central Park Gate, Connaught Place",
    status: "assigned",
    category: "Water Leakage",
    categoryIcon: "💧",
    slaRemaining: "1d 4h",
    slaWarning: false,
    time: "Yesterday, 3:12 PM",
    ticketId: "#CVL-2024-00338",
  },
  {
    id: "3",
    title: "Large Pothole on Ring Road",
    location: "Ring Road, Near ITO, New Delhi",
    status: "submitted",
    category: "Road Damage",
    categoryIcon: "🚧",
    slaRemaining: "2d 12h",
    slaWarning: false,
    time: "3 days ago",
    ticketId: "#CVL-2024-00329",
  },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#1E3A8A", "#1E40AF"]}
        style={styles.header}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Good Morning 🌤️</Text>
            <Text style={styles.name}>Rahul Sharma</Text>
          </View>

          <View style={styles.iconRow}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/(tabs)/NotificationsScreen")}
            >
              <Ionicons name="notifications-outline" size={18} color="white" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton}>
              <Feather name="user" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: "Total Reports", value: "12", icon: "📋" },
            { label: "Resolved", value: "8", icon: "✅" },
            { label: "Pending", value: "3", icon: "⏳" },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={{ fontSize: 16 }}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* CTA */}
      <View style={styles.ctaWrapper}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push("/(tabs)/ReportScreen")}
        >
          <View style={styles.ctaLeft}>
            <View style={styles.ctaIcon}>
              <Feather name="camera" size={24} color="white" />
            </View>
            <View>
              <Text style={styles.ctaTitle}>Report an Issue</Text>
              <Text style={styles.ctaSubtitle}>
                Photo · Category · Location
              </Text>
            </View>
          </View>

          <View style={styles.ctaArrow}>
            <Feather name="chevron-right" size={18} color="white" />
          </View>
        </TouchableOpacity>
      </View>

      {/* City Banner */}
      <View style={styles.bannerWrapper}>
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Feather name="trending-up" size={18} color="#1E3A8A" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>
              New Delhi Municipal Corp
            </Text>
            <Text style={styles.bannerSubtitle}>
              87% resolution rate this month · Ward 14
            </Text>
          </View>

          <MaterialIcons name="emoji-events" size={18} color="#F59E0B" />
        </View>
      </View>

      {/* Active Issues */}
      <View style={styles.issuesSection}>
        <View style={styles.issuesHeader}>
          <Text style={styles.issuesTitle}>My Active Issues</Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/MyIssuesScreen")}
            style={styles.seeAll}
          >
            <Text style={styles.seeAllText}>See all</Text>
            <Feather name="chevron-right" size={14} color="#1E3A8A" />
          </TouchableOpacity>
        </View>

        <View style={{ gap: 10 }}>
          {mockIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onPress={() =>
                router.push(`/IssueDetails?id=${issue.id}` as any)
              }
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F2F7",
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  greeting: {
    color: "rgba(186,210,253,0.8)",
    fontSize: 12,
  },
  name: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
  },
  iconRow: {
    flexDirection: "row",
    gap: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    backgroundColor: "#EF4444",
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
  },
  statValue: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
  },
  statLabel: {
    color: "rgba(186,210,253,0.7)",
    fontSize: 10,
  },
  ctaWrapper: {
    paddingHorizontal: 16,
    marginTop: -16,
  },
  ctaButton: {
    backgroundColor: "#0D9488",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ctaLeft: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  ctaIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  ctaTitle: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },
  ctaSubtitle: {
    color: "rgba(153,246,228,0.85)",
    fontSize: 12,
  },
  ctaArrow: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  bannerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  banner: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1A2340",
  },
  bannerSubtitle: {
    fontSize: 11,
    color: "#6B7280",
  },
  issuesSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  issuesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  issuesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2340",
  },
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    color: "#1E3A8A",
    fontWeight: "600",
  },
});