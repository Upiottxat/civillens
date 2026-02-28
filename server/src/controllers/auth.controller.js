const jwt = require('jsonwebtoken');
const config = require('../config');
const { prisma } = require('../lib/prisma');
const { success, error } = require('../utils/response');

// In-memory OTP store (demo only — in production, use Redis or SMS provider)
const otpStore = new Map();

/**
 * POST /api/v1/auth/send-otp
 * Accepts { phone }, stores a mocked OTP (123456).
 */
async function sendOtp(req, res, next) {
  try {
    const { phone } = req.body;

    if (!phone || phone.length !== 10) {
      return error(res, 'Please provide a valid 10-digit phone number.');
    }

    // Store the mocked OTP
    otpStore.set(phone, {
      otp: config.mockOtp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
    });

    console.log(`[OTP] Sent ${config.mockOtp} to ${phone} (mocked)`);

    return success(res, {
      message: 'OTP sent successfully.',
      // Include OTP in dev mode so the mobile app can auto-fill
      ...(config.nodeEnv === 'development' && { otp: config.mockOtp }),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/verify-otp
 * Accepts { phone, otp }, returns JWT + user.
 */
async function verifyOtp(req, res, next) {
  try {
    const { phone, otp, name } = req.body;

    if (!phone || !otp) {
      return error(res, 'Phone and OTP are required.');
    }

    const stored = otpStore.get(phone);

    if (!stored) {
      return error(res, 'OTP not found. Please request a new one.');
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(phone);
      return error(res, 'OTP expired. Please request a new one.');
    }

    if (stored.otp !== otp) {
      return error(res, 'Invalid OTP.');
    }

    // OTP valid — clear it
    otpStore.delete(phone);

    // Upsert user (create if first login)
    const user = await prisma.user.upsert({
      where: { phone },
      update: {
        ...(name && { name }),
      },
      create: {
        phone,
        name: name || null,
        role: 'CITIZEN',
      },
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return success(res, {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/auth/me
 * Returns the current authenticated user from JWT.
 */
async function getMe(req, res, next) {
  try {
    return success(res, {
      id: req.user.id,
      phone: req.user.phone,
      name: req.user.name,
      role: req.user.role,
      createdAt: req.user.createdAt,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { sendOtp, verifyOtp, getMe };
