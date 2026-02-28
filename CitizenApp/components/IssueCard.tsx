import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import StatusBadge, { IssueStatus } from './StatusBadge';

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

export default function IssueCard({ issue, onPress }: { issue: Issue; onPress: () => void }) {
  const breached = issue.status === 'breached';
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[s.card, breached && { borderColor: '#FECACA' }]}>
      <View style={s.top}>
        <View style={s.left}>
          <View style={s.icon}><Text style={{ fontSize: 18 }}>{issue.categoryIcon}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.title} numberOfLines={2}>{issue.title}</Text>
            <View style={s.locRow}>
              <Feather name="map-pin" size={10} color="#9CA3AF" />
              <Text style={s.loc} numberOfLines={1}>{issue.location}</Text>
            </View>
          </View>
        </View>
        <Feather name="chevron-right" size={16} color="#C4C9D4" />
      </View>
      <View style={s.divider} />
      <View style={s.bottom}>
        <StatusBadge status={issue.status} size="sm" />
        <View style={s.sla}>
          <Feather name="clock" size={11} color={breached ? '#DC2626' : '#6B7280'} />
          <Text style={[s.slaText, breached && s.breachText]}>
            {breached ? 'Overdue' : `${issue.slaRemaining} left`}
          </Text>
        </View>
      </View>
      <Text style={s.ticket}>{issue.ticketId}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#ECEEF2' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  left: { flexDirection: 'row', gap: 10, flex: 1 },
  icon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 13, fontWeight: '600', color: '#1A2340', marginBottom: 3 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  loc: { fontSize: 11, color: '#9CA3AF', flexShrink: 1 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sla: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  slaText: { fontSize: 11, color: '#6B7280' },
  breachText: { color: '#DC2626', fontWeight: '600' },
  ticket: { fontSize: 10, color: '#C4C9D4', marginTop: 6, fontFamily: 'monospace' },
});
