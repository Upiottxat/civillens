import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  RefreshControl, ActivityIndicator, Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import IssueCard, { Issue } from '../../components/IssueCard';
import { complaintsAPI } from '@/services/api';
import { transformComplaint, FrontendStatus } from '@/services/slaHelpers';

const FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'breached', label: 'Breached' },
];

export default function MyIssuesScreen() {
  const router = useRouter();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const r = await complaintsAPI.getMine();
      if (r.success && r.data) setIssues(r.data.map(transformComplaint));
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const filtered = filter === 'all' ? issues : issues.filter((i) => i.status === filter);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>My Issues</Text>
        <Text style={s.sub}>{issues.length} total reports</Text>
      </View>
      <FlatList
        horizontal
        data={FILTERS}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow}
        keyExtractor={(i) => i.key}
        renderItem={({ item }) => (
          <TouchableOpacity style={[s.chip, filter === item.key && s.chipSel]} onPress={() => setFilter(item.key)}>
            <Text style={[s.chipT, filter === item.key && s.chipSelT]}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />
      {loading ? (
        <View style={s.center}><ActivityIndicator color="#1E3A8A" /><Text style={s.loadT}>Loading issues…</Text></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          renderItem={({ item }) => <IssueCard issue={item} onPress={() => router.push(`/(tabs)/IssueDetails?id=${item.id}` as any)} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 28 }}>📭</Text>
              <Text style={s.emptyT}>No issues found</Text>
              <Text style={s.emptySub}>{filter !== 'all' ? 'Try a different filter.' : 'You haven\'t reported any issues yet.'}</Text>
              {filter === 'all' && (
                <TouchableOpacity style={s.reportBtn} onPress={() => router.push('/(tabs)/ReportScreen')}>
                  <Text style={s.reportBtnT}>Report First Issue</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F7' },
  header: { paddingTop: Platform.OS === 'ios' ? 54 : 44, paddingHorizontal: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#1A2340' },
  sub: { fontSize: 12, color: '#6B7280' },
  filterRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB' },
  chipSel: { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' },
  chipT: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  chipSelT: { color: 'white' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadT: { marginTop: 8, fontSize: 12, color: '#6B7280' },
  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20, backgroundColor: 'white', borderRadius: 14, marginTop: 20 },
  emptyT: { fontSize: 15, fontWeight: '600', color: '#1A2340', marginTop: 8 },
  emptySub: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 4 },
  reportBtn: { backgroundColor: '#1E3A8A', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 16 },
  reportBtnT: { color: 'white', fontWeight: '700', fontSize: 13 },
});
