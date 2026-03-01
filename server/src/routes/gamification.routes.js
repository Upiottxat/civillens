const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  getWallet,
  getBadges,
  leaderboard,
  getRewards,
  redeem,
  profile,
  getMyRedemptions,
} = require('../controllers/gamification.controller');

const router = Router();

// All gamification routes require authentication
router.use(authenticate);

// ─── Coin wallet ─────────────────────────────────────────────────────────────
router.get('/wallet', getWallet);

// ─── Badges ──────────────────────────────────────────────────────────────────
router.get('/badges', getBadges);

// ─── Leaderboard ─────────────────────────────────────────────────────────────
router.get('/leaderboard', leaderboard);

// ─── Rewards ─────────────────────────────────────────────────────────────────
router.get('/rewards', getRewards);
router.post('/rewards/:id/redeem', redeem);
router.get('/my-redemptions', getMyRedemptions);

// ─── Full profile ────────────────────────────────────────────────────────────
router.get('/profile', profile);

module.exports = router;
