import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/layout/Sidebar";

// Lazy load dashboard pages
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const StoreManagerDashboard = lazy(() => import("./pages/StoreManagerDashboard"));
const RetailAnalystDashboard = lazy(() => import("./pages/RetailAnalystDashboard"));
const MarketingManagerDashboard = lazy(() => import("./pages/MarketingManagerDashboard"));
const StoresPage = lazy(() => import("./pages/StoresPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard"));

const App: React.FC = () => {
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith("/dashboard/");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.14),_transparent_24%),linear-gradient(180deg,#020617_0%,#060b16_55%,#090f19_100%)] text-slate-100">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex w-full">
                {!isDashboardRoute && <Sidebar />}
                <div className="flex-1">
                  <Suspense
                    fallback={
                      <div className="flex min-h-screen items-center justify-center">
                        <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-6 py-4 text-sm font-medium text-slate-300 shadow-[0_24px_80px_-28px_rgba(2,6,23,0.95)] backdrop-blur-2xl">
                          Preparing your workspace...
                        </div>
                      </div>
                    }
                  >
                    <Routes>
                      <Route
                        path="/dashboard/admin"
                        element={
                          <ProtectedRoute allowedRoles={["Administrator"]}>
                            <AdminDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/store-manager"
                        element={
                          <ProtectedRoute allowedRoles={["Store Manager"]}>
                            <StoreManagerDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/retail-analyst"
                        element={
                          <ProtectedRoute allowedRoles={["Retail Analyst"]}>
                            <RetailAnalystDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/marketing-manager"
                        element={
                          <ProtectedRoute allowedRoles={["Marketing Manager"]}>
                            <MarketingManagerDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/stores"
                        element={
                          <ProtectedRoute allowedRoles={["Administrator", "Store Manager"]}>
                            <StoresPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/users"
                        element={
                          <ProtectedRoute allowedRoles={["Administrator"]}>
                            <UsersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/analytics"
                        element={
                          <ProtectedRoute allowedRoles={["Administrator", "Retail Analyst", "Marketing Manager"]}>
                            <AnalyticsDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/" element={<Navigate to="/login" replace />} />
                    </Routes>
                  </Suspense>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
