import { Layout as AntdLayout, Menu, Spin } from "antd";
import {
  DashboardOutlined,
  FlagOutlined,
  TeamOutlined,
  UserOutlined,
  FormOutlined,
  CommentOutlined,
  SettingOutlined,
  BarChartOutlined,
  ToolOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AdminProfileDropdown from "./AdminProfileDropdown";

const { Header, Sider, Content } = AntdLayout;

export const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [identity, setIdentity] = useState(null);

  useEffect(() => {
    // Check if user is properly authenticated
    const token = localStorage.getItem("admin_token");
    const adminData = localStorage.getItem("admin_data");
    
    console.log("✅ [ADMIN LAYOUT] Checking credentials...");
    
    if (!token || !adminData) {
      console.warn("⚠️ [ADMIN LAYOUT] No admin credentials found - redirecting to login");
      navigate("/admin/login", { replace: true });
      return;
    }

    try {
      const admin = JSON.parse(adminData);
      console.log("👤 [ADMIN LAYOUT] Admin data:", admin);
      
      if (!admin.role || !['super_admin', 'admin', 'moderator'].includes(admin.role)) {
        console.warn("⛔ [ADMIN LAYOUT] Invalid admin role - redirecting to 403");
        navigate("/error/403", { replace: true });
        return;
      }

      // Set identity for display
      setIdentity({
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name)}&background=667eea&color=fff`,
      });

      console.log("✅ [ADMIN LAYOUT] All checks passed");
      setIsChecking(false);
    } catch (error) {
      console.error("❌ [ADMIN LAYOUT] Failed to parse admin data - redirecting to login");
      navigate("/admin/login", { replace: true });
      return;
    }
  }, [navigate]);

  const handleLogout = () => {
    console.log("🔓 [ADMIN LAYOUT] Logging out...");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_email");
    localStorage.removeItem("admin_data");
    navigate("/admin/login", { replace: true });
  };

  const menuItems = [
    {
      key: "/admin/dashboard",
      icon: <DashboardOutlined />,
      label: <Link to="/admin/dashboard">Dashboard</Link>,
    },
    {
      key: "/admin/metrics",
      icon: <BarChartOutlined />,
      label: <Link to="/admin/metrics">Metrics</Link>,
    },
    {
      key: "/admin/reports",
      icon: <FlagOutlined />,
      label: <Link to="/admin/reports">Reports</Link>,
    },
    {
      key: "/admin/users",
      icon: <UserOutlined />,
      label: <Link to="/admin/users">Users</Link>,
    },
    {
      key: "/admin/admins",
      icon: <TeamOutlined />,
      label: <Link to="/admin/admins">Admins</Link>,
    },
    {
      key: "/admin/onboarding",
      icon: <FormOutlined />,
      label: <Link to="/admin/onboarding">Onboarding</Link>,
    },
    {
      key: "/admin/feedback",
      icon: <CommentOutlined />,
      label: <Link to="/admin/feedback">Feedback</Link>,
    },
    {
      key: "/admin/maintenance",
      icon: <ToolOutlined />,
      label: <Link to="/admin/maintenance">Maintenance</Link>,
    },
    {
      key: "/admin/ads",
      icon: <FileImageOutlined />,
      label: <Link to="/admin/ads">Homepage Ads</Link>,
    },
    {
      key: "/admin/animations",
      icon: <VideoCameraOutlined />,
      label: <Link to="/admin/animations">Animations</Link>,
    },
  ];



  // Show loading spinner while checking authentication
  if (isChecking) {
    return (
      <AntdLayout style={{ minHeight: "100vh" }}>
        <Content
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
          }}
        >
          <Spin size="large" tip="Verifying credentials..." />
        </Content>
      </AntdLayout>
    );
  }

  return (
    <AntdLayout style={{ minHeight: "100vh" }}>
      <Sider
        width={250}
        style={{
          background: "#fff",
          boxShadow: "2px 0 8px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid #f0f0f0",
            padding: "0 16px",
          }}
        >
          <img 
            src="/LOGOO.png" 
            alt="Chirp Logo" 
            style={{ 
              height: 50, 
              width: "auto",
              objectFit: "contain"
            }} 
            onError={(e) => {
              // Fallback to text if image fails to load
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<span style="font-weight: bold; font-size: 18px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">🐦 Chirp Admin</span>';
            }}
          />
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ border: "none", marginTop: 16 }}
        />
      </Sider>

      <AntdLayout>
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <div />
          <AdminProfileDropdown adminData={identity} />
        </Header>

        <Content
          style={{
            margin: 24,
            padding: 24,
            background: "#f5f5f5",
            borderRadius: 8,
          }}
        >
          {children}
        </Content>
      </AntdLayout>
    </AntdLayout>
  );
};
