const { prisma } = require('../lib/prisma');
const { success, error } = require('../utils/response');

/**
 * GET /api/v1/notifications
 * Returns status history entries for all of the authenticated citizen's complaints.
 * Essentially: "things that happened to your issues."
 */
async function getMyNotifications(req, res, next) {
  try {
    const userId = req.user.id;

    // Get all complaint IDs owned by this citizen
    const complaints = await prisma.complaint.findMany({
      where: { citizenId: userId },
      select: { id: true, issueType: true, locationLabel: true },
    });

    if (complaints.length === 0) {
      return success(res, []);
    }

    const complaintIds = complaints.map((c) => c.id);

    // Fetch status history for all those complaints (newest first)
    const history = await prisma.statusHistory.findMany({
      where: {
        complaintId: { in: complaintIds },
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Latest 50 notifications
      include: {
        complaint: {
          select: {
            id: true,
            issueType: true,
            locationLabel: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    // Transform into a notification-friendly shape
    const notifications = history.map((entry) => {
      const complaint = entry.complaint;
      const typeInfo = getNotificationType(entry.status);

      return {
        id: entry.id,
        title: typeInfo.title,
        body: entry.note || `Status changed to ${entry.status.replace(/_/g, ' ')}`,
        ticketId: formatTicketId(complaint.id),
        time: entry.createdAt,
        type: typeInfo.type,
        icon: typeInfo.icon,
        iconBg: typeInfo.iconBg,
        read: isOlderThan24Hours(entry.createdAt),
        issueId: complaint.id,
        issueType: complaint.issueType,
        locationLabel: complaint.locationLabel,
      };
    });

    return success(res, notifications);
  } catch (err) {
    next(err);
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getNotificationType(status) {
  const map = {
    SUBMITTED: {
      title: 'Issue Registered',
      type: 'success',
      icon: '✅',
      iconBg: '#F0FDF4',
    },
    ASSIGNED: {
      title: 'Issue Assigned',
      type: 'assigned',
      icon: '👤',
      iconBg: '#EFF6FF',
    },
    IN_PROGRESS: {
      title: 'Work In Progress',
      type: 'info',
      icon: '🔧',
      iconBg: '#F0FDF4',
    },
    RESOLVED: {
      title: 'Issue Resolved',
      type: 'success',
      icon: '✅',
      iconBg: '#F0FDF4',
    },
    CLOSED: {
      title: 'Issue Closed',
      type: 'success',
      icon: '🏁',
      iconBg: '#F0FDF4',
    },
    BREACHED: {
      title: 'SLA Breached',
      type: 'breach',
      icon: '🚨',
      iconBg: '#FEF2F2',
    },
  };

  return map[status] || { title: 'Status Update', type: 'info', icon: 'ℹ️', iconBg: '#F8FAFF' };
}

function isOlderThan24Hours(date) {
  const diff = Date.now() - new Date(date).getTime();
  return diff > 24 * 60 * 60 * 1000;
}

function formatTicketId(id) {
  const short = id.replace(/-/g, '').slice(0, 8).toUpperCase();
  return `#CVL-${short}`;
}

module.exports = { getMyNotifications };
