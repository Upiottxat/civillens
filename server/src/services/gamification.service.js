const { prisma } = require('../lib/prisma');

// ─── Coin Award Rules ────────────────────────────────────────────────────────

const COIN_RULES = {
  COMPLAINT_SUBMITTED: 10,    // Valid complaint submitted
  COMPLAINT_RESOLVED: 15,     // Complaint resolved (any)
  SLA_RESOLVED: 25,           // Resolved within SLA deadline
  PHOTO_EVIDENCE: 5,          // Uploaded clear photo evidence
  FIRST_COMPLAINT: 20,        // One-time bonus
  MILESTONE_10: 50,           // 10th complaint milestone
  MILESTONE_25: 100,          // 25th complaint milestone
  SLA_BREACH_CITIZEN: 10,     // Authority missed SLA — citizen rewarded
};

// ─── Wallet Helpers ──────────────────────────────────────────────────────────

/**
 * Get or create a CoinWallet for a user (idempotent).
 */
async function getOrCreateWallet(userId, tx = prisma) {
  let wallet = await tx.coinWallet.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await tx.coinWallet.create({ data: { userId } });
  }
  return wallet;
}

/**
 * Award coins to a user. Creates transaction log + updates balance.
 * Returns the updated wallet.
 */
async function awardCoins(userId, amount, reason, referenceId = null) {
  return prisma.$transaction(async (tx) => {
    const wallet = await getOrCreateWallet(userId, tx);

    await tx.coinTransaction.create({
      data: {
        walletId: wallet.id,
        amount,
        reason,
        referenceId,
      },
    });

    const updated = await tx.coinWallet.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: amount },
        totalEarned: amount > 0 ? { increment: amount } : undefined,
      },
    });

    return updated;
  });
}

/**
 * Deduct coins from a user (for reward redemption).
 * Throws if insufficient balance.
 */
async function deductCoins(userId, amount, reason, referenceId = null) {
  return prisma.$transaction(async (tx) => {
    const wallet = await getOrCreateWallet(userId, tx);

    if (wallet.balance < amount) {
      throw new Error('INSUFFICIENT_BALANCE');
    }

    await tx.coinTransaction.create({
      data: {
        walletId: wallet.id,
        amount: -amount,
        reason,
        referenceId,
      },
    });

    return tx.coinWallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: amount } },
    });
  });
}

// ─── Complaint-Triggered Awards ──────────────────────────────────────────────

/**
 * Called after a complaint is successfully submitted.
 * Awards: COMPLAINT_SUBMITTED + PHOTO_EVIDENCE + FIRST_COMPLAINT + milestones.
 */
async function onComplaintSubmitted(userId, complaintId, hasImage) {
  const awarded = [];

  // Base award: valid complaint submitted
  await awardCoins(userId, COIN_RULES.COMPLAINT_SUBMITTED, 'COMPLAINT_SUBMITTED', complaintId);
  awarded.push({ reason: 'COMPLAINT_SUBMITTED', amount: COIN_RULES.COMPLAINT_SUBMITTED });

  // Photo evidence bonus
  if (hasImage) {
    await awardCoins(userId, COIN_RULES.PHOTO_EVIDENCE, 'PHOTO_EVIDENCE', complaintId);
    awarded.push({ reason: 'PHOTO_EVIDENCE', amount: COIN_RULES.PHOTO_EVIDENCE });
  }

  // Check if first complaint ever
  const totalComplaints = await prisma.complaint.count({ where: { citizenId: userId } });

  if (totalComplaints === 1) {
    await awardCoins(userId, COIN_RULES.FIRST_COMPLAINT, 'FIRST_COMPLAINT', complaintId);
    awarded.push({ reason: 'FIRST_COMPLAINT', amount: COIN_RULES.FIRST_COMPLAINT });
  }

  // Milestone bonuses
  if (totalComplaints === 10) {
    await awardCoins(userId, COIN_RULES.MILESTONE_10, 'MILESTONE_10', complaintId);
    awarded.push({ reason: 'MILESTONE_10', amount: COIN_RULES.MILESTONE_10 });
  }
  if (totalComplaints === 25) {
    await awardCoins(userId, COIN_RULES.MILESTONE_25, 'MILESTONE_25', complaintId);
    awarded.push({ reason: 'MILESTONE_25', amount: COIN_RULES.MILESTONE_25 });
  }

  // Check and award any new badges
  await checkAndAwardBadges(userId);

  return awarded;
}

