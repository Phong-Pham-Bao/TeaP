'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth, isRoleAllowed, ROLE_DEFAULT_ROUTES, type UserRole } from '@/lib/auth-context';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (allowedRoles) {
      if (!allowedRoles.includes(user.role)) {
        const fallback = ROLE_DEFAULT_ROUTES[user.role] || '/login';
        router.replace(fallback);
        return;
      }
    } else {
      if (!isRoleAllowed(user.role, pathname)) {
        const fallback = ROLE_DEFAULT_ROUTES[user.role] || '/login';
        router.replace(fallback);
        return;
      }
    }
  }, [user, loading, router, pathname, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-slate-700"></div>
          <div className="text-sm text-slate-500">Đang kiểm tra quyền truy cập...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <AccessDeniedFallback userRole={user.role} />;
  }

  if (!allowedRoles && !isRoleAllowed(user.role, pathname)) {
    return <AccessDeniedFallback userRole={user.role} />;
  }

  return <>{children}</>;
}

function AccessDeniedFallback({ userRole }: { userRole: UserRole }) {
  const fallback = ROLE_DEFAULT_ROUTES[userRole] || '/login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 text-center space-y-6 shadow-sm">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">Không có quyền truy cập</h2>
          <p className="text-sm text-slate-500">
            Tài khoản của bạn không được cấp phép truy cập vào khu vực này.
          </p>
        </div>
        <Link
          href={fallback}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay về trang làm việc</span>
        </Link>
      </div>
    </div>
  );
}
