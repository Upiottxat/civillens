import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import IssueCard, { Issue } from "../../components/IssueCard";
import StatusBadge from "../../components/StatusBadge";
const ALL_ISSUES: Issue[] = [
  {
    id: "1",
    title: "Broken Streetlight on MG Road",
    location: "MG Road, Sector 14, Gurugram",
    status: "in-progress",
    category: "Streetlight",
    categoryIcon: "💡",
    slaRemaining: "10h 24m",
    time: "Today, 8:00 AM",
    ticketId: "#CVL-2024-00341",
  },
  {
    id: "2",
    title: "Water Leakage near Central Park",
    location: "Connaught Place, New Delhi",
    status: "assigned",
    category: "Water Leakage",
    categoryIcon: "💧",
    slaRemaining: "1d 4h",
    time: "Yesterday",
    ticketId: "#CVL-2024-00338",
  },
  {
    id: "3",
    title: "Large Pothole on Ring Road",
    location: "Ring Road, Near ITO, Delhi",
    status: "submitted",
    category: "Road Damage",
    categoryIcon: "🚧",
    slaRemaining: "2d 12h",
    time: "3 days ago",
    ticketId: "#CVL-2024-00329",
  },
  {
    id: "4",
    title: "Overflowing Garbage Bin",
    location: "Lajpat Nagar Market, Delhi",
    status: "resolved",
    category: "Garbage",
    categoryIcon: "🗑️",
    slaRemaining: "Resolved",
    time: "1 week ago",
    ticketId: "#CVL-2024-00302",
  },
  {
    id: "5",
    title: "Broken Park Bench",
    location: "Nehru Park, New Delhi",
    status: "resolved",
    category: "Park",
    categoryIcon: "🌳",
    slaRemaining: "Resolved",
    time: "2 weeks ago",
    ticketId: "#CVL-2024-00284",
  },
  {
    id: "6",
    title: "Stray Dog Menace near School",
    location: "DPS School Road, R.K. Puram",
    status: "breached",
    category: "Stray Animals",
    categoryIcon: "🐕",
    slaRemaining: "Overdue by 6h",
    time: "5 days ago",
    ticketId: "#CVL-2024-00316",
  },
];

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Resolved", value: "resolved" },
  { label: "Breached", value: "breached" },
];

const ACTIVE_STATUSES = ["submitted", "assigned", "in-progress"];

export default function MyIssuesScreen() {
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return ALL_ISSUES.filter((issue) => {
      const matchesSearch =
        !search ||
        issue.title.toLowerCase().includes(search.toLowerCase()) ||
        issue.location.toLowerCase().includes(search.toLowerCase()) ||
        issue.category.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "all" ||
        (filter === "active" &&
          ACTIVE_STATUSES.includes(issue.status)) ||
        (filter === "resolved" &&
          issue.status === "resolved") ||
        (filter === "breached" &&
          issue.status === "breached");

      return matchesSearch && matchesFilter;
    });
  }, [filter, search]);

  const stats = {
    total: ALL_ISSUES.length,
    resolved: ALL_ISSUES.filter(
      (i) => i.status === "resolved"
    ).length,
    active: ALL_ISSUES.filter((i) =>
      ACTIVE_STATUSES.includes(i.status)
    ).length,
    breached: ALL_ISSUES.filter(
      (i) => i.status === "breached"
    ).length,
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 30 }}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                My Issues
              </Text>

              <View style={styles.statsRow}>
                {[
                  { label: "Total", value: stats.total },
                  { label: "Active", value: stats.active },
                  { label: "Resolved", value: stats.resolved },
                  { label: "Breached", value: stats.breached },
                ].map((stat) => (
                  <View
                    key={stat.label}
                    style={styles.statCard}
                  >
                    <Text style={styles.statValue}>
                      {stat.value}
                    </Text>
                    <Text style={styles.statLabel}>
                      {stat.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
              <Feather
                name="search"
                size={16}
                color="#9CA3AF"
              />
              <TextInput
                placeholder="Search issues..."
                value={search}
                onChangeText={setSearch}
                style={styles.input}
              />
            </View>

            {/* Filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {STATUS_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  onPress={() =>
                    setFilter(f.value)
                  }
                  style={[
                    styles.filterChip,
                    filter === f.value &&
                      styles.activeChip,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      filter === f.value &&
                        styles.activeChipText,
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        }
        renderItem={({ item }) => (
          <View style={{ marginBottom: 10 }}>
            <IssueCard
              issue={item}
              onPress={() =>
                navigation.navigate(
                  "IssueDetail",
                  { id: item.id }
                )
              }
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>
              🔍
            </Text>
            <Text style={styles.emptyTitle}>
              No issues found
            </Text>
            <Text style={styles.emptyText}>
              Try adjusting your search.
            </Text>
          </View>
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F0F2F7",
    },
  
    header: {
      backgroundColor: "#1E3A8A",
      padding: 16,
      paddingBottom: 20,
    },
  
    headerTitle: {
      color: "white",
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 14,
    },
  
    statsRow: {
      flexDirection: "row",
      gap: 8,
    },
  
    statCard: {
      flex: 1,
      backgroundColor: "rgba(255,255,255,0.15)",
      borderRadius: 10,
      padding: 8,
      alignItems: "center",
    },
  
    statValue: {
      color: "white",
      fontSize: 18,
      fontWeight: "700",
    },
  
    statLabel: {
      color: "rgba(186,210,253,0.8)",
      fontSize: 10,
    },
  
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "white",
      margin: 16,
      marginBottom: 10,
      borderRadius: 12,
      paddingHorizontal: 12,
      borderWidth: 1.5,
      borderColor: "#E5E7EB",
    },
  
    input: {
      flex: 1,
      paddingVertical: 12,
      marginLeft: 8,
      fontSize: 13,
    },
  
    filterRow: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 8,
    },
  
    filterChip: {
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "#E9ECF2",
      backgroundColor: "white",
    },
  
    activeChip: {
      backgroundColor: "#1E3A8A",
      borderColor: "#1E3A8A",
    },
  
    filterText: {
      fontSize: 12,
      color: "#6B7280",
    },
  
    activeChipText: {
      color: "white",
      fontWeight: "600",
    },
  
    emptyState: {
      backgroundColor: "white",
      margin: 16,
      borderRadius: 16,
      padding: 40,
      alignItems: "center",
    },
  
    emptyEmoji: {
      fontSize: 32,
      marginBottom: 12,
    },
  
    emptyTitle: {
      fontSize: 15,
      fontWeight: "600",
      marginBottom: 6,
    },
  
    emptyText: {
      fontSize: 13,
      color: "#9CA3AF",
    },
  });