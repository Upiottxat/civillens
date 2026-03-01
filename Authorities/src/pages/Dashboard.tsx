import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary, getComplaints, getSLAStats } from "@/services/api";
import { getSlaStatus, getSlaTimeRemaining, getSeverityLabel, getStatusLabel, getSeverityBadge, formatRelativeTime } from "@/lib/issueUtils";
import { AlertTriangle, CheckCircle2, Clock, ClipboardList, ArrowRight, TrendingUp, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
  });

  const { data: slaStats } = useQuery({
    queryKey: ["sla-stats"],
    queryFn: getSLAStats,
  });

  const { data: complaintsResult, isLoading: complaintsLoading } = useQuery({
    queryKey: ["urgent-complaints"],
    queryFn: () => getComplaints({ limit: 6 }),
  });

  const urgentIssues = (complaintsResult?.data || [])
    .filter((c) => c.status !== "RESOLVED" && c.status !== "CLOSED")
    .sort(
      (a, b) =>
        new Date(a.slaDeadline).getTime() - new Date(b.slaDeadline).getTime()
    )
    .slice(0, 5);

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const kpis = [
    {
      label: "Total Complaints",
      value: summary?.totalComplaints ?? 0,
      icon: ClipboardList,
      color: "text-primary",
    },
    {
      label: "Open Issues",
      value: summary?.totalOpen ?? 0,
      icon: AlertTriangle,
      color: "text-destructive",
    },
    {
      label: "Resolved",
      value: summary?.totalResolved ?? 0,
      icon: CheckCircle2,
      color: "text-success",
    },
    {
      label: "Resolution Rate",
      value: `${summary?.resolutionRate ?? 0}%`,
      icon: TrendingUp,
      color: "text-primary",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time overview of civic issues
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-card rounded-lg border p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <p className="text-3xl font-bold mt-2 text-card-foreground">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Alert cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          className={`rounded-lg border p-5 ${
            (summary?.totalBreached ?? 0) > 0
              ? "bg-destructive/5 border-destructive/20"
              : "bg-card"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={`w-5 h-5 ${
                (summary?.totalBreached ?? 0) > 0
                  ? "text-destructive animate-pulse"
                  : "text-muted-foreground"
              }`}
            />
            <p className="text-sm font-medium text-foreground">SLA Breached</p>
          </div>
          <p
            className={`text-3xl font-bold mt-2 ${
              (summary?.totalBreached ?? 0) > 0
                ? "text-destructive"
                : "text-card-foreground"
            }`}
          >
            {summary?.totalBreached ?? 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Issues past deadline
          </p>
        </div>
        <div className="bg-card rounded-lg border p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <p className="text-sm font-medium text-foreground">
              Critical Issues
            </p>
          </div>
          <p className="text-3xl font-bold mt-2 text-card-foreground">
            {summary?.totalCritical ?? 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Require immediate attention
          </p>
        </div>
      </div>

      {/* SLA Compliance by Department */}
      {slaStats && slaStats.length > 0 && (
        <div className="bg-card rounded-lg border">
          <div className="p-5 border-b">
            <h2 className="font-semibold text-foreground">
              SLA Compliance by Department
            </h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {slaStats
                .filter((s) => s.totalComplaints > 0)
                .map((stat) => (
                  <div key={stat.departmentId} className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {stat.departmentName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              stat.slaComplianceRate >= 80
                                ? "bg-green-500"
                                : stat.slaComplianceRate >= 50
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${stat.slaComplianceRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground w-10 text-right">
                          {stat.slaComplianceRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Urgent Issues Table */}
      <div className="bg-card rounded-lg border">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Urgent Issues</h2>
          <Link
            to="/issues"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {complaintsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
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
                    Type
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Priority
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Score
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    SLA
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Reported
                  </th>
                </tr>
              </thead>
              <tbody>
                {urgentIssues.map((issue) => {
                  const sla = getSlaStatus(issue);
                  return (
                    <tr
                      key={issue.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-3">
                        <Link
                          to={`/issues/${issue.id}`}
                          className="text-foreground hover:text-primary transition-colors line-clamp-1 max-w-[250px]"
                        >
                          {issue.description
                            ? issue.description.slice(0, 60) +
                              (issue.description.length > 60 ? "..." : "")
                            : issue.issueType}
                        </Link>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {issue.issueType}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getSeverityBadge(
                            issue.severity
                          )}`}
                        >
                          {getSeverityLabel(issue.severity)}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-xs font-bold text-foreground">
                          {issue.priorityScore}/100
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
                          {getSlaTimeRemaining(issue.slaDeadline)}
                        </div>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {formatRelativeTime(issue.createdAt)}
                      </td>
                    </tr>
                  );
                })}
                {urgentIssues.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No urgent issues. All clear!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