/**
 * Called when a complaint is resolved.
 * Awards: COMPLAINT_RESOLVED + SLA_RESOLVED (if within deadline).
 */
async function onComplaintResolved(complaint) {
  const userId = complaint.citizenId;
  const awarded = [];

  // Base resolve award
  await awardCoins(userId, COIN_RULES.COMPLAINT_RESOLVED, 'COMPLAINT_RESOLVED', complaint.id);
  awarded.push({ reason: 'COMPLAINT_RESOLVED', amount: COIN_RULES.COMPLAINT_RESOLVED });

  // Bonus if resolved within SLA
  const resolvedAt = complaint.resolvedAt || new Date();
  if (resolvedAt <= complaint.slaDeadline) {
    await awardCoins(userId, COIN_RULES.SLA_RESOLVED, 'SLA_RESOLVED', complaint.id);
    awarded.push({ reason: 'SLA_RESOLVED', amount: COIN_RULES.SLA_RESOLVED });
  }

  await checkAndAwardBadges(userId);
  return awarded;
}

/**
 * Called when SLA is breached — reward citizen for holding authority accountable.
 */
async function onSLABreached(complaint) {
  await awardCoins(complaint.citizenId, COIN_RULES.SLA_BREACH_CITIZEN, 'SLA_BREACH_CITIZEN', complaint.id);
  return [{ reason: 'SLA_BREACH_CITIZEN', amount: COIN_RULES.SLA_BREACH_CITIZEN }];
}

// ─── Badge System ────────────────────────────────────────────────────────────

/**
 * Evaluate all badge criteria and award any new badges the user qualifies for.
 */
async function checkAndAwardBadges(userId) {
  const badges = await prisma.badge.findMany();
  const existing = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  });
  const earned = new Set(existing.map((b) => b.badgeId));
  const newBadges = [];

  for (const badge of badges) {
    if (earned.has(badge.id)) continue;

    const qualifies = await evaluateBadgeCriteria(userId, badge.criteria);
    if (qualifies) {
      await prisma.userBadge.create({
        data: { userId, badgeId: badge.id },
      });
      newBadges.push(badge);
    }
  }

  return newBadges;
}

/**
 * Evaluate a single badge's criteria against user stats.
 */
async function evaluateBadgeCriteria(userId, criteria) {
  const { type, threshold } = criteria;

  switch (type) {
    case 'complaints_submitted': {
      const count = await prisma.complaint.count({
        where: { citizenId: userId, duplicateOf: null },
      });
      return count >= threshold;
    }

    case 'complaints_resolved': {
      const count = await prisma.complaint.count({
        where: {
          citizenId: userId,
          status: { in: ['RESOLVED', 'CLOSED'] },
        },
      });
      return count >= threshold;
    }

    case 'sla_resolved': {
      // Complaints resolved within SLA
      const resolved = await prisma.complaint.findMany({
        where: {
          citizenId: userId,
          status: { in: ['RESOLVED', 'CLOSED'] },
          resolvedAt: { not: null },
        },
        select: { resolvedAt: true, slaDeadline: true },
      });
      const withinSLA = resolved.filter((c) => c.resolvedAt <= c.slaDeadline).length;
      return withinSLA >= threshold;
    }

    case 'total_coins': {
      const wallet = await prisma.coinWallet.findUnique({ where: { userId } });
      return wallet && wallet.totalEarned >= threshold;
    }

    case 'streak_7d': {
      // Complaints in last 7 days
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const count = await prisma.complaint.count({
        where: { citizenId: userId, createdAt: { gte: weekAgo } },
      });
      return count >= threshold;
    }

    default:
      return false;
  }
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

/**
 * Get leaderboard rankings with optional city/state filtering.
 * Returns top N users ranked by totalEarned.
 */
async function getLeaderboard({ scope = 'all', city, state, page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  // Build user filter based on scope
  const userWhere = { role: 'CITIZEN' };
  if (scope === 'city' && city) userWhere.city = city;
  if (scope === 'state' && state) userWhere.state = state;

  const wallets = await prisma.coinWallet.findMany({
    where: {
      user: userWhere,
      totalEarned: { gt: 0 },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
          badges: {
            include: { badge: { select: { name: true, icon: true, tier: true } } },
            orderBy: { awardedAt: 'desc' },
            take: 3,
          },
        },
      },
    },
    orderBy: { totalEarned: 'desc' },
    skip,
    take: limit,
  });

  const total = await prisma.coinWallet.count({
    where: {
      user: userWhere,
      totalEarned: { gt: 0 },
    },
  });

  const rankings = wallets.map((w, i) => ({
    rank: skip + i + 1,
    userId: w.user.id,
    name: w.user.name || 'Anonymous',
    city: w.user.city,
    state: w.user.state,
    totalCoins: w.totalEarned,
    currentBalance: w.balance,
    topBadges: w.user.badges.map((ub) => ({
      name: ub.badge.name,
      icon: ub.badge.icon,
      tier: ub.badge.tier,
    })),
  }));

  return { rankings, total, page, limit };
}

