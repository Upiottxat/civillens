const cron = require('node-cron');
const { prisma } = require('../lib/prisma');
const { onSLABreached } = require('../services/gamification.service');

/**
 * SLA Breach Checker — runs every 5 minutes.
 *
 * Finds open complaints past their SLA deadline and auto-flags them as BREACHED.
 * Awards citizens coins for holding authorities accountable.
 */
function startSLAChecker() {
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

      if (breached.length === 0) return;

      // Batch update all breached complaints in a single transaction
      await prisma.$transaction(async (tx) => {
        for (const complaint of breached) {
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
        }
      });

      // Award coins to citizens whose complaints were breached (fire-and-forget)
      for (const complaint of breached) {
        try {
          await onSLABreached(complaint);
        } catch (err) {
          console.error(`[SLA Checker] Failed to award breach coins for ${complaint.id}:`, err.message);
        }
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
