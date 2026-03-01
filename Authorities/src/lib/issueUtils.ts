import type { Complaint, IssueStatus, Severity } from "@/data/types";

// ─── SLA helpers ───────────────────────────────────────────────────────────

export function getSlaStatus(
  complaint: Complaint
): "ok" | "warning" | "breached" {
  if (complaint.slaBreached) return "breached";
  if (complaint.status === "RESOLVED" || complaint.status === "CLOSED")
    return "ok";

  const now = new Date();
  const deadline = new Date(complaint.slaDeadline);
  const diff = deadline.getTime() - now.getTime();

  if (diff < 0) return "breached";
  if (diff < 12 * 60 * 60 * 1000) return "warning";
  return "ok";
}

export function getSlaTimeRemaining(slaDeadline: string): string {
  const now = new Date();
  const deadline = new Date(slaDeadline);
  const diff = deadline.getTime() - now.getTime();

  if (diff < 0) {
    const absDiff = Math.abs(diff);
    const hours = Math.floor(absDiff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `Breached ${days}d ${hours % 24}h ago`;
    return `Breached ${hours}h ago`;
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours % 24}h remaining`;
  if (hours > 0) return `${hours}h ${mins}m remaining`;
  return `${mins}m remaining`;
}

// ─── Formatting ────────────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Labels & Colors ───────────────────────────────────────────────────────

const departmentLabels: Record<string, string> = {
  Water: "Water Supply",
  Roads: "Roads & Transport",
  Sanitation: "Sanitation",
  Electrical: "Electricity",
  "Public Safety": "Public Safety",
  Parks: "Parks & Recreation",
  "Animal Control": "Animal Control",
  General: "General",
};

export function getDepartmentLabel(name: string): string {
  return departmentLabels[name] || name;
}

const issueTypeLabels: Record<string, string> = {
  "Water Leakage": "Water Supply",
  "Road Damage": "Roads & Transport",
  Garbage: "Sanitation",
  Streetlight: "Electricity",
  "Public Safety": "Public Safety",
  "Park / Open Space": "Parks & Recreation",
  "Stray Animals": "Animal Control",
};

export function getIssueTypeLabel(issueType: string): string {
  return issueTypeLabels[issueType] || issueType;
}

export function getSeverityColor(severity: Severity | string): string {
  switch (severity) {
    case "CRITICAL":
      return "bg-destructive text-destructive-foreground";
    case "HIGH":
      return "bg-warning text-warning-foreground";
    case "MEDIUM":
      return "bg-info text-info-foreground";
    case "LOW":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function getSeverityBadge(severity: Severity | string): string {
  switch (severity) {
    case "CRITICAL":
      return "bg-destructive/10 text-destructive";
    case "HIGH":
      return "bg-warning/10 text-warning";
    case "MEDIUM":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "LOW":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function getStatusColor(status: IssueStatus | string): string {
  switch (status) {
    case "SUBMITTED":
      return "bg-destructive/10 text-destructive border border-destructive/20";
    case "ASSIGNED":
      return "bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-400";
    case "IN_PROGRESS":
      return "bg-warning/10 text-warning-foreground border border-warning/20";
    case "RESOLVED":
      return "bg-success/10 text-success border border-success/20";
    case "CLOSED":
      return "bg-muted text-muted-foreground border border-border";
    case "BREACHED":
      return "bg-destructive/10 text-destructive border border-destructive/30 font-semibold";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function getStatusLabel(status: IssueStatus | string): string {
  switch (status) {
    case "SUBMITTED":
      return "Open";
    case "ASSIGNED":
      return "Assigned";
    case "IN_PROGRESS":
      return "In Progress";
    case "RESOLVED":
      return "Resolved";
    case "CLOSED":
      return "Closed";
    case "BREACHED":
      return "SLA Breached";
    default:
      return status;
  }
}

export function getSeverityLabel(severity: Severity | string): string {
  return severity.charAt(0) + severity.slice(1).toLowerCase();
}
