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
  Popconfirm,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/app/lib/axios';
import toast from 'react-hot-toast';

const { Option } = Select;

function generateCouponCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function PlansPage() {
  const [form] = Form.useForm();
  const [plans, setPlans] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Fetch plans
  const fetchPlans = async () => {
    setLoading(true);
    try {

      const res = await api.get('/admin/coupons/plans');

      const data = res.data?.plans ?? res.data ?? [];
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetch plans', err);
      toast.error(err?.response?.data?.message || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  // Fetch hotels
  const fetchHotels = async () => {
    try {
      const res = await api.get('/admin/hotels');
      const data = res.data?.hotels ?? res.data ?? [];
      setHotels(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load hotels for plans', err);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchHotels();
  }, []);

  // Submit (create / update)
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        name: values.name, // plan name
        title: values.title || '',
        description: values.description || '',
        price: values.price != null ? Number(values.price) : undefined, // plan price
        validTo: values.expiryDate ? values.expiryDate.toISOString() : undefined,
        applicableHotels: values.hotels || [],
        status: values.status || 'active',
        coupons: (values.coupons || []).map((c) => ({
          code: c.code,
          couponPrice:
            c.couponPrice != null && c.couponPrice !== ''
              ? Number(c.couponPrice)
              : undefined,
          discountType: c.discountType,
          discountValue: Number(c.discountValue) || 0,
          description: c.description || '',
          minOrderValue: c.minOrderValue ?? 0,
        })),
      };


      if (editing && editing._id) {
        await api.put(`/admin/coupons/plans/${editing._id}`, payload);
        toast.success('Plan updated');
      } else {
        await api.post('/admin/coupons/plans', payload);
        toast.success('Plan created');
      }

      form.resetFields();
      setOpen(false);
      setEditing(null);
      await fetchPlans();
    } catch (err) {
      if (err?.errorFields) {
        console.warn('Validation failed', err);
      } else {
        console.error('Plan save error:', err);
        toast.error(err?.response?.data?.message || err?.message || 'Failed to save plan');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/coupons/plans/${id}`);
      toast.success('Plan deleted');
      fetchPlans();
    } catch (err) {
      console.error('delete plan', err);
      toast.error(err?.response?.data?.message || 'Failed to delete plan');
    }
  };

  // Edit
  const handleEdit = (plan) => {
    setEditing(plan);
    setOpen(true);

    form.setFieldsValue({
      name: plan.name,
      title: plan.title,
      description: plan.description,
      price: plan.price ?? undefined,
      expiryDate: plan.validTo ? dayjs(plan.validTo) : null,
      hotels: (plan.applicableHotels || plan.hotels || []).map((h) =>
        typeof h === 'string' ? h : h._id,
      ),
      status: plan.status,
      coupons:
        (plan.coupons || []).map((c) => ({
          code: c.code,
          couponPrice: c.couponPrice,
          discountType: c.discountType,
          discountValue: c.discountValue,
          description: c.description,
          minOrderValue: c.minOrderValue,
        })) ?? [],
    });
  };

  const columns = [
    { title: 'Plan Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Plan Price',
      dataIndex: 'price',
      key: 'price',
      render: (p) => (p != null ? `₹${p}` : '-'),
    },
    {
      title: 'Coupons',
      key: 'couponCount',
      render: (record) => record.coupons?.length || 0,
    },
    {
      title: 'Expiry',
      dataIndex: 'validTo',
      key: 'validTo',
      render: (d) => (d ? dayjs(d).format('DD MMM YYYY') : '-'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s) => (
        <Tag color={s === 'active' ? 'blue' : 'red'}>
          {String(s || '').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Delete this plan?"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleGenerateCoupons = () => {
    const count = form.getFieldValue('couponCount') || 0;
    if (!count || count <= 0) {
      toast.error('Please enter how many coupons you need');
      return;
    }

    const existing = form.getFieldValue('coupons') || [];
    const generated = Array.from({ length: count }).map(() => ({
      code: generateCouponCode(6),
      couponPrice: undefined,
      discountType: 'percentage',
      discountValue: 0,
      description: '',
      minOrderValue: 0,
    }));

    form.setFieldsValue({
      coupons: [...existing, ...generated],
    });
  };

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
        <h2 style={{ margin: 0 }}>Plans</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setEditing(null);
            setOpen(true);
          }}
        >
          Create Plan
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={plans}
        rowKey={(r) => r._id || r.id}
        loading={loading}
      />

      <Modal
        open={open}
        title={editing ? 'Edit Plan' : 'Create Plan'}
        width={1100}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
        }}
        onOk={handleSubmit}
        okText="Save"
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form layout="vertical" form={form}>
          {/* PLAN FIELDS IN GRID */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="name"
                label="Plan Name"
                rules={[{ required: true, message: 'Enter plan name' }]}
              >
                <Input placeholder="Starter Plan" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item name="title" label="Title">
                <Input />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="price"
                label="Plan Price (₹)"
                rules={[
                  { required: true, message: 'Enter plan price' },
                  { type: 'number', message: 'Plan price must be a number' },
                ]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="expiryDate" label="Plan Expiry Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="status"
                label="Status"
                initialValue="active"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                  <Option value="expired">Expired</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item name="hotels" label="Applicable Hotels">
                <Select
                  mode="multiple"
                  placeholder="Select hotels"
                  optionFilterProp="children"
                  showSearch
                >
                  {hotels.map((h) => (
                    <Option key={h._id} value={h._id}>
                      {h.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="description" label="Plan Description">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          {/* COUPON GENERATION */}
          <Space
            style={{
              marginTop: 16,
              marginBottom: 8,
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <Form.Item
              name="couponCount"
              label="How many coupons?"
              style={{ flex: 1, marginRight: 8 }}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Button
              type="default"
              style={{ alignSelf: 'flex-end', marginBottom: 4 }}
              onClick={handleGenerateCoupons}
            >
              Generate Coupons
            </Button>
          </Space>

          {/* COUPON LIST (SINGLE ROW PER COUPON) */}
          <Form.List name="coupons">
            {(fields, { remove }) => (
              <>
                {fields.length > 0 && (
                  <div
                    style={{
                      marginBottom: 8,
                      fontWeight: 600,
                      fontSize: 16,
                    }}
                  >
                    Generated Coupons
                  </div>
                )}

                {fields.map((field) => (
                  <div
                    key={field.key}
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        '1.3fr 1fr 0.8fr 1.6fr 1fr 0.2fr',
                      gap: '10px',
                      marginBottom: '12px',
                      alignItems: 'center',
                    }}
                  >
                    <Form.Item
                      {...field}
                      name={[field.name, 'code']}
                      label="Code"
                      rules={[{ required: true, message: 'Enter code' }]}
                    >
                      <Input />
                    </Form.Item>

                    <Form.Item
                      {...field}
                      name={[field.name, 'discountType']}
                      label="Type"
                      rules={[{ required: true }]}
                    >
                      <Select>
                        <Option value="percentage">%</Option>
                        <Option value="fixed">₹</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item
                      {...field}
                      name={[field.name, 'discountValue']}
                      label="Value"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                      {...field}
                      name={[field.name, 'description']}
                      label="Description"
                    >
                      <Input />
                    </Form.Item>

                    <Form.Item
                      {...field}
                      name={[field.name, 'minOrderValue']}
                      label="Min Order"
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>

                    <Button
                      danger
                      type="link"
                      onClick={() => remove(field.name)}
                      style={{ paddingTop: 24 }}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
}
