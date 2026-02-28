/**
 * SLA / complaint transformation helpers.
 * Converts backend complaint objects into shapes the UI components expect.
 */

export interface SLAInfo {
  remaining: string;
  isBreached: boolean;
  isWarning: boolean;
  isResolved: boolean;
}

export function computeSLA(
  deadline: string | Date,
  status: string,
  slaBreached?: boolean
): SLAInfo {
  const resolved = status === 'RESOLVED' || status === 'CLOSED';
  if (resolved)
    return { remaining: 'Resolved', isBreached: false, isWarning: false, isResolved: true };

  if (slaBreached || status === 'BREACHED') {
    const diff = Date.now() - new Date(deadline).getTime();
    return {
      remaining: `Overdue by ${fmtDur(diff)}`,
      isBreached: true,
      isWarning: false,
      isResolved: false,
    };
  }

  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0)
    return { remaining: 'Overdue', isBreached: true, isWarning: false, isResolved: false };

  return {
    remaining: fmtDur(diff),
    isBreached: false,
    isWarning: diff / 36e5 < 3,
    isResolved: false,
  };
}

function fmtDur(ms: number): string {
  const m = Math.floor(Math.abs(ms) / 6e4);
  const d = Math.floor(m / 1440);
  const hr = Math.floor((m % 1440) / 60);
  const min = m % 60;
  if (d > 0) return `${d}d ${hr}h`;
  if (hr > 0) return `${hr}h ${min}m`;
  return `${min}m`;
}

// ─── Status mapping ──────────────────────────────────────────────────────────

const ICON_MAP: Record<string, string> = {
  Garbage: '🗑️',
  'Water Leakage': '💧',
  Streetlight: '💡',
  'Road Damage': '🚧',
  'Public Safety': '🛡️',
  'Park / Open Space': '🌳',
  'Stray Animals': '🐕',
  Other: '➕',
};

export type FrontendStatus =
  | 'submitted'
  | 'assigned'
  | 'in-progress'
  | 'resolved'
  | 'breached';

export function mapStatus(s: string): FrontendStatus {
  const m: Record<string, FrontendStatus> = {
    SUBMITTED: 'submitted',
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'in-progress',
    RESOLVED: 'resolved',
    CLOSED: 'resolved',
    BREACHED: 'breached',
  };
  return m[s] || 'submitted';
}

export const getCategoryIcon = (t: string) => ICON_MAP[t] || '📋';

export function formatRelativeTime(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 6e4);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(d).toLocaleDateString();
}

export function formatTicketId(id: string): string {
  return `#CVL-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

/**
 * Transforms a raw complaint from the API into the shape expected by IssueCard.
 */
export function transformComplaint(c: any) {
  const sla = computeSLA(c.slaDeadline, c.status, c.slaBreached);
  return {
    id: c.id,
    title: `${c.issueType}${c.locationLabel ? ' — ' + c.locationLabel : ''}`,
    location:
      c.locationLabel ||
      `${c.latitude?.toFixed(4)}, ${c.longitude?.toFixed(4)}`,
    status: mapStatus(c.status),
    category: c.issueType,
    categoryIcon: getCategoryIcon(c.issueType),
    slaRemaining: sla.remaining,
    slaWarning: sla.isWarning,
    time: formatRelativeTime(c.createdAt),
    ticketId: formatTicketId(c.id),
    _raw: c,
    _sla: sla,
  };
}
