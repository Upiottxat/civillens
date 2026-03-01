const { prisma } = require('../lib/prisma');
const { success, error, paginated } = require('../utils/response');
const { getDepartmentForCategory, assignSLA } = require('../services/sla.service');
const { calculatePriorityScore } = require('../services/priority.service');
const { onComplaintSubmitted, onComplaintResolved } = require('../services/gamification.service');

// ─── Citizen endpoints ──────────────────────────────────────────────────────

/**
 * POST /api/v1/complaints
 * Citizen submits a new complaint.
 * Triggers: department lookup → SLA assignment → priority scoring.
 */
async function submitComplaint(req, res, next) {
  try {
    const {
      issueType,
      description,
      imageUrl,
      latitude,
      longitude,
      locationLabel,
      severity,
    } = req.body;

    // Validate required fields
    if (!issueType || latitude == null || longitude == null || !severity) {
      return error(res, 'issueType, latitude, longitude, and severity are required.');
    }

    // Validate severity enum
    const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const normalizedSeverity = severity.toUpperCase();
    if (!validSeverities.includes(normalizedSeverity)) {
      return error(res, `severity must be one of: ${validSeverities.join(', ')}`);
    }

    // 1. Resolve department
    const department = await getDepartmentForCategory(issueType);
    if (!department) {
      return error(res, 'Unable to determine department for this issue type.', 500);
    }

    // 2. Calculate priority score
    const priority = await calculatePriorityScore({
      severity: normalizedSeverity,
      latitude,
      longitude,
      issueType,
    });

    // 3. Assign SLA
    const { slaDeadline, hoursAllowed } = await assignSLA(
      issueType,
      normalizedSeverity,
      department.id
    );

    // 4. Create complaint + initial status history in a transaction
    const complaint = await prisma.$transaction(async (tx) => {
      const created = await tx.complaint.create({
        data: {
          citizenId: req.user.id,
          departmentId: department.id,
          issueType,
          description: description || null,
          imageUrl: imageUrl || null,
          latitude,
          longitude,
          locationLabel: locationLabel || null,
          severity: normalizedSeverity,
          priorityScore: priority.score,
          priorityBreakdown: priority.breakdown,
          slaDeadline,
        },
      });

      // Log initial status
      await tx.statusHistory.create({
        data: {
          complaintId: created.id,
          status: 'SUBMITTED',
          note: `Complaint submitted. SLA: ${hoursAllowed}h. Priority: ${priority.score}/100.`,
          changedById: req.user.id,
        },
      });

      return created;
    });

    // 5. Award gamification coins (fire-and-forget — don't block response)
    let coinsAwarded = [];
    try {
      coinsAwarded = await onComplaintSubmitted(req.user.id, complaint.id, !!imageUrl);
    } catch (coinErr) {
      console.error('[Gamification] Failed to award coins on submit:', coinErr.message);
    }

    return success(
      res,
      {
        complaint,
        priority: priority.breakdown,
        sla: { deadline: slaDeadline, hoursAllowed },
        department: { id: department.id, name: department.name },
        coinsAwarded,
      },
      201
    );
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/complaints/mine
 * Returns the authenticated citizen's own complaints.
 */
async function getMyComplaints(req, res, next) {
  try {
    const complaints = await prisma.complaint.findMany({
      where: { citizenId: req.user.id },
      include: {
        department: { select: { id: true, name: true } },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(res, complaints);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/complaints/:id
 * Returns a single complaint with full status history and priority breakdown.
 */
async function getComplaintById(req, res, next) {
  try {
    const { id } = req.params;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        citizen: { select: { id: true, name: true, phone: true } },
        department: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!complaint) {
      return error(res, 'Complaint not found.', 404);
    }

    return success(res, complaint);
  } catch (err) {
    next(err);
  }
}

// ─── Authority endpoints ────────────────────────────────────────────────────

/**
 * GET /api/v1/complaints
 * Returns all complaints with filters + pagination.
 * Query params: status, severity, departmentId, slaBreached, page, limit
 */
async function getAllComplaints(req, res, next) {
  try {
    const {
      status,
      severity,
      departmentId,
      slaBreached,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const where = {};

    if (status) {
      where.status = status.toUpperCase();
    }

    if (severity) {
      where.severity = severity.toUpperCase();
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (slaBreached !== undefined) {
      where.slaBreached = slaBreached === 'true';
    }

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: {
          citizen: { select: { id: true, name: true, phone: true } },
          department: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
        },
        orderBy: [
          { slaBreached: 'desc' },
          { priorityScore: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limitNum,
      }),
      prisma.complaint.count({ where }),
    ]);

    return paginated(res, complaints, {
      page: pageNum,
      limit: limitNum,
      total,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/complaints/:id/status
 * Authority updates complaint status + optional note.
 * Always logs to StatusHistory.
 */
async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status: newStatus, note } = req.body;

    if (!newStatus) {
      return error(res, 'status is required.');
    }

    const validStatuses = ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'BREACHED'];
    const normalized = newStatus.toUpperCase();
    if (!validStatuses.includes(normalized)) {
      return error(res, `status must be one of: ${validStatuses.join(', ')}`);
    }

    const existing = await prisma.complaint.findUnique({ where: { id } });
    if (!existing) {
      return error(res, 'Complaint not found.', 404);
    }

    const updateData = { status: normalized };

    // Set resolvedAt when resolving
    if (normalized === 'RESOLVED' || normalized === 'CLOSED') {
      updateData.resolvedAt = new Date();
    }

    const updated = await prisma.$transaction(async (tx) => {
      const complaint = await tx.complaint.update({
        where: { id },
        data: updateData,
      });

      await tx.statusHistory.create({
        data: {
          complaintId: id,
          status: normalized,
          note: note || null,
          changedById: req.user.id,
        },
      });

      return complaint;
    });

    // Award coins when complaint is resolved
    if (normalized === 'RESOLVED' || normalized === 'CLOSED') {
      try {
        await onComplaintResolved(updated);
      } catch (coinErr) {
        console.error('[Gamification] Failed to award coins on resolve:', coinErr.message);
      }
    }

    return success(res, updated);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/complaints/:id/proof
 * Authority uploads proof-of-resolution image URL.
 */
async function uploadProof(req, res, next) {
  try {
    const { id } = req.params;
    const { proofImageUrl } = req.body;

    if (!proofImageUrl) {
      return error(res, 'proofImageUrl is required.');
    }

    const existing = await prisma.complaint.findUnique({ where: { id } });
    if (!existing) {
      return error(res, 'Complaint not found.', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const complaint = await tx.complaint.update({
        where: { id },
        data: { proofImageUrl },
      });

      await tx.statusHistory.create({
        data: {
          complaintId: id,
          status: existing.status,
          note: 'Proof of resolution uploaded.',
          changedById: req.user.id,
        },
      });

      return complaint;
    });

    return success(res, updated);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/complaints/:id/assign
 * Assign a complaint to an authority officer.
 */
async function assignComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const { assignedToId } = req.body;

    if (!assignedToId) {
      return error(res, 'assignedToId is required.');
    }

    const existing = await prisma.complaint.findUnique({ where: { id } });
    if (!existing) {
      return error(res, 'Complaint not found.', 404);
    }

    // Verify the assignee exists and is an authority
    const assignee = await prisma.user.findUnique({
      where: { id: assignedToId },
    });

    if (!assignee) {
      return error(res, 'Assignee user not found.', 404);
    }

    if (assignee.role !== 'AUTHORITY' && assignee.role !== 'ADMIN') {
      return error(res, 'Can only assign to AUTHORITY or ADMIN users.');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const complaint = await tx.complaint.update({
        where: { id },
        data: {
          assignedToId,
          status: 'ASSIGNED',
        },
      });

      await tx.statusHistory.create({
        data: {
          complaintId: id,
          status: 'ASSIGNED',
          note: `Assigned to ${assignee.name || assignee.phone}.`,
          changedById: req.user.id,
        },
      });

      return complaint;
    });

    return success(res, updated);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  submitComplaint,
  getMyComplaints,
  getComplaintById,
  getAllComplaints,
  updateStatus,
  uploadProof,
  assignComplaint,
};
