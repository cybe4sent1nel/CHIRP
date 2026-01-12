import React, { useState, useEffect } from 'react';
import {
  Card,
  Switch,
  Input,
  Button,
  Space,
  message,
  Form,
  Select,
  Spin,
  Alert,
  Row,
  Col,
} from 'antd';
import api from '../../../api/axios';

export const Maintenance = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceData, setMaintenanceData] = useState(null);

  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    fetchMaintenanceStatus();
  }, []);

  const fetchMaintenanceStatus = async () => {
    try {
      const { data } = await api.get('/api/admin/maintenance', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setMaintenanceData(data.maintenance);
        setMaintenanceMode(data.maintenance?.enabled || false);
        form.setFieldsValue(data.maintenance || {});
      }
    } catch (error) {
      console.error('Failed to fetch maintenance status');
    }
  };

  const handleToggleMaintenance = async (checked) => {
    setLoading(true);
    try {
      const { data } = await api.post(
        '/api/admin/maintenance/toggle',
        { enabled: checked },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setMaintenanceMode(checked);
        message.success(
          checked ? 'Maintenance mode enabled' : 'Maintenance mode disabled'
        );
        fetchMaintenanceStatus();
      }
    } catch (error) {
      message.error('Failed to update maintenance mode');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMaintenance = async (values) => {
    setLoading(true);
    try {
      const { data } = await api.post(
        '/api/admin/maintenance/update',
        values,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        message.success('Maintenance settings updated');
        fetchMaintenanceStatus();
      }
    } catch (error) {
      message.error('Failed to update maintenance settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="Maintenance Mode" style={{ marginBottom: 24 }}>
            {maintenanceMode && (
              <Alert
                message="⚠️ Site is currently under maintenance"
                type="warning"
                style={{ marginBottom: 16 }}
              />
            )}

            <Space direction="vertical" style={{ width: '100%' }}>
              <div
                style={{
                  padding: '16px',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 600 }}>
                  Enable Maintenance Mode
                </span>
                <Switch
                  checked={maintenanceMode}
                  onChange={handleToggleMaintenance}
                  loading={loading}
                  size="large"
                />
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={handleSaveMaintenance}
                style={{ marginTop: 16 }}
              >
                <Form.Item
                  label="Page Title"
                  name="title"
                  rules={[
                    { required: true, message: 'Please enter page title' },
                  ]}
                >
                  <Input placeholder="e.g., We'll be back soon!" />
                </Form.Item>

                <Form.Item
                  label="Message"
                  name="message"
                  rules={[
                    { required: true, message: 'Please enter message' },
                  ]}
                >
                  <Input.TextArea
                    rows={5}
                    placeholder="Enter maintenance message..."
                  />
                </Form.Item>

                <Form.Item
                  label="Estimated Time"
                  name="estimatedTime"
                >
                  <Input placeholder="e.g., 2 hours" />
                </Form.Item>

                <Form.Item
                  label="Contact Email"
                  name="contactEmail"
                  rules={[{ type: 'email', message: 'Invalid email' }]}
                >
                  <Input placeholder="support@chirp.com" />
                </Form.Item>

                <Form.Item
                  label="Show on Routes"
                  name="routes"
                  help="Leave empty to show on all routes. Enter comma-separated routes to show only on specific pages."
                >
                  <Input placeholder="/,/explore,/profile" />
                </Form.Item>

                <Form.Item
                  label="Pigeon Messages (one per line)"
                  name="pigeonMessages"
                  help="Add witty messages that will rotate every 5 seconds. Start each message with an emoji!"
                >
                  <Input.TextArea
                    rows={8}
                    placeholder={'🐦 Chirp is taking a coffee break...\n🐦 Our servers are getting a spa day...\n🐦 We\'re under maintenance. Even digital birds need their rest!'}
                  />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                >
                  Save Settings
                </Button>
              </Form>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Preview">
            {maintenanceData ? (
              <div
                style={{
                  padding: '32px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '8px',
                  color: 'white',
                  textAlign: 'center',
                  minHeight: '400px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Background Video */}
                <video
                  src="/maintainence.mp4"
                  autoPlay
                  loop
                  muted
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0.15,
                    objectFit: 'cover',
                  }}
                />

                {/* Content */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🛠️</div>
                  <h1 style={{ color: 'white', marginBottom: 16 }}>
                    {maintenanceData.title || 'We\'ll be back soon!'}
                  </h1>
                  <p style={{ fontSize: 16, marginBottom: 24, opacity: 0.95 }}>
                    {maintenanceData.message || 'We\'re currently performing maintenance.'}
                  </p>
                  {maintenanceData.estimatedTime && (
                    <p style={{ fontSize: 14, opacity: 0.9 }}>
                      ⏱️ Estimated time: {maintenanceData.estimatedTime}
                    </p>
                  )}
                  {maintenanceData.contactEmail && (
                    <p style={{ fontSize: 14, opacity: 0.9 }}>
                      📧 Contact: {maintenanceData.contactEmail}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <Spin />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Maintenance;
