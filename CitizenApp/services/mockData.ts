/**
 * Offline / demo mock data for CiviLens.
 * Provides realistic complaints, notifications, and classification
 * so the app is fully functional without a backend.
 */

const h = (n: number) => new Date(Date.now() - n * 36e5).toISOString();
const fwd = (n: number) => new Date(Date.now() + n * 36e5).toISOString();

export const MOCK_USER = {
  id: 'usr-demo-priya',
  phone: '9876543210',
  name: 'Priya Sharma',
  role: 'CITIZEN',
};
export const MOCK_TOKEN = 'mock-jwt-offline';

// ---------- complaints ----------

export const MOCK_COMPLAINTS: any[] = [
  {
    id: 'cmp-01',
    issueType: 'Water Leakage',
    description:
      'Major water leak near Kendriya Vidyalaya school gate. Water pooling on the road causing traffic hazard.',
    imageUrl: null,
    latitude: 28.6315,
    longitude: 77.2167,
    locationLabel: 'Kendriya Vidyalaya, Connaught Place',
    severity: 'HIGH',
    status: 'IN_PROGRESS',
    priorityScore: 91,
    priorityBreakdown: {
      severity: { points: 30, max: 40, label: 'HIGH' },
      zone: { points: 25, max: 25, label: 'Market Zone — Connaught Place' },
      population: { points: 18, max: 20 },
      duplicates: { points: 15, max: 15, count: 3 },
    },
    slaDeadline: fwd(2.5),
    slaBreached: false,
    createdAt: h(9),
    updatedAt: h(3),
    resolvedAt: null,
    department: { id: 'd1', name: 'Water' },
    assignedTo: { id: 'a1', name: 'R.K. Verma' },
    proofImageUrl: null,
    statusHistory: [
      { id: 'sh1', status: 'SUBMITTED', note: 'Complaint registered.', createdAt: h(9) },
      { id: 'sh2', status: 'ASSIGNED', note: 'Auto-assigned to Water dept.', createdAt: h(8) },
      { id: 'sh3', status: 'IN_PROGRESS', note: 'Field team dispatched.', createdAt: h(3) },
    ],
    citizenId: 'usr-demo-priya',
  },
  {
    id: 'cmp-02',
    issueType: 'Road Damage',
    description:
      'Large pothole near Rajiv Chowk metro. Multiple vehicles damaged.',
    imageUrl: null,
    latitude: 28.6328,
    longitude: 77.2197,
    locationLabel: 'Rajiv Chowk, New Delhi',
    severity: 'HIGH',
    status: 'ASSIGNED',
    priorityScore: 78,
    priorityBreakdown: {
      severity: { points: 30, max: 40, label: 'HIGH' },
      zone: { points: 18, max: 25, label: 'Near Market Zone' },
      population: { points: 15, max: 20 },
      duplicates: { points: 15, max: 15, count: 3 },
    },
    slaDeadline: fwd(8),
    slaBreached: false,
    createdAt: h(6),
    updatedAt: h(5),
    resolvedAt: null,
    department: { id: 'd2', name: 'Roads' },
    assignedTo: { id: 'a2', name: 'S. Patel' },
    proofImageUrl: null,
    statusHistory: [
      { id: 'sh4', status: 'SUBMITTED', note: 'Complaint registered.', createdAt: h(6) },
      { id: 'sh5', status: 'ASSIGNED', note: 'Assigned to Roads dept.', createdAt: h(5) },
    ],
    citizenId: 'usr-demo-priya',
  },
  {
    id: 'cmp-03',
    issueType: 'Streetlight',
    description:
      'Three streetlights out on MG Road near AIIMS bus stop. Dark after 7 PM — safety hazard.',
    imageUrl: null,
    latitude: 28.5672,
    longitude: 77.21,
    locationLabel: 'MG Road, near AIIMS',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    priorityScore: 65,
    priorityBreakdown: {
      severity: { points: 20, max: 40, label: 'MEDIUM' },
      zone: { points: 20, max: 25, label: 'Hospital Zone — AIIMS' },
      population: { points: 15, max: 20 },
      duplicates: { points: 10, max: 15, count: 2 },
    },
    slaDeadline: h(2),
    slaBreached: false,
    createdAt: h(48),
    updatedAt: h(8),
    resolvedAt: h(8),
    department: { id: 'd3', name: 'Electrical' },
    assignedTo: { id: 'a3', name: 'M. Singh' },
    proofImageUrl: null,
    statusHistory: [
      { id: 'sh6', status: 'SUBMITTED', note: 'Complaint registered.', createdAt: h(48) },
      { id: 'sh7', status: 'ASSIGNED', note: 'Assigned to Electrical.', createdAt: h(47) },
      { id: 'sh8', status: 'IN_PROGRESS', note: 'Bulbs procured; team sent.', createdAt: h(24) },
      { id: 'sh9', status: 'RESOLVED', note: 'All 3 streetlights repaired.', createdAt: h(8) },
    ],
    citizenId: 'usr-demo-priya',
  },
  {
    id: 'cmp-04',
    issueType: 'Garbage',
    description:
      'Garbage pile-up at community park entrance for 4 days. Foul smell and stray dogs.',
    imageUrl: null,
    latitude: 28.5456,
    longitude: 77.2507,
    locationLabel: 'Nehru Park, Lajpat Nagar',
    severity: 'MEDIUM',
    status: 'BREACHED',
    priorityScore: 72,
    priorityBreakdown: {
      severity: { points: 20, max: 40, label: 'MEDIUM' },
      zone: { points: 22, max: 25, label: 'Near Hospital Zone' },
      population: { points: 18, max: 20 },
      duplicates: { points: 12, max: 15, count: 2 },
    },
    slaDeadline: h(6),
    slaBreached: true,
    createdAt: h(72),
    updatedAt: h(6),
    resolvedAt: null,
    department: { id: 'd4', name: 'Sanitation' },
    assignedTo: { id: 'a4', name: 'D. Kumar' },
    proofImageUrl: null,
    statusHistory: [
      { id: 'sh10', status: 'SUBMITTED', note: 'Complaint registered.', createdAt: h(72) },
      { id: 'sh11', status: 'ASSIGNED', note: 'Assigned to Sanitation.', createdAt: h(71) },
      { id: 'sh12', status: 'BREACHED', note: 'SLA exceeded — escalated.', createdAt: h(6) },
    ],
    citizenId: 'usr-demo-priya',
  },
  {
    id: 'cmp-05',
    issueType: 'Stray Animals',
    description:
      'Aggressive stray dog pack near DPS School Road. Children are scared to walk to school.',
    imageUrl: null,
    latitude: 28.5631,
    longitude: 77.1727,
    locationLabel: 'DPS School Road, R.K. Puram',
    severity: 'HIGH',
    status: 'SUBMITTED',
    priorityScore: 85,
    priorityBreakdown: {
      severity: { points: 30, max: 40, label: 'HIGH' },
      zone: { points: 25, max: 25, label: 'School Zone — DPS RK Puram' },
      population: { points: 16, max: 20 },
      duplicates: { points: 15, max: 15, count: 4 },
    },
    slaDeadline: fwd(6),
    slaBreached: false,
    createdAt: h(2),
    updatedAt: h(2),
    resolvedAt: null,
    department: null,
    assignedTo: null,
    proofImageUrl: null,
    statusHistory: [
      { id: 'sh13', status: 'SUBMITTED', note: 'Complaint registered.', createdAt: h(2) },
    ],
    citizenId: 'usr-demo-priya',
  },
];

