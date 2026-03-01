import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getComplaints } from "@/services/api";
import {
  getSlaStatus,
  getSlaTimeRemaining,
  getStatusLabel,
  getStatusColor,
  getSeverityLabel,
  getSeverityBadge,
  getIssueTypeLabel,
  formatRelativeTime,
} from "@/lib/issueUtils";
import { Link } from "react-router-dom";
import { Search, Filter, Clock, Loader2 } from "lucide-react";
import type { Severity, IssueStatus } from "@/data/types";

export default function IssuesList() {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "all">("all");
  const [slaFilter, setSlaFilter] = useState<"all" | "true">("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: [
      "complaints",
      severityFilter,
      statusFilter,
      slaFilter,
      page,
    ],
    queryFn: () =>
      getComplaints({
        severity: severityFilter !== "all" ? severityFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        slaBreached: slaFilter !== "all" ? slaFilter : undefined,
        page,
        limit: 20,
      }),
  });

  const complaints = data?.data || [];
  const pagination = data?.pagination;

  // Client-side search filter (API doesn't have full-text search)
  const filtered = search
    ? complaints.filter(
        (c) =>
          c.issueType.toLowerCase().includes(search.toLowerCase()) ||
          c.id.toLowerCase().includes(search.toLowerCase()) ||
          (c.description &&
            c.description.toLowerCase().includes(search.toLowerCase())) ||
          (c.locationLabel &&
            c.locationLabel.toLowerCase().includes(search.toLowerCase()))
      )
    : complaints;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">All Issues</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {pagination
            ? `${pagination.total} total complaints`
            : "Loading..."}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by type, location, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={severityFilter}
          onChange={(e) => {
            setSeverityFilter(e.target.value as any);
            setPage(1);
          }}
          className="text-sm bg-card border rounded-md px-3 py-2 text-foreground"
        >
          <option value="all">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as any);
            setPage(1);
          }}
          className="text-sm bg-card border rounded-md px-3 py-2 text-foreground"
        >
          <option value="all">All Statuses</option>
          <option value="SUBMITTED">Open</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
          <option value="BREACHED">Breached</option>
        </select>
        <button
          onClick={() => {
            setSlaFilter(slaFilter === "all" ? "true" : "all");
            setPage(1);
          }}
          className={`text-sm px-3 py-2 rounded-md border flex items-center gap-1.5 transition-colors ${
            slaFilter === "true"
              ? "bg-destructive text-destructive-foreground border-destructive"
              : "bg-card text-foreground"
          }`}
        >
          <Filter className="w-3 h-3" />
          SLA Breached
        </button>
      </div>

      {/* Issues Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Issue
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Citizen
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Severity
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Score
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    SLA
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((complaint) => {
                  const sla = getSlaStatus(complaint);
                  return (
                    <tr
                      key={complaint.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-3">
                        <Link
                          to={`/issues/${complaint.id}`}
                          className="block"
                        >
                          <p className="text-foreground font-medium hover:text-primary transition-colors line-clamp-1 max-w-[280px]">
                            {complaint.issueType}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-[280px]">
                            {complaint.locationLabel || "No location"}
                          </p>
                        </Link>
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-foreground">
                          {complaint.citizen.name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {complaint.citizen.phone}
                        </p>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getSeverityBadge(
                            complaint.severity
                          )}`}
                        >
                          {getSeverityLabel(complaint.severity)}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                            complaint.status
                          )}`}
                        >
                          {getStatusLabel(complaint.status)}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-xs font-bold text-foreground">
                          {complaint.priorityScore}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          /100
                        </span>
                      </td>
                      <td className="p-3">
                        <div
                          className={`flex items-center gap-1.5 text-xs font-medium ${
                            sla === "breached"
                              ? "text-destructive"
                              : sla === "warning"
                              ? "text-warning"
                              : "text-success"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {complaint.status === "RESOLVED" ||
                          complaint.status === "CLOSED"
                            ? "Completed"
                            : getSlaTimeRemaining(complaint.slaDeadline)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No issues match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm border rounded-md text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setPage(Math.min(pagination.totalPages, page + 1))
              }
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 text-sm border rounded-md text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
