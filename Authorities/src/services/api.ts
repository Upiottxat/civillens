/**
 * API service for the Authority Portal.
 * Talks to the same backend as the CitizenApp → same database.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "https://devoted-radiance-production.up.railway.app/api/v1";

// ─── Token management ──────────────────────────────────────────────────────

let authToken: string | null = localStorage.getItem("civilens_token");

export function setToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem("civilens_token", token);
  } else {
    localStorage.removeItem("civilens_token");
  }
}

export function getToken(): string | null {
  return authToken;
}

// ─── Generic fetch wrapper ─────────────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await res.json();

  if (!json.success) {
    throw new Error(json.error || "API request failed");
  }

  return json;
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export async function authorityLogin(email: string, password: string) {
  const res = await apiFetch<{
    token: string;
    user: import("@/data/types").AuthUser;
  }>("/auth/authority/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return res.data;
}

export async function authorityRegister(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  department?: string;
  designation?: string;
  role?: string;
}) {
  const res = await apiFetch<{
    token: string;
    user: import("@/data/types").AuthUser;
  }>("/auth/authority/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function getMe() {
  const res = await apiFetch<import("@/data/types").AuthUser>(
    "/auth/authority/me"
  );
  return res.data;
}

// ─── Dashboard ─────────────────────────────────────────────────────────────

export async function getDashboardSummary() {
  const res = await apiFetch<import("@/data/types").DashboardSummary>(
    "/dashboard/summary"
  );
  return res.data;
}

export async function getSLAStats() {
  const res = await apiFetch<import("@/data/types").SLADeptStats[]>(
    "/dashboard/sla-stats"
  );
  return res.data;
}

// ─── Complaints ────────────────────────────────────────────────────────────

interface GetComplaintsParams {
  status?: string;
  severity?: string;
  departmentId?: string;
  slaBreached?: string;
  page?: number;
  limit?: number;
}

export async function getComplaints(params: GetComplaintsParams = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== "" && val !== "all") {
      query.set(key, String(val));
    }
  });

  const qs = query.toString();
  const res = await apiFetch<import("@/data/types").Complaint[]>(
    `/complaints${qs ? `?${qs}` : ""}`
  );
  return { data: res.data, pagination: res.pagination };
}

export async function getComplaintById(id: string) {
  const res = await apiFetch<import("@/data/types").Complaint>(
    `/complaints/${id}`
  );
  return res.data;
}

export async function updateComplaintStatus(
  id: string,
  status: string,
  note?: string
) {
  const res = await apiFetch<import("@/data/types").Complaint>(
    `/complaints/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status, note }),
    }
  );
  return res.data;
}

export async function uploadProof(id: string, proofImageUrl: string) {
  const res = await apiFetch<import("@/data/types").Complaint>(
    `/complaints/${id}/proof`,
    {
      method: "PATCH",
      body: JSON.stringify({ proofImageUrl }),
    }
  );
  return res.data;
}

export async function assignComplaint(id: string, assignedToId: string) {
  const res = await apiFetch<import("@/data/types").Complaint>(
    `/complaints/${id}/assign`,
    {
      method: "PATCH",
      body: JSON.stringify({ assignedToId }),
    }
  );
  return res.data;
}
