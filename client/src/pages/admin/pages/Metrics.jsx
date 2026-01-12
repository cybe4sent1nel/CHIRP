import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Empty,
  Spin,
  Space,
  Button,
} from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  HeartOutlined,
  MessageOutlined,
  EyeOutlined,
  FireOutlined,
} from '@ant-design/icons';
import api from '../../../api/axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'];

export const Metrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7d'); // 7d, 30d, 90d

  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    fetchMetrics();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [timeframe]);

  const fetchMetrics = async () => {
    try {
      const { data } = await api.get(`/api/admin/metrics?timeframe=${timeframe}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Spin size="large" tip="Loading metrics..." />
      </div>
    );
  }

  if (!metrics) {
    return <Empty description="Failed to load metrics" />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Real-Time App Metrics"
        extra={
          <Space>
            <Button
              type={timeframe === '7d' ? 'primary' : 'default'}
              onClick={() => setTimeframe('7d')}
            >
              7 Days
            </Button>
            <Button
              type={timeframe === '30d' ? 'primary' : 'default'}
              onClick={() => setTimeframe('30d')}
            >
              30 Days
            </Button>
            <Button
              type={timeframe === '90d' ? 'primary' : 'default'}
              onClick={() => setTimeframe('90d')}
            >
              90 Days
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={16}>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="Total Users"
              value={metrics.totalUsers}
              icon={<UserOutlined />}
              valueStyle={{ color: '#667eea' }}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="Total Posts"
              value={metrics.totalPosts}
              icon={<FileTextOutlined />}
              valueStyle={{ color: '#764ba2' }}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="Total Likes"
              value={metrics.totalLikes}
              icon={<HeartOutlined />}
              valueStyle={{ color: '#f093fb' }}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="Total Comments"
              value={metrics.totalComments}
              icon={<MessageOutlined />}
              valueStyle={{ color: '#4facfe' }}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="Total Views"
              value={metrics.totalViews}
              icon={<EyeOutlined />}
              valueStyle={{ color: '#43e97b' }}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="Active Users"
              value={metrics.activeUsers}
              icon={<FireOutlined />}
              valueStyle={{ color: '#ff6b6b' }}
              suffix={`/${metrics.totalUsers}`}
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="User Growth">
            {metrics.userGrowthChart?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.userGrowthChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#667eea"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Post Activity">
            {metrics.postActivityChart?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.postActivityChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="posts" fill="#764ba2" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="Engagement Breakdown">
            {metrics.engagementData?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={metrics.engagementData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {metrics.engagementData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Top Trending Hashtags">
            <Space direction="vertical" style={{ width: '100%' }}>
              {metrics.trendingHashtags?.map((hashtag, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px',
                    background: '#f5f5f5',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>#{hashtag.name}</span>
                  <span style={{ fontWeight: 600, color: '#667eea' }}>
                    {hashtag.count} posts
                  </span>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Metrics;
