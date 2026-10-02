'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, ROLE_DEFAULT_ROUTES, type UserRole } from '@/lib/auth-context';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        const targetRoute = ROLE_DEFAULT_ROUTES[user.role as UserRole] || '/login';
        router.push(targetRoute);
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-600"></div>
    </div>
  );
}
