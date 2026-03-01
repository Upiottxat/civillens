const jwt = require('jsonwebtoken');
const config = require('../config');
const { prisma } = require('../lib/prisma');
const { success, error } = require('../utils/response');

// ─── Twilio setup ────────────────────────────────────────────────────────────
// Only initialize if credentials are present and enabled
let twilioClient = null;

if (config.twilio.enabled && config.twilio.accountSid && config.twilio.authToken) {
  const twilio = require('twilio');
  twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
  console.log('📲 Twilio OTP enabled (Verify API)');
} else {
  console.log('📲 Twilio OTP disabled — using mocked OTP (123456)');
}

// In-memory OTP store (used only when Twilio is disabled / demo mode)
const otpStore = new Map();

/**
 * POST /api/v1/auth/send-otp
 * Accepts { phone }.
 *
 * If Twilio is enabled:
 *   → Sends a real OTP via Twilio Verify API to +91<phone>.
 * If Twilio is disabled:
 *   → Stores mocked OTP (123456) in memory.
 */
async function sendOtp(req, res, next) {
  try {
    const { phone } = req.body;

    if (!phone || phone.length !== 10) {
      return error(res, 'Please provide a valid 10-digit phone number.');
    }

    // ── Twilio path ──
    if (twilioClient && config.twilio.verifyServiceSid) {
      try {
        const verification = await twilioClient.verify.v2
          .services(config.twilio.verifyServiceSid)
          .verifications.create({
            to: `+91${phone}`,
            channel: 'sms', // 'sms' or 'call'
          });

        console.log(`[Twilio] OTP sent to +91${phone} — status: ${verification.status}`);

        return success(res, {
          message: 'OTP sent to your phone via SMS.',
          channel: 'sms',
          status: verification.status,
        });
      } catch (twilioErr) {
        console.error('[Twilio] Send OTP failed:', twilioErr.message);

        // If Twilio fails, fall back to mock in dev mode
        if (config.nodeEnv === 'development') {
          console.log('[Twilio] Falling back to mocked OTP in development mode');
          return sendMockedOtp(phone, res);
        }

        return error(res, 'Failed to send OTP. Please try again later.', 500);
      }
    }

    // ── Mock path (demo / no Twilio) ──
    // Block mock OTP in production to prevent abuse
    if (config.nodeEnv === 'production') {
      return error(res, 'OTP service is not configured. Contact support.', 503);
    }
    return sendMockedOtp(phone, res);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/verify-otp
 * Accepts { phone, otp, name }.
 *
 * If Twilio is enabled:
 *   → Verifies OTP via Twilio Verify API.
 * If Twilio is disabled:
 *   → Checks against in-memory mock store.
 *
 * On success: upserts user, returns JWT + user object.
 */
async function verifyOtp(req, res, next) {
  try {
    const { phone, otp, name } = req.body;

    if (!phone || !otp) {
      return error(res, 'Phone and OTP are required.');
    }

    // ── Twilio path ──
    if (twilioClient && config.twilio.verifyServiceSid) {
      try {
        const verificationCheck = await twilioClient.verify.v2
          .services(config.twilio.verifyServiceSid)
          .verificationChecks.create({
            to: `+91${phone}`,
            code: otp,
          });

        console.log(`[Twilio] Verify +91${phone} — status: ${verificationCheck.status}`);

        if (verificationCheck.status !== 'approved') {
          return error(res, 'Invalid OTP. Please check and try again.');
        }
      } catch (twilioErr) {
        console.error('[Twilio] Verify OTP failed:', twilioErr.message);

        // In dev, allow mock fallback
        if (config.nodeEnv === 'development') {
          console.log('[Twilio] Falling back to mock verification in dev');
          const mockOk = verifyMockedOtp(phone, otp);
          if (!mockOk) return error(res, 'Invalid OTP.');
        } else {
          return error(res, 'OTP verification failed. Please try again.', 500);
        }
      }
    } else {
      // ── Mock path (blocked in production) ──
      if (config.nodeEnv === 'production') {
        return error(res, 'OTP service is not configured. Contact support.', 503);
      }
      const mockOk = verifyMockedOtp(phone, otp);
      if (!mockOk) return error(res, mockOk === null ? 'OTP not found. Request a new one.' : 'Invalid OTP.');
    }

    // ── OTP is valid — upsert user & issue JWT ──
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
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      department: req.user.department,
      designation: req.user.designation,
      createdAt: req.user.createdAt,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Mock helpers (used when Twilio is disabled) ─────────────────────────────

function sendMockedOtp(phone, res) {
  otpStore.set(phone, {
    otp: config.mockOtp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
  });

  console.log(`[Mock] OTP ${config.mockOtp} stored for ${phone}`);

  return success(res, {
    message: 'OTP sent successfully.',
    // Include OTP in response during development for easy testing
    ...(config.nodeEnv === 'development' && { otp: config.mockOtp }),
  });
}

/**
 * Returns true if OTP is valid, false if invalid, null if not found / expired.
 */
function verifyMockedOtp(phone, otp) {
  const stored = otpStore.get(phone);

  if (!stored) return null;

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(phone);
    return null;
  }

  if (stored.otp !== otp) return false;

  // Valid — clean up
  otpStore.delete(phone);
  return true;
}

module.exports = { sendOtp, verifyOtp, getMe };
