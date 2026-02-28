/**
 * SLA time computation helpers.
 * Convert a deadline ISO string from the API into human-readable remaining time.
 */

export interface SLAInfo {
  remaining: string;      // e.g. "10h 24m", "1d 4h", "Resolved"
  isBreached: boolean;
  isWarning: boolean;     // < 3 hours remaining
  isResolved: boolean;
}

/**
 * Computes the SLA remaining string from a deadline date.
 */
export function computeSLA(
  slaDeadline: string | Date,
  status: string,
  slaBreached?: boolean
): SLAInfo {
  const isResolved = status === 'RESOLVED' || status === 'CLOSED';

  if (isResolved) {
    return { remaining: 'Resolved', isBreached: false, isWarning: false, isResolved: true };
  }

  if (slaBreached || status === 'BREACHED') {
    const deadline = new Date(slaDeadline);
    const now = new Date();
    const diff = now.getTime() - deadline.getTime();
    const overdue = formatDuration(diff);
    return {
      remaining: `Overdue by ${overdue}`,
      isBreached: true,
      isWarning: false,
      isResolved: false,
    };
  }

  const deadline = new Date(slaDeadline);
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();

  if (diff <= 0) {
    return { remaining: 'Overdue', isBreached: true, isWarning: false, isResolved: false };
  }

  const remaining = formatDuration(diff);
  const hoursLeft = diff / (1000 * 60 * 60);

  return {
    remaining,
    isBreached: false,
    isWarning: hoursLeft < 3,
    isResolved: false,
  };
}

/**
 * Formats a duration in milliseconds to a human-readable string.
 */
function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(Math.abs(ms) / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// ─── Status mapping ─────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  'Garbage': '🗑️',
  'Water Leakage': '💧',
  'Streetlight': '💡',
  'Road Damage': '🚧',
  'Public Safety': '🛡️',
  'Park / Open Space': '🌳',
  'Stray Animals': '🐕',
  'Other': '➕',
};

/**
 * Maps a backend status enum to the frontend IssueStatus type.
 */
export function mapStatus(
  backendStatus: string
): 'submitted' | 'assigned' | 'in-progress' | 'resolved' | 'breached' {
  const map: Record<string, any> = {
    SUBMITTED: 'submitted',
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'in-progress',
    RESOLVED: 'resolved',
    CLOSED: 'resolved',
    BREACHED: 'breached',
  };
  return map[backendStatus] || 'submitted';
}

/**
 * Returns the emoji icon for an issue category.
 */
export function getCategoryIcon(issueType: string): string {
  return CATEGORY_ICONS[issueType] || '📋';
}

/**
 * Formats a date into relative time (e.g. "2 hours ago", "Yesterday").
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

/**
 * Generates a short ticket-style ID from a UUID.
 */
export function formatTicketId(id: string): string {
  const short = id.replace(/-/g, '').slice(0, 8).toUpperCase();
  return `#CVL-${short}`;
}

/**
 * Transforms a raw complaint from the API into the Issue shape
 * that the IssueCard component expects.
 */
export function transformComplaint(complaint: any) {
  const sla = computeSLA(complaint.slaDeadline, complaint.status, complaint.slaBreached);

  return {
    id: complaint.id,
    title: `${complaint.issueType}${complaint.locationLabel ? ' — ' + complaint.locationLabel : ''}`,
    location: complaint.locationLabel || `${complaint.latitude.toFixed(4)}, ${complaint.longitude.toFixed(4)}`,
    status: mapStatus(complaint.status),
    category: complaint.issueType,
    categoryIcon: getCategoryIcon(complaint.issueType),
    slaRemaining: sla.remaining,
    slaWarning: sla.isWarning,
    time: formatRelativeTime(complaint.createdAt),
    ticketId: formatTicketId(complaint.id),
    // Extra fields for detail views
    _raw: complaint,
    _sla: sla,
  };
}
