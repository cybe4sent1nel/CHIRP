import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Upload,
  Button,
  Space,
  message,
  Form,
  Input,
  Select,
  Row,
  Col,
  Modal,
  Empty,
  Spin,
  Image,
  Tag,
} from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import api from '../../../api/axios';

export const AnimationManager = () => {
  const [form] = Form.useForm();
  const [animations, setAnimations] = useState({
    maintenance: null,
    error403: null,
    error404: null,
    error500: null,
    error408: null,
  });
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    fetchAnimations();
  }, []);

  const fetchAnimations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/animations', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setAnimations(data.animations || {
          maintenance: null,
          error403: null,
          error404: null,
          error500: null,
          error408: null,
        });
      }
    } catch (error) {
      message.error('Failed to fetch animations');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file, type) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      setLoading(true);
      const { data } = await api.post('/api/admin/animations/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (data.success) {
        message.success(`${type} animation uploaded successfully!`);
        setAnimations({
          ...animations,
          [type]: data.animation,
        });
      }
    } catch (error) {
      message.error('Failed to upload animation');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type) => {
    Modal.confirm({
      title: 'Delete Animation',
      content: `Are you sure you want to delete the ${type} animation?`,
      okText: 'Delete',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const { data } = await api.delete(`/api/admin/animations/${type}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (data.success) {
            message.success('Animation deleted successfully');
            setAnimations({
              ...animations,
              [type]: null,
            });
          }
        } catch (error) {
          message.error('Failed to delete animation');
        }
      },
    });
  };

  const AnimationCard = ({ type, title, description }) => (
    <Card
      title={title}
      extra={
        animations[type] && (
          <Tag color="green">
            <CheckCircleOutlined /> Uploaded
          </Tag>
        )
      }
      style={{ marginBottom: 16 }}
    >
      <p style={{ color: '#666', marginBottom: 16 }}>{description}</p>

      {animations[type] ? (
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>Current Animation:</strong>
          </div>
          <div
            style={{
              padding: '12px',
              background: '#f5f5f5',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{animations[type].filename}</span>
            <Space>
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => {
                  setPreviewData({
                    type: animations[type].type,
                    url: animations[type].url,
                  });
                  setPreviewModalVisible(true);
                }}
              >
                Preview
              </Button>
              <Button
                type="link"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(type)}
              >
                Delete
              </Button>
            </Space>
          </div>
        </div>
      ) : (
        <Empty description="No animation uploaded" style={{ margin: '24px 0' }} />
      )}

      <Upload
        maxCount={1}
        beforeUpload={(file) => {
          const isValidType = file.type === 'application/json' ||
            file.type === 'video/mp4' ||
            file.name.endsWith('.lottie');

          if (!isValidType) {
            message.error('Please upload a Lottie JSON, MP4 video, or .lottie file');
            return false;
          }

          const isLessThan50MB = file.size / 1024 / 1024 < 50;
          if (!isLessThan50MB) {
            message.error('File must be smaller than 50MB');
            return false;
          }

          handleUpload(file, type);
          return false;
        }}
      >
        <Button icon={<UploadOutlined />} block>
          {animations[type] ? 'Replace Animation' : 'Upload Animation'}
        </Button>
      </Upload>

      <p style={{ fontSize: 12, color: '#999', marginTop: 12 }}>
        Supported formats: Lottie JSON, Lottie .lottie file, or MP4 video (Max 50MB)
      </p>
    </Card>
  );

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Animation & Video Manager">
        <p style={{ marginBottom: 24, color: '#666' }}>
          Upload custom animations and videos for different pages. You can use Lottie
          animations (JSON/lottie files) or MP4 videos.
        </p>

        <Spin spinning={loading}>
          <AnimationCard
            type="maintenance"
            title="🛠️ Maintenance Page"
            description="Animation/video displayed when the site is under maintenance"
          />

          <AnimationCard
            type="error403"
            title="🚫 403 Access Denied"
            description="Animation/video for the 403 Access Denied error page"
          />

          <AnimationCard
            type="error404"
            title="❓ 404 Not Found"
            description="Animation/video for the 404 Page Not Found error page"
          />

          <AnimationCard
            type="error500"
            title="💥 500 Server Error"
            description="Animation/video for the 500 Server Error page"
          />

          <AnimationCard
            type="error408"
            title="⏱️ 408 Request Timeout"
            description="Animation/video for the 408 Request Timeout page"
          />
        </Spin>
      </Card>

      <Modal
        title="Preview Animation"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={null}
        width={700}
      >
        {previewData && (
          <div style={{ textAlign: 'center' }}>
            {previewData.type.includes('mp4') || previewData.url.endsWith('.mp4') ? (
              <video
                src={previewData.url}
                controls
                autoPlay
                loop
                style={{
                  width: '100%',
                  maxHeight: '500px',
                  borderRadius: '4px',
                }}
              />
            ) : (
              <div
                style={{
                  background: '#f5f5f5',
                  padding: '40px',
                  borderRadius: '4px',
                  minHeight: '400px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div>
                  <p>Lottie Animation Preview</p>
                  <p style={{ fontSize: 12, color: '#999' }}>
                    Animation will render on the actual page
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AnimationManager;
