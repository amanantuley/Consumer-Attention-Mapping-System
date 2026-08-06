import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  BarChart3,
  Users,
  LogOut,
  Menu,
  X,
  Cpu,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ElementType;
  allowedRoles: string[];
}

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems: SidebarItem[] = [
    {
      title: "Dashboard",
      href: `/dashboard/${user?.role.name.toLowerCase().replace(" ", "-")}`,
      icon: LayoutDashboard,
      allowedRoles: ["Administrator", "Store Manager", "Retail Analyst", "Marketing Manager"],
    },
    {
      title: "Stores",
      href: "/stores",
      icon: Store,
      allowedRoles: ["Administrator", "Store Manager"],
    },
    {
      title: "Users",
      href: "/users",
      icon: Users,
      allowedRoles: ["Administrator"],
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      allowedRoles: ["Administrator", "Retail Analyst", "Marketing Manager"],
    },
    {
      title: "System Status",
      href: "/system",
      icon: Cpu,
      allowedRoles: ["Administrator"],
    },
  ];

  const filteredItems = menuItems.filter((item) =>
    user ? item.allowedRoles.includes(user.role.name) : false
  );

  return (
    <div className="flex">
      <div
        className={cn(
          "fixed z-50 h-screen border-r border-white/10 bg-slate-950/90 backdrop-blur-2xl transition-all duration-300 md:relative",
          isOpen ? "w-72" : "w-20"
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-5">
          <div className={cn("flex items-center", !isOpen && "justify-center")}>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_18px_50px_-18px_rgba(34,211,238,0.75)]">
              <Video className="h-5 w-5 text-white" />
            </div>
            {isOpen && (
              <div className="ml-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-400">SignalOS</p>
                <p className="text-sm font-semibold text-slate-100">Attention Intelligence</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white md:hidden"
          >
            {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {isOpen && (
          <div className="px-4 pb-4 border-b border-white/10 text-[11px] uppercase tracking-[0.3em] text-slate-500">
            <p>Secure insights for every role</p>
          </div>
        )}

        <nav className="mt-6 space-y-1 px-3">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center rounded-2xl px-3 py-3 text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-300 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.2)]"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
                  !isOpen && "justify-center"
                )}
              >
                <Icon className="h-5 w-5" />
                {isOpen && <span className="ml-3">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4 bg-slate-950/80">
          <div className="mb-3 px-2 text-[10px] uppercase tracking-[0.3em] text-slate-500">Current role</div>
          <button
            onClick={logout}
            className={cn(
              "flex w-full items-center justify-center rounded-2xl px-3 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10",
              !isOpen && "justify-center"
            )}
          >
            <LogOut className="h-5 w-5" />
            {isOpen && <span className="ml-3">Sign out</span>}
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/60 md:hidden" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default Sidebar;
