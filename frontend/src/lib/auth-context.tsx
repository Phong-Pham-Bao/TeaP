'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api, {
  clearAuthSession,
  refreshAuthSession,
  setAuthSession,
} from './api';
import routePolicy from './route-policy.json';

export type UserRole = 'SUPER_ADMIN' | 'MANAGER' | 'HR' | 'ACCOUNTANT' | 'CASHIER' | 'WAREHOUSE_STAFF' | 'KITCHEN_STAFF';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  branchId?: string | null;
  allowedBranchIds: string[];
}

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Tổng Quản Trị',
  MANAGER: 'Quản Lý Chi Nhánh',
  HR: 'Nhân Sự',
  ACCOUNTANT: 'Kế Toán',
  CASHIER: 'Thu Ngân',
  WAREHOUSE_STAFF: 'Thủ Kho',
  KITCHEN_STAFF: 'Nhân Viên Bếp',
};

export const ROLE_DEFAULT_ROUTES: Record<UserRole, string> = {
  ...routePolicy.defaultRoutes,
} as Record<UserRole, string>;

const ALL_ROLES = routePolicy.roles as UserRole[];

/**
 * Frontend route policy mirrors the backend role boundary. `null` means public;
 * an empty array means the route is unknown and must fail closed.
 */
export function getAllowedRoles(route: string): UserRole[] | null {
  const policy = routePolicy.routes.find((entry) =>
    entry.match === 'exact'
      ? route === entry.path
      : route === entry.path || route.startsWith(`${entry.path}/`),
  );
  if (!policy) return [];
  if (policy.access === 'public') return null;
  if (policy.access === 'authenticated') return ALL_ROLES;
  if ('roles' in policy) return policy.roles as UserRole[];
  return [];
}

export function isPublicRoute(route: string): boolean {
  return getAllowedRoles(route) === null;
}

export function isRoleAllowed(role: UserRole, route: string): boolean {
  const allowed = getAllowedRoles(route);
  if (allowed === null) return true;
  return allowed.includes(role);
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, csrfToken: string, user: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      try {
        const session = await refreshAuthSession<User>();
        if (!active) return;
        setUser(session.user);
      } catch {
        if (!active) return;
        clearAuthSession();
        setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const login = (token: string, nextCsrfToken: string, userData: User) => {
    setAuthSession(token, nextCsrfToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAuthSession();
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
