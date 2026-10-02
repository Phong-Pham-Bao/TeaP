'use client';

import { usePathname } from 'next/navigation';
import RoleGuard from '@/components/role-guard';
import { isPublicRoute } from '@/lib/auth-context';

export default function ProtectedApp({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isPublicRoute(pathname)) {
    return <>{children}</>;
  }

  return <RoleGuard>{children}</RoleGuard>;
}
