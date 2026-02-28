import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const NOTIFICATIONS = [
  {
    id: "1",
    title: "Issue Assigned",
    body: "Your streetlight complaint on MG Road has been assigned to Ward Officer, Electrical Div.",
    ticketId: "#CVL-2024-00341",
    time: "10:42 AM",
    date: "Today",
    type: "assigned",
    icon: "👤",
    iconBg: "#EFF6FF",
    read: false,
    issueId: "1",
  },
  {
    id: "2",
    title: "SLA Deadline Approaching",
    body: "Resolution deadline for your broken streetlight issue is in 10h 24m. Field team is on-site.",
    ticketId: "#CVL-2024-00341",
    time: "11:00 AM",
    date: "Today",
    type: "warning",
    icon: "⏰",
    iconBg: "#FFF7ED",
    read: false,
    issueId: "1",
  },
  {
    id: "3",
    title: "Field Team Dispatched",
    body: "A repair team has been dispatched to your reported location. Work may begin shortly.",
    ticketId: "#CVL-2024-00341",
    time: "9:15 AM",
    date: "Today",
    type: "info",
    icon: "🔧",
    iconBg: "#F0FDF4",
    read: true,
    issueId: "1",
  },
  {
    id: "4",
    title: "Issue Registered",
    body: "Your water leakage complaint near Central Park has been successfully registered.",
    ticketId: "#CVL-2024-00338",
    time: "3:15 PM",
    date: "Yesterday",
    type: "success",
    icon: "✅",
    iconBg: "#F0FDF4",
    read: true,
    issueId: "2",
  },
  {
    id: "5",
    title: "Assigned to Authority",
    body: "Your water leakage issue has been forwarded to Delhi Jal Board, Connaught Place Division.",
    ticketId: "#CVL-2024-00338",
    time: "5:00 PM",
    date: "Yesterday",
    type: "assigned",
    icon: "🏛️",
    iconBg: "#EFF6FF",
    read: true,
    issueId: "2",
  },
  {
    id: "6",
    title: "Road Damage Complaint Queued",
    body: "Your pothole complaint on Ring Road has been added to the PWD Delhi maintenance queue.",
    ticketId: "#CVL-2024-00329",
    time: "2:25 PM",
    date: "3 days ago",
    type: "info",
    icon: "ℹ️",
    iconBg: "#F8FAFF",
    read: true,
    issueId: "3",
  },
];

const TYPE_COLORS: Record<string, { border: string; accent: string }> = {
  assigned: { border: "#BFDBFE", accent: "#1E3A8A" },
  warning: { border: "#FDE68A", accent: "#D97706" },
  info: { border: "#E8EEFF", accent: "#6366F1" },
  success: { border: "#BBF7D0", accent: "#16A34A" },
  breach: { border: "#FECACA", accent: "#DC2626" },
};

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;

  const grouped = useMemo(() => {
    return NOTIFICATIONS.reduce<Record<string, typeof NOTIFICATIONS>>(
      (acc, notif) => {
        if (!acc[notif.date]) acc[notif.date] = [];
        acc[notif.date].push(notif);
        return acc;
      },
      {}
    );
  }, []);

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
        data={Object.entries(grouped)}
        keyExtractor={([date]) => date}
        contentContainerStyle={{ paddingBottom: 30 }}
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
                    navigation.navigate("IssueDetail", {
                      id: notif.issueId,
                    })
                  }
                  style={[
                    styles.notificationCard,
                    { backgroundColor: notif.read ? "white" : "#F5F7FF", borderColor: notif.read ? "#ECEEF4" : colors.border },
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
                      { backgroundColor: notif.iconBg, borderColor: colors.border },
                    ]}
                  >
                    <Text style={{ fontSize: 18 }}>{notif.icon}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.notificationHeader}>
                      <Text style={[styles.notificationTitle, notif.read ? {} : { fontWeight: "700" }]}>
                        {notif.title}
                      </Text>
                      <Text style={styles.notificationTime}>{notif.time}</Text>
                    </View>
                    <Text style={styles.notificationBody}>{notif.body}</Text>
                    <View style={styles.notificationFooter}>
                      <Text
                        style={[
                          styles.ticketId,
                          { backgroundColor: notif.iconBg, color: colors.accent },
                        ]}
                      >
                        {notif.ticketId}
                      </Text>
                      <View style={styles.viewContainer}>
                        <Text style={styles.viewText}>View</Text>
                        <Feather name="chevron-right" size={12} color="#1E3A8A" />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="bell" size={28} color="#1E3A8A" />
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>
              You'll receive updates on your reported issues here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F2F7" },
  header: { backgroundColor: "#1E3A8A", padding: 16, paddingBottom: 20 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { color: "white", fontSize: 20, fontWeight: "700" },
  unreadText: { color: "rgba(186,210,253,0.7)", fontSize: 12, marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  newBadge: { backgroundColor: "#EF4444", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2 },
  newBadgeText: { color: "white", fontSize: 12, fontWeight: "700" },
  settingsButton: { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  dateGroup: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 8 },
  dateLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dateText: { fontSize: 11, color: "#9CA3AF", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  notificationCard: { flexDirection: "row", borderRadius: 14, padding: 13, borderWidth: 1, gap: 11, position: "relative", alignItems: "flex-start" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, position: "absolute", top: 14, right: 14 },
  notificationIcon: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  notificationHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 6 },
  notificationTitle: { fontSize: 13, color: "#1A2340" },
  notificationTime: { fontSize: 10, color: "#9CA3AF" },
  notificationBody: { fontSize: 12, color: "#6B7280", marginVertical: 4, lineHeight: 18 },
  notificationFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ticketId: { fontSize: 10, fontWeight: "600", fontFamily: "monospace", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  viewContainer: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewText: { fontSize: 11, fontWeight: "600", color: "#1E3A8A" },
  emptyState: { alignItems: "center", padding: 60 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#1A2340", marginBottom: 6 },
  emptyText: { fontSize: 13, color: "#9CA3AF" },
});