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
 * Uses _count aggregations — avoids loading all complaints into memory.
 */
async function getSLAStats(req, res, next) {
  try {
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { complaints: true },
        },
      },
    });

    // Parallel count queries per department — much lighter than include
    const stats = await Promise.all(
      departments.map(async (dept) => {
        const total = dept._count.complaints;

        if (total === 0) {
          return {
            departmentId: dept.id,
            departmentName: dept.name,
            totalComplaints: 0,
            breachedCount: 0,
            resolvedCount: 0,
            slaComplianceRate: 100,
            resolutionRate: 0,
          };
        }

        const [breachedCount, resolvedCount] = await Promise.all([
          prisma.complaint.count({
            where: { departmentId: dept.id, slaBreached: true },
          }),
          prisma.complaint.count({
            where: {
              departmentId: dept.id,
              status: { in: ['RESOLVED', 'CLOSED'] },
            },
          }),
        ]);

        return {
          departmentId: dept.id,
          departmentName: dept.name,
          totalComplaints: total,
          breachedCount,
          resolvedCount,
          slaComplianceRate: Math.round(((total - breachedCount) / total) * 100),
          resolutionRate: Math.round((resolvedCount / total) * 100),
        };
      })
    );

    return success(res, stats);
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary, getSLAStats };
