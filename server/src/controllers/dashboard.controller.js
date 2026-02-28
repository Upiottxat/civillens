const { prisma } = require('../lib/prisma');
const { success } = require('../utils/response');

/**
 * GET /api/v1/dashboard/summary
 * Returns aggregate counts for the authority dashboard.
 */
async function getSummary(req, res, next) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalOpen,
      totalBreached,
      totalCritical,
      resolvedToday,
      totalComplaints,
      totalResolved,
    ] = await Promise.all([
      prisma.complaint.count({
        where: {
          status: { notIn: ['RESOLVED', 'CLOSED'] },
        },
      }),
      prisma.complaint.count({
        where: { slaBreached: true },
      }),
      prisma.complaint.count({
        where: {
          severity: 'CRITICAL',
          status: { notIn: ['RESOLVED', 'CLOSED'] },
        },
      }),
      prisma.complaint.count({
        where: {
          resolvedAt: { gte: todayStart },
        },
      }),
      prisma.complaint.count(),
      prisma.complaint.count({
        where: { status: { in: ['RESOLVED', 'CLOSED'] } },
      }),
    ]);

    return success(res, {
      totalOpen,
      totalBreached,
      totalCritical,
      resolvedToday,
      totalComplaints,
      totalResolved,
      resolutionRate:
        totalComplaints > 0
          ? Math.round((totalResolved / totalComplaints) * 100)
          : 0,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/dashboard/sla-stats
 * Returns per-department SLA compliance percentage.
 */
async function getSLAStats(req, res, next) {
  try {
    const departments = await prisma.department.findMany({
      include: {
        complaints: {
          select: {
            id: true,
            slaBreached: true,
            status: true,
          },
        },
      },
    });

    const stats = departments.map((dept) => {
      const total = dept.complaints.length;
      const breached = dept.complaints.filter((c) => c.slaBreached).length;
      const resolved = dept.complaints.filter(
        (c) => c.status === 'RESOLVED' || c.status === 'CLOSED'
      ).length;

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        totalComplaints: total,
        breachedCount: breached,
        resolvedCount: resolved,
        slaComplianceRate:
          total > 0 ? Math.round(((total - breached) / total) * 100) : 100,
        resolutionRate:
          total > 0 ? Math.round((resolved / total) * 100) : 0,
      };
    });

    return success(res, stats);
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary, getSLAStats };
