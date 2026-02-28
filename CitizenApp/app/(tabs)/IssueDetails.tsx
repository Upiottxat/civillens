import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { complaintsAPI } from "@/services/api";
import { computeSLA, mapStatus, getCategoryIcon, formatRelativeTime, formatTicketId } from "@/services/slaHelpers";
import StatusBadge from "@/components/StatusBadge";
import SLATimer from "@/components/SLATimer";

export default function IssueDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchComplaint();
  }, [id]);

  const fetchComplaint = async () => {
    setLoading(true);
    try {
      const result = await complaintsAPI.getById(id!);
      if (result.success && result.data) {
        setComplaint(result.data);
      } else {
        setError(result.error || "Complaint not found");
      }
    } catch (err) {
      setError("Failed to load complaint details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loadingText}>Loading issue details...</Text>
      </View>
    );
  }

  if (error || !complaint) {
    return (
      <View style={styles.centered}>
        <Feather name="alert-circle" size={48} color="#DC2626" />
        <Text style={styles.errorText}>{error || "Not found"}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sla = computeSLA(complaint.slaDeadline, complaint.status, complaint.slaBreached);
  const status = mapStatus(complaint.status);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Issue Details</Text>
        <Text style={styles.ticketId}>{formatTicketId(complaint.id)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* SLA Timer — the emotional centrepiece */}
        <SLATimer
          remaining={sla.remaining}
          isBreached={sla.isBreached}
          isResolved={sla.isResolved}
        />

        {/* Issue Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.categoryIcon}>
              <Text style={{ fontSize: 22 }}>{getCategoryIcon(complaint.issueType)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.issueType}>{complaint.issueType}</Text>
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={12} color="#6B7280" />
                <Text style={styles.locationText}>
                  {complaint.locationLabel || `${complaint.latitude?.toFixed(4)}, ${complaint.longitude?.toFixed(4)}`}
                </Text>
              </View>
            </View>
            <StatusBadge status={status} size="md" />
          </View>

          {complaint.description && (
            <Text style={styles.description}>{complaint.description}</Text>
          )}

          {/* Photo */}
          {complaint.imageUrl && (
            <Image source={{ uri: complaint.imageUrl }} style={styles.image} resizeMode="cover" />
          )}

          {/* Proof of Resolution */}
          {complaint.proofImageUrl && (
            <View style={styles.proofSection}>
              <Text style={styles.sectionTitle}>📸 Proof of Resolution</Text>
              <Image source={{ uri: complaint.proofImageUrl }} style={styles.image} resizeMode="cover" />
            </View>
          )}
        </View>

        {/* Priority Score — "the wow factor" */}
        {complaint.priorityScore != null && (
          <View style={styles.priorityCard}>
            <Text style={styles.sectionTitle}>🧠 Priority Intelligence</Text>
            <View style={styles.scoreRow}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreValue}>{complaint.priorityScore}</Text>
                <Text style={styles.scoreMax}>/100</Text>
              </View>
              <View style={{ flex: 1 }}>
                {complaint.priorityBreakdown && (
                  <>
                    <PriorityBar label="Severity" value={complaint.priorityBreakdown.severity} max={40} color="#DC2626" />
                    <PriorityBar label="Critical Zone" value={complaint.priorityBreakdown.zone} max={25} color="#D97706" />
                    <PriorityBar label="Population" value={complaint.priorityBreakdown.population} max={20} color="#2563EB" />
                    <PriorityBar label="Duplicates" value={complaint.priorityBreakdown.duplicates} max={15} color="#7C3AED" />
                  </>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Details</Text>
          <DetailRow label="Department" value={complaint.department?.name || "—"} />
          <DetailRow label="Assigned To" value={complaint.assignedTo?.name || "Pending assignment"} />
          <DetailRow label="Severity" value={complaint.severity} />
          <DetailRow label="Reported" value={formatRelativeTime(complaint.createdAt)} />
          {complaint.resolvedAt && (
            <DetailRow label="Resolved" value={formatRelativeTime(complaint.resolvedAt)} />
          )}
        </View>

        {/* Status Timeline */}
        {complaint.statusHistory && complaint.statusHistory.length > 0 && (
          <View style={styles.timelineCard}>
            <Text style={styles.sectionTitle}>📋 Status Timeline</Text>
            {complaint.statusHistory.map((entry: any, index: number) => (
              <View key={entry.id} style={styles.timelineItem}>
                <View style={styles.timelineDot}>
                  <View
                    style={[
                      styles.dot,
                      index === complaint.statusHistory.length - 1 && styles.dotActive,
                    ]}
                  />
                  {index < complaint.statusHistory.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStatus}>{entry.status.replace(/_/g, " ")}</Text>
                  {entry.note && <Text style={styles.timelineNote}>{entry.note}</Text>}
                  <Text style={styles.timelineTime}>{formatRelativeTime(entry.createdAt)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function PriorityBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.barValue}>{Math.round(value)}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F2F7" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  loadingText: { marginTop: 12, color: "#6B7280" },
  errorText: { marginTop: 12, color: "#DC2626", fontSize: 15, fontWeight: "600" },
  backBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: "#1E3A8A", borderRadius: 10 },
  backBtnText: { color: "white", fontWeight: "600" },

  header: {
    backgroundColor: "#1E3A8A",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: { color: "white", fontSize: 17, fontWeight: "700", flex: 1 },
  ticketId: {
    color: "rgba(186,210,253,0.8)",
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "600",
  },

  content: { padding: 16, paddingBottom: 30, gap: 14 },

  card: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ECEEF2",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  issueType: { fontSize: 16, fontWeight: "700", color: "#1A2340" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  locationText: { fontSize: 12, color: "#6B7280" },
  description: { fontSize: 13, color: "#4B5563", marginTop: 12, lineHeight: 20 },
  image: { width: "100%", height: 180, borderRadius: 12, marginTop: 12 },

  proofSection: { marginTop: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1A2340", marginBottom: 10 },

  // Priority Score
  priorityCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ECEEF2",
  },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  scoreCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EFF6FF",
    borderWidth: 3,
    borderColor: "#1E3A8A",
    justifyContent: "center",
    alignItems: "center",
  },
  scoreValue: { fontSize: 20, fontWeight: "800", color: "#1E3A8A" },
  scoreMax: { fontSize: 10, color: "#6B7280" },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  barLabel: { fontSize: 10, color: "#6B7280", width: 70 },
  barTrack: { flex: 1, height: 6, backgroundColor: "#F3F4F6", borderRadius: 3 },
  barFill: { height: "100%", borderRadius: 3 },
  barValue: { fontSize: 10, fontWeight: "600", color: "#374151", width: 20, textAlign: "right" },

  // Details
  detailsCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ECEEF2",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailLabel: { fontSize: 12, color: "#6B7280" },
  detailValue: { fontSize: 13, fontWeight: "600", color: "#1A2340" },

  // Timeline
  timelineCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ECEEF2",
  },
  timelineItem: { flexDirection: "row", minHeight: 48 },
  timelineDot: { alignItems: "center", width: 24 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D1D5DB",
    marginTop: 4,
  },
  dotActive: { backgroundColor: "#1E3A8A" },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 4,
  },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineStatus: { fontSize: 13, fontWeight: "600", color: "#1A2340", textTransform: "capitalize" },
  timelineNote: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  timelineTime: { fontSize: 10, color: "#9CA3AF", marginTop: 4 },
});
