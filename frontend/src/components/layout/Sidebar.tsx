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
      allowedRoles: [
        "Administrator",
        "Store Manager",
        "Retail Analyst",
        "Marketing Manager",
      ],
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
          "bg-white border-r h-screen transition-all duration-300 fixed md:relative z-50",
          isOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-4 flex items-center justify-between border-b">
          <div className={cn("flex items-center", !isOpen && "justify-center")}>
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            {isOpen && (
              <span className="ml-3 font-bold text-lg text-gray-800">
                Attention Mapping
              </span>
            )}
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded-md hover:bg-gray-100 md:hidden"
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
        <nav className="mt-8 px-3">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-3 rounded-lg mb-2 transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-600 hover:bg-gray-100",
                  !isOpen && "justify-center"
                )}
              >
                <item.icon className="w-5 h-5" />
                {isOpen && <span className="ml-3">{item.title}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <button
            onClick={logout}
            className={cn(
              "flex items-center w-full px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors",
              !isOpen && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5" />
            {isOpen && <span className="ml-3">Log Out</span>}
          </button>
        </div>
      </div>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default Sidebar;
