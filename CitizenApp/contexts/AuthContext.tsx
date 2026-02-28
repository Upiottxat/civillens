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

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  sendOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (phone: string, otp: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Try to restore user from storage first (instant)
      const storedUser = await getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        setIsAuthenticated(true);
      }

      // Validate token with the backend in the background
      const result = await authAPI.getMe();
      if (result.success && result.data) {
        setUser(result.data);
        await setStoredUser(result.data);
        setIsAuthenticated(true);
      } else {
        // Token is invalid/expired — clear everything
        await clearToken();
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // On network error, trust the stored token (offline support)
      const token = await getToken();
      setIsAuthenticated(!!token);
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async (phone: string): Promise<{ success: boolean; error?: string }> => {
    const result = await authAPI.sendOtp(phone);
    if (!result.success) {
      return { success: false, error: result.error || 'Failed to send OTP' };
    }
    return { success: true };
  };

  const verifyOtp = async (
    phone: string,
    otp: string,
    name?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await authAPI.verifyOtp(phone, otp, name);
    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'OTP verification failed' };
    }

    // Store token and user
    await setToken(result.data.token);
    await setStoredUser(result.data.user);
    setUser(result.data.user);
    setIsAuthenticated(true);

    return { success: true };
  };

  const logout = async () => {
    try {
      await clearToken();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, sendOtp, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
