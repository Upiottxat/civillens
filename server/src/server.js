const config = require('./config');
const app = require('./app');
const { prisma } = require('./lib/prisma');
const { startSLAChecker } = require('./jobs/sla-checker.job');

const PORT = config.port;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 CiviLens API running on http://0.0.0.0:${PORT}`);
  console.log(`   Environment : ${config.nodeEnv}`);
  console.log(`   Health check: http://localhost:${PORT}/api/v1/health\n`);

  // Start background jobs
  startSLAChecker();
});

// ─── Graceful shutdown ─────────────────────────────────────────────────────
// Railway / Docker sends SIGTERM before killing the container.
// We close open connections so in-flight requests finish cleanly.

function gracefulShutdown(signal) {
  console.log(`\n⏻  Received ${signal}. Shutting down gracefully…`);

  server.close(async () => {
    console.log('   HTTP server closed.');
    await prisma.$disconnect();
    console.log('   Database disconnected.');
    process.exit(0);
  });

  // Force-kill after 10 s if connections don't drain
  setTimeout(() => {
    console.error('   Could not close in time — forcing exit.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
