import { useState, useEffect } from "react";
import { Table, Card, Tag, Typography, message } from "antd";
import api from "../../../../api/axios";

const { Title } = Typography;

export const OnboardingList = () => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchResponses();
  }, []);

  const fetchResponses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const { data } = await api.get("/api/admin/onboarding-responses", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setResponses(data.data);
      }
    } catch (error) {
      message.error("Failed to fetch onboarding responses");
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
      title: "Age Group",
      dataIndex: "age_group",
      key: "age_group",
      render: (age) => <Tag>{age}</Tag>,
    },
    {
      title: "Interests",
      dataIndex: "interests",
      key: "interests",
      render: (interests) => (
        <>
          {interests?.slice(0, 3).map((interest, i) => (
            <Tag key={i} color="blue">
              {interest}
            </Tag>
          ))}
          {interests?.length > 3 && <Tag>+{interests.length - 3}</Tag>}
        </>
      ),
    },
    {
      title: "Referral Source",
      dataIndex: "referral_source",
      key: "referral",
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "date",
      render: (date) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <Title level={2}>Onboarding Responses</Title>
      <Card>
        <Table
          columns={columns}
          dataSource={responses}
          loading={loading}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};