const cron = require('node-cron');
const { prisma } = require('../lib/prisma');

/**
 * SLA Breach Checker — runs every 5 minutes.
 *
 * Finds open complaints past their SLA deadline and auto-flags them as BREACHED.
 * This is the "standing ovation moment" during demos: the system itself
 * enforces accountability, not just the UI.
 */
function startSLAChecker() {
  // Every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();

      // Find all open complaints past their deadline
      const breached = await prisma.complaint.findMany({
        where: {
          slaBreached: false,
          resolvedAt: null,
          slaDeadline: { lt: now },
          status: { notIn: ['RESOLVED', 'CLOSED'] },
        },
      });

      if (breached.length === 0) {
        return; // Nothing to do — keep logs clean
      }

      // Update each breached complaint in a transaction
      for (const complaint of breached) {
        await prisma.$transaction(async (tx) => {
          await tx.complaint.update({
            where: { id: complaint.id },
            data: {
              slaBreached: true,
              status: 'BREACHED',
            },
          });

          await tx.statusHistory.create({
            data: {
              complaintId: complaint.id,
              status: 'BREACHED',
              note: 'SLA deadline exceeded — auto-flagged by system.',
              changedById: 'system',
            },
          });
        });
      }

      console.log(
        `[SLA Checker] ${breached.length} complaint(s) flagged as BREACHED at ${now.toISOString()}`
      );
    } catch (err) {
      console.error('[SLA Checker] Error:', err.message);
    }
  });

  console.log('[SLA Checker] Cron job started — checking every 5 minutes.');
}

module.exports = { startSLAChecker };
