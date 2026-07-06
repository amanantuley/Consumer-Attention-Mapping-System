'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, UserRole } from '@/store/authStore';
import { LogIn, ShoppingBag, Eye, Lock, Mail, Users, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user, initialize } = useAuthStore();
  const [email, setEmail] = useState('admin@cams.com');
  const [password, setPassword] = useState('adminpassword');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isAuthenticated && user) {
      redirectUser(user.role);
    }
  }, [isAuthenticated, user]);

  const redirectUser = (role: UserRole) => {
    switch (role) {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Authentication failed. Please verify credentials.');
      }

      const data = await res.json();
      
      // Fetch user profile info
      const profileRes = await fetch('/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      });
      
      if (!profileRes.ok) throw new Error('Failed to retrieve user profile.');
      
      const profileData = await profileRes.json();
      
      login(
        {
          email: profileData.email,
          full_name: profileData.full_name,
          role: profileData.role,
          is_active: profileData.is_active
        },
        data.access_token,
        data.refresh_token
      );
    } catch (err: any) {
      setError(err.message || 'Network error occurred. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#09090b] overflow-hidden px-4">
      {/* Abstract background blur shapes */}
      <div className="absolute top-1/4 left-1/4 w-[35rem] h-[35rem] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg z-10">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4 border border-emerald-400/20">
            <ShoppingBag className="w-7 h-7 text-[#09090b]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            CAMS
          </h1>
          <p className="text-zinc-400 text-sm max-w-sm">
            Consumer Attention Mapping System. AI-powered Retail Intelligence Platform.
          </p>
        </div>

        {/* Login Form Panel */}
        <div className="glass-panel rounded-3xl p-8 border border-zinc-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-blue-500" />
          
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <LogIn className="w-5 h-5 text-emerald-400" /> Enter Gateway
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-900/50 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                  placeholder="name@retailer.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Security Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 text-[#09090b] font-bold rounded-xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#09090b] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Authenticate <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Dev credentials tips */}
          <div className="mt-8 pt-6 border-t border-zinc-800/80 text-xs text-zinc-500 space-y-2">
            <div className="font-semibold text-zinc-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-zinc-400" /> Seeded Credentials for Testing:
            </div>
            <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-900 font-mono flex justify-between items-center">
              <div>
                <span className="text-emerald-400">admin@cams.com</span> / <span className="text-emerald-400">adminpassword</span>
              </div>
              <span className="text-[10px] text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                Administrator
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
