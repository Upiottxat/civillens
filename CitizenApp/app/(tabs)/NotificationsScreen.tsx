import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SectionList,
  RefreshControl, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { notificationsAPI } from '@/services/api';
import { formatRelativeTime } from '@/services/slaHelpers';

interface Notif {
  id: string;
  title: string;
  body: string;
  ticketId: string;
  time: string;
  type: string;
  icon: string;
  iconBg: string;
  read: boolean;
  issueId?: string;
}

function groupByDate(items: Notif[]): { title: string; data: Notif[] }[] {
  const groups: Record<string, Notif[]> = {};
  for (const n of items) {
    const d = new Date(n.time);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    let label: string;
    if (d.toDateString() === today.toDateString()) label = 'Today';
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
    else label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    (groups[label] ??= []).push(n);
  }
  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const r = await notificationsAPI.getMine();
      if (r.success && r.data) setNotifs(r.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const unread = notifs.filter((n) => !n.read).length;
  const sections = groupByDate(notifs);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Notifications</Text>
        {unread > 0 && <View style={s.badge}><Text style={s.badgeT}>{unread} new</Text></View>}
      </View>
      {loading ? (
        <View style={s.center}><ActivityIndicator color="#1E3A8A" /></View>
      ) : notifs.length === 0 ? (
        <View style={s.empty}><Text style={{ fontSize: 28 }}>🔔</Text><Text style={s.emptyT}>No notifications yet</Text><Text style={s.emptySub}>You'll be notified when your issues are updated.</Text></View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(i) => i.id}
          stickySectionHeadersEnabled={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderSectionHeader={({ section }) => (
            <Text style={s.sectionHead}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity style={[s.card, !item.read && s.unread]} onPress={() => { if (item.issueId) router.push(`/(tabs)/IssueDetails?id=${item.issueId}` as any); }}>
              <View style={[s.iconWrap, { backgroundColor: item.iconBg || '#F8FAFF' }]}>
                <Text style={{ fontSize: 18 }}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.nTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={s.nBody} numberOfLines={2}>{item.body}</Text>
                <View style={s.meta}>
                  <Text style={s.ticket}>{item.ticketId}</Text>
                  <Text style={s.time}>{formatRelativeTime(item.time)}</Text>
                </View>
              </View>
              {!item.read && <View style={s.dot} />}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F7' },
  header: { paddingTop: Platform.OS === 'ios' ? 54 : 44, paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 22, fontWeight: '700', color: '#1A2340' },
  badge: { backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeT: { fontSize: 10, fontWeight: '600', color: 'white' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyT: { fontSize: 15, fontWeight: '600', color: '#1A2340', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 4 },
  sectionHead: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6, textTransform: 'uppercase' },
  card: { flexDirection: 'row', backgroundColor: 'white', marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 14, gap: 12, borderWidth: 1, borderColor: '#ECEEF2' },
  unread: { backgroundColor: '#F8FAFF', borderColor: '#BFDBFE' },
  iconWrap: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  nTitle: { fontSize: 13, fontWeight: '600', color: '#1A2340' },
  nBody: { fontSize: 12, color: '#6B7280', lineHeight: 17, marginTop: 2 },
  meta: { flexDirection: 'row', gap: 8, marginTop: 6 },
  ticket: { fontSize: 10, color: '#C4C9D4', fontFamily: 'monospace' },
  time: { fontSize: 10, color: '#9CA3AF' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6', alignSelf: 'center' },
});
