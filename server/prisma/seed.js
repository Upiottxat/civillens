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
    update: { city: 'New Delhi', state: 'Delhi' },
    create: {
      phone: '9876543210',
      name: 'Priya Sharma',
      role: 'CITIZEN',
      city: 'New Delhi',
      state: 'Delhi',
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

  // ─── 5. Badges ──────────────────────────────────────────────────────────────

  const badgeData = [
    {
      slug: 'first-reporter',
      name: 'First Reporter',
      description: 'Submitted your very first complaint',
      icon: '🌱',
      tier: 'BRONZE',
      criteria: { type: 'complaints_submitted', threshold: 1 },
    },
    {
      slug: 'active-citizen',
      name: 'Active Citizen',
      description: 'Submitted 5 verified complaints',
      icon: '📢',
      tier: 'BRONZE',
      criteria: { type: 'complaints_submitted', threshold: 5 },
    },
    {
      slug: 'civic-champion',
      name: 'Civic Champion',
      description: 'Submitted 10 verified complaints',
      icon: '🏅',
      tier: 'SILVER',
      criteria: { type: 'complaints_submitted', threshold: 10 },
    },
    {
      slug: 'city-hero',
      name: 'City Hero',
      description: '25 of your complaints have been resolved',
      icon: '🦸',
      tier: 'GOLD',
      criteria: { type: 'complaints_resolved', threshold: 25 },
    },
    {
      slug: 'impact-maker',
      name: 'Impact Maker',
      description: '5 complaints resolved within SLA deadline',
      icon: '⚡',
      tier: 'SILVER',
      criteria: { type: 'sla_resolved', threshold: 5 },
    },
    {
      slug: 'streak-master',
      name: 'Streak Master',
      description: 'Filed 5 complaints in a single week',
      icon: '🔥',
      tier: 'SILVER',
      criteria: { type: 'streak_7d', threshold: 5 },
    },
    {
      slug: 'coin-collector',
      name: 'Coin Collector',
      description: 'Earned 100+ App Coins in total',
      icon: '💰',
      tier: 'BRONZE',
      criteria: { type: 'total_coins', threshold: 100 },
    },
    {
      slug: 'platinum-citizen',
      name: 'Platinum Citizen',
      description: 'Earned 500+ App Coins — a true civic leader',
      icon: '💎',
      tier: 'PLATINUM',
      criteria: { type: 'total_coins', threshold: 500 },
    },
    {
      slug: 'watchdog',
      name: 'Watchdog',
      description: '3 of your complaints resulted in SLA breach accountability',
      icon: '🐕',
      tier: 'GOLD',
      criteria: { type: 'complaints_submitted', threshold: 25 },
    },
    {
      slug: 'problem-solver',
      name: 'Problem Solver',
      description: '10 complaints resolved successfully',
      icon: '🧩',
      tier: 'SILVER',
      criteria: { type: 'complaints_resolved', threshold: 10 },
    },
  ];

  for (const badge of badgeData) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: {
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        tier: badge.tier,
        criteria: badge.criteria,
      },
      create: badge,
    });
  }

  console.log(`✅ ${badgeData.length} badges created`);

  // ─── 6. Rewards ─────────────────────────────────────────────────────────────

  const rewardData = [
    {
      name: 'Swiggy 20% Off',
      description: 'Get 20% off on your next Swiggy order (max ₹100 discount)',
      partner: 'Swiggy',
      coinCost: 150,
      category: 'FOOD',
      stock: -1,
    },
    {
      name: 'Swiggy 30% Off',
      description: 'Get 30% off on your next Swiggy order (max ₹200 discount)',
      partner: 'Swiggy',
      coinCost: 300,
      category: 'FOOD',
      stock: 50,
    },
    {
      name: 'Zomato Free Delivery',
      description: 'Free delivery on your next 3 Zomato orders',
      partner: 'Zomato',
      coinCost: 100,
      category: 'FOOD',
      stock: -1,
    },
    {
      name: 'Spotify Premium 1 Month',
      description: 'One month of Spotify Premium subscription',
      partner: 'Spotify',
      coinCost: 500,
      category: 'ENTERTAINMENT',
      stock: 20,
    },
    {
      name: 'YouTube Premium 1 Week',
      description: 'One week of ad-free YouTube',
      partner: 'YouTube',
      coinCost: 200,
      category: 'ENTERTAINMENT',
      stock: -1,
    },
    {
      name: 'Amazon ₹100 Voucher',
      description: '₹100 Amazon Gift Card',
      partner: 'Amazon',
      coinCost: 400,
      category: 'SHOPPING',
      stock: 30,
    },
    {
      name: 'Myntra 15% Off',
      description: '15% off on Myntra (max ₹300)',
      partner: 'Myntra',
      coinCost: 250,
      category: 'SHOPPING',
      stock: -1,
    },
    {
      name: 'BookMyShow ₹50 Off',
      description: '₹50 off on any movie ticket',
      partner: 'BookMyShow',
      coinCost: 200,
      category: 'ENTERTAINMENT',
      stock: -1,
    },
  ];

  for (const reward of rewardData) {
    // Use name + partner as a pseudo-unique key
    const existing = await prisma.reward.findFirst({
      where: { name: reward.name, partner: reward.partner },
    });

    if (!existing) {
      await prisma.reward.create({ data: reward });
    } else {
      await prisma.reward.update({
        where: { id: existing.id },
        data: reward,
      });
    }
  }

  console.log(`✅ ${rewardData.length} rewards created`);

  // ─── 7. Demo Gamification Data ──────────────────────────────────────────────

  // Give demo citizen some coins and badges
  const wallet = await prisma.coinWallet.upsert({
    where: { userId: citizen.id },
    update: { balance: 185, totalEarned: 235 },
    create: { userId: citizen.id, balance: 185, totalEarned: 235 },
  });

  // Add some demo transactions
  const demoTransactions = [
    { amount: 10, reason: 'COMPLAINT_SUBMITTED', referenceId: null },
    { amount: 20, reason: 'FIRST_COMPLAINT', referenceId: null },
    { amount: 5, reason: 'PHOTO_EVIDENCE', referenceId: null },
    { amount: 10, reason: 'COMPLAINT_SUBMITTED', referenceId: null },
    { amount: 15, reason: 'COMPLAINT_RESOLVED', referenceId: null },
    { amount: 25, reason: 'SLA_RESOLVED', referenceId: null },
    { amount: 10, reason: 'COMPLAINT_SUBMITTED', referenceId: null },
    { amount: 10, reason: 'COMPLAINT_SUBMITTED', referenceId: null },
    { amount: 10, reason: 'COMPLAINT_SUBMITTED', referenceId: null },
    { amount: 5, reason: 'PHOTO_EVIDENCE', referenceId: null },
    { amount: 10, reason: 'COMPLAINT_SUBMITTED', referenceId: null },
    { amount: 15, reason: 'COMPLAINT_RESOLVED', referenceId: null },
    { amount: 10, reason: 'SLA_BREACH_CITIZEN', referenceId: null },
    { amount: 10, reason: 'COMPLAINT_SUBMITTED', referenceId: null },
    { amount: 5, reason: 'PHOTO_EVIDENCE', referenceId: null },
    { amount: 15, reason: 'COMPLAINT_RESOLVED', referenceId: null },
    { amount: -50, reason: 'REWARD_REDEEMED', referenceId: null },
  ];

  // Clear old demo transactions
  await prisma.coinTransaction.deleteMany({ where: { walletId: wallet.id } });

  for (const tx of demoTransactions) {
    await prisma.coinTransaction.create({
      data: { walletId: wallet.id, ...tx },
    });
  }

  // Award demo badges
  const firstReporter = await prisma.badge.findUnique({ where: { slug: 'first-reporter' } });
  const activeCitizen = await prisma.badge.findUnique({ where: { slug: 'active-citizen' } });
  const coinCollector = await prisma.badge.findUnique({ where: { slug: 'coin-collector' } });

  for (const badge of [firstReporter, activeCitizen, coinCollector]) {
    if (badge) {
      await prisma.userBadge.upsert({
        where: { userId_badgeId: { userId: citizen.id, badgeId: badge.id } },
        update: {},
        create: { userId: citizen.id, badgeId: badge.id },
      });
    }
  }

  console.log('✅ Demo gamification data created (coins, transactions, badges)');

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
