const config = require('./config');
const app = require('./app');
const { prisma } = require('./lib/prisma');
const { startSLAChecker } = require('./jobs/sla-checker.job');

const PORT = config.port;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`CiviLens API running on port ${PORT} [${config.nodeEnv}]`);
  startSLAChecker();
});

// ─── Graceful shutdown ─────────────────────────────────────────────────────
// Railway / Docker sends SIGTERM before killing the container.
// We close open connections so in-flight requests finish cleanly.

function gracefulShutdown(signal) {
  console.log(`Received ${signal}. Shutting down gracefully...`);

  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Database disconnected.');
    process.exit(0);
  });

  // Force-kill after 10s if connections don't drain
  setTimeout(() => {
    console.error('Could not close in time - forcing exit.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ─── Uncaught error handlers ────────────────────────────────────────────────
// Prevent silent crashes — log and exit cleanly so Railway can restart.

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled promise rejection:', reason);
  gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err);
  process.exit(1);
});
