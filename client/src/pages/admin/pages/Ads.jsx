import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Upload,
  DatePicker,
  TimePicker,
  Switch,
  Space,
  message,
  Tag,
  Drawer,
  Image,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../../api/axios';

export const HomepageAds = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [previewAd, setPreviewAd] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/ads', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setAds(data.ads || []);
      }
    } catch (error) {
      message.error('Failed to fetch ads');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAd = () => {
    setEditingAd(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditAd = (ad) => {
    setEditingAd(ad);
    form.setFieldsValue({
      title: ad.title,
      description: ad.description,
      link: ad.link,
      isActive: ad.isActive,
      startDate: dayjs(ad.startDate),
      endDate: dayjs(ad.endDate),
      startTime: dayjs(ad.startTime, 'HH:mm'),
      endTime: dayjs(ad.endTime, 'HH:mm'),
    });
    setModalVisible(true);
  };

  const handleDeleteAd = async (adId) => {
    Modal.confirm({
      title: 'Delete Ad',
      content: 'Are you sure you want to delete this ad?',
      okText: 'Delete',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const { data } = await api.delete(`/api/admin/ads/${adId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (data.success) {
            message.success('Ad deleted successfully');
            fetchAds();
          }
        } catch (error) {
          message.error('Failed to delete ad');
        }
      },
    });
  };

  const handleSaveAd = async (values) => {
    try {
      const payload = {
        title: values.title,
        description: values.description,
        image: values.image?.file?.response?.url || editingAd?.image,
        link: values.link,
        isActive: values.isActive,
        startDate: values.startDate?.toDate(),
        endDate: values.endDate?.toDate(),
        startTime: values.startTime?.format('HH:mm'),
        endTime: values.endTime?.format('HH:mm'),
      };

      const endpoint = editingAd
        ? `/api/admin/ads/${editingAd._id}`
        : '/api/admin/ads';
      const method = editingAd ? 'put' : 'post';

      const { data } = await api[method](endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        message.success(
          editingAd ? 'Ad updated successfully' : 'Ad created successfully'
        );
        setModalVisible(false);
        fetchAds();
      }
    } catch (error) {
      message.error('Failed to save ad');
    }
  };

  const columns = [
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      render: (image) => (
        <Image
          src={image}
          alt="Ad"
          style={{ height: 50, borderRadius: 4 }}
          preview
        />
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Active Period',
      key: 'period',
      render: (_, record) => (
        <div style={{ fontSize: 12 }}>
          <div>{dayjs(record.startDate).format('MMM DD')}</div>
          <div>
            {record.startTime} - {record.endTime}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
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
              setPreviewAd(record);
              setDrawerVisible(true);
            }}
          >
            Preview
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditAd(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteAd(record._id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Homepage Advertisement"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddAd}
          >
            Add New Ad
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={ads.map((ad) => ({ ...ad, key: ad._id }))}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingAd ? 'Edit Ad' : 'Create New Ad'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveAd}>
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: 'Please enter title' }]}
          >
            <Input placeholder="Ad title" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea rows={3} placeholder="Ad description" />
          </Form.Item>

          <Form.Item
            label="Image"
            name="image"
            rules={[{ required: !editingAd, message: 'Please upload image' }]}
          >
            <Upload
              maxCount={1}
              beforeUpload={() => false}
            >
              <Button>Upload Image</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            label="Link/URL"
            name="link"
            rules={[
              { type: 'url', message: 'Invalid URL' },
            ]}
          >
            <Input placeholder="https://example.com" />
          </Form.Item>

          <Form.Item
            label="Start Date"
            name="startDate"
            rules={[{ required: true, message: 'Please select start date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="End Date"
            name="endDate"
            rules={[{ required: true, message: 'Please select end date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Start Time"
            name="startTime"
            rules={[{ required: true, message: 'Please select start time' }]}
          >
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="End Time"
            name="endTime"
            rules={[{ required: true, message: 'Please select end time' }]}
          >
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Active" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="Ad Preview"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {previewAd && (
          <div
            style={{
              padding: '16px',
              background: '#f5f5f5',
              borderRadius: '8px',
            }}
          >
            <Image src={previewAd.image} alt="Preview" style={{ width: '100%', marginBottom: 16 }} />
            <h3>{previewAd.title}</h3>
            <p>{previewAd.description}</p>
            <p>
              <strong>Period:</strong> {dayjs(previewAd.startDate).format('MMM DD')} -{' '}
              {dayjs(previewAd.endDate).format('MMM DD')}
            </p>
            <p>
              <strong>Time:</strong> {previewAd.startTime} - {previewAd.endTime}
            </p>
            {previewAd.link && (
              <Button type="primary" href={previewAd.link} target="_blank" block>
                Visit Link
              </Button>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default HomepageAds;
