import React, { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Input,
  Space,
  Button,
  Tag,
  Modal,
  Form,
  Select,
  message,
  Drawer,
  Statistic,
  Row,
  Col,
  Avatar,
} from 'antd';
import {
  SearchOutlined,
  DeleteOutlined,
  EyeOutlined,
  MailOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import api from '../../../../api/axios';

export const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    verifiedUsers: 0,
  });

  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/user/all', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      message.error('Failed to fetch users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/api/admin/user-stats', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch user stats');
    }
  };

  const handleBanUser = async (userId) => {
    Modal.confirm({
      title: 'Ban User',
      content: 'Are you sure you want to ban this user?',
      okText: 'Ban',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const { data } = await api.post(
            `/api/admin/user/${userId}/ban`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (data.success) {
            message.success('User banned successfully');
            fetchUsers();
          }
        } catch (error) {
          message.error('Failed to ban user');
        }
      },
    });
  };

  const handleUnbanUser = async (userId) => {
    try {
      const { data } = await api.post(
        `/api/admin/user/${userId}/unban`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        message.success('User unbanned successfully');
        fetchUsers();
      }
    } catch (error) {
      message.error('Failed to unban user');
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'User',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (text, record) => (
        <Space>
          <Avatar src={record.profile_picture} icon={<MailOutlined />} />
          <div>
            <div style={{ fontWeight: 600 }}>{text}</div>
            <div style={{ fontSize: 12, color: '#999' }}>@{record.username}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => (
        <div style={{ wordBreak: 'break-word', maxWidth: 200 }}>{email}</div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (_, record) => (
        <Space>
          {record.emailVerified && <Tag color="green">Verified</Tag>}
          {record.is_banned && <Tag color="red">Banned</Tag>}
          {!record.is_banned && <Tag color="blue">Active</Tag>}
        </Space>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedUser(record);
              setDrawerVisible(true);
            }}
          >
            View
          </Button>
          {record.is_banned ? (
            <Button
              type="link"
              icon={<UnlockOutlined />}
              onClick={() => handleUnbanUser(record._id)}
            >
              Unban
            </Button>
          ) : (
            <Button
              type="link"
              danger
              icon={<LockOutlined />}
              onClick={() => handleBanUser(record._id)}
            >
              Ban
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="User Management" style={{ marginBottom: 24 }}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Statistic title="Total Users" value={stats.totalUsers} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="Active Users" value={stats.activeUsers} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="Verified" value={stats.verifiedUsers} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="Banned" value={stats.bannedUsers} />
          </Col>
        </Row>

        <Input
          placeholder="Search by name, username, or email..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ marginBottom: 16 }}
          size="large"
        />

        <Table
          columns={columns}
          dataSource={filteredUsers.map((u) => ({
            ...u,
            key: u._id,
          }))}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Drawer
        title="User Details"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedUser && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <strong>Name:</strong> {selectedUser.full_name}
            </div>
            <div>
              <strong>Username:</strong> @{selectedUser.username}
            </div>
            <div>
              <strong>Email:</strong> {selectedUser.email}
            </div>
            <div>
              <strong>Joined:</strong>{' '}
              {new Date(selectedUser.createdAt).toLocaleDateString()}
            </div>
            <div>
              <strong>Email Verified:</strong>{' '}
              {selectedUser.emailVerified ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Status:</strong>{' '}
              {selectedUser.is_banned ? 'Banned' : 'Active'}
            </div>
            <Avatar src={selectedUser.profile_picture} size={128} />
          </Space>
        )}
      </Drawer>
    </div>
  );
};

export default UserList;