// ---------- notifications ----------

export const MOCK_NOTIFICATIONS = [
  {
    id: 'n1', title: 'Work In Progress', body: 'Field team dispatched to Kendriya Vidyalaya.',
    ticketId: '#CVL-CMP01WAT', time: h(3), type: 'info', icon: '🔧', iconBg: '#F0FDF4',
    read: false, issueId: 'cmp-01', issueType: 'Water Leakage', locationLabel: 'Kendriya Vidyalaya',
  },
  {
    id: 'n2', title: 'Issue Assigned', body: 'Road Damage at Rajiv Chowk assigned to Roads dept.',
    ticketId: '#CVL-CMP02ROA', time: h(5), type: 'assigned', icon: '👤', iconBg: '#EFF6FF',
    read: false, issueId: 'cmp-02', issueType: 'Road Damage', locationLabel: 'Rajiv Chowk',
  },
  {
    id: 'n3', title: 'Issue Resolved', body: 'All 3 streetlights on MG Road repaired!',
    ticketId: '#CVL-CMP03STR', time: h(8), type: 'success', icon: '🎉', iconBg: '#F0FDF4',
    read: true, issueId: 'cmp-03', issueType: 'Streetlight', locationLabel: 'MG Road',
  },
  {
    id: 'n4', title: 'SLA Breached', body: 'Garbage at Nehru Park overdue — escalated to District Officer.',
    ticketId: '#CVL-CMP04GAR', time: h(6), type: 'breach', icon: '🚨', iconBg: '#FEF2F2',
    read: false, issueId: 'cmp-04', issueType: 'Garbage', locationLabel: 'Nehru Park',
  },
  {
    id: 'n5', title: 'Issue Registered', body: 'Stray Animals complaint registered & auto-prioritized.',
    ticketId: '#CVL-CMP05STR', time: h(2), type: 'success', icon: '✅', iconBg: '#F0FDF4',
    read: false, issueId: 'cmp-05', issueType: 'Stray Animals', locationLabel: 'DPS School Road',
  },
];

