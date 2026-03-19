'use client';
import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  Space,
  Typography,
  Popconfirm,
  Input,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '@/app/lib/axios';
import toast from 'react-hot-toast';

const { Title } = Typography;

export default function SliderPage() {
  const [form] = Form.useForm();
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ✅ Fetch sliders
  const fetchSliders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/sliders');
      setSliders(res.data || []);
    } catch (err) {
      toast.error('Failed to load sliders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSliders();
  }, []);

  // ✅ Save slider (URL only)
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      await api.post('/admin/sliders', {
        image: values.image, // 👈 only URL
      });

      toast.success('Slider added');
      form.resetFields();
      setOpen(false);
      fetchSliders();

    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Delete
  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/sliders/${id}`);
      toast.success('Deleted');
      fetchSliders();
    } catch {
      toast.error('Delete failed');
    }
  };

  // ✅ Table
  const columns = [
    {
      title: 'Image',
      dataIndex: 'image',
      render: (img) => (
        <img
          src={img}
          alt="slider"
          style={{
            width: 150,
            height: 80,
            objectFit: 'cover',
            borderRadius: 6,
          }}
        />
      ),
    },
    {
      title: 'URL',
      dataIndex: 'image',
      ellipsis: true,
    },
    {
      title: 'Actions',
      render: (_, record) => (
        <Popconfirm title="Delete?" onConfirm={() => handleDelete(record._id)}>
          <Button danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space
        style={{ justifyContent: 'space-between', width: '100%', marginBottom: 16 }}
      >
        <Title level={3}>Sliders</Title>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpen(true)}
        >
          Add Slider
        </Button>
      </Space>

      <Table
        dataSource={sliders}
        columns={columns}
        rowKey="_id"
        loading={loading}
      />

      {/* Modal */}
      <Modal
            title="Add Slider Image"
            open={open}
            onCancel={() => setOpen(false)}
            onOk={handleSubmit}
            confirmLoading={submitting}
            >
            <Form form={form} layout="vertical">
                <Form.Item
                name="image"
                label="Image URL"
                rules={[
                    { required: true, message: 'Please enter image URL' },
                    {
                    pattern: /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i,
                    message: 'Enter valid image URL (jpg, png, etc)',
                    },
                ]}
                >
                <Input placeholder="Paste image URL (https://...)" />
                </Form.Item>
            </Form>
            </Modal>
    </div>
  );
}