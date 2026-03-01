import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator, Modal, Pressable, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { gamificationAPI } from '@/services/api';

type Category = 'ALL' | 'FOOD' | 'ENTERTAINMENT' | 'SHOPPING';

interface Reward {
  id: string;
  name: string;
  description: string;
  partner: string;
  coinCost: number;
  category: string;
  stock: number;
  canAfford: boolean;
  inStock: boolean;
  imageUrl: string | null;
}

const CATEGORY_ICONS: Record<string, string> = {
  FOOD: '🍕',
  ENTERTAINMENT: '🎵',
  SHOPPING: '🛍️',
  ALL: '🎁',
};

const PARTNER_ICONS: Record<string, string> = {
  Swiggy: '🍊',
  Zomato: '🔴',
  Spotify: '🎵',
  YouTube: '▶️',
  Amazon: '📦',
  Myntra: '👗',
  BookMyShow: '🎬',
};

export default function RewardsScreen() {
  const [category, setCategory] = useState<Category>('ALL');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<{ code: string; name: string } | null>(null);

  const fetchRewards = async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const cat = category === 'ALL' ? undefined : category;
      const r = await gamificationAPI.getRewards(cat);
      if (r.success && r.data) {
        setRewards(r.data.rewards || []);
        setBalance(r.data.balance || 0);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchRewards(); }, [category]));

  const handleRedeem = (reward: Reward) => {
    if (!reward.canAfford) {
      Alert.alert('Not Enough Coins', `You need ${reward.coinCost - balance} more coins to redeem this reward.`);
      return;
    }
    if (!reward.inStock) {
      Alert.alert('Out of Stock', 'This reward is currently unavailable.');
      return;
    }

    Alert.alert(
      'Redeem Reward',
      `Spend ${reward.coinCost} coins for "${reward.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          style: 'default',
          onPress: async () => {
            setRedeeming(reward.id);
            try {
              const r = await gamificationAPI.redeemReward(reward.id);
              if (r.success && r.data) {
                setSuccessModal({ code: r.data.code, name: reward.name });
                setBalance((prev) => prev - reward.coinCost);
                // Refresh rewards to update canAfford
                fetchRewards();
              } else {
                Alert.alert('Failed', r.error || 'Could not redeem reward.');
              }
            } catch (e) {
              Alert.alert('Error', 'Something went wrong. Try again.');
            } finally {
              setRedeeming(null);
            }
          },
        },
      ]
    );
  };

  const renderRewardCard = (reward: Reward) => {
    const locked = !reward.canAfford;
    const outOfStock = !reward.inStock;
    const isRedeeming = redeeming === reward.id;

    return (
      <View key={reward.id} style={[s.card, locked && s.cardLocked]}>
        <View style={s.cardHeader}>
          <View style={[s.partnerIcon, { backgroundColor: locked ? '#F3F4F6' : '#EEF2FF' }]}>
            <Text style={{ fontSize: 24 }}>{PARTNER_ICONS[reward.partner] || '🎁'}</Text>
          </View>
          {outOfStock && (
            <View style={s.stockBadge}>
              <Text style={s.stockText}>Out of Stock</Text>
            </View>
          )}
          {reward.stock > 0 && reward.stock <= 10 && (
            <View style={[s.stockBadge, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[s.stockText, { color: '#D97706' }]}>Only {reward.stock} left</Text>
            </View>
          )}
        </View>

        <Text style={[s.cardPartner, locked && { color: '#9CA3AF' }]}>{reward.partner}</Text>
        <Text style={[s.cardName, locked && { color: '#9CA3AF' }]}>{reward.name}</Text>
        <Text style={s.cardDesc} numberOfLines={2}>{reward.description}</Text>

        <View style={s.cardFooter}>
          <View style={s.costRow}>
            <Text style={{ fontSize: 14 }}>🪙</Text>
            <Text style={[s.costText, locked && { color: '#9CA3AF' }]}>{reward.coinCost}</Text>
          </View>

          <TouchableOpacity
            style={[
              s.redeemBtn,
              locked && s.redeemBtnLocked,
              outOfStock && s.redeemBtnLocked,
            ]}
            onPress={() => handleRedeem(reward)}
            disabled={isRedeeming || outOfStock}
            activeOpacity={0.8}
          >
            {isRedeeming ? (
              <ActivityIndicator size="small" color="white" />
            ) : locked ? (
              <View style={s.redeemInner}>
                <Feather name="lock" size={12} color="#9CA3AF" />
                <Text style={s.redeemTextLocked}>Locked</Text>
              </View>
            ) : (
              <Text style={s.redeemText}>Redeem</Text>
            )}
          </TouchableOpacity>
        </View>

        {locked && !outOfStock && (
          <View style={s.needMore}>
            <Feather name="trending-up" size={10} color="#6B7280" />
            <Text style={s.needMoreText}>
              Need {reward.coinCost - balance} more coins
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <LinearGradient colors={['#1E3A8A', '#0D9488']} style={s.header}>
        <Text style={s.headerTitle}>🎁 Rewards Store</Text>
        <Text style={s.headerSub}>Redeem coins for real-world rewards</Text>

        {/* Balance card */}
        <View style={s.balanceCard}>
          <View style={s.balanceLeft}>
            <Text style={s.balanceLabel}>Your Balance</Text>
            <View style={s.balanceRow}>
              <Text style={{ fontSize: 22 }}>🪙</Text>
              <Text style={s.balanceAmount}>{balance}</Text>
            </View>
          </View>
          <View style={s.balanceDivider} />
          <View style={s.balanceRight}>
            <MaterialIcons name="emoji-events" size={20} color="#F59E0B" />
            <Text style={s.balanceHint}>Earn more by{'\n'}reporting issues</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Category filter */}
      <View style={s.catRow}>
        {(['ALL', 'FOOD', 'ENTERTAINMENT', 'SHOPPING'] as Category[]).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[s.catTab, category === cat && s.catTabActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={{ fontSize: 14 }}>{CATEGORY_ICONS[cat]}</Text>
            <Text style={[s.catText, category === cat && s.catTextActive]}>
              {cat === 'ALL' ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Rewards grid */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={s.loadText}>Loading rewards…</Text>
        </View>
      ) : rewards.length === 0 ? (
        <View style={s.emptyWrap}>
          <Text style={{ fontSize: 48 }}>🎁</Text>
          <Text style={s.emptyTitle}>No rewards available</Text>
          <Text style={s.emptySub}>Check back soon for exciting offers!</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.grid}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchRewards(true)} />}
          showsVerticalScrollIndicator={false}
        >
          {rewards.map(renderRewardCard)}
        </ScrollView>
      )}

      {/* Success Modal */}
      <Modal visible={!!successModal} transparent animationType="fade">
        <Pressable style={s.overlay} onPress={() => setSuccessModal(null)}>
          <Pressable style={s.successCard} onPress={() => {}}>
            <View style={s.successIcon}>
              <Text style={{ fontSize: 40 }}>🎉</Text>
            </View>
            <Text style={s.successTitle}>Reward Redeemed!</Text>
            <Text style={s.successName}>{successModal?.name}</Text>
            <View style={s.codeBox}>
              <Text style={s.codeLabel}>Your Coupon Code</Text>
              <Text style={s.codeText}>{successModal?.code}</Text>
            </View>
            <Text style={s.successHint}>Screenshot this code to use later</Text>
            <TouchableOpacity style={s.successBtn} onPress={() => setSuccessModal(null)}>
              <Text style={s.successBtnText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F7' },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { color: 'white', fontSize: 22, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },

  // Balance
  balanceCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 16, marginTop: 14, alignItems: 'center' },
  balanceLeft: { flex: 1 },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  balanceAmount: { color: 'white', fontSize: 28, fontWeight: '800' },
  balanceDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 16 },
  balanceRight: { alignItems: 'center', gap: 4 },
  balanceHint: { color: 'rgba(255,255,255,0.6)', fontSize: 10, textAlign: 'center' },

  // Categories
  catRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  catTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 10, backgroundColor: 'white', borderWidth: 1, borderColor: '#ECEEF2' },
  catTabActive: { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' },
  catText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  catTextActive: { color: 'white' },

  // Grid
  grid: { paddingHorizontal: 16, paddingBottom: 100, gap: 12 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#ECEEF2' },
  cardLocked: { opacity: 0.85, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  partnerIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  stockBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  stockText: { fontSize: 10, fontWeight: '600', color: '#DC2626' },
  cardPartner: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  cardName: { fontSize: 16, fontWeight: '700', color: '#1A2340', marginTop: 2 },
  cardDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 4, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  costRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  costText: { fontSize: 18, fontWeight: '800', color: '#1A2340' },
  redeemBtn: { backgroundColor: '#1E3A8A', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  redeemBtnLocked: { backgroundColor: '#E5E7EB' },
  redeemInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  redeemText: { color: 'white', fontSize: 13, fontWeight: '700' },
  redeemTextLocked: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
  needMore: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  needMoreText: { fontSize: 11, color: '#6B7280' },

  // Loading / Empty
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadText: { marginTop: 10, color: '#6B7280', fontSize: 13 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A2340', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 6 },

  // Success modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  successCard: { backgroundColor: 'white', borderRadius: 24, padding: 28, width: '100%', maxWidth: 340, alignItems: 'center' },
  successIcon: { marginBottom: 12 },
  successTitle: { fontSize: 20, fontWeight: '800', color: '#1A2340' },
  successName: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  codeBox: { backgroundColor: '#EEF2FF', borderRadius: 12, padding: 16, marginTop: 16, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#C7D2FE', borderStyle: 'dashed' },
  codeLabel: { fontSize: 11, color: '#6B7280', marginBottom: 6 },
  codeText: { fontSize: 22, fontWeight: '800', color: '#1E3A8A', letterSpacing: 2, fontFamily: 'monospace' },
  successHint: { fontSize: 11, color: '#9CA3AF', marginTop: 10 },
  successBtn: { backgroundColor: '#1E3A8A', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 12, marginTop: 18 },
  successBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
});
