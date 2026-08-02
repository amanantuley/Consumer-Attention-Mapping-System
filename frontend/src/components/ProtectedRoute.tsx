import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-[28px] border border-white/10 bg-slate-950/70 px-8 py-6 text-center text-slate-300 shadow-[0_24px_80px_-28px_rgba(2,6,23,0.95)] backdrop-blur-2xl">
          <div className="mb-3 h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-400" />
          <p className="text-lg font-semibold text-white">Loading workspace…</p>
          <p className="mt-2 text-sm text-slate-400">Preparing your dashboard experience.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role.name)) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-[28px] border border-red-500/20 bg-slate-950/70 px-8 py-8 text-center shadow-[0_24px_80px_-28px_rgba(2,6,23,0.95)] backdrop-blur-2xl">
          <h1 className="text-2xl font-semibold text-white">Access denied</h1>
          <p className="mt-2 text-sm text-slate-400">You do not have permission to view this area.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
