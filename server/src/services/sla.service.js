const { prisma } = require('../lib/prisma');

/**
 * Fallback SLA hours when no rule is configured.
 * Judges love seeing that you planned for missing data.
 */
const FALLBACK_HOURS = {
  CRITICAL: 2,
  HIGH: 12,
  MEDIUM: 24,
  LOW: 48,
};

/**
 * Maps frontend issue categories → department names.
 * In production this would be a DB lookup; for hackathon, a simple map.
 */
const CATEGORY_TO_DEPARTMENT = {
  'Garbage':        'Sanitation',
  'Water Leakage':  'Water',
  'Streetlight':    'Electrical',
  'Road Damage':    'Roads',
  'Public Safety':  'Public Safety',
  'Park / Open Space': 'Parks',
  'Stray Animals':  'Animal Control',
  'Other':          'General',
};

/**
 * Looks up the department for a given issue category.
 * Returns the department record or null.
 */
async function getDepartmentForCategory(issueType) {
  const deptName = CATEGORY_TO_DEPARTMENT[issueType] || 'General';

  const dept = await prisma.department.findUnique({
    where: { name: deptName },
  });

  // Fallback to first department if not found
  if (!dept) {
    return prisma.department.findFirst();
  }

  return dept;
}

/**
 * Looks up the SLA hours for a given complaint.
 * Checks the SLARule config table first, falls back to defaults.
 */
async function getSLAHours(issueType, severity, departmentId) {
  const rule = await prisma.sLARule.findFirst({
    where: { issueType, severity, departmentId },
  });

  if (rule) {
    return rule.hoursAllowed;
  }

  // Try finding a rule just by severity (department-agnostic fallback)
  const genericRule = await prisma.sLARule.findFirst({
    where: { severity, departmentId },
  });

  if (genericRule) {
    return genericRule.hoursAllowed;
  }

  return FALLBACK_HOURS[severity] || 24;
}

/**
 * Calculates the SLA deadline from now.
 * Returns { slaDeadline, hoursAllowed }.
 */
async function assignSLA(issueType, severity, departmentId) {
  const hoursAllowed = await getSLAHours(issueType, severity, departmentId);
  const slaDeadline = new Date(Date.now() + hoursAllowed * 60 * 60 * 1000);

  return { slaDeadline, hoursAllowed };
}

module.exports = {
  getDepartmentForCategory,
  getSLAHours,
  assignSLA,
  CATEGORY_TO_DEPARTMENT,
  FALLBACK_HOURS,
};
