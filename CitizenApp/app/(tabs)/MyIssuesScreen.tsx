import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import IssueCard, { Issue } from "../../components/IssueCard";
import { complaintsAPI } from "@/services/api";
import { transformComplaint } from "@/services/slaHelpers";

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Resolved", value: "resolved" },
  { label: "Breached", value: "breached" },
];

const ACTIVE_STATUSES = ["submitted", "assigned", "in-progress"];

export default function MyIssuesScreen() {
  const router = useRouter();
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIssues = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const result = await complaintsAPI.getMine();
      if (result.success && result.data) {
        const transformed = result.data.map(transformComplaint);
        setAllIssues(transformed);
      }
    } catch (err) {
      console.error("Error fetching issues:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchIssues();
    }, [])
  );

  const filtered = useMemo(() => {
    return allIssues.filter((issue) => {
      const matchesSearch =
        !search ||
        issue.title.toLowerCase().includes(search.toLowerCase()) ||
        issue.location.toLowerCase().includes(search.toLowerCase()) ||
        issue.category.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && ACTIVE_STATUSES.includes(issue.status)) ||
        (filter === "resolved" && issue.status === "resolved") ||
        (filter === "breached" && issue.status === "breached");

      return matchesSearch && matchesFilter;
    });
  }, [filter, search, allIssues]);

  const stats = {
    total: allIssues.length,
    resolved: allIssues.filter((i) => i.status === "resolved").length,
    active: allIssues.filter((i) => ACTIVE_STATUSES.includes(i.status)).length,
    breached: allIssues.filter((i) => i.status === "breached").length,
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchIssues(true)} />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>My Issues</Text>

              <View style={styles.statsRow}>
                {[
                  { label: "Total", value: stats.total },
                  { label: "Active", value: stats.active },
                  { label: "Resolved", value: stats.resolved },
                  { label: "Breached", value: stats.breached },
                ].map((stat) => (
                  <View key={stat.label} style={styles.statCard}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
              <Feather name="search" size={16} color="#9CA3AF" />
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
                  onPress={() => setFilter(f.value)}
                  style={[styles.filterChip, filter === f.value && styles.activeChip]}
                >
                  <Text
                    style={[styles.filterText, filter === f.value && styles.activeChipText]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        }
        renderItem={({ item }) => (
          <View style={{ marginBottom: 10, marginHorizontal: 16 }}>
            <IssueCard
              issue={item}
              onPress={() => router.push(`/(tabs)/IssueDetails?id=${item.id}` as any)}
            />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="small" color="#1E3A8A" />
              <Text style={styles.emptyTitle}>Loading issues...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>No issues found</Text>
              <Text style={styles.emptyText}>
                {search ? "Try adjusting your search." : "You haven't reported any issues yet."}
              </Text>
            </View>
          )
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
    paddingTop: 50,
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
