'use client';
import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  DatePicker,
  InputNumber,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/app/lib/axios';

export default function CouponsPage() {
  const [form] = Form.useForm();
  const [coupons, setCoupons] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Fetch coupons
  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/coupons');
      const data = res.data?.coupons ?? res.data ?? [];
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetch coupons', err);
      message.error(err?.response?.data?.message || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  // Fetch hotels for dropdown
  const fetchHotels = async () => {
    try {
      const res = await api.get('/admin/hotels');
      const data = res.data?.hotels ?? res.data ?? [];
      setHotels(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load hotels for coupons', err);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchHotels();
  }, []);

  // Submit (create or update)
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        code: values.code,
        title: values.title || '',
        description: values.description || '',
        price: values.price != null ? Number(values.price) : undefined,
        discountType: values.discountType, // 'percentage' | 'fixed'
        discountValue: Number(values.discountValue) || 0,
        // map expiry date -> validTo
        validTo: values.expiryDate ? values.expiryDate.toISOString() : undefined,
        minOrderValue: values.minOrderValue ?? 0,
        maxDiscount: values.maxDiscount ?? undefined,
        usageLimit: values.usageLimit ?? 0,
        perUserLimit: values.perUserLimit ?? 1,
        applicableHotels: values.hotels || [], // array of hotel ids
        status: values.status || 'active',
      };

      if (editing && editing._id) {
        await api.put(`/admin/coupons/${editing._id}`, payload);
        message.success('Coupon updated');
      } else {
        await api.post('/admin/coupons', payload);
        message.success('Coupon created');
      }

      form.resetFields();
      setOpen(false);
      setEditing(null);
      await fetchCoupons();
    } catch (err) {
      console.error('Coupon save error:', err);
      message.error(err?.response?.data?.message || err?.message || 'Failed to save coupon');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/coupons/${id}`);
      message.success('Coupon deleted');
      fetchCoupons();
    } catch (err) {
      console.error('delete coupon', err);
      message.error(err?.response?.data?.message || 'Failed to delete coupon');
    }
  };

  // Edit fill
  const handleEdit = (coupon) => {
    setEditing(coupon);
    setOpen(true);

    form.setFieldsValue({
      code: coupon.code,
      title: coupon.title,
      description: coupon.description,
      price: coupon.price ?? undefined,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      expiryDate: coupon.validTo ? dayjs(coupon.validTo) : null,
      minOrderValue: coupon.minOrderValue ?? coupon.minAmount ?? 0,
      maxDiscount: coupon.maxDiscount ?? undefined,
      usageLimit: coupon.usageLimit ?? 0,
      perUserLimit: coupon.perUserLimit ?? 1,
      hotels: (coupon.applicableHotels || coupon.hotels || []).map((h) => (typeof h === 'string' ? h : h._id)),
      status: coupon.status,
    });
  };

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code' },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (p) => (p != null ? `₹${p}` : '-'),
    },
    {
      title: 'Discount',
      key: 'discount',
      render: (_, record) =>
        record.discountType === 'percentage'
          ? `${record.discountValue}%`
          : `₹${record.discountValue}`,
    },
    {
      title: 'Expiry',
      dataIndex: 'validTo',
      key: 'validTo',
      render: (d) => (d ? dayjs(d).format('DD MMM YYYY') : '-'),
    },
    {
      title: 'Min Order',
      dataIndex: 'minOrderValue',
      key: 'minOrderValue',
      render: (v) => (v !== undefined ? `₹${v}` : '-'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s) => (
        <Tag color={s === 'active' ? 'blue' : 'red'}>{String(s || '').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Delete this coupon?"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space
        align="center"
        style={{
          marginBottom: 16,
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <h2 style={{ margin: 0 }}>Coupons</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setEditing(null);
            setOpen(true);
          }}
        >
          Create Coupon
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={coupons}
        rowKey={(r) => r._id || r.id}
        loading={loading}
      />

      <Modal
        open={open}
        title={editing ? 'Edit Coupon' : 'Create Coupon'}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
        }}
        onOk={handleSubmit}
        okText="Save"
        confirmLoading={submitting}
        destroyOnHidden
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            name="code"
            label="Coupon Code"
            rules={[{ required: true, message: 'Enter coupon code' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="title" label="Title">
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input />
          </Form.Item>

          <Form.Item
            name="price"
            label="Price (₹)"
            rules={[
              { required: false },
              { type: 'number', message: 'Price must be a number' },
            ]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="discountType"
            label="Discount Type"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="percentage">Percentage (%)</Select.Option>
              <Select.Option value="fixed">Fixed (₹)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="discountValue"
            label="Discount Value"
            rules={[{ required: true, message: 'Enter discount value' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="maxDiscount" label="Max Discount (for percentage, optional)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="expiryDate" label="Expiry Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="minOrderValue" label="Minimum Order Amount">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="usageLimit" label="Usage Limit (global, 0 = unlimited)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="perUserLimit" label="Per User Limit">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="hotels" label="Applicable Hotels">
            <Select
              mode="multiple"
              placeholder="Select hotels"
              optionFilterProp="children"
            >
              {hotels.map((h) => (
                <Select.Option key={h._id} value={h._id}>
                  {h.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            initialValue="active"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
              <Select.Option value="expired">Expired</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
