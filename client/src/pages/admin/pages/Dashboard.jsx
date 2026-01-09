import { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Typography, Space, Spin } from "antd";
import {
  UserOutlined,
  FileTextOutlined,
  FlagOutlined,
  StarOutlined,
} from "@ant-design/icons";
import api from "../../../api/axios";

const { Title } = Typography;

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const { data } = await api.get("/admin/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div>
        <Title level={2}>Dashboard</Title>
        <Typography.Text type="secondary">
          Overview of your Chirp platform
        </Typography.Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats?.total_users || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Posts"
              value={stats?.total_posts || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Reports"
              value={stats?.pending_reports || 0}
              prefix={<FlagOutlined />}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Average Rating"
              value={stats?.average_rating?.toFixed(1) || 0}
              prefix={<StarOutlined />}
              suffix="/ 5"
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Recent Activity" style={{ height: 400 }}>
            <Typography.Text type="secondary">
              Coming soon: Real-time activity feed
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Quick Actions" style={{ height: 400 }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Card.Grid style={{ width: "100%", cursor: "pointer" }}>
                <Space>
                  <FlagOutlined style={{ fontSize: 20, color: "#667eea" }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Review Reports</div>
                    <Typography.Text type="secondary">
                      {stats?.pending_reports || 0} pending
                    </Typography.Text>
                  </div>
                </Space>
              </Card.Grid>
              <Card.Grid style={{ width: "100%", cursor: "pointer" }}>
                <Space>
                  <UserOutlined style={{ fontSize: 20, color: "#667eea" }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Manage Users</div>
                    <Typography.Text type="secondary">
                      {stats?.total_users || 0} users
                    </Typography.Text>
                  </div>
                </Space>
              </Card.Grid>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default DashboardPage;