// ---------- classify ----------

const KW: Record<string, { issueType: string; confidence: number }> = {
  water: { issueType: 'Water Leakage', confidence: 92 },
  leak: { issueType: 'Water Leakage', confidence: 88 },
  pothole: { issueType: 'Road Damage', confidence: 94 },
  road: { issueType: 'Road Damage', confidence: 87 },
  garbage: { issueType: 'Garbage', confidence: 95 },
  trash: { issueType: 'Garbage', confidence: 90 },
  light: { issueType: 'Streetlight', confidence: 91 },
  dark: { issueType: 'Streetlight', confidence: 78 },
  manhole: { issueType: 'Public Safety', confidence: 93 },
  dog: { issueType: 'Stray Animals', confidence: 89 },
  park: { issueType: 'Park / Open Space', confidence: 84 },
};

export function mockClassify(desc: string) {
  const low = desc.toLowerCase();
  for (const [k, v] of Object.entries(KW))
    if (low.includes(k)) return v;
  return { issueType: 'Other', confidence: 60 };
}

// ---------- submit ----------

let ctr = 10;
export function mockSubmitComplaint(p: any) {
  ctr++;
  const id = `cmp-new-${ctr}`;
  const c: any = {
    id,
    ...p,
    status: 'SUBMITTED',
    priorityScore: 60 + Math.floor(Math.random() * 30),
    priorityBreakdown: {
      severity: { points: p.severity === 'HIGH' ? 30 : 20, max: 40, label: p.severity },
      zone: { points: 15, max: 25, label: null },
      population: { points: 14, max: 20 },
      duplicates: { points: 5, max: 15, count: 1 },
    },
    slaDeadline: fwd(p.severity === 'HIGH' ? 12 : p.severity === 'MEDIUM' ? 24 : 48),
    slaBreached: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: null,
    department: null,
    assignedTo: null,
    proofImageUrl: null,
    statusHistory: [
      { id: `sh-new-${ctr}`, status: 'SUBMITTED', note: 'Complaint registered.', createdAt: new Date().toISOString() },
    ],
    citizenId: MOCK_USER.id,
  };
  MOCK_COMPLAINTS.unshift(c);
  MOCK_NOTIFICATIONS.unshift({
    id: `n-new-${ctr}`, title: 'Issue Registered', body: `${p.issueType} complaint registered.`,
    ticketId: `#CVL-${id.toUpperCase().slice(0, 8)}`, time: new Date().toISOString(),
    type: 'success', icon: '✅', iconBg: '#F0FDF4', read: false, issueId: id,
    issueType: p.issueType, locationLabel: p.locationLabel || '',
  });
  return { complaint: c };
}
