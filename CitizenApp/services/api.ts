import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─── Server URL Configuration ───────────────────────────────────────────────
// For local dev:
//   Android emulator  → 10.0.2.2 (maps to host localhost)
//   iOS simulator     → localhost (shares host network)
//   Physical device   → your machine's LAN IP (e.g. 192.168.x.x)
//
// Set EXPO_PUBLIC_API_URL in your .env or app.config for physical devices.

function getBaseUrl(): string {
  // Allow override via Expo env var (useful for physical devices / production)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  if (!__DEV__) {
    // Production — replace with your deployed API URL
    return 'https://api.civilens.in/api/v1';
  }

  // Dev mode: pick the right localhost alias per platform
  const host = Platform.select({
    android: '10.0.2.2',   // Android emulator → host machine
    ios: 'localhost',       // iOS simulator shares host network
    default: 'localhost',   // Web
  });

  return `http://${host}:4000/api/v1`;
}

const BASE_URL = getBaseUrl();

const TOKEN_KEY = '@civiclens_auth_token';
const USER_KEY = '@civiclens_user';

const REQUEST_TIMEOUT_MS = 15000; // 15 second timeout

// ─── Token helpers ──────────────────────────────────────────────────────────

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

export async function getStoredUser(): Promise<any | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function setStoredUser(user: any): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ─── Core fetch wrapper ─────────────────────────────────────────────────────

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: any;
  authenticated?: boolean;
  timeout?: number;
}

async function apiFetch<T = any>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<{ success: boolean; data?: T; error?: string; pagination?: any }> {
  const { method = 'GET', body, authenticated = true, timeout = REQUEST_TIMEOUT_MS } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authenticated) {
    const token = await getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // AbortController for request timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const json = await response.json();
    return json;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.error(`API Timeout [${method} ${endpoint}]: Request took > ${timeout}ms`);
      return { success: false, error: 'Request timed out. Please try again.' };
    }
    console.error(`API Error [${method} ${endpoint}]:`, err.message);
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

// ─── Auth API ───────────────────────────────────────────────────────────────

export const authAPI = {
  sendOtp: (phone: string) =>
    apiFetch('/auth/send-otp', {
      method: 'POST',
      body: { phone },
      authenticated: false,
    }),

  verifyOtp: (phone: string, otp: string, name?: string) =>
    apiFetch<{ token: string; user: any }>('/auth/verify-otp', {
      method: 'POST',
      body: { phone, otp, name },
      authenticated: false,
    }),

  getMe: () => apiFetch<any>('/auth/me'),
};

// ─── Complaints API ─────────────────────────────────────────────────────────

export interface SubmitComplaintPayload {
  issueType: string;
  description?: string;
  imageUrl?: string;
  latitude: number;
  longitude: number;
  locationLabel?: string;
  severity: string;
}

export const complaintsAPI = {
  submit: (data: SubmitComplaintPayload) =>
    apiFetch('/complaints', { method: 'POST', body: data }),

  getMine: () =>
    apiFetch<any[]>('/complaints/mine'),

  getById: (id: string) =>
    apiFetch<any>(`/complaints/${id}`),
};

// ─── Notifications API ───────────────────────────────────────────────────────

export const notificationsAPI = {
  getMine: () =>
    apiFetch<any[]>('/notifications'),
};

// ─── Classification API ─────────────────────────────────────────────────────

export const classifyAPI = {
  classify: (description: string) =>
    apiFetch<any>('/classify', {
      method: 'POST',
      body: { description },
      authenticated: false,
    }),
};

export default apiFetch;
