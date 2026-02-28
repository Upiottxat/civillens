import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator, Modal, Pressable, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import IssueCard, { Issue } from '../../components/IssueCard';
import { complaintsAPI } from '@/services/api';
import { transformComplaint } from '@/services/slaHelpers';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 });
  const [profileVisible, setProfileVisible] = useState(false);
  const [hasAlerts, setHasAlerts] = useState(false);

  const fetch = async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const r = await complaintsAPI.getMine();
      if (r.success && r.data) {
        const t = r.data.map(transformComplaint);
        setIssues(t);
        const total = r.data.length;
        const resolved = r.data.filter((c: any) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
        const breached = r.data.filter((c: any) => c.slaBreached).length;
        setStats({ total, resolved, pending: total - resolved });
        setHasAlerts(breached > 0 || total - resolved > 0);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetch(); }, []));

  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good Morning ☀️' : h < 17 ? 'Good Afternoon 🌤️' : 'Good Evening 🌙'; };
  const active = issues.filter((i) => i.status !== 'resolved').slice(0, 5);

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetch(true)} />}>
      <LinearGradient colors={['#1E3A8A', '#1E40AF']} style={s.header}>
        <View style={s.topBar}>
          <View>
            <Text style={s.greeting}>{greeting()}</Text>
            <Text style={s.name}>{user?.name || 'Citizen'}</Text>
          </View>
          <View style={s.iconRow}>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/(tabs)/NotificationsScreen')}>
              <Ionicons name="notifications-outline" size={18} color="white" />
              {hasAlerts && <View style={s.dot} />}
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} onPress={() => setProfileVisible(true)}>
              <Feather name="user" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={s.statsRow}>
          {[{ l: 'Total Reports', v: stats.total, i: '📋' }, { l: 'Resolved', v: stats.resolved, i: '✅' }, { l: 'Pending', v: stats.pending, i: '⏳' }].map((st) => (
            <View key={st.l} style={s.stat}><Text style={{ fontSize: 16 }}>{st.i}</Text><Text style={s.statVal}>{st.v}</Text><Text style={s.statLbl}>{st.l}</Text></View>
          ))}
        </View>
      </LinearGradient>

      <View style={s.ctaWrap}>
        <TouchableOpacity style={s.cta} onPress={() => router.push('/(tabs)/ReportScreen')}>
          <View style={s.ctaL}><View style={s.ctaIcon}><Feather name="camera" size={24} color="white" /></View>
            <View><Text style={s.ctaTitle}>Report an Issue</Text><Text style={s.ctaSub}>Photo · Category · Location</Text></View>
          </View>
          <View style={s.ctaArrow}><Feather name="chevron-right" size={18} color="white" /></View>
        </TouchableOpacity>
      </View>

      <View style={s.bannerWrap}>
        <View style={s.banner}>
          <View style={s.bannerIcon}><Feather name="trending-up" size={18} color="#1E3A8A" /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.bannerTitle}>CiviLens — Accountability Engine</Text>
            <Text style={s.bannerSub}>{stats.total > 0 ? `${Math.round((stats.resolved / stats.total) * 100) || 0}% resolution rate` : 'Report your first issue →'}</Text>
          </View>
          <MaterialIcons name="emoji-events" size={18} color="#F59E0B" />
        </View>
      </View>

      <View style={s.section}>
        <View style={s.secHead}>
          <Text style={s.secTitle}>My Active Issues</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/MyIssuesScreen')} style={s.seeAll}>
            <Text style={s.seeAllT}>See all</Text><Feather name="chevron-right" size={14} color="#1E3A8A" />
          </TouchableOpacity>
        </View>
        {loading ? (
          <View style={s.center}><ActivityIndicator size="small" color="#1E3A8A" /><Text style={s.loadT}>Loading…</Text></View>
        ) : active.length === 0 ? (
          <View style={s.empty}><Text style={{ fontSize: 28 }}>🎉</Text><Text style={s.emptyT}>No active issues</Text><Text style={s.emptySub}>All clear! Report an issue if you spot one.</Text></View>
        ) : (
          <View style={{ gap: 10, paddingBottom: 20 }}>
            {active.map((i) => <IssueCard key={i.id} issue={i} onPress={() => router.push(`/(tabs)/IssueDetails?id=${i.id}` as any)} />)}
          </View>
        )}
      </View>

      {/* Profile modal */}
      <Modal visible={profileVisible} transparent animationType="fade" onRequestClose={() => setProfileVisible(false)}>
        <Pressable style={s.overlay} onPress={() => setProfileVisible(false)}>
          <Pressable style={s.profileCard} onPress={() => {}}>
            <View style={s.avatar}><Feather name="user" size={28} color="#1E3A8A" /></View>
            <Text style={s.pName}>{user?.name || 'Citizen'}</Text>
            <Text style={s.pPhone}>+91 {user?.phone || '—'}</Text>
            <View style={s.pDiv} />
            <View style={s.pStats}>
              {[{ v: stats.total, l: 'Reports' }, { v: stats.resolved, l: 'Resolved' }, { v: stats.pending, l: 'Pending' }].map((x) => (
                <View key={x.l} style={s.pStatItem}><Text style={s.pStatV}>{x.v}</Text><Text style={s.pStatL}>{x.l}</Text></View>
              ))}
            </View>
            <View style={s.pDiv} />
            <TouchableOpacity style={s.logoutBtn} onPress={() => Alert.alert('Logout', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Logout', style: 'destructive', onPress: async () => { setProfileVisible(false); await logout(); } }])}>
              <Feather name="log-out" size={16} color="#DC2626" /><Text style={s.logoutT}>Logout</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F7' },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 28 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  greeting: { color: 'rgba(186,210,253,0.8)', fontSize: 12 },
  name: { color: 'white', fontSize: 20, fontWeight: '700' },
  iconRow: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  dot: { position: 'absolute', top: 8, right: 8, width: 7, height: 7, backgroundColor: '#EF4444', borderRadius: 4 },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12 },
  statVal: { color: 'white', fontSize: 22, fontWeight: '700' },
  statLbl: { color: 'rgba(186,210,253,0.7)', fontSize: 10 },
  ctaWrap: { paddingHorizontal: 16, marginTop: -16 },
  cta: { backgroundColor: '#0D9488', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ctaL: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  ctaIcon: { width: 50, height: 50, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  ctaTitle: { color: 'white', fontSize: 17, fontWeight: '700' },
  ctaSub: { color: 'rgba(153,246,228,0.85)', fontSize: 12 },
  ctaArrow: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  bannerWrap: { paddingHorizontal: 16, paddingTop: 14 },
  banner: { backgroundColor: 'white', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  bannerIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  bannerTitle: { fontSize: 12, fontWeight: '600', color: '#1A2340' },
  bannerSub: { fontSize: 11, color: '#6B7280' },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  secHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  secTitle: { fontSize: 16, fontWeight: '700', color: '#1A2340' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllT: { fontSize: 13, color: '#1E3A8A', fontWeight: '600' },
  center: { alignItems: 'center', paddingVertical: 30 },
  loadT: { marginTop: 8, fontSize: 12, color: '#6B7280' },
  empty: { backgroundColor: 'white', borderRadius: 14, padding: 30, alignItems: 'center' },
  emptyT: { fontSize: 15, fontWeight: '600', marginTop: 8, color: '#1A2340' },
  emptySub: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  profileCard: { backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 320, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  pName: { fontSize: 18, fontWeight: '700', color: '#1A2340' },
  pPhone: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  pDiv: { height: 1, backgroundColor: '#F3F4F6', width: '100%', marginVertical: 16 },
  pStats: { flexDirection: 'row', gap: 24 },
  pStatItem: { alignItems: 'center' },
  pStatV: { fontSize: 20, fontWeight: '700', color: '#1E3A8A' },
  pStatL: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10, backgroundColor: '#FEF2F2' },
  logoutT: { fontSize: 14, fontWeight: '600', color: '#DC2626' },
});
