import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getComplaintById, updateComplaintStatus } from "@/services/api";
import {
  getSlaStatus,
  getSlaTimeRemaining,
  getIssueTypeLabel,
  formatDate,
  getStatusLabel,
  getStatusColor,
  getSeverityBadge,
  getSeverityLabel,
} from "@/lib/issueUtils";
import { toast } from "@/components/ui/sonner";
import {
  ArrowLeft,
  Clock,
  MapPin,
  User,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Circle,
  FileText,
  Loader2,
  BarChart3,
} from "lucide-react";
import type { IssueStatus } from "@/data/types";

export default function IssueDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const {
    data: complaint,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["complaint", id],
    queryFn: () => getComplaintById(id!),
    enabled: !!id,
  });

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusNote, setStatusNote] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const statusMutation = useMutation({
    mutationFn: () =>
      updateComplaintStatus(id!, selectedStatus, statusNote || undefined),
    onSuccess: () => {
      toast.success("Status updated successfully!");
      setShowStatusModal(false);
      setStatusNote("");
      queryClient.invalidateQueries({ queryKey: ["complaint", id] });
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["urgent-complaints"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">
            Issue not found
          </p>
          <Link
            to="/issues"
            className="text-sm text-primary hover:underline mt-2 inline-block"
          >
            ← Back to Issues
          </Link>
        </div>
      </div>
    );
  }

  const sla = getSlaStatus(complaint);

  const timelineIcon = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return <Circle className="w-4 h-4 text-destructive" />;
      case "ASSIGNED":
        return <FileText className="w-4 h-4 text-orange-500" />;
      case "IN_PROGRESS":
        return <Clock className="w-4 h-4 text-warning" />;
      case "RESOLVED":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "CLOSED":
        return <CheckCircle2 className="w-4 h-4 text-muted-foreground" />;
      case "BREACHED":
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Link
            to="/issues"
            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Issues
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityBadge(
                complaint.severity
              )}`}
            >
              {getSeverityLabel(complaint.severity)}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                complaint.status
              )}`}
            >
              {getStatusLabel(complaint.status)}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              ID: {complaint.id.slice(0, 8)}...
            </span>
          </div>
          <h1 className="text-xl font-bold text-foreground mt-2">
            {complaint.issueType}
          </h1>
          {complaint.description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              {complaint.description}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setSelectedStatus(complaint.status);
            setShowStatusModal(true);
          }}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
        >
          Update Status
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* SLA & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className={`rounded-lg border p-5 ${
                sla === "breached"
                  ? "bg-destructive/5 border-destructive/20"
                  : sla === "warning"
                  ? "bg-warning/5 border-warning/20"
                  : "bg-card"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock
                  className={`w-4 h-4 ${
                    sla === "breached"
                      ? "text-destructive"
                      : sla === "warning"
                      ? "text-warning"
                      : "text-success"
                  }`}
                />
                <p className="text-sm font-medium text-foreground">
                  SLA Deadline
                </p>
              </div>
              <p
                className={`text-lg font-bold ${
                  sla === "breached"
                    ? "text-destructive"
                    : sla === "warning"
                    ? "text-warning"
                    : "text-success"
                }`}
              >
                {complaint.status === "RESOLVED" || complaint.status === "CLOSED"
                  ? "Completed"
                  : getSlaTimeRemaining(complaint.slaDeadline)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Deadline: {formatDate(complaint.slaDeadline)}
              </p>
            </div>

            <div className="bg-card rounded-lg border p-5">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium text-foreground">Location</p>
              </div>
              <p className="text-sm text-foreground font-medium">
                {complaint.locationLabel || "Not specified"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {complaint.latitude.toFixed(4)}, {complaint.longitude.toFixed(4)}
              </p>
            </div>
          </div>

          {/* Priority Score Breakdown */}
          {complaint.priorityBreakdown && (
            <div className="bg-card rounded-lg border p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-foreground">
                  Priority Score: {complaint.priorityScore}/100
                </h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Severity */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Severity
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {complaint.priorityBreakdown.severity.points}
                    <span className="text-xs font-normal text-muted-foreground">
                      /{complaint.priorityBreakdown.severity.max}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {complaint.priorityBreakdown.severity.label}
                  </p>
                </div>
                {/* Zone */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Zone Factor
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {complaint.priorityBreakdown.zone.points}
                    <span className="text-xs font-normal text-muted-foreground">
                      /{complaint.priorityBreakdown.zone.max}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {complaint.priorityBreakdown.zone.label || "Standard zone"}
                  </p>
                </div>
                {/* Population */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Population
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {complaint.priorityBreakdown.population.points}
                    <span className="text-xs font-normal text-muted-foreground">
                      /{complaint.priorityBreakdown.population.max}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">Density</p>
                </div>
                {/* Duplicates */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Duplicates
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {complaint.priorityBreakdown.duplicates.points}
                    <span className="text-xs font-normal text-muted-foreground">
                      /{complaint.priorityBreakdown.duplicates.max}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {complaint.priorityBreakdown.duplicates.count} nearby
                    reports
                  </p>
                </div>
              </div>
              {/* Visual bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Priority Score</span>
                  <span className="font-bold text-foreground">
                    {complaint.priorityScore}/100
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      complaint.priorityScore >= 80
                        ? "bg-red-500"
                        : complaint.priorityScore >= 60
                        ? "bg-orange-500"
                        : complaint.priorityScore >= 40
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${complaint.priorityScore}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Status Timeline */}
          {complaint.statusHistory && complaint.statusHistory.length > 0 && (
            <div className="bg-card rounded-lg border p-5">
              <h2 className="font-semibold text-foreground mb-4">
                Status Timeline
              </h2>
              <div className="space-y-0">
                {complaint.statusHistory.map((entry, idx) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      {timelineIcon(entry.status)}
                      {idx < complaint.statusHistory!.length - 1 && (
                        <div className="w-px flex-1 bg-border my-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-foreground">
                        {getStatusLabel(entry.status)}
                      </p>
                      {entry.note && (
                        <p className="text-xs text-muted-foreground">
                          {entry.note}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5">
          {/* Citizen Info */}
          <div className="bg-card rounded-lg border p-5">
            <h2 className="font-semibold text-foreground mb-3">
              Citizen Details
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">
                  {complaint.citizen.name || "Unknown"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">
                  +91 {complaint.citizen.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Issue Meta */}
          <div className="bg-card rounded-lg border p-5">
            <h2 className="font-semibold text-foreground mb-3">Details</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="text-foreground font-medium">
                  {complaint.issueType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Department</span>
                <span className="text-foreground font-medium">
                  {complaint.department.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assigned To</span>
                <span className="text-foreground font-medium">
                  {complaint.assignedTo?.name || "Unassigned"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reported</span>
                <span className="text-foreground font-medium">
                  {formatDate(complaint.createdAt)}
                </span>
              </div>
              {complaint.resolvedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolved</span>
                  <span className="text-foreground font-medium">
                    {formatDate(complaint.resolvedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Proof Image */}
          {complaint.proofImageUrl && (
            <div className="bg-card rounded-lg border p-5">
              <h2 className="font-semibold text-foreground mb-3">
                Proof of Resolution
              </h2>
              <img
                src={complaint.proofImageUrl}
                alt="Proof"
                className="w-full h-40 object-cover rounded-md border"
              />
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border shadow-lg w-full max-w-md">
            <div className="p-5 border-b">
              <h2 className="font-semibold text-foreground">
                Update Issue Status
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {complaint.issueType} — {complaint.id.slice(0, 8)}
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  New Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="SUBMITTED">Open</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Resolution Note (Optional)
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Add a note about the status change..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-background border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>
            <div className="p-5 border-t flex gap-3 justify-end">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 text-sm border rounded-md text-foreground hover:bg-muted transition-colors"
                disabled={statusMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={() => statusMutation.mutate()}
                disabled={statusMutation.isPending}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {statusMutation.isPending ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                    Updating...
                  </>
                ) : (
                  "Update Status"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
