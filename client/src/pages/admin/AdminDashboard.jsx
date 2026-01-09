import { Refine } from "@refinedev/core";
import routerBindings, {
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router-v6";
import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import {
  useNotificationProvider,
  Layout,
  ErrorComponent,
} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";
import { ConfigProvider, App as AntdApp } from "antd";
import dataProvider from "@refinedev/simple-rest";
import { authProvider } from "./authProvider";
import { DashboardPage, AdminLogin } from "./pages";
import { ReportList, ReportShow } from "./pages/reports";
import { AdminList, AdminCreate, AdminEdit } from "./pages/admins";
import { OnboardingList } from "./pages/onboarding";
import { FeedbackList } from "./pages/feedback";
import { UserList } from "./pages/users";
import { AdminLayout } from "./components/AdminLayout";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function AdminDashboard() {
  console.log("🚀 [ADMIN DASHBOARD] Component rendering...");
  console.log("🔗 [ADMIN DASHBOARD] API_URL:", API_URL);
  
  try {
    return (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#667eea",
            borderRadius: 8,
          },
        }}
      >
        <AntdApp>
          <Refine
              dataProvider={dataProvider(API_URL)}
              authProvider={authProvider}
              routerProvider={routerBindings}
              notificationProvider={useNotificationProvider}
            resources={[
              {
                name: "dashboard",
                list: "/admin/dashboard",
                meta: {
                  label: "Dashboard",
                  icon: "📊",
                },
              },
              {
                name: "reports",
                list: "/admin/reports",
                show: "/admin/reports/:id",
                meta: {
                  label: "Reports",
                  icon: "🚩",
                },
              },
              {
                name: "admins",
                list: "/admin/admins",
                create: "/admin/admins/create",
                edit: "/admin/admins/edit/:id",
                meta: {
                  label: "Admins",
                  icon: "👥",
                },
              },
              {
                name: "users",
                list: "/admin/users",
                meta: {
                  label: "Users",
                  icon: "👤",
                },
              },
              {
                name: "onboarding",
                list: "/admin/onboarding",
                meta: {
                  label: "Onboarding",
                  icon: "📝",
                },
              },
              {
                name: "feedback",
                list: "/admin/feedback",
                meta: {
                  label: "Feedback",
                  icon: "💬",
                },
              },
            ]}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
            }}
          >
            <Routes>
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              
              {/* Protected routes - require authentication */}
              <Route
                element={
                  <AdminLayout>
                    <Outlet />
                  </AdminLayout>
                }
              >
                <Route path="/admin/dashboard" element={<DashboardPage />} />
                <Route path="/admin/reports" element={<ReportList />} />
                <Route path="/admin/reports/:id" element={<ReportShow />} />
                <Route path="/admin/admins" element={<AdminList />} />
                <Route path="/admin/admins/create" element={<AdminCreate />} />
                <Route path="/admin/admins/edit/:id" element={<AdminEdit />} />
                <Route path="/admin/users" element={<UserList />} />
                <Route path="/admin/onboarding" element={<OnboardingList />} />
                <Route path="/admin/feedback" element={<FeedbackList />} />
              </Route>
            </Routes>
            <UnsavedChangesNotifier />
            <DocumentTitleHandler />
          </Refine>
        </AntdApp>
      </ConfigProvider>
    );
  } catch (error) {
    console.error("❌ [ADMIN DASHBOARD] Error rendering:", error);
    window.location.href = "/error/500";
    return null;
  }
}

export default AdminDashboard;
