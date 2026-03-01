const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CiviLens database...\n');

  // ─── 1. Departments ────────────────────────────────────────────────────────

  const departments = await Promise.all(
    [
      'Water',
      'Roads',
      'Sanitation',
      'Electrical',
      'Public Safety',
      'Parks',
      'Animal Control',
      'General',
    ].map((name) =>
      prisma.department.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  const deptMap = Object.fromEntries(departments.map((d) => [d.name, d.id]));
  console.log(`✅ ${departments.length} departments created`);

  // ─── 2. SLA Rules ──────────────────────────────────────────────────────────

  const slaRules = [
    // Water
    { dept: 'Water', issueType: 'Water Leakage', severity: 'CRITICAL', hours: 2 },
    { dept: 'Water', issueType: 'Water Leakage', severity: 'HIGH', hours: 6 },
    { dept: 'Water', issueType: 'Water Leakage', severity: 'MEDIUM', hours: 24 },
    { dept: 'Water', issueType: 'Water Leakage', severity: 'LOW', hours: 48 },
    // Roads
    { dept: 'Roads', issueType: 'Road Damage', severity: 'CRITICAL', hours: 4 },
    { dept: 'Roads', issueType: 'Road Damage', severity: 'HIGH', hours: 12 },
    { dept: 'Roads', issueType: 'Road Damage', severity: 'MEDIUM', hours: 48 },
    { dept: 'Roads', issueType: 'Road Damage', severity: 'LOW', hours: 72 },
    // Sanitation
    { dept: 'Sanitation', issueType: 'Garbage', severity: 'CRITICAL', hours: 2 },
    { dept: 'Sanitation', issueType: 'Garbage', severity: 'HIGH', hours: 8 },
    { dept: 'Sanitation', issueType: 'Garbage', severity: 'MEDIUM', hours: 24 },
    { dept: 'Sanitation', issueType: 'Garbage', severity: 'LOW', hours: 48 },
    // Electrical
    { dept: 'Electrical', issueType: 'Streetlight', severity: 'CRITICAL', hours: 2 },
    { dept: 'Electrical', issueType: 'Streetlight', severity: 'HIGH', hours: 12 },
    { dept: 'Electrical', issueType: 'Streetlight', severity: 'MEDIUM', hours: 24 },
    { dept: 'Electrical', issueType: 'Streetlight', severity: 'LOW', hours: 48 },
    // Public Safety
    { dept: 'Public Safety', issueType: 'Public Safety', severity: 'CRITICAL', hours: 1 },
    { dept: 'Public Safety', issueType: 'Public Safety', severity: 'HIGH', hours: 4 },
    { dept: 'Public Safety', issueType: 'Public Safety', severity: 'MEDIUM', hours: 12 },
    { dept: 'Public Safety', issueType: 'Public Safety', severity: 'LOW', hours: 24 },
    // Parks
    { dept: 'Parks', issueType: 'Park / Open Space', severity: 'HIGH', hours: 24 },
    { dept: 'Parks', issueType: 'Park / Open Space', severity: 'MEDIUM', hours: 48 },
    { dept: 'Parks', issueType: 'Park / Open Space', severity: 'LOW', hours: 72 },
    // Animal Control
    { dept: 'Animal Control', issueType: 'Stray Animals', severity: 'CRITICAL', hours: 2 },
    { dept: 'Animal Control', issueType: 'Stray Animals', severity: 'HIGH', hours: 8 },
    { dept: 'Animal Control', issueType: 'Stray Animals', severity: 'MEDIUM', hours: 24 },
    { dept: 'Animal Control', issueType: 'Stray Animals', severity: 'LOW', hours: 48 },
  ];

  for (const rule of slaRules) {
    await prisma.sLARule.upsert({
      where: {
        departmentId_issueType_severity: {
          departmentId: deptMap[rule.dept],
          issueType: rule.issueType,
          severity: rule.severity,
        },
      },
      update: { hoursAllowed: rule.hours },
      create: {
        departmentId: deptMap[rule.dept],
        issueType: rule.issueType,
        severity: rule.severity,
        hoursAllowed: rule.hours,
      },
    });
  }

  console.log(`✅ ${slaRules.length} SLA rules created`);

  // ─── 3. Demo Users ─────────────────────────────────────────────────────────

  // Hash passwords for authority users
  const authorityPassword = await bcrypt.hash('officer123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  const citizen = await prisma.user.upsert({
    where: { phone: '9876543210' },
    update: {},
    create: {
      phone: '9876543210',
      name: 'Priya Sharma',
      role: 'CITIZEN',
    },
  });

  const authority = await prisma.user.upsert({
    where: { phone: '9876543211' },
    update: {
      email: 'officer@gov.in',
      passwordHash: authorityPassword,
      department: 'Roads & Infrastructure',
      designation: 'Ward Engineer',
    },
    create: {
      phone: '9876543211',
      email: 'officer@gov.in',
      passwordHash: authorityPassword,
      name: 'Ravi Shankar',
      role: 'AUTHORITY',
      department: 'Roads & Infrastructure',
      designation: 'Ward Engineer',
    },
  });

  const admin = await prisma.user.upsert({
    where: { phone: '9876543212' },
    update: {
      email: 'admin@gov.in',
      passwordHash: adminPassword,
      department: 'Municipal Corporation',
      designation: 'Commissioner',
    },
    create: {
      phone: '9876543212',
      email: 'admin@gov.in',
      passwordHash: adminPassword,
      name: 'Meera Gupta',
      role: 'ADMIN',
      department: 'Municipal Corporation',
      designation: 'Commissioner',
    },
  });

  console.log('✅ 3 demo users created (citizen, authority, admin)');
  console.log('   Authority login: officer@gov.in / officer123');
  console.log('   Admin login:     admin@gov.in / admin123');

  // ─── 4. Demo Complaints ────────────────────────────────────────────────────

  const now = new Date();

  const complaintData = [
    {
      issueType: 'Streetlight',
      description: 'Broken streetlight on MG Road near sector 14 crossing. The entire stretch is dark at night causing safety concerns.',
      latitude: 28.4595,
      longitude: 77.0266,
      locationLabel: 'MG Road, Sector 14, Gurugram',
      severity: 'HIGH',
      status: 'IN_PROGRESS',
      priorityScore: 72,
      priorityBreakdown: { severity: { points: 30, max: 40, label: 'HIGH' }, zone: { points: 15, max: 25, label: 'Near School Zone' }, population: { points: 17, max: 20 }, duplicates: { points: 10, max: 15, count: 2 } },
      slaDeadline: new Date(now.getTime() + 10 * 60 * 60 * 1000), // 10 hours from now
      departmentName: 'Electrical',
      assignedToId: authority.id,
    },
    {
      issueType: 'Water Leakage',
      description: 'Continuous water leakage near Central Park gate. Water flowing onto the road creating slippery conditions.',
      latitude: 28.6315,
      longitude: 77.2167,
      locationLabel: 'Connaught Place, New Delhi',
      severity: 'HIGH',
      status: 'ASSIGNED',
      priorityScore: 85,
      priorityBreakdown: { severity: { points: 30, max: 40, label: 'HIGH' }, zone: { points: 25, max: 25, label: 'Market Zone — Connaught Place' }, population: { points: 18, max: 20 }, duplicates: { points: 10, max: 15, count: 2 } },
      slaDeadline: new Date(now.getTime() + 28 * 60 * 60 * 1000), // 28 hours from now
      departmentName: 'Water',
      assignedToId: authority.id,
    },
    {
      issueType: 'Road Damage',
      description: 'Large pothole on Ring Road near ITO. Multiple vehicles have been damaged. Urgent fix needed.',
      latitude: 28.6275,
      longitude: 77.2412,
      locationLabel: 'Ring Road, Near ITO, Delhi',
      severity: 'MEDIUM',
      status: 'SUBMITTED',
      priorityScore: 45,
      priorityBreakdown: { severity: { points: 20, max: 40, label: 'MEDIUM' }, zone: { points: 10, max: 25, label: null }, population: { points: 15, max: 20 }, duplicates: { points: 0, max: 15, count: 0 } },
      slaDeadline: new Date(now.getTime() + 60 * 60 * 60 * 1000), // 60 hours from now
      departmentName: 'Roads',
      assignedToId: null,
    },
    {
      issueType: 'Garbage',
      description: 'Overflowing garbage bin at Lajpat Nagar Market entrance. Stray dogs gathering around. Health hazard.',
      latitude: 28.5700,
      longitude: 77.2371,
      locationLabel: 'Lajpat Nagar Market, Delhi',
      severity: 'MEDIUM',
      status: 'RESOLVED',
      priorityScore: 55,
      priorityBreakdown: { severity: { points: 20, max: 40, label: 'MEDIUM' }, zone: { points: 12, max: 25, label: 'Near Hospital Zone — AIIMS' }, population: { points: 13, max: 20 }, duplicates: { points: 10, max: 15, count: 2 } },
      slaDeadline: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago (resolved in time)
      departmentName: 'Sanitation',
      assignedToId: authority.id,
      resolvedAt: new Date(now.getTime() - 18 * 60 * 60 * 1000),
    },
    {
      issueType: 'Park / Open Space',
      description: 'Broken bench in Nehru Park near the walking track. Sharp edges exposed, dangerous for children.',
      latitude: 28.5862,
      longitude: 77.1953,
      locationLabel: 'Nehru Park, New Delhi',
      severity: 'LOW',
      status: 'RESOLVED',
      priorityScore: 28,
      priorityBreakdown: { severity: { points: 10, max: 40, label: 'LOW' }, zone: { points: 8, max: 25, label: null }, population: { points: 10, max: 20 }, duplicates: { points: 0, max: 15, count: 0 } },
      slaDeadline: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      departmentName: 'Parks',
      assignedToId: authority.id,
      resolvedAt: new Date(now.getTime() - 96 * 60 * 60 * 1000),
    },
    {
      issueType: 'Stray Animals',
      description: 'Aggressive stray dog menace near DPS School Road. Children are scared to walk to school. Multiple bite incidents reported.',
      latitude: 28.5631,
      longitude: 77.1727,
      locationLabel: 'DPS School Road, R.K. Puram',
      severity: 'HIGH',
      status: 'BREACHED',
      priorityScore: 91,
      priorityBreakdown: { severity: { points: 30, max: 40, label: 'HIGH' }, zone: { points: 25, max: 25, label: 'School Zone — DPS RK Puram' }, population: { points: 16, max: 20 }, duplicates: { points: 15, max: 15, count: 4 } },
      slaDeadline: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours overdue
      slaBreached: true,
      departmentName: 'Animal Control',
      assignedToId: authority.id,
    },
  ];

  for (const data of complaintData) {
    const dept = departments.find((d) => d.name === data.departmentName);

    const complaint = await prisma.complaint.create({
      data: {
        citizenId: citizen.id,
        departmentId: dept.id,
        issueType: data.issueType,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        locationLabel: data.locationLabel,
        severity: data.severity,
        priorityScore: data.priorityScore,
        priorityBreakdown: data.priorityBreakdown,
        status: data.status,
        slaDeadline: data.slaDeadline,
        slaBreached: data.slaBreached || false,
        assignedToId: data.assignedToId,
        resolvedAt: data.resolvedAt || null,
      },
    });

    // Create status history entries
    const statuses = getStatusTimeline(data.status, data.assignedToId);
    for (const entry of statuses) {
      await prisma.statusHistory.create({
        data: {
          complaintId: complaint.id,
          status: entry.status,
          note: entry.note,
          changedById: entry.byAuthority ? authority.id : citizen.id,
          createdAt: new Date(now.getTime() - entry.hoursAgo * 60 * 60 * 1000),
        },
      });
    }
  }

  console.log(`✅ ${complaintData.length} demo complaints created with status histories`);

  console.log('\n🎉 Seeding complete!\n');
  console.log('Demo credentials:');
  console.log('  Citizen:   phone=9876543210  OTP=123456');
  console.log('  Authority: phone=9876543211  OTP=123456');
  console.log('  Admin:     phone=9876543212  OTP=123456');
}

