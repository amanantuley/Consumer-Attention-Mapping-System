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

const App: React.FC = () => {
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith("/dashboard/");

  return (
    <div className="min-h-screen bg-[#070e17]">
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
                      <div className="flex items-center justify-center min-h-screen">
                        <div className="text-lg text-gray-600">Loading...</div>
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
