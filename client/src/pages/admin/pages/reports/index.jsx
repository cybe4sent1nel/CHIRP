import { useState, useEffect } from "react";
import {
  Table,
  Card,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Select,
  Input,
  message,
  Typography,
  Badge,
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import api from "../../../../api/axios";

const { Title } = Typography;
const { TextArea } = Input;

export const ReportList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionModal, setActionModal] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const { data } = await api.get("/admin/reports", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setReports(data.data);
      }
    } catch (error) {
      message.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const handleTakeAction = async (values) => {
    try {
      const token = localStorage.getItem("admin_token");
      const { data } = await api.patch(
        `/admin/reports/${selectedReport._id}`,
        values,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        message.success("Action taken successfully");
        setActionModal(false);
        form.resetFields();
        fetchReports();
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to take action");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "gold",
      reviewed: "blue",
      resolved: "green",
    };
    return colors[status] || "default";
  };

  const getActionColor = (action) => {
    const colors = {
      no_action: "default",
      content_removed: "red",
      user_warned: "orange",
      user_suspended: "volcano",
      user_banned: "magenta",
    };
    return colors[action] || "default";
  };

  const columns = [
    {
      title: "Reporter",
      dataIndex: ["reported_by", "username"],
      key: "reporter",
      render: (username) => username || "Unknown",
    },
    {
      title: "Reported User",
      dataIndex: ["reported_user", "username"],
      key: "reported_user",
      render: (username) => username || "Unknown",
    },
    {
      title: "Type",
      dataIndex: "item_type",
      key: "type",
      render: (type) => (
        <Tag color="blue">{type?.toUpperCase() || "N/A"}</Tag>
      ),
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      render: (reason) => reason?.replace(/_/g, " ").toUpperCase(),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Badge status={status === "pending" ? "processing" : "success"} text={status} />
      ),
    },
    {
      title: "Action Taken",
      dataIndex: "action_taken",
      key: "action",
      render: (action) =>
        action ? (
          <Tag color={getActionColor(action)}>
            {action.replace(/_/g, " ").toUpperCase()}
          </Tag>
        ) : (
          "-"
        ),
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "date",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedReport(record);
            setActionModal(true);
          }}
        >
          Review
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Title level={2}>Reports</Title>
        <Button onClick={fetchReports}>Refresh</Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={reports}
          loading={loading}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Take Action on Report"
        open={actionModal}
        onCancel={() => {
          setActionModal(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        {selectedReport && (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Card size="small" title="Report Details">
              <p>
                <strong>Reporter:</strong> {selectedReport.reported_by?.username}
              </p>
              <p>
                <strong>Reported User:</strong>{" "}
                {selectedReport.reported_user?.username}
              </p>
              <p>
                <strong>Type:</strong> {selectedReport.item_type}
              </p>
              <p>
                <strong>Reason:</strong> {selectedReport.reason?.replace(/_/g, " ")}
              </p>
              {selectedReport.description && (
                <p>
                  <strong>Description:</strong> {selectedReport.description}
                </p>
              )}
            </Card>

            <Form form={form} layout="vertical" onFinish={handleTakeAction}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true }]}
              >
                <Select placeholder="Select status">
                  <Select.Option value="reviewed">Reviewed</Select.Option>
                  <Select.Option value="resolved">Resolved</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="action_taken"
                label="Action Taken"
                rules={[{ required: true }]}
              >
                <Select placeholder="Select action">
                  <Select.Option value="no_action">No Action</Select.Option>
                  <Select.Option value="content_removed">
                    Content Removed
                  </Select.Option>
                  <Select.Option value="user_warned">User Warned</Select.Option>
                  <Select.Option value="user_suspended">
                    User Suspended
                  </Select.Option>
                  <Select.Option value="user_banned">User Banned</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item name="admin_notes" label="Admin Notes">
                <TextArea rows={4} placeholder="Add notes about this action..." />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    Submit Action
                  </Button>
                  <Button
                    onClick={() => {
                      setActionModal(false);
                      form.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>
    </Space>
  );
};

export const ReportShow = () => {
  return <div>Report Details View</div>;
};
