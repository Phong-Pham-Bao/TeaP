'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'CASHIER') {
        router.push('/pos');
      } else if (user.role === 'MANAGER') {
        router.push('/manager');
      } else if (user.role === 'HR') {
        router.push('/staff');
      } else if (user.role === 'WAREHOUSE_STAFF') {
        router.push('/warehouse');
      } else if (user.role === 'KITCHEN') {
        router.push('/kitchen');
      } else {
        router.push('/admin');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-700"></div>
    </div>
  );
}
