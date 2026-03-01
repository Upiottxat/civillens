const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const authAuthorityRoutes = require('./routes/auth.authority.routes');
const complaintsRoutes = require('./routes/complaints.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const classifyRoutes = require('./routes/classify.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const gamificationRoutes = require('./routes/gamification.routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ─── Production hardening ───────────────────────────────────────────────────

// Trust Railway's reverse proxy so req.ip / req.protocol are correct
app.set('trust proxy', 1);

// Security headers (HSTS, X-Content-Type, X-Frame, etc.)
app.use(helmet());

// Disable X-Powered-By header (redundant with helmet but explicit)
app.disable('x-powered-by');

// Gzip / Brotli compression for all responses
app.use(compression());

// ─── CORS ────────────────────────────────────────────────────────────────────

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  : [];

app.use(
  cors({
    origin:
      allowedOrigins.length === 0 || allowedOrigins.includes('*')
        ? true // reflect request origin (safer than literal '*' with credentials)
        : allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ─── Body parsers ────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate limiting ───────────────────────────────────────────────────────────

// Global: 200 requests / 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests — please try again later.',
  },
});

// Auth: 10 OTP requests / 15 min per IP (anti-abuse)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many OTP requests. Please wait before trying again.',
  },
});

// Redeem: 5 redemptions / 15 min per IP
const redeemLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many redemption attempts. Please wait.',
  },
});

app.use('/api/v1', globalLimiter);

// ─── Health check ───────────────────────────────────────────────────────────

app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      version: process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    },
  });
});

// ─── API routes ─────────────────────────────────────────────────────────────

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/auth/authority', authLimiter, authAuthorityRoutes);
app.use('/api/v1/complaints', complaintsRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/classify', classifyRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/gamification', gamificationRoutes);

// Apply redeem limiter specifically
app.use('/api/v1/gamification/rewards', redeemLimiter);

// ─── 404 handler ────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.url} not found.`,
  });
});

// ─── Global error handler (must be last) ────────────────────────────────────

app.use(errorHandler);

module.exports = app;
