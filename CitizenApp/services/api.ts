import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── MODE SWITCH ─────────────────────────────────────────────────────────────
// Controlled via env var; defaults to real backend in production
const USE_BACKEND = process.env.EXPO_PUBLIC_USE_MOCK !== 'true';

// Lazy-load mock data only when needed (saves ~50KB from production bundle)
const getMocks = () => require('./mockData');

// ─── Server URL ──────────────────────────────────────────────────────────────
function getBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  // Railway deployed backend
  return 'https://devoted-radiance-production.up.railway.app/api/v1';
}

const BASE_URL = getBaseUrl();
const TOKEN_KEY = '@civiclens_token';
const USER_KEY = '@civiclens_user';
const TIMEOUT_MS = 12_000;

// ─── Token helpers ───────────────────────────────────────────────────────────

export const getToken = () => AsyncStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => AsyncStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
export const getStoredUser = async (): Promise<any | null> => {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
};
export const setStoredUser = (u: any) =>
  AsyncStorage.setItem(USER_KEY, JSON.stringify(u));

// ─── Fetch wrapper ───────────────────────────────────────────────────────────

interface ApiOpts {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: any;
  authenticated?: boolean;
  timeout?: number;
}

interface ApiRes<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: any;
}

async function apiFetch<T = any>(
  endpoint: string,
  opts: ApiOpts = {}
): Promise<ApiRes<T>> {
  const {
    method = 'GET',
    body,
    authenticated = true,
    timeout = TIMEOUT_MS,
  } = opts;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (authenticated) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeout);

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    clearTimeout(tid);
    return await res.json();
  } catch (err: any) {
    clearTimeout(tid);
    if (err.name === 'AbortError')
      return { success: false, error: 'Request timed out. Try again.' };
    return { success: false, error: 'Network error. Check your connection.' };
  }
}

// tiny delay for mock feel
const wait = (ms = 350) =>
  new Promise<void>((r) => setTimeout(r, ms + Math.random() * 200));

// ─── Auth API ────────────────────────────────────────────────────────────────

export const authAPI = {
  sendOtp: async (phone: string): Promise<ApiRes> => {
    if (!USE_BACKEND) {
      await wait(500);
      return { success: true, data: { message: 'OTP sent (demo)' } };
    }
    return apiFetch('/auth/send-otp', {
      method: 'POST',
      body: { phone },
      authenticated: false,
    });
  },

  verifyOtp: async (
    phone: string,
    otp: string,
    name?: string
  ): Promise<ApiRes<{ token: string; user: any }>> => {
    if (!USE_BACKEND) {
      const { MOCK_TOKEN, MOCK_USER } = getMocks();
      await wait(600);
      if (otp === '123456')
        return {
          success: true,
          data: {
            token: MOCK_TOKEN,
            user: { ...MOCK_USER, phone, name: name || MOCK_USER.name },
          },
        };
      return { success: false, error: 'Invalid OTP.' };
    }
    return apiFetch('/auth/verify-otp', {
      method: 'POST',
      body: { phone, otp, name },
      authenticated: false,
    });
  },

  getMe: async (): Promise<ApiRes> => {
    if (!USE_BACKEND) {
      const { MOCK_USER } = getMocks();
      await wait(150);
      const u = await getStoredUser();
      return { success: true, data: u || MOCK_USER };
    }
    return apiFetch('/auth/me');
  },
};

// ─── Complaints API ──────────────────────────────────────────────────────────

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
  submit: async (data: SubmitComplaintPayload): Promise<ApiRes> => {
    if (!USE_BACKEND) {
      const { mockSubmitComplaint } = getMocks();
      await wait(1000);
      return { success: true, data: mockSubmitComplaint(data) };
    }
    return apiFetch('/complaints', { method: 'POST', body: data });
  },

  getMine: async (): Promise<ApiRes<any[]>> => {
    if (!USE_BACKEND) {
      const { MOCK_COMPLAINTS } = getMocks();
      await wait(400);
      return { success: true, data: [...MOCK_COMPLAINTS] };
    }
    return apiFetch('/complaints/mine');
  },

  getById: async (id: string): Promise<ApiRes> => {
    if (!USE_BACKEND) {
      const { MOCK_COMPLAINTS } = getMocks();
      await wait(300);
      const c = MOCK_COMPLAINTS.find((x: any) => x.id === id);
      return c
        ? { success: true, data: c }
        : { success: false, error: 'Not found' };
    }
    return apiFetch(`/complaints/${id}`);
  },
};

// ─── Notifications API ───────────────────────────────────────────────────────

export const notificationsAPI = {
  getMine: async (): Promise<ApiRes<any[]>> => {
    if (!USE_BACKEND) {
      const { MOCK_NOTIFICATIONS } = getMocks();
      await wait(350);
      return { success: true, data: [...MOCK_NOTIFICATIONS] };
    }
    return apiFetch('/notifications');
  },
};

// ─── Classify API ────────────────────────────────────────────────────────────

export const classifyAPI = {
  classify: async (description: string): Promise<ApiRes> => {
    if (!USE_BACKEND) {
      const { mockClassify } = getMocks();
      await wait(500);
      return { success: true, data: { suggestion: mockClassify(description) } };
    }
    return apiFetch('/classify', {
      method: 'POST',
      body: { description },
      authenticated: false,
    });
  },
};

// ─── Gamification API ─────────────────────────────────────────────────────────

export const gamificationAPI = {
  /** Get coin wallet (balance + recent transactions) */
  getWallet: async (): Promise<ApiRes> => {
    return apiFetch('/gamification/wallet');
  },

  /** Get badges (earned + available) */
  getBadges: async (): Promise<ApiRes> => {
    return apiFetch('/gamification/badges');
  },

  /** Get leaderboard with optional scope filter */
  getLeaderboard: async (params?: {
    scope?: 'all' | 'city' | 'state';
    city?: string;
    state?: string;
    page?: number;
  }): Promise<ApiRes> => {
    const query = new URLSearchParams();
    if (params?.scope) query.set('scope', params.scope);
    if (params?.city) query.set('city', params.city);
    if (params?.state) query.set('state', params.state);
    if (params?.page) query.set('page', String(params.page));
    const qs = query.toString();
    return apiFetch(`/gamification/leaderboard${qs ? `?${qs}` : ''}`);
  },

  /** Get available rewards */
  getRewards: async (category?: string): Promise<ApiRes> => {
    const qs = category ? `?category=${category}` : '';
    return apiFetch(`/gamification/rewards${qs}`);
  },

  /** Redeem a reward by id */
  redeemReward: async (rewardId: string): Promise<ApiRes> => {
    return apiFetch(`/gamification/rewards/${rewardId}/redeem`, { method: 'POST' });
  },

  /** Get full gamification profile */
  getProfile: async (): Promise<ApiRes> => {
    return apiFetch('/gamification/profile');
  },

  /** Get user's redemption history */
  getMyRedemptions: async (): Promise<ApiRes> => {
    return apiFetch('/gamification/my-redemptions');
  },
};

export default apiFetch;
