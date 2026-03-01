import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import IssueCard, { Issue } from '../../components/IssueCard';
import { complaintsAPI, gamificationAPI } from '@/services/api';
import { transformComplaint } from '@/services/slaHelpers';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 });
  const [hasAlerts, setHasAlerts] = useState(false);
  const [coins, setCoins] = useState({ balance: 0, totalEarned: 0 });
  const [badgeCount, setBadgeCount] = useState(0);

  const fetchData = async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      // Fetch complaints + gamification data in parallel
      const [complaintsRes, walletRes, badgesRes] = await Promise.all([
        complaintsAPI.getMine(),
        gamificationAPI.getWallet().catch(() => ({ success: false })),
        gamificationAPI.getBadges().catch(() => ({ success: false })),
      ]);

      if (complaintsRes.success && complaintsRes.data) {
        const t = complaintsRes.data.map(transformComplaint);
        setIssues(t);
        const total = complaintsRes.data.length;
        const resolved = complaintsRes.data.filter((c: any) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
        const breached = complaintsRes.data.filter((c: any) => c.slaBreached).length;
        setStats({ total, resolved, pending: total - resolved });
        setHasAlerts(breached > 0 || total - resolved > 0);
      }

      if (walletRes.success && walletRes.data) {
        setCoins({ balance: walletRes.data.balance, totalEarned: walletRes.data.totalEarned });
      }

      if (badgesRes.success && badgesRes.data) {
        setBadgeCount(badgesRes.data.earned?.length || 0);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good Morning ☀️' : h < 17 ? 'Good Afternoon 🌤️' : 'Good Evening 🌙'; };
  const active = issues.filter((i) => i.status !== 'resolved').slice(0, 5);

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />}>
      <LinearGradient colors={['#1E3A8A', '#1E40AF']} style={s.header}>
        <View style={s.topBar}>
          <View>
            <Text style={s.greeting}>{greeting()}</Text>
            <Text style={s.name}>{user?.name || 'Citizen'}</Text>
          </View>
          <View style={s.iconRow}>
            <TouchableOpacity style={s.coinChip} onPress={() => router.push('/(tabs)/ProfileScreen')}>
              <Text style={{ fontSize: 12 }}>🪙</Text>
              <Text style={s.coinChipText}>{coins.balance}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/(tabs)/NotificationsScreen')}>
              <Ionicons name="notifications-outline" size={18} color="white" />
              {hasAlerts && <View style={s.dot} />}
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/(tabs)/ProfileScreen')}>
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

      {/* Gamification quick actions */}
      <View style={s.quickRow}>
        <TouchableOpacity style={s.quickCard} onPress={() => router.push('/(tabs)/LeaderboardScreen')}>
          <View style={[s.quickIcon, { backgroundColor: '#FEF3C7' }]}>
            <MaterialIcons name="emoji-events" size={20} color="#F59E0B" />
          </View>
          <Text style={s.quickLabel}>Leaderboard</Text>
          <Feather name="chevron-right" size={14} color="#C4C9D4" />
        </TouchableOpacity>
        <TouchableOpacity style={s.quickCard} onPress={() => router.push('/(tabs)/RewardsScreen')}>
          <View style={[s.quickIcon, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="gift-outline" size={20} color="#059669" />
          </View>
          <Text style={s.quickLabel}>Rewards</Text>
          <Feather name="chevron-right" size={14} color="#C4C9D4" />
        </TouchableOpacity>
      </View>

      {/* Coins + Badges banner */}
      <View style={s.bannerWrap}>
        <TouchableOpacity style={s.banner} onPress={() => router.push('/(tabs)/ProfileScreen')} activeOpacity={0.85}>
          <View style={s.bannerIcon}><Text style={{ fontSize: 16 }}>🪙</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.bannerTitle}>
              {coins.balance} Coins · {badgeCount} Badge{badgeCount !== 1 ? 's' : ''}
            </Text>
            <Text style={s.bannerSub}>
              {coins.totalEarned > 0 ? `${coins.totalEarned} total earned` : 'Earn coins by reporting issues →'}
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color="#C4C9D4" />
        </TouchableOpacity>
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

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F7' },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 28 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  greeting: { color: 'rgba(186,210,253,0.8)', fontSize: 12 },
  name: { color: 'white', fontSize: 20, fontWeight: '700' },
  iconRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  iconBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  dot: { position: 'absolute', top: 8, right: 8, width: 7, height: 7, backgroundColor: '#EF4444', borderRadius: 4 },
  coinChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(252,211,77,0.2)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(252,211,77,0.3)' },
  coinChipText: { color: '#FCD34D', fontSize: 13, fontWeight: '800' },
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

  // Quick actions
  quickRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14, gap: 10 },
  quickCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'white', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#ECEEF2' },
  quickIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  quickLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1A2340' },

  bannerWrap: { paddingHorizontal: 16, paddingTop: 10 },
  banner: { backgroundColor: 'white', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  bannerIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center' },
  bannerTitle: { fontSize: 12, fontWeight: '600', color: '#1A2340' },
  bannerSub: { fontSize: 11, color: '#6B7280' },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  secHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  secTitle: { fontSize: 16, fontWeight: '700', color: '#1A2340' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllT: { fontSize: 13, color: '#1E3A8A', fontWeight: '600' },
  center: { alignItems: 'center', paddingVertical: 30 },
  loadT: { marginTop: 8, fontSize: 12, color: '#6B7280' },
  empty: { backgroundColor: 'white', borderRadius: 14, padding: 30, alignItems: 'center' },
  emptyT: { fontSize: 15, fontWeight: '600', marginTop: 8, color: '#1A2340' },
  emptySub: { fontSize: 12, color: '#6B7280', marginTop: 4 },
});
