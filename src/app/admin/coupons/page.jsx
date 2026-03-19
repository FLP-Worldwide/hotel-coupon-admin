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

const getBenefits = (coupons = []) => {
  const map = {};

  coupons.forEach((c) => {
    const key = c.benefitName || "Benefit";

    if (!map[key]) {
      map[key] = 0;
    }

    map[key]++;
  });

  return Object.entries(map).map(([name, count]) => ({
    name,
    count,
  }));
};

export default function PlansPage() {
  const [form] = Form.useForm();
  const [plans, setPlans] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/coupons/plans');
      const data = res.data?.plans ?? res.data ?? [];
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchHotels = async () => {
    try {
      const res = await api.get('/admin/hotels');
      const data = res.data?.hotels ?? res.data ?? [];
      setHotels(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchHotels();
  }, []);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        name: values.name,
        title: values.title || '',
        description: values.description || '',
        price: Number(values.price),
        validityMonths: Number(values.validityMonths),
        applicableHotels: values.hotels || [],
        status: values.status || 'active',
        rules: (values.rules || []).map((r) => r.text),
        benefits: (values.benefits || []).map((b) => ({
          name: b.name,
          couponCount: Number(b.couponCount),
          description: b.description || "", 
          redeemPerVisit: Number(b.redeemPerVisit),
          discountType: b.discountType,
          discountValue: Number(b.discountValue),

          coupons: Array.from({ length: b.couponCount }).map(() => ({
            code: generateCouponCode(6),
            usedCount: 0,
          })),
        })),
      };

      if (editing?._id) {
        await api.put(`/admin/coupons/plans/${editing._id}`, payload);
        toast.success('Plan updated');
      } else {
        await api.post('/admin/coupons/plans', payload);
        toast.success('Plan created');
      }

      form.resetFields();
      setOpen(false);
      setEditing(null);
      fetchPlans();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/coupons/plans/${id}`);
      toast.success('Plan deleted');
      fetchPlans();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleEdit = (plan) => {
    setEditing(plan);
    setOpen(true);

    const coupons = plan.coupons || [];

    // group coupons by benefitName
    const benefitMap = {};

    coupons.forEach((c) => {
      const key = c.benefitName || "Benefit";

      if (!benefitMap[key]) {
        benefitMap[key] = {
          name: key,
          couponCount: 0,
          description: c.description || "",
          redeemPerVisit: c.redeemPerVisit || 1,
          discountType: c.discountType || "fixed",
          discountValue: c.discountValue || 0,
        };
      }

      benefitMap[key].couponCount += 1;
    });

    const benefits = Object.values(benefitMap);

    form.setFieldsValue({
      name: plan.name,
      title: plan.title,
      description: plan.description,
      price: plan.price,
      validityMonths: plan.validityMonths,
      hotels: (plan.applicableHotels || []).map((h) =>
        typeof h === "string" ? h : h._id
      ),
      status: plan.status,
      benefits,
      rules: (plan.rules || []).map((r) => ({ text: r })),

    });
  };

  const columns = [
    {
      title: "Plan Name",
      dataIndex: "name",
    },

    {
      title: "Price",
      dataIndex: "price",
      render: (p) => `₹${p}`,
    },

    {
      title: "Benefits",
      render: (_, record) => {
        const benefits = getBenefits(record.coupons);

        return (
          <Space wrap>
            {benefits.map((b) => (
              <Tag color="purple" key={b.name}>
                {b.name} ({b.count})
              </Tag>
            ))}
          </Space>
        );
      },
    },

    {
      title: "Coupons",
      render: (record) => record.coupons?.length || 0,
    },

    {
      title: "Validity",
      render: (record) => {
        if (record.validityMonths)
          return `${record.validityMonths} Months`;

        if (record.validTo)
          return new Date(record.validTo).toLocaleDateString();

        return "-";
      },
    },

    {
      title: "Status",
      dataIndex: "status",
      render: (s) => (
        <Tag color={s === "active" ? "blue" : "red"}>
          {String(s).toUpperCase()}
        </Tag>
      ),
    },

    {
      title: "Actions",
      render: (_, record) => (
        <Space>

          {/* VIEW */}
          <Button
            type="default"
            onClick={() => {
              setEditing(record);
              setOpen(true);
              handleEdit(record);
            }}
          >
            View
          </Button>

          {/* EDIT */}
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />

          {/* DELETE */}
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

  return (
    <div style={{ padding: 24 }}>
      <Space
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
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
      >
        <Form layout="vertical" form={form}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="name"
                label="Plan Name"
                rules={[{ required: true }]}
              >
                <Input />
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
                rules={[{ required: true }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="validityMonths"
                label="Plan Validity"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  addonAfter="Months"
                  placeholder="Enter number"
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item name="status" label="Status" initialValue="active">
                <Select>
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item name="hotels" label="Applicable Hotels">
                <Select mode="multiple">
                  {hotels.map((h) => (
                    <Option key={h._id} value={h._id}>
                      {h.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Plan Description">
            <Input />
          </Form.Item>

          <Form.List name="rules">
            {(fields, { add, remove }) => (
              <>
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: 10,
                    fontSize: 16,
                    marginTop: 20,
                  }}
                >
                  How to Use / Rules
                </div>

                {fields.map((field, index) => (
                  <Row gutter={10} key={field.key} align="middle">
                    <Col span={22}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'text']}
                        rules={[{ required: true, message: 'Enter rule' }]}
                      >
                        <Input
                          placeholder={`Rule ${index + 1}`}
                          prefix="•"
                        />
                      </Form.Item>
                    </Col>

                    <Col span={2}>
                      <Button
                        danger
                        type="link"
                        onClick={() => remove(field.name)}
                      >
                        ✕
                      </Button>
                    </Col>
                  </Row>
                ))}

                <Button type="dashed" onClick={() => add()} block>
                  + Add Rule
                </Button>
              </>
            )}
          </Form.List>

          {/* BENEFITS */}

          <Form.List name="benefits">
            {(fields, { add, remove }) => (
              <>
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: 10,
                    fontSize: 16,
                  }}
                >
                  Plan Benefits
                </div>

                {fields.map((field) => (
                  <Row gutter={10} key={field.key}>
                    <Col span={6}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'name']}
                        label="Benefit"
                        rules={[{ required: true }]}
                      >
                        <Input placeholder="Dinner Free" />
                      </Form.Item>
                    </Col>

                     {/* DESCRIPTION */}
                    <Col span={6}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'description']}
                        label="Description"
                      >
                        <Input placeholder="Buffet dinner for two people" />
                      </Form.Item>
                    </Col>

                    <Col span={2}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'couponCount']}
                        label="Coupons"
                        rules={[{ required: true }]}
                      >
                        <InputNumber min={1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>

                    <Col span={3}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'redeemPerVisit']}
                        label="Redeem/Visit"
                      >
                        <InputNumber min={1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>

                    <Col span={3  }>
                      <Form.Item
                        {...field}
                        name={[field.name, 'discountType']}
                        label="Type"
                      >
                        <Select>
                          <Option value="percentage">%</Option>
                          <Option value="fixed">₹</Option>
                          <Option value="free">Free</Option>
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col span={2}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'discountValue']}
                        label="Value"
                      >
                        <InputNumber style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>

                    <Col span={2}>
                      <Button
                        danger
                        type="link"
                        onClick={() => remove(field.name)}
                        style={{ marginTop: 30 }}
                      >
                        ✕
                      </Button>
                    </Col>
                  </Row>
                ))}

                <Button type="dashed" onClick={() => add()}>
                  Add Benefit
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
}