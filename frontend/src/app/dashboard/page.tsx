'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    if (user) {
      switch (user.role) {
        case 'administrator':
          router.push('/dashboard/admin');
          break;
        case 'store_manager':
          router.push('/dashboard/manager');
          break;
        case 'retail_analyst':
          router.push('/dashboard/analyst');
          break;
        case 'marketing_manager':
          router.push('/dashboard/marketing');
          break;
        default:
          router.push('/dashboard/analyst');
      }
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
