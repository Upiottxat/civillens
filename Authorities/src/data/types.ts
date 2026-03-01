// ─── Backend-aligned types ─────────────────────────────────────────────────
// These match the Prisma schema exactly so the authority portal and mobile app
// share the same data model from the same database.

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type IssueStatus =
  | "SUBMITTED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"
  | "BREACHED";

export interface PriorityBreakdown {
  severity: { points: number; max: number; label: string };
  zone: { points: number; max: number; label: string | null };
  population: { points: number; max: number };
  duplicates: { points: number; max: number; count: number };
}

export interface StatusHistoryEntry {
  id: string;
  status: IssueStatus;
  note: string | null;
  changedById: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  citizenId: string;
  departmentId: string;
  issueType: string;
  description: string | null;
  imageUrl: string | null;
  proofImageUrl: string | null;
  latitude: number;
  longitude: number;
  locationLabel: string | null;
  severity: Severity;
  priorityScore: number;
  priorityBreakdown: PriorityBreakdown | null;
  status: IssueStatus;
  slaDeadline: string;
  slaBreached: boolean;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  duplicateOf: string | null;
  citizen: { id: string; name: string | null; phone: string };
  department: { id: string; name: string };
  assignedTo: { id: string; name: string | null } | null;
  statusHistory?: StatusHistoryEntry[];
}

export interface DashboardSummary {
  totalOpen: number;
  totalBreached: number;
  totalCritical: number;
  resolvedToday: number;
  totalComplaints: number;
  totalResolved: number;
  resolutionRate: number;
}

export interface SLADeptStats {
  departmentId: string;
  departmentName: string;
  totalComplaints: number;
  breachedCount: number;
  resolvedCount: number;
  slaComplianceRate: number;
  resolutionRate: number;
}

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string;
  name: string | null;
  role: string;
  department: string | null;
  designation: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