/**
 * Get a specific user's rank in the leaderboard.
 */
async function getUserRank(userId, { scope = 'all', city, state } = {}) {
  const wallet = await prisma.coinWallet.findUnique({ where: { userId } });
  if (!wallet || wallet.totalEarned === 0) {
    return { rank: null, totalCoins: 0, message: 'Not ranked yet' };
  }

  const userWhere = { role: 'CITIZEN' };
  if (scope === 'city' && city) userWhere.city = city;
  if (scope === 'state' && state) userWhere.state = state;

  // Count users with higher totalEarned
  const above = await prisma.coinWallet.count({
    where: {
      user: userWhere,
      totalEarned: { gt: wallet.totalEarned },
    },
  });

  return {
    rank: above + 1,
    totalCoins: wallet.totalEarned,
    balance: wallet.balance,
  };
}

// ─── Reward Redemption ───────────────────────────────────────────────────────

/**
 * Redeem a reward — deducts coins and creates a redemption record with coupon code.
 */
async function redeemReward(userId, rewardId) {
  const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
  if (!reward) throw new Error('REWARD_NOT_FOUND');
  if (!reward.active) throw new Error('REWARD_INACTIVE');
  if (reward.stock === 0) throw new Error('OUT_OF_STOCK');

  // Deduct coins (throws INSUFFICIENT_BALANCE if not enough)
  await deductCoins(userId, reward.coinCost, 'REWARD_REDEEMED', rewardId);

  // Generate coupon code
  const code = `CL-${reward.partner.substring(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  // Create redemption record
  const redemption = await prisma.redemption.create({
    data: {
      userId,
      rewardId,
      coinSpent: reward.coinCost,
      code,
    },
    include: {
      reward: { select: { name: true, partner: true, description: true } },
    },
  });

  // Decrement stock if limited
  if (reward.stock > 0) {
    await prisma.reward.update({
      where: { id: rewardId },
      data: { stock: { decrement: 1 } },
    });
  }

  return redemption;
}

// ─── Profile Summary ─────────────────────────────────────────────────────────

/**
 * Get full gamification profile for a user.
 */
async function getProfile(userId) {
  const [wallet, badges, redemptions, complaintStats] = await Promise.all([
    getOrCreateWallet(userId),
    prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { awardedAt: 'desc' },
    }),
    prisma.redemption.findMany({
      where: { userId },
      include: { reward: { select: { name: true, partner: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.complaint.groupBy({
      by: ['status'],
      where: { citizenId: userId },
      _count: true,
    }),
  ]);

  // Recent transactions
  const transactions = await prisma.coinTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  // Parse complaint stats
  const stats = {
    total: 0,
    resolved: 0,
    pending: 0,
    breached: 0,
  };
  for (const s of complaintStats) {
    stats.total += s._count;
    if (s.status === 'RESOLVED' || s.status === 'CLOSED') stats.resolved += s._count;
    if (s.status === 'BREACHED') stats.breached += s._count;
  }
  stats.pending = stats.total - stats.resolved;

  return {
    coins: {
      balance: wallet.balance,
      totalEarned: wallet.totalEarned,
    },
    badges: badges.map((ub) => ({
      id: ub.badge.id,
      slug: ub.badge.slug,
      name: ub.badge.name,
      icon: ub.badge.icon,
      tier: ub.badge.tier,
      description: ub.badge.description,
      awardedAt: ub.awardedAt,
    })),
    recentTransactions: transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      reason: t.reason,
      createdAt: t.createdAt,
    })),
    recentRedemptions: redemptions,
    complaintStats: stats,
  };
}

module.exports = {
  COIN_RULES,
  awardCoins,
  deductCoins,
  onComplaintSubmitted,
  onComplaintResolved,
  onSLABreached,
  checkAndAwardBadges,
  getLeaderboard,
  getUserRank,
  redeemReward,
  getProfile,
  getOrCreateWallet,
};
