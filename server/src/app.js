const express = require('express');
const cors = require('cors');

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

// Disable X-Powered-By header (security)
app.disable('x-powered-by');

// ─── Global middleware ──────────────────────────────────────────────────────

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['*'];

app.use(cors({
  origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ───────────────────────────────────────────────────────────

app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      version: process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// ─── API routes ─────────────────────────────────────────────────────────────

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auth/authority', authAuthorityRoutes);
app.use('/api/v1/complaints', complaintsRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/classify', classifyRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/gamification', gamificationRoutes);

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
