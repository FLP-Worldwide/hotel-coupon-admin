'use client';
import React, { useState } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Space,
  Input,
  Select,
  DatePicker,
  Button,
  Table,
  Tag,
  Avatar,
} from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const sampleBookings = [
  {
    _id: 'ORD-3001',
    user: { name: 'Ravi Kumar', email: 'ravi@example.com' },
    hotel: { name: 'Sea View Resort', city: 'Goa' },
    coupon: {
      title: '50% Off Spa Package',
      code: 'SPA50',
      discount: '50%',
      expiry: '2025-12-31',
    },
    qty: 2,
    price: 1500,
    total: 3000,
    status: 'paid',
    createdAt: '2025-09-12T12:00:00Z',
  },
  {
    _id: 'ORD-3002',
    user: { name: 'Anita Sharma', email: 'anita@example.com' },
    hotel: { name: 'Royal Palace Hotel', city: 'Delhi' },
    coupon: {
      title: '10% Off Dinner Buffet',
      code: 'DINNER10',
      discount: '10%',
      expiry: '2025-10-30',
    },
    qty: 1,
    price: 800,
    total: 800,
    status: 'pending',
    createdAt: '2025-09-15T14:30:00Z',
  },
  {
    _id: 'ORD-3003',
    user: { name: 'John Doe', email: 'john@example.com' },
    hotel: { name: 'Mountain View Lodge', city: 'Manali' },
    coupon: {
      title: 'Buy 1 Get 1 Free - Drinks',
      code: 'DRINKS2025',
      discount: 'B1G1',
      expiry: '2025-11-20',
    },
    qty: 3,
    price: 500,
    total: 1500,
    status: 'cancelled',
    createdAt: '2025-09-10T09:00:00Z',
  },
];

export default function CouponBookingsPage() {
  const [bookings] = useState(sampleBookings);
  const [filterStatus, setFilterStatus] = useState(null);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState(null);

  const stats = {
    total: bookings.length,
    revenue: bookings.reduce((s, b) => s + (b.total || 0), 0),
    paid: bookings.filter((b) => b.status === 'paid').length,
  };

  const columns = [
    { title: 'Order ID', dataIndex: '_id', key: '_id', width: 120 },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      render: (u) => (
        <Space>
          <Avatar>{u.name[0]}</Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{u.name}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{u.email}</div>
          </div>
        </Space>
      ),
      width: 200,
    },
    {
      title: 'Hotel',
      dataIndex: 'hotel',
      key: 'hotel',
      render: (h) => (
        <div>
          <div style={{ fontWeight: 600 }}>{h.name}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{h.city}</div>
        </div>
      ),
      width: 220,
    },
    {
      title: 'Coupon',
      dataIndex: 'coupon',
      key: 'coupon',
      render: (c) => (
        <div>
          <div style={{ fontWeight: 600 }}>{c.title}</div>
          <div style={{ fontSize: 12, color: '#666' }}>Code: {c.code}</div>
        </div>
      ),
      width: 260,
    },
    { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 80 },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (t) => `₹ ${t}`,
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => {
        const color = s === 'paid' ? 'blue' : s === 'pending' ? 'gold' : 'red';
        return <Tag color={color}>{s.toUpperCase()}</Tag>;
      },
      width: 120,
    },
    {
      title: 'Purchased',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d) => dayjs(d).format('DD MMM YYYY, HH:mm'),
      width: 180,
    },
    // Action column removed (no preview)
  ];

  const filtered = bookings.filter((b) => {
    if (filterStatus && b.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !(
          b._id.toLowerCase().includes(q) ||
          b.user.name.toLowerCase().includes(q) ||
          b.coupon.title.toLowerCase().includes(q) ||
          b.hotel.name.toLowerCase().includes(q)
        )
      )
        return false;
    }
    if (dateRange && dateRange.length === 2) {
      const [from, to] = dateRange;
      const created = dayjs(b.createdAt);
      if (!created.isBetween(from.startOf('day'), to.endOf('day'), null, '[]'))
        return false;
    }
    return true;
  });

  return (
    <div style={{ padding: 24 }}>
      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 18 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Total Orders" value={stats.total} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Revenue (₹)" value={stats.revenue} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Paid Orders" value={stats.paid} />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={12} align="middle">
          <Col xs={24} md={8}>
            <Input
              placeholder="Search by ID, user, hotel or coupon..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
              placeholder="Status"
              style={{ width: '100%' }}
              allowClear
              onChange={(val) => setFilterStatus(val)}
            >
              <Select.Option value="paid">Paid</Select.Option>
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="cancelled">Cancelled</Select.Option>
            </Select>
          </Col>
          <Col xs={24} md={8}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={(vals) => setDateRange(vals)}
            />
          </Col>
          <Col xs={24} md={2}>
            <Button
              icon={<FilterOutlined />}
              onClick={() => {
                setSearch('');
                setFilterStatus(null);
                setDateRange(null);
              }}
            >
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="_id"
          pagination={{ pageSize: 6 }}
          scroll={{ x: 1100 }}
        />
      </Card>
    </div>
  );
}
