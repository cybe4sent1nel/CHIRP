import { useState, useEffect } from "react";
import { Table, Card, Rate, Typography, message, Space, Statistic, Row, Col } from "antd";
import { StarOutlined } from "@ant-design/icons";
import api from "../../../../api/axios";

const { Title, Paragraph } = Typography;

export const FeedbackList = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [averages, setAverages] = useState({ avgOverall: 0, avgNPS: 0 });

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const { data } = await api.get("/admin/feedback", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setFeedback(data.data);
        setAverages(data.averages);
      }
    } catch (error) {
      message.error("Failed to fetch feedback");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "User",
      dataIndex: ["user_id", "username"],
      key: "user",
    },
    {
      title: "Overall Rating",
      dataIndex: "overall_rating",
      key: "overall_rating",
      render: (rating) => <Rate disabled value={rating} />,
    },
    {
      title: "NPS Score",
      dataIndex: "nps_score",
      key: "nps_score",
      render: (score) => <span>{score}/10</span>,
    },
    {
      title: "Comments",
      dataIndex: "what_like_most",
      key: "comments",
      render: (text) => (
        <Paragraph ellipsis={{ rows: 2 }}>{text || "No comments"}</Paragraph>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "date",
      render: (date) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Title level={2}>User Feedback</Title>

      <Row gutter={16}>
        <Col span={12}>
          <Card>
            <Statistic
              title="Average Rating"
              value={averages.avgOverall?.toFixed(1) || 0}
              suffix="/ 5"
              prefix={<StarOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="Average NPS Score"
              value={averages.avgNPS?.toFixed(1) || 0}
              suffix="/ 10"
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={feedback}
          loading={loading}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </Space>
  );
};