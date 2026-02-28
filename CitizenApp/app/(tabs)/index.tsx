import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import IssueCard, { Issue } from "../../components/IssueCard";
import { complaintsAPI } from "@/services/api";
import { transformComplaint } from "@/services/slaHelpers";
import { useAuth } from "@/contexts/AuthContext";

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 });
  const [profileVisible, setProfileVisible] = useState(false);
  const [hasAlerts, setHasAlerts] = useState(false);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          setProfileVisible(false);
          await logout();
        },
      },
    ]);
  };

  const fetchIssues = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const result = await complaintsAPI.getMine();
      if (result.success && result.data) {
        const transformed = result.data.map(transformComplaint);
        setIssues(transformed);

        // Compute stats
        const total = result.data.length;
        const resolved = result.data.filter(
          (c: any) => c.status === "RESOLVED" || c.status === "CLOSED"
        ).length;
        const breached = result.data.filter(
          (c: any) => c.slaBreached || c.status === "BREACHED"
        ).length;
        setStats({ total, resolved, pending: total - resolved });
        setHasAlerts(breached > 0 || (total - resolved) > 0);
      }
    } catch (err) {
      console.error("Error fetching issues:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh on screen focus (e.g., after submitting a new complaint)
  useFocusEffect(
    useCallback(() => {
      fetchIssues();
    }, [])
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning ☀️";
    if (h < 17) return "Good Afternoon 🌤️";
    return "Good Evening 🌙";
  };

  const activeIssues = issues.filter(
    (i) => i.status !== "resolved"
  ).slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => fetchIssues(true)} />
      }
    >
      {/* Header */}
      <LinearGradient colors={["#1E3A8A", "#1E40AF"]} style={styles.header}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.name}>{user?.name || "Citizen"}</Text>
          </View>

          <View style={styles.iconRow}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/(tabs)/NotificationsScreen")}
            >
              <Ionicons name="notifications-outline" size={18} color="white" />
              {hasAlerts && (
                <View style={styles.notificationDot} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setProfileVisible(true)}
            >
              <Feather name="user" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: "Total Reports", value: `${stats.total}`, icon: "📋" },
            { label: "Resolved", value: `${stats.resolved}`, icon: "✅" },
            { label: "Pending", value: `${stats.pending}`, icon: "⏳" },
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
              CiviLens — Accountability Engine
            </Text>
            <Text style={styles.bannerSubtitle}>
              {stats.total > 0
                ? `${Math.round((stats.resolved / stats.total) * 100) || 0}% resolution rate`
                : "Report your first issue →"}
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

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#1E3A8A" />
            <Text style={styles.loadingText}>Loading your issues...</Text>
          </View>
        ) : activeIssues.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 28 }}>🎉</Text>
            <Text style={styles.emptyTitle}>No active issues</Text>
            <Text style={styles.emptySubtitle}>
              All clear! Report an issue if you spot one.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10, paddingBottom: 20 }}>
            {activeIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onPress={() =>
                  router.push(`/(tabs)/IssueDetails?id=${issue.id}` as any)
                }
              />
            ))}
          </View>
        )}
      </View>

      {/* Profile Modal */}
      <Modal
        visible={profileVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setProfileVisible(false)}
        >
          <Pressable style={styles.profileCard} onPress={() => {}}>
            <View style={styles.profileAvatar}>
              <Feather name="user" size={28} color="#1E3A8A" />
            </View>
            <Text style={styles.profileName}>{user?.name || "Citizen"}</Text>
            <Text style={styles.profilePhone}>
              +91 {user?.phone || "—"}
            </Text>
            <View style={styles.profileDivider} />

            <View style={styles.profileStats}>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>{stats.total}</Text>
                <Text style={styles.profileStatLabel}>Reports</Text>
              </View>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>{stats.resolved}</Text>
                <Text style={styles.profileStatLabel}>Resolved</Text>
              </View>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>{stats.pending}</Text>
                <Text style={styles.profileStatLabel}>Pending</Text>
              </View>
            </View>

            <View style={styles.profileDivider} />

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
            >
              <Feather name="log-out" size={16} color="#DC2626" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: "#6B7280",
  },
  emptyCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 30,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 8,
    color: "#1A2340",
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },

  // Profile modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  profileCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2340",
  },
  profilePhone: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  profileDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    width: "100%",
    marginVertical: 16,
  },
  profileStats: {
    flexDirection: "row",
    gap: 24,
  },
  profileStatItem: {
    alignItems: "center",
  },
  profileStatValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  profileStatLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
  },
});
