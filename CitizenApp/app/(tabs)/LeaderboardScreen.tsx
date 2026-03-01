import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { gamificationAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

type Scope = 'all' | 'city' | 'state';

interface RankEntry {
  rank: number;
  userId: string;
  name: string;
  city: string | null;
  state: string | null;
  totalCoins: number;
  currentBalance: number;
  topBadges: { name: string; icon: string; tier: string }[];
}

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [scope, setScope] = useState<Scope>('all');
  const [rankings, setRankings] = useState<RankEntry[]>([]);
  const [myRank, setMyRank] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const r = await gamificationAPI.getLeaderboard({ scope });
      if (r.success && r.data) {
        setRankings(r.data.rankings || []);
        setMyRank(r.data.myRank || null);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchLeaderboard(); }, [scope]));

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PLATINUM': return '#A78BFA';
      case 'GOLD': return '#F59E0B';
      case 'SILVER': return '#9CA3AF';
      default: return '#D97706';
    }
  };

  const renderPodium = () => {
    const top3 = rankings.slice(0, 3);
    if (top3.length === 0) return null;

    // Reorder: [2nd, 1st, 3rd] for visual podium
    const podiumOrder = top3.length >= 3
      ? [top3[1], top3[0], top3[2]]
      : top3;
    const heights = top3.length >= 3 ? [90, 120, 70] : top3.map(() => 100);

    return (
      <View style={s.podiumContainer}>
        {podiumOrder.map((entry, i) => {
          const isFirst = entry.rank === 1;
          return (
            <View key={entry.userId} style={[s.podiumItem, { marginTop: isFirst ? 0 : 30 }]}>
              <View style={[s.podiumAvatar, isFirst && s.podiumAvatarFirst]}>
                <Text style={{ fontSize: isFirst ? 24 : 18 }}>
                  {getMedalEmoji(entry.rank)}
                </Text>
              </View>
              <Text style={[s.podiumName, isFirst && s.podiumNameFirst]} numberOfLines={1}>
                {entry.name}
              </Text>
              <Text style={s.podiumCoins}>{entry.totalCoins} 🪙</Text>
              {entry.topBadges.length > 0 && (
                <Text style={s.podiumBadge}>{entry.topBadges[0].icon}</Text>
              )}
              <View style={[s.podiumBar, { height: heights[i] }]}>
                <Text style={s.podiumRank}>{entry.rank}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderRankItem = ({ item }: { item: RankEntry }) => {
    const isMe = item.userId === user?.id;
    return (
      <View style={[s.rankRow, isMe && s.rankRowMe]}>
        <View style={s.rankLeft}>
          <Text style={[s.rankNum, isMe && s.rankNumMe]}>
            {getMedalEmoji(item.rank)}
          </Text>
          <View style={s.rankInfo}>
            <Text style={[s.rankName, isMe && s.rankNameMe]} numberOfLines={1}>
              {item.name} {isMe ? '(You)' : ''}
            </Text>
            {item.city && (
              <Text style={s.rankCity}>
                📍 {item.city}{item.state ? `, ${item.state}` : ''}
              </Text>
            )}
            {item.topBadges.length > 0 && (
              <View style={s.badgeRow}>
                {item.topBadges.map((b, i) => (
                  <Text key={i} style={s.badgeChip}>{b.icon} {b.name}</Text>
                ))}
              </View>
            )}
          </View>
        </View>
        <View style={s.rankRight}>
          <Text style={[s.rankCoins, isMe && s.rankCoinsMe]}>{item.totalCoins}</Text>
          <Text style={s.rankCoinLabel}>coins</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <LinearGradient colors={['#1E3A8A', '#7C3AED']} style={s.header}>
        <View style={s.topBar}>
          <View>
            <Text style={s.headerTitle}>🏆 Leaderboard</Text>
            <Text style={s.headerSub}>Top civic contributors</Text>
          </View>
          {myRank && myRank.rank && (
            <View style={s.myRankBadge}>
              <Text style={s.myRankText}>#{myRank.rank}</Text>
              <Text style={s.myRankLabel}>Your Rank</Text>
            </View>
          )}
        </View>

        {/* Scope tabs */}
        <View style={s.scopeRow}>
          {[
            { key: 'all' as Scope, label: '🌍 All India' },
            { key: 'city' as Scope, label: '🏙️ City' },
            { key: 'state' as Scope, label: '🗺️ State' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[s.scopeTab, scope === tab.key && s.scopeTabActive]}
              onPress={() => setScope(tab.key)}
            >
              <Text style={[s.scopeText, scope === tab.key && s.scopeTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={s.loadText}>Loading rankings…</Text>
        </View>
      ) : rankings.length === 0 ? (
        <View style={s.emptyWrap}>
          <Text style={{ fontSize: 48 }}>🏆</Text>
          <Text style={s.emptyTitle}>No rankings yet</Text>
          <Text style={s.emptySub}>Be the first to report an issue and climb the leaderboard!</Text>
        </View>
      ) : (
        <FlatList
          data={rankings.slice(3)} // Rest after top 3
          keyExtractor={(item) => item.userId}
          renderItem={renderRankItem}
          ListHeaderComponent={
            <View>
              {renderPodium()}
              {rankings.length > 3 && (
                <Text style={s.listHeader}>Rankings</Text>
              )}
            </View>
          }
          ListFooterComponent={
            myRank && myRank.rank && myRank.rank > 3 ? (
              <View style={s.myRankCard}>
                <Feather name="trending-up" size={16} color="#1E3A8A" />
                <Text style={s.myRankCardText}>
                  You're ranked #{myRank.rank} with {myRank.totalCoins} coins
                </Text>
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchLeaderboard(true)} />
          }
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F7' },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerTitle: { color: 'white', fontSize: 22, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  myRankBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6, alignItems: 'center' },
  myRankText: { color: '#FCD34D', fontSize: 20, fontWeight: '800' },
  myRankLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  scopeRow: { flexDirection: 'row', gap: 8 },
  scopeTab: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center' },
  scopeTabActive: { backgroundColor: 'rgba(255,255,255,0.95)' },
  scopeText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  scopeTextActive: { color: '#1E3A8A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadText: { marginTop: 10, color: '#6B7280', fontSize: 13 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A2340', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 6 },

  // Podium
  podiumContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, gap: 12 },
  podiumItem: { alignItems: 'center', flex: 1 },
  podiumAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#C4C9D4' },
  podiumAvatarFirst: { width: 56, height: 56, borderRadius: 28, borderColor: '#FCD34D', borderWidth: 3 },
  podiumName: { fontSize: 11, fontWeight: '600', color: '#1A2340', marginTop: 6, textAlign: 'center' },
  podiumNameFirst: { fontSize: 13, fontWeight: '800' },
  podiumCoins: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  podiumBadge: { fontSize: 14, marginTop: 2 },
  podiumBar: { width: '90%', backgroundColor: '#EEF2FF', borderTopLeftRadius: 8, borderTopRightRadius: 8, marginTop: 8, justifyContent: 'center', alignItems: 'center' },
  podiumRank: { fontSize: 20, fontWeight: '800', color: '#1E3A8A' },

  // List
  listContent: { paddingBottom: 100 },
  listHeader: { fontSize: 14, fontWeight: '700', color: '#1A2340', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 },
  rankRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', marginHorizontal: 16, marginVertical: 4, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#ECEEF2' },
  rankRowMe: { borderColor: '#1E3A8A', borderWidth: 2, backgroundColor: '#EFF6FF' },
  rankLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rankNum: { fontSize: 16, fontWeight: '700', color: '#6B7280', width: 36, textAlign: 'center' },
  rankNumMe: { color: '#1E3A8A' },
  rankInfo: { flex: 1 },
  rankName: { fontSize: 14, fontWeight: '600', color: '#1A2340' },
  rankNameMe: { color: '#1E3A8A', fontWeight: '800' },
  rankCity: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  badgeChip: { fontSize: 10, color: '#6B7280', backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  rankRight: { alignItems: 'flex-end' },
  rankCoins: { fontSize: 18, fontWeight: '800', color: '#F59E0B' },
  rankCoinsMe: { color: '#1E3A8A' },
  rankCoinLabel: { fontSize: 10, color: '#9CA3AF' },

  // My rank card
  myRankCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EFF6FF', marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE' },
  myRankCardText: { fontSize: 13, color: '#1E3A8A', fontWeight: '600' },
});
