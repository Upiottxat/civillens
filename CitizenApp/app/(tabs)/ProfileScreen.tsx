import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { gamificationAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const REASON_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  COMPLAINT_SUBMITTED: { label: 'Complaint Submitted', icon: '📋', color: '#0D9488' },
  COMPLAINT_RESOLVED: { label: 'Complaint Resolved', icon: '✅', color: '#059669' },
  SLA_RESOLVED: { label: 'SLA Met Bonus', icon: '⚡', color: '#7C3AED' },
  PHOTO_EVIDENCE: { label: 'Photo Evidence', icon: '📸', color: '#2563EB' },
  FIRST_COMPLAINT: { label: 'First Report Bonus', icon: '🌱', color: '#D97706' },
  MILESTONE_10: { label: '10th Report Milestone', icon: '🎯', color: '#DC2626' },
  MILESTONE_25: { label: '25th Report Milestone', icon: '🏆', color: '#DC2626' },
  SLA_BREACH_CITIZEN: { label: 'SLA Breach Reward', icon: '⏰', color: '#EA580C' },
  REWARD_REDEEMED: { label: 'Reward Redeemed', icon: '🎁', color: '#DC2626' },
};

const TIER_COLORS: Record<string, string> = {
  BRONZE: '#D97706',
  SILVER: '#6B7280',
  GOLD: '#F59E0B',
  PLATINUM: '#8B5CF6',
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'badges' | 'transactions' | 'redemptions'>('badges');

  const fetchProfile = async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const r = await gamificationAPI.getProfile();
      if (r.success && r.data) {
        setProfile(r.data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchProfile(); }, []));

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); } },
    ]);
  };

  if (loading) {
    return (
      <View style={[s.container, s.center]}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={s.loadText}>Loading profile…</Text>
      </View>
    );
  }

  const coins = profile?.coins || { balance: 0, totalEarned: 0 };
  const badges = profile?.badges || [];
  const transactions = profile?.recentTransactions || [];
  const redemptions = profile?.recentRedemptions || [];
  const stats = profile?.complaintStats || { total: 0, resolved: 0, pending: 0, breached: 0 };
  const rank = profile?.rank || {};

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchProfile(true)} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <LinearGradient colors={['#1E3A8A', '#1E40AF']} style={s.header}>
        <View style={s.headerTop}>
          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              <Feather name="user" size={28} color="#1E3A8A" />
            </View>
            {rank.rank && (
              <View style={s.rankBadge}>
                <Text style={s.rankBadgeText}>#{rank.rank}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={s.logoutIcon} onPress={handleLogout}>
            <Feather name="log-out" size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        <Text style={s.userName}>{user?.name || 'Citizen'}</Text>
        <Text style={s.userPhone}>+91 {user?.phone || '—'}</Text>

        {/* Coins display */}
        <View style={s.coinsRow}>
          <View style={s.coinCard}>
            <Text style={{ fontSize: 20 }}>🪙</Text>
            <View>
              <Text style={s.coinValue}>{coins.balance}</Text>
              <Text style={s.coinLabel}>Balance</Text>
            </View>
          </View>
          <View style={s.coinCard}>
            <Text style={{ fontSize: 20 }}>💰</Text>
            <View>
              <Text style={s.coinValue}>{coins.totalEarned}</Text>
              <Text style={s.coinLabel}>Total Earned</Text>
            </View>
          </View>
          <View style={s.coinCard}>
            <Text style={{ fontSize: 20 }}>🏅</Text>
            <View>
              <Text style={s.coinValue}>{badges.length}</Text>
              <Text style={s.coinLabel}>Badges</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Stats cards */}
      <View style={s.statsSection}>
        <Text style={s.sectionTitle}>📊 Complaint Stats</Text>
        <View style={s.statsGrid}>
          {[
            { label: 'Total', value: stats.total, icon: '📋', color: '#1E3A8A' },
            { label: 'Resolved', value: stats.resolved, icon: '✅', color: '#059669' },
            { label: 'Pending', value: stats.pending, icon: '⏳', color: '#D97706' },
            { label: 'Breached', value: stats.breached, icon: '🚨', color: '#DC2626' },
          ].map((st) => (
            <View key={st.label} style={s.statCard}>
              <Text style={{ fontSize: 18 }}>{st.icon}</Text>
              <Text style={[s.statValue, { color: st.color }]}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Tab selector */}
      <View style={s.tabRow}>
        {[
          { key: 'badges' as const, label: '🏅 Badges', count: badges.length },
          { key: 'transactions' as const, label: '🪙 History', count: transactions.length },
          { key: 'redemptions' as const, label: '🎁 Redeemed', count: redemptions.length },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
              {tab.label}
            </Text>
            <View style={[s.tabCount, activeTab === tab.key && s.tabCountActive]}>
              <Text style={[s.tabCountText, activeTab === tab.key && s.tabCountTextActive]}>
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <View style={s.tabContent}>
        {activeTab === 'badges' && (
          badges.length === 0 ? (
            <View style={s.emptyTab}>
              <Text style={{ fontSize: 32 }}>🏅</Text>
              <Text style={s.emptyTabTitle}>No badges yet</Text>
              <Text style={s.emptyTabSub}>Keep reporting issues to earn badges!</Text>
            </View>
          ) : (
            <View style={s.badgeGrid}>
              {badges.map((b: any) => (
                <View key={b.id} style={s.badgeCard}>
                  <View style={[s.badgeIcon, { borderColor: TIER_COLORS[b.tier] || '#D97706' }]}>
                    <Text style={{ fontSize: 24 }}>{b.icon}</Text>
                  </View>
                  <Text style={s.badgeName}>{b.name}</Text>
                  <Text style={[s.badgeTier, { color: TIER_COLORS[b.tier] || '#D97706' }]}>
                    {b.tier}
                  </Text>
                  <Text style={s.badgeDesc} numberOfLines={2}>{b.description}</Text>
                </View>
              ))}
            </View>
          )
        )}

        {activeTab === 'transactions' && (
          transactions.length === 0 ? (
            <View style={s.emptyTab}>
              <Text style={{ fontSize: 32 }}>🪙</Text>
              <Text style={s.emptyTabTitle}>No transactions yet</Text>
              <Text style={s.emptyTabSub}>Submit your first complaint to earn coins!</Text>
            </View>
          ) : (
            <View style={s.txList}>
              {transactions.map((tx: any) => {
                const meta = REASON_LABELS[tx.reason] || { label: tx.reason, icon: '🪙', color: '#6B7280' };
                const isPositive = tx.amount > 0;
                return (
                  <View key={tx.id} style={s.txRow}>
                    <View style={s.txLeft}>
                      <Text style={{ fontSize: 18 }}>{meta.icon}</Text>
                      <View>
                        <Text style={s.txLabel}>{meta.label}</Text>
                        <Text style={s.txDate}>
                          {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </Text>
                      </View>
                    </View>
                    <Text style={[s.txAmount, { color: isPositive ? '#059669' : '#DC2626' }]}>
                      {isPositive ? '+' : ''}{tx.amount}
                    </Text>
                  </View>
                );
              })}
            </View>
          )
        )}

        {activeTab === 'redemptions' && (
          redemptions.length === 0 ? (
            <View style={s.emptyTab}>
              <Text style={{ fontSize: 32 }}>🎁</Text>
              <Text style={s.emptyTabTitle}>No redemptions yet</Text>
              <Text style={s.emptyTabSub}>Earn coins and redeem exciting rewards!</Text>
            </View>
          ) : (
            <View style={s.txList}>
              {redemptions.map((r: any) => (
                <View key={r.id} style={s.txRow}>
                  <View style={s.txLeft}>
                    <Text style={{ fontSize: 18 }}>🎁</Text>
                    <View>
                      <Text style={s.txLabel}>{r.reward?.name || 'Reward'}</Text>
                      <Text style={s.txDate}>{r.reward?.partner}</Text>
                    </View>
                  </View>
                  <View style={s.codeChip}>
                    <Text style={s.codeChipText}>{r.code}</Text>
                  </View>
                </View>
              ))}
            </View>
          )
        )}
      </View>

      {/* Bottom padding */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F7' },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadText: { marginTop: 10, color: '#6B7280', fontSize: 13 },

  // Header
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  avatarWrap: { position: 'relative' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  rankBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#FCD34D', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 2, borderColor: 'white' },
  rankBadgeText: { fontSize: 10, fontWeight: '800', color: '#92400E' },
  logoutIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  userName: { color: 'white', fontSize: 20, fontWeight: '800', marginTop: 12 },
  userPhone: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 },

  // Coins row
  coinsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  coinCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 10 },
  coinValue: { color: 'white', fontSize: 18, fontWeight: '800' },
  coinLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 9 },

  // Stats
  statsSection: { paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A2340', marginBottom: 10 },
  statsGrid: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#ECEEF2' },
  statValue: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  statLabel: { fontSize: 10, color: '#6B7280', marginTop: 2 },

  // Tabs
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, gap: 6 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: 'white', borderWidth: 1, borderColor: '#ECEEF2' },
  tabActive: { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: 'white' },
  tabCount: { backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabCountText: { fontSize: 10, fontWeight: '700', color: '#6B7280' },
  tabCountTextActive: { color: 'white' },

  // Tab content
  tabContent: { paddingHorizontal: 16, paddingTop: 12 },

  // Empty tab
  emptyTab: { alignItems: 'center', paddingVertical: 30 },
  emptyTabTitle: { fontSize: 15, fontWeight: '700', color: '#1A2340', marginTop: 8 },
  emptyTabSub: { fontSize: 12, color: '#6B7280', marginTop: 4 },

  // Badges
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: { width: '47%', backgroundColor: 'white', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ECEEF2' },
  badgeIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  badgeName: { fontSize: 13, fontWeight: '700', color: '#1A2340', marginTop: 8, textAlign: 'center' },
  badgeTier: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  badgeDesc: { fontSize: 10, color: '#9CA3AF', marginTop: 4, textAlign: 'center', lineHeight: 14 },

  // Transactions
  txList: { gap: 6 },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#ECEEF2' },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  txLabel: { fontSize: 13, fontWeight: '600', color: '#1A2340' },
  txDate: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  txAmount: { fontSize: 16, fontWeight: '800' },

  // Redemption code
  codeChip: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  codeChipText: { fontSize: 10, fontWeight: '700', color: '#1E3A8A', fontFamily: 'monospace' },
});
