'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { api, ApiResponse } from '@/lib/api';
import {
  clearStoredAuth,
  getStoredAuth,
  setStoredAuth,
} from '@/lib/auth-storage';
import { User } from '@/lib/types';
import {
  isCustomerRole,
  isDashboardUserRole,
  isSuperAdminRole,
  type AppRole,
} from '@/lib/roles';
import type { DashboardRequestStatus, NotificationPreferences } from '@/lib/types';

interface AuthUserPayload {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  dashboardRequestStatus?: DashboardRequestStatus;
  sessionId?: string;
  phone?: string;
  companyName?: string;
  designation?: string;
  preferredLocale?: 'en' | 'mr';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  avatar?: string;
  notificationPreferences?: NotificationPreferences;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    remember?: boolean,
    otpSessionToken?: string
  ) => Promise<User>;
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    accountType?: 'customer' | 'layout_manager';
    requestNote?: string;
    document?: File | null;
  }) => Promise<{ pendingApproval: boolean }>;
  logout: () => Promise<void>;
  updateProfile: (data: {
    name?: string;
    email?: string;
    phone?: string;
    companyName?: string;
    designation?: string;
    preferredLocale?: 'en' | 'mr';
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    notificationPreferences?: Partial<NotificationPreferences>;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }) => Promise<User>;
  refreshUser: () => Promise<void>;
  isAuthenticated: () => boolean;
  /** Layout managers and super admins (dashboard access) */
  isDashboardUser: boolean;
  /** @deprecated Use isDashboardUser — kept for existing call sites */
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapAuthUser = (data: AuthUserPayload): User => ({
  _id: data.id,
  name: data.name,
  email: data.email,
  role: data.role,
  dashboardRequestStatus: data.dashboardRequestStatus || 'none',
  phone: data.phone || '',
  companyName: data.companyName || '',
  designation: data.designation || '',
  preferredLocale: data.preferredLocale === 'mr' ? 'mr' : 'en',
  address: data.address || '',
  city: data.city || '',
  state: data.state || '',
  country: data.country || '',
  avatar: data.avatar || '',
  notificationPreferences: data.notificationPreferences,
  isActive: true,
  createdAt: data.createdAt || '',
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = useCallback(
    (newToken: string, newUser: User, remember = true, newSessionId?: string | null) => {
      setStoredAuth(newToken, JSON.stringify(newUser), remember, newSessionId);
      setToken(newToken);
      setUser(newUser);
      setSessionId(newSessionId || null);
    },
    []
  );

  const logout = useCallback(async () => {
    const { token: storedToken, sessionId: storedSessionId } = getStoredAuth();

    if (storedToken) {
      try {
        await api.post(
          '/auth/logout',
          storedSessionId ? { sessionId: storedSessionId } : {},
          storedToken
        );
      } catch {
        // Clear local session even if logout API fails
      }
    }

    clearStoredAuth();
    setToken(null);
    setUser(null);
    setSessionId(null);
  }, []);

  const isAuthenticated = useCallback(() => Boolean(token && user), [token, user]);

  useEffect(() => {
    const init = async () => {
      const { token: storedToken, userJson, sessionId: storedSessionId } = getStoredAuth();

      if (!storedToken || !userJson) {
        setLoading(false);
        return;
      }

      setToken(storedToken);
      setUser(JSON.parse(userJson) as User);
      setSessionId(storedSessionId);

      try {
        const res = await api.get<AuthUserPayload>('/auth/me', storedToken);
        const mapped = mapAuthUser(res);
        setUser(mapped);

        const { isPersistent, sessionId: currentSessionId } = getStoredAuth();
        setStoredAuth(storedToken, JSON.stringify(mapped), isPersistent, currentSessionId);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [logout]);

  const login = async (
    email: string,
    password: string,
    remember = true,
    otpSessionToken?: string
  ) => {
    const res = await api.post<ApiResponse<AuthUserPayload>>('/auth/login', {
      email,
      password,
      otpSessionToken,
    });
    if (!res.token) throw new Error('No token received');
    const mapped = mapAuthUser(res.data);
    persist(res.token, mapped, remember, res.data.sessionId);
    return mapped;
  };

  const register = async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    accountType?: 'customer' | 'layout_manager';
    requestNote?: string;
    document?: File | null;
  }) => {
    const accountType = data.accountType || 'customer';
    const pendingApproval = accountType === 'layout_manager';

    if (pendingApproval) {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('phone', data.phone);
      formData.append('password', data.password);
      formData.append('confirmPassword', data.confirmPassword);
      formData.append('accountType', accountType);
      if (data.requestNote) formData.append('requestNote', data.requestNote);
      if (data.document) formData.append('document', data.document);
      await api.postForm('/auth/register', formData);
      return { pendingApproval: true };
    }

    await api.post<ApiResponse<AuthUserPayload>>('/auth/register', data);
    return { pendingApproval: false };
  };

  const updateProfile = async (data: {
    name?: string;
    email?: string;
    phone?: string;
    companyName?: string;
    designation?: string;
    preferredLocale?: 'en' | 'mr';
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    notificationPreferences?: Partial<NotificationPreferences>;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }) => {
    if (!token) throw new Error('Not authenticated');
    const payload = { ...data };
    if (!payload.newPassword) {
      delete payload.currentPassword;
      delete payload.newPassword;
      delete payload.confirmPassword;
    }
    const res = await api.put<AuthUserPayload>('/auth/me', payload, token);
    const mapped = mapAuthUser(res);
    const { isPersistent, sessionId: currentSessionId } = getStoredAuth();
    setStoredAuth(token, JSON.stringify(mapped), isPersistent, currentSessionId);
    setUser(mapped);
    return mapped;
  };

  const refreshUser = async () => {
    if (!token) return;
    const res = await api.get<AuthUserPayload>('/auth/me', token);
    const mapped = mapAuthUser(res);
    const { isPersistent, sessionId: currentSessionId } = getStoredAuth();
    setStoredAuth(token, JSON.stringify(mapped), isPersistent, currentSessionId);
    setUser(mapped);
  };

  const role = user?.role;
  const isDashboardUser = isDashboardUserRole(role);
  const isSuperAdmin = isSuperAdminRole(role);
  const isCustomer = isCustomerRole(role);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
        isAuthenticated,
        isDashboardUser,
        isAdmin: isDashboardUser,
        isSuperAdmin,
        isCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