/**
 * Generates a realistic status history timeline based on current status.
 */
function getStatusTimeline(currentStatus, assignedToId) {
  const timeline = [
    { status: 'SUBMITTED', note: 'Complaint submitted by citizen.', hoursAgo: 120, byAuthority: false },
  ];

  if (['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'BREACHED'].includes(currentStatus)) {
    timeline.push({
      status: 'ASSIGNED',
      note: 'Assigned to ward officer.',
      hoursAgo: 96,
      byAuthority: true,
    });
  }

  if (['IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(currentStatus)) {
    timeline.push({
      status: 'IN_PROGRESS',
      note: 'Field team dispatched. Work in progress.',
      hoursAgo: 72,
      byAuthority: true,
    });
  }

  if (['RESOLVED', 'CLOSED'].includes(currentStatus)) {
    timeline.push({
      status: 'RESOLVED',
      note: 'Issue resolved. Proof of resolution uploaded.',
      hoursAgo: 24,
      byAuthority: true,
    });
  }

  if (currentStatus === 'CLOSED') {
    timeline.push({
      status: 'CLOSED',
      note: 'Complaint closed after citizen confirmation.',
      hoursAgo: 12,
      byAuthority: true,
    });
  }

  if (currentStatus === 'BREACHED') {
    timeline.push({
      status: 'BREACHED',
      note: 'SLA deadline exceeded — auto-flagged by system.',
      hoursAgo: 6,
      byAuthority: true,
    });
  }

  return timeline;
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
