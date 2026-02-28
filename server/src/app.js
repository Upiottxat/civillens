const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const complaintsRoutes = require('./routes/complaints.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const classifyRoutes = require('./routes/classify.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ─── Global middleware ──────────────────────────────────────────────────────

app.use(cors({
  origin: '*', // In production, lock this down
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ───────────────────────────────────────────────────────────

app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// ─── API routes ─────────────────────────────────────────────────────────────

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/complaints', complaintsRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/classify', classifyRoutes);
app.use('/api/v1/notifications', notificationsRoutes);

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
