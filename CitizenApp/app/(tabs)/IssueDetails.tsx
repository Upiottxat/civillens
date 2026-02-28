import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import StatusBadge from '../../components/StatusBadge';
import SLATimer from '../../components/SLATimer';
import { complaintsAPI } from '@/services/api';
import { mapStatus, computeSLA, getCategoryIcon, formatRelativeTime, formatTicketId } from '@/services/slaHelpers';

export default function IssueDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [c, setC] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const r = await complaintsAPI.getById(id);
        if (r.success && r.data) setC(r.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading)
    return <View style={s.centerFull}><ActivityIndicator size="large" color="#1E3A8A" /></View>;

  if (!c)
    return (
      <View style={s.centerFull}>
        <Text style={{ fontSize: 28 }}>😶</Text>
        <Text style={s.errT}>Issue not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={s.goBack}><Text style={s.goBackT}>Go Back</Text></TouchableOpacity>
      </View>
    );

  const sla = computeSLA(c.slaDeadline, c.status, c.slaBreached);
  const status = mapStatus(c.status);
  const breakdown = typeof c.priorityBreakdown === 'string' ? JSON.parse(c.priorityBreakdown) : c.priorityBreakdown;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Header */}
      <View style={s.headerBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#374151" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Issue Details</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Top Card */}
      <View style={s.topCard}>
        <View style={s.topLeft}>
          <View style={s.catIcon}><Text style={{ fontSize: 22 }}>{getCategoryIcon(c.issueType)}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.issueType}>{c.issueType}</Text>
            <Text style={s.locText}>{c.locationLabel || `${c.latitude?.toFixed(4)}, ${c.longitude?.toFixed(4)}`}</Text>
          </View>
        </View>
        <View style={s.idRow}>
          <Text style={s.ticketId}>{formatTicketId(c.id)}</Text>
          <StatusBadge status={status} size="md" />
        </View>
      </View>

      {/* SLA Timer */}
      <View style={s.slaWrap}>
        <SLATimer remaining={sla.remaining} isBreached={sla.isBreached} isResolved={sla.isResolved} />
      </View>

      {/* Priority Score */}
      {c.priorityScore != null && (
        <View style={s.section}>
          <Text style={s.secTitle}>Priority Score</Text>
          <View style={s.prioCard}>
            <View style={s.prioTop}>
              <View style={s.prioCircle}><Text style={s.prioVal}>{c.priorityScore}</Text><Text style={s.prioMax}>/100</Text></View>
              <Text style={s.prioLevel}>{c.priorityScore >= 80 ? '🔴 Critical' : c.priorityScore >= 60 ? '🟠 High' : c.priorityScore >= 40 ? '🟡 Medium' : '🟢 Low'}</Text>
            </View>
            {breakdown && (
              <View style={s.prioBreakdown}>
                {[
                  { l: 'Severity', v: breakdown.severity?.points, m: breakdown.severity?.max, extra: breakdown.severity?.label },
                  { l: 'Zone Risk', v: breakdown.zone?.points, m: breakdown.zone?.max, extra: breakdown.zone?.label },
                  { l: 'Population', v: breakdown.population?.points, m: breakdown.population?.max },
                  { l: 'Duplicates', v: breakdown.duplicates?.points, m: breakdown.duplicates?.max, extra: `${breakdown.duplicates?.count || 0} nearby` },
                ].map((b) => (
                  <View key={b.l} style={s.prioRow}>
                    <Text style={s.prioLbl}>{b.l}</Text>
                    <View style={s.prioBarBg}><View style={[s.prioBarFill, { width: `${((b.v || 0) / (b.m || 1)) * 100}%` }]} /></View>
                    <Text style={s.prioPts}>{b.v}/{b.m}</Text>
                    {b.extra && <Text style={s.prioExtra}>{b.extra}</Text>}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Description */}
      {c.description && (
        <View style={s.section}>
          <Text style={s.secTitle}>Description</Text>
          <View style={s.descCard}><Text style={s.descText}>{c.description}</Text></View>
        </View>
      )}

      {/* Assignment */}
      {(c.department || c.assignedTo) && (
        <View style={s.section}>
          <Text style={s.secTitle}>Assignment</Text>
          <View style={s.assignCard}>
            {c.department && (
              <View style={s.assignRow}><Feather name="briefcase" size={14} color="#6B7280" /><Text style={s.assignLbl}>Department:</Text><Text style={s.assignVal}>{c.department.name}</Text></View>
            )}
            {c.assignedTo && (
              <View style={s.assignRow}><Feather name="user" size={14} color="#6B7280" /><Text style={s.assignLbl}>Officer:</Text><Text style={s.assignVal}>{c.assignedTo.name || c.assignedTo.id}</Text></View>
            )}
          </View>
        </View>
      )}

      {/* Timeline */}
      {c.statusHistory?.length > 0 && (
        <View style={s.section}>
          <Text style={s.secTitle}>Timeline</Text>
          <View style={s.timeline}>
            {c.statusHistory.map((h: any, i: number) => {
              const last = i === c.statusHistory.length - 1;
              return (
                <View key={h.id || i} style={s.tlItem}>
                  <View style={s.tlTrack}>
                    <View style={[s.tlDot, last && { backgroundColor: '#1E3A8A' }]} />
                    {!last && <View style={s.tlLine} />}
                  </View>
                  <View style={s.tlContent}>
                    <Text style={s.tlStatus}>{h.status.replace(/_/g, ' ')}</Text>
                    {h.note && <Text style={s.tlNote}>{h.note}</Text>}
                    <Text style={s.tlTime}>{formatRelativeTime(h.createdAt)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F7' },
  centerFull: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F2F7' },
  errT: { fontSize: 16, fontWeight: '600', color: '#1A2340', marginTop: 8 },
  goBack: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#1E3A8A', borderRadius: 10 },
  goBackT: { color: 'white', fontWeight: '700' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 54 : 44, paddingBottom: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A2340' },
  topCard: { backgroundColor: 'white', marginHorizontal: 16, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#ECEEF2' },
  topLeft: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  catIcon: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  issueType: { fontSize: 17, fontWeight: '700', color: '#1A2340' },
  locText: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  idRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketId: { fontSize: 11, fontFamily: 'monospace', color: '#9CA3AF' },
  slaWrap: { paddingHorizontal: 16, paddingTop: 12 },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  secTitle: { fontSize: 14, fontWeight: '700', color: '#1A2340', marginBottom: 8 },
  prioCard: { backgroundColor: 'white', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#ECEEF2' },
  prioTop: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  prioCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  prioVal: { fontSize: 20, fontWeight: '700', color: '#1E3A8A' },
  prioMax: { fontSize: 10, color: '#6B7280' },
  prioLevel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  prioBreakdown: { gap: 10 },
  prioRow: { gap: 4 },
  prioLbl: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  prioBarBg: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3 },
  prioBarFill: { height: 6, backgroundColor: '#1E3A8A', borderRadius: 3, minWidth: 4 },
  prioPts: { fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace' },
  prioExtra: { fontSize: 10, color: '#6B7280', fontStyle: 'italic' },
  descCard: { backgroundColor: 'white', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#ECEEF2' },
  descText: { fontSize: 13, color: '#374151', lineHeight: 20 },
  assignCard: { backgroundColor: 'white', borderRadius: 14, padding: 16, gap: 8, borderWidth: 1, borderColor: '#ECEEF2' },
  assignRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  assignLbl: { fontSize: 12, color: '#6B7280' },
  assignVal: { fontSize: 13, fontWeight: '600', color: '#1A2340' },
  timeline: {},
  tlItem: { flexDirection: 'row' },
  tlTrack: { alignItems: 'center', width: 28 },
  tlDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D1D5DB', marginTop: 4 },
  tlLine: { width: 2, flex: 1, backgroundColor: '#E5E7EB', marginVertical: 2 },
  tlContent: { flex: 1, backgroundColor: 'white', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#ECEEF2' },
  tlStatus: { fontSize: 12, fontWeight: '700', color: '#1A2340', textTransform: 'capitalize' },
  tlNote: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  tlTime: { fontSize: 10, color: '#9CA3AF', marginTop: 4 },
});
