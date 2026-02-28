import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  getToken,
  setToken,
  clearToken,
  getStoredUser,
  setStoredUser,
  authAPI,
} from '@/services/api';

interface User {
  id: string;
  phone: string;
  name: string | null;
  role: string;
}

interface AuthCtx {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  sendOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (phone: string, otp: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) { setIsLoading(false); return; }

        // fast restore from storage
        const stored = await getStoredUser();
        if (stored) { setUser(stored); setIsAuthenticated(true); }

        // validate with backend
        const res = await authAPI.getMe();
        if (res.success && res.data) {
          setUser(res.data);
          await setStoredUser(res.data);
          setIsAuthenticated(true);
        } else if (!stored) {
          await clearToken();
          setIsAuthenticated(false);
        }
      } catch {
        const t = await getToken();
        setIsAuthenticated(!!t);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const sendOtp = async (phone: string) => {
    const r = await authAPI.sendOtp(phone);
    return r.success ? { success: true } : { success: false, error: r.error || 'Failed to send OTP' };
  };

  const verifyOtp = async (phone: string, otp: string, name?: string) => {
    const r = await authAPI.verifyOtp(phone, otp, name);
    if (!r.success || !r.data) return { success: false, error: r.error || 'Verification failed' };

    await setToken(r.data.token);
    await setStoredUser(r.data.user);
    setUser(r.data.user);
    setIsAuthenticated(true);
    return { success: true };
  };

  const logout = async () => {
    await clearToken();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, sendOtp, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
