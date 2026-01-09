import { useGetIdentity, useLogout } from "@refinedev/core";
import { Layout as AntdLayout, Menu, Avatar, Dropdown, Space, Typography } from "antd";
import {
  DashboardOutlined,
  FlagOutlined,
  TeamOutlined,
  UserOutlined,
  FormOutlined,
  CommentOutlined,
  LogoutOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";

const { Header, Sider, Content } = AntdLayout;
const { Text } = Typography;

export const AdminLayout = ({ children }) => {
  const { data: identity } = useGetIdentity();
  const { mutate: logout } = useLogout();
  const location = useLocation();

  const menuItems = [
    {
      key: "/admin/dashboard",
      icon: <DashboardOutlined />,
      label: <Link to="/admin/dashboard">Dashboard</Link>,
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
  ];

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        <div>
          <div style={{ fontWeight: 600 }}>{identity?.name}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {identity?.role}
          </Text>
        </div>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        Settings
      </Menu.Item>
      <Menu.Item
        key="logout"
        icon={<LogoutOutlined />}
        danger
        onClick={() => logout()}
      >
        Logout
      </Menu.Item>
    </Menu>
  );

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
          }}
        >
          <Text
            strong
            style={{
              fontSize: 20,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            🐦 Chirp Admin
          </Text>
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
          <Dropdown overlay={userMenu} trigger={["click"]}>
            <Space style={{ cursor: "pointer" }}>
              <Avatar src={identity?.avatar} size="large">
                {identity?.name?.[0]}
              </Avatar>
              <div>
                <div style={{ fontWeight: 600 }}>{identity?.name}</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {identity?.email}
                </Text>
              </div>
            </Space>
          </Dropdown>
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
