'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, UserRole } from '@/store/authStore';
import { 
  LayoutDashboard, ShoppingBag, Eye, Map, LogOut, 
  BarChart3, Settings, AlertTriangle, User as UserIcon, Camera
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, logout, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    // If not authenticated after state initialization, redirect to login
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const navItems: SidebarItem[] = [
    {
      name: 'Executive Insights',
      href: '/dashboard/analyst',
      icon: <LayoutDashboard className="w-5 h-5" />,
      roles: ['administrator', 'store_manager', 'retail_analyst', 'marketing_manager']
    },
    {
      name: 'Manager Live CCTV',
      href: '/dashboard/manager',
      icon: <Camera className="w-5 h-5" />,
      roles: ['administrator', 'store_manager']
    },
    {
      name: 'Marketing Conversions',
      href: '/dashboard/marketing',
      icon: <BarChart3 className="w-5 h-5" />,
      roles: ['administrator', 'marketing_manager', 'retail_analyst']
    },
    {
      name: 'Admin Panel',
      href: '/dashboard/admin',
      icon: <Settings className="w-5 h-5" />,
      roles: ['administrator']
    }
  ];

  const currentRoleLabel = user.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col md:flex-row text-zinc-100">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-zinc-950 border-b md:border-b-0 md:border-r border-zinc-900 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-zinc-900/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <ShoppingBag className="w-5 h-5 text-[#09090b]" />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-lg tracking-tight">CAMS</h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Retail AI Engine</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item, idx) => {
              const hasRoleAccess = item.roles.includes(user.role);
              if (!hasRoleAccess) return null;
              
              return (
                <button
                  key={idx}
                  onClick={() => router.push(item.href)}
                  className="w-full flex items-center gap-3.5 px-4 py-3 text-sm font-medium rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/50 transition-all cursor-pointer text-left"
                >
                  {item.icon}
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile footer */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-950/40">
          <div className="flex items-center gap-3 px-2 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
              <UserIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-bold text-white truncate">{user.full_name}</h4>
              <p className="text-xs text-emerald-500/80 font-medium truncate">{currentRoleLabel}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-950/10 transition-all cursor-pointer text-left border border-zinc-900 hover:border-red-900/30"
          >
            <LogOut className="w-4 h-4" />
            Sign Out Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-zinc-950/10">
        {children}
      </main>
    </div>
  );
}
