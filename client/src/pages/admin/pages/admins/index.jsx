import { useState, useEffect } from "react";
import {
  Table,
  Card,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Typography,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import api from "../../../../api/axios";

const { Title } = Typography;

export const AdminList = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const { data } = await api.get("/api/admin/list", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setAdmins(data.data);
      }
    } catch (error) {
      message.error("Failed to fetch admins");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (values) => {
    try {
      const token = localStorage.getItem("admin_token");
      const { data } = await api.post("/api/admin/create", values, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        message.success("Admin created successfully");
        setCreateModal(false);
        form.resetFields();
        fetchAdmins();
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to create admin");
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    try {
      const token = localStorage.getItem("admin_token");
      const { data } = await api.delete(`/api/admin/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        message.success("Admin deleted successfully");
        fetchAdmins();
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to delete admin");
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      super_admin: "red",
      admin: "blue",
      moderator: "green",
    };
    return colors[role] || "default";
  };

  const isProtectedAdmin = (email) => {
    return email === "info.ops.chirp@gmail.com";
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <Space>
          {name}
          {isProtectedAdmin(record.email) && (
            <SafetyOutlined style={{ color: "#ff4d4f" }} />
          )}
        </Space>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => (
        <Tag color={getRoleColor(role)}>{role?.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "status",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Last Login",
      dataIndex: "last_login",
      key: "last_login",
      render: (date) => date ? new Date(date).toLocaleDateString() : "Never",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedAdmin(record);
              setEditModal(true);
              form.setFieldsValue(record);
            }}
            disabled={isProtectedAdmin(record.email)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this admin?"
            onConfirm={() => handleDeleteAdmin(record._id)}
            disabled={isProtectedAdmin(record.email)}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              disabled={isProtectedAdmin(record.email)}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Title level={2}>Admin Management</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModal(true)}
        >
          Create Admin
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={admins}
          loading={loading}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Create Admin Modal */}
      <Modal
        title="Create New Admin"
        open={createModal}
        onCancel={() => {
          setCreateModal(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateAdmin}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter valid email" },
            ]}
          >
            <Input placeholder="admin@chirp.com" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please enter name" }]}
          >
            <Input placeholder="John Doe" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: "Please select role" }]}
            initialValue="moderator"
          >
            <Select>
              <Select.Option value="moderator">Moderator</Select.Option>
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="super_admin">Super Admin</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Create Admin
              </Button>
              <Button
                onClick={() => {
                  setCreateModal(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export const AdminCreate = () => null;
export const AdminEdit = () => null;
