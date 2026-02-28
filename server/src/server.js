const config = require('./config');
const app = require('./app');
const { startSLAChecker } = require('./jobs/sla-checker.job');

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`\n🚀 CiviLens API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Health check: http://localhost:${PORT}/api/v1/health\n`);

  // Start background jobs
  startSLAChecker();
});
