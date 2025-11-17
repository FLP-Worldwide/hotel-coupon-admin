'use client';
import React, { useEffect, useState, useCallback } from 'react';
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
  message,
  Spin,
} from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/app/lib/axios';
import { useSession } from 'next-auth/react';

import toast from 'react-hot-toast';
const { RangePicker } = DatePicker;

export default function CouponBookingsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState(null);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState(null);

  // stats derived from bookings
  const stats = {
    total: bookings.length,
    revenue: bookings.reduce((s, b) => s + (Number(b.total) || 0), 0),
    paid: bookings.filter((b) => b.status === 'paid').length,
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      // admin gets all bookings, users get their own
      const url = '/admin/bookings';
      // If your backend mounts differently, change the paths (e.g. '/api/bookings' vs '/admin/bookings')
      const res = await api.get(url);
      // Try common shapes: { bookings: [...] } or direct array
      const data = res.data?.bookings ?? res.data?.data ?? res.data ?? [];
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch bookings', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    // wait for session to be resolved before fetching (if using next-auth)
    if (sessionStatus === 'loading') return;
    fetchBookings();
  }, [fetchBookings, sessionStatus]);

  const columns = [
    // { title: 'Order ID', dataIndex: '_id', key: '_id', width: 140 },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      render: (u) => (
        <Space>
          <Avatar>{(u?.name || 'U')[0]}</Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{u?.name || '-'}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{u?.phone || '-'}</div>
          </div>
        </Space>
      ),
      width: 220,
    },
    {
      title: 'Hotel',
      dataIndex: 'hotel',
      key: 'hotel',
      render: (h) => (
        <div>
          <div style={{ fontWeight: 600 }}>{h?.name || '-'}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{h?.city || '-'}</div>
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
          <div style={{ fontWeight: 600 }}>{c?.title || c?.code || '-'}</div>
          <div style={{ fontSize: 12, color: '#666' }}>Code: {c?.code || '-'}</div>
        </div>
      ),
      width: 260,
    },
    { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 80 },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (t) => `₹ ${t ?? 0}`,
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => {
        const color = s === 'paid' ? 'blue' : s === 'pending' ? 'gold' : 'red';
        return <Tag color={color}>{(s || '').toUpperCase()}</Tag>;
      },
      width: 120,
    },
    {
      title: 'Purchased',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d) => (d ? dayjs(d).format('DD MMM YYYY, HH:mm') : '-'),
      width: 180,
    },
  ];

  // Client-side filtering for quick responsiveness
  const filtered = bookings.filter((b) => {
    if (filterStatus && b.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !(
          String(b._id || '').toLowerCase().includes(q) ||
          String(b.user?.name || '').toLowerCase().includes(q) ||
          String(b.coupon?.title || '').toLowerCase().includes(q) ||
          String(b.hotel?.name || '').toLowerCase().includes(q)
        )
      ) {
        return false;
      }
    }
    if (dateRange && dateRange.length === 2) {
      const [from, to] = dateRange;
      const created = dayjs(b.createdAt);
      if (!created.isBetween(from.startOf('day'), to.endOf('day'), null, '[]')) return false;
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
              value={filterStatus}
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
              value={dateRange}
            />
          </Col>
          <Col xs={24} md={2}>
            <Button
              icon={<FilterOutlined />}
              onClick={() => {
                setSearch('');
                setFilterStatus(null);
                setDateRange(null);
                fetchBookings();
              }}
            >
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filtered}
            rowKey={(r) => r._id || r.id}
            pagination={{ pageSize: 8 }}
            scroll={{ x: 1100 }}
          />
        )}
      </Card>
    </div>
  );
}
