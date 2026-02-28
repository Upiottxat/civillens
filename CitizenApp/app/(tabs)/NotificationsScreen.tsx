import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { notificationsAPI } from "@/services/api";

interface Notification {
  id: string;
  title: string;
  body: string;
  ticketId: string;
  time: string;
  type: string;
  icon: string;
  iconBg: string;
  read: boolean;
  issueId: string;
  issueType: string;
  locationLabel?: string;
}

const TYPE_COLORS: Record<string, { border: string; accent: string }> = {
  assigned: { border: "#BFDBFE", accent: "#1E3A8A" },
  warning: { border: "#FDE68A", accent: "#D97706" },
  info: { border: "#E8EEFF", accent: "#6366F1" },
  success: { border: "#BBF7D0", accent: "#16A34A" },
  breach: { border: "#FECACA", accent: "#DC2626" },
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const result = await notificationsAPI.getMine();
      if (result.success && result.data) {
        setNotifications(result.data);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Group notifications by date
  const grouped = useMemo(() => {
    const groups: Record<string, Notification[]> = {};
    for (const notif of notifications) {
      const dateKey = formatDateGroup(notif.time);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(notif);
    }
    return Object.entries(groups);
  }, [notifications]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={styles.unreadText}>
                {unreadCount} unread alerts
              </Text>
            )}
          </View>
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>{unreadCount} new</Text>
              </View>
            )}
            <TouchableOpacity style={styles.settingsButton}>
              <Feather name="settings" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Notification list */}
      <FlatList
        data={grouped}
        keyExtractor={([date]) => date}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchNotifications(true)}
          />
        }
        renderItem={({ item: [date, notifs] }) => (
          <View style={{ marginBottom: 12 }}>
            {/* Date label */}
            <View style={styles.dateGroup}>
              <View style={styles.dateLine} />
              <Text style={styles.dateText}>{date}</Text>
              <View style={styles.dateLine} />
            </View>

            {/* Notifications */}
            {notifs.map((notif) => {
              const colors = TYPE_COLORS[notif.type] || TYPE_COLORS.info;
              return (
                <TouchableOpacity
                  key={notif.id}
                  onPress={() =>
                    router.push(
                      `/(tabs)/IssueDetails?id=${notif.issueId}` as any
                    )
                  }
                  style={[
                    styles.notificationCard,
                    {
                      backgroundColor: notif.read ? "white" : "#F5F7FF",
                      borderColor: notif.read ? "#ECEEF4" : colors.border,
                    },
                  ]}
                >
                  {!notif.read && (
                    <View
                      style={[
                        styles.unreadDot,
                        { backgroundColor: colors.accent },
                      ]}
                    />
                  )}
                  <View
                    style={[
                      styles.notificationIcon,
                      {
                        backgroundColor: notif.iconBg,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 18 }}>{notif.icon}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.notificationHeader}>
                      <Text
                        style={[
                          styles.notificationTitle,
                          notif.read ? {} : { fontWeight: "700" },
                        ]}
                      >
                        {notif.title}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {formatTime(notif.time)}
                      </Text>
                    </View>
                    <Text style={styles.notificationBody}>{notif.body}</Text>
                    <View style={styles.notificationFooter}>
                      <Text
                        style={[
                          styles.ticketId,
                          {
                            backgroundColor: notif.iconBg,
                            color: colors.accent,
                          },
                        ]}
                      >
                        {notif.ticketId}
                      </Text>
                      <View style={styles.viewContainer}>
                        <Text style={styles.viewText}>View</Text>
                        <Feather
                          name="chevron-right"
                          size={12}
                          color="#1E3A8A"
                        />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="small" color="#1E3A8A" />
              <Text style={[styles.emptyTitle, { marginTop: 12 }]}>
                Loading notifications...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Feather name="bell" size={28} color="#1E3A8A" />
              </View>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyText}>
                You'll receive updates on your reported issues here.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F2F7" },
  header: {
    backgroundColor: "#1E3A8A",
    padding: 16,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { color: "white", fontSize: 20, fontWeight: "700" },
  unreadText: {
    color: "rgba(186,210,253,0.7)",
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  newBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  newBadgeText: { color: "white", fontSize: 12, fontWeight: "700" },
  settingsButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  dateGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  dateLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dateText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  notificationCard: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    gap: 11,
    position: "relative",
    alignItems: "flex-start",
    marginHorizontal: 16,
    marginBottom: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: "absolute",
    top: 14,
    right: 14,
  },
  notificationIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 6,
  },
  notificationTitle: { fontSize: 13, color: "#1A2340" },
  notificationTime: { fontSize: 10, color: "#9CA3AF" },
  notificationBody: {
    fontSize: 12,
    color: "#6B7280",
    marginVertical: 4,
    lineHeight: 18,
  },
  notificationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketId: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "monospace",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  viewContainer: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewText: { fontSize: 11, fontWeight: "600", color: "#1E3A8A" },
  emptyState: { alignItems: "center", padding: 60 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A2340",
    marginBottom: 6,
  },
  emptyText: { fontSize: 13, color: "#9CA3AF" },
});
