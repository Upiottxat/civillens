const { success, error, paginated } = require('../utils/response');
const {
  getProfile,
  getLeaderboard,
  getUserRank,
  redeemReward,
  getOrCreateWallet,
} = require('../services/gamification.service');
const { prisma } = require('../lib/prisma');

// ─── GET /gamification/wallet ────────────────────────────────────────────────

async function getWallet(req, res, next) {
  try {
    const wallet = await getOrCreateWallet(req.user.id);

    const transactions = await prisma.coinTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return success(res, {
      balance: wallet.balance,
      totalEarned: wallet.totalEarned,
      recentTransactions: transactions,
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /gamification/badges ────────────────────────────────────────────────

async function getBadges(req, res, next) {
  try {
    const [allBadges, earned] = await Promise.all([
      prisma.badge.findMany({ orderBy: { tier: 'asc' } }),
      prisma.userBadge.findMany({
        where: { userId: req.user.id },
        select: { badgeId: true, awardedAt: true },
      }),
    ]);

    const earnedMap = new Map(earned.map((e) => [e.badgeId, e.awardedAt]));

    const badges = allBadges.map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      description: b.description,
      icon: b.icon,
      tier: b.tier,
      criteria: b.criteria,
      earned: earnedMap.has(b.id),
      awardedAt: earnedMap.get(b.id) || null,
    }));

    return success(res, {
      earned: badges.filter((b) => b.earned),
      available: badges.filter((b) => !b.earned),
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /gamification/leaderboard ───────────────────────────────────────────

async function leaderboard(req, res, next) {
  try {
    const {
      scope = 'all',
      city,
      state,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

    const result = await getLeaderboard({
      scope,
      city,
      state,
      page: pageNum,
      limit: limitNum,
    });

    // Also get the requesting user's rank
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { city: true, state: true },
    });

    const myRank = await getUserRank(req.user.id, {
      scope,
      city: city || user?.city,
      state: state || user?.state,
    });

    return success(res, {
      ...result,
      myRank,
      totalPages: Math.ceil(result.total / limitNum),
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /gamification/rewards ───────────────────────────────────────────────

async function getRewards(req, res, next) {
  try {
    const { category } = req.query;

    const where = { active: true };
    if (category) where.category = category.toUpperCase();

    const rewards = await prisma.reward.findMany({
      where,
      orderBy: { coinCost: 'asc' },
    });

    // Get user's current balance
    const wallet = await getOrCreateWallet(req.user.id);

    return success(res, {
      rewards: rewards.map((r) => ({
        ...r,
        canAfford: wallet.balance >= r.coinCost,
        inStock: r.stock === -1 || r.stock > 0,
      })),
      balance: wallet.balance,
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /gamification/rewards/:id/redeem ───────────────────────────────────

async function redeem(req, res, next) {
  try {
    const { id } = req.params;

    const redemption = await redeemReward(req.user.id, id);

    return success(res, redemption, 201);
  } catch (err) {
    if (err.message === 'INSUFFICIENT_BALANCE') {
      return error(res, 'Not enough coins to redeem this reward.', 400);
    }
    if (err.message === 'REWARD_NOT_FOUND') {
      return error(res, 'Reward not found.', 404);
    }
    if (err.message === 'REWARD_INACTIVE') {
      return error(res, 'This reward is no longer available.', 400);
    }
    if (err.message === 'OUT_OF_STOCK') {
      return error(res, 'This reward is out of stock.', 400);
    }
    next(err);
  }
}

// ─── GET /gamification/profile ───────────────────────────────────────────────

async function profile(req, res, next) {
  try {
    const data = await getProfile(req.user.id);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, phone: true, city: true, state: true, createdAt: true },
    });

    // Get user's overall rank
    const myRank = await getUserRank(req.user.id);

    return success(res, {
      user,
      rank: myRank,
      ...data,
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /gamification/my-redemptions ────────────────────────────────────────

async function getMyRedemptions(req, res, next) {
  try {
    const redemptions = await prisma.redemption.findMany({
      where: { userId: req.user.id },
      include: {
        reward: {
          select: { name: true, partner: true, description: true, category: true, imageUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(res, redemptions);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getWallet,
  getBadges,
  leaderboard,
  getRewards,
  redeem,
  profile,
  getMyRedemptions,
};
