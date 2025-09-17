'use client';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Avatar,
  Tag,
  Progress,
  Space,
  Divider,
  Typography,
  Button,
  Spin,
  message,
} from 'antd';
import {
  AppstoreOutlined,
  GiftOutlined,
  UsergroupAddOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import dayjs from 'dayjs';
import api from '@/app/lib/axios';

const { Text, Title } = Typography;

const styles = {
  page: { padding: 24, background: '#f9fbff' },
  topRow: { marginBottom: 24 },
  statCard: {
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(22, 119, 255, 0.08)',
    background: '#fff',
  },
  mainCard: {
    borderRadius: 12,
    boxShadow: '0 6px 16px rgba(22, 119, 255, 0.08)',
    background: '#fff',
  },
  // small helper so inner truncation works
  truncateCell: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 140,
  },
};

const ordersColumns = [
  {
    title: 'Booking ID',
    dataIndex: '_id',
    key: '_id',
    width: 160,
    ellipsis: { showTitle: true },
    render: (id) => {
      if (!id) return '-';
      const s = String(id);
      const short = s.length > 18 ? `${s.slice(0, 8)}…${s.slice(-6)}` : s;
      return <span title={s} style={{ fontFamily: 'monospace' }}>{short}</span>;
    },
    responsive: ['sm'],
  },
  {
    title: 'Guest',
    dataIndex: 'user',
    key: 'user',
    width: 180,
    render: (u) => {
      const name = u?.name || u?.phone || 'User';
      const email = u?.email || '-';
      return (
        <Space align="center">
          <Avatar style={{ backgroundColor: '#e6f4ff', color: '#1677ff' }}>
            {String(name || 'U')[0]}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <div style={{ ...styles.truncateCell, fontWeight: 600 }}>{name}</div>
            <div style={{ fontSize: 12, color: '#666', ...styles.truncateCell }}>{email}</div>
          </div>
        </Space>
      );
    },
  },
  {
    title: 'Hotel',
    dataIndex: 'hotel',
    key: 'hotel',
    width: 180,
    render: (h) => (
      <div style={{ minWidth: 0 }}>
        <div style={{ ...styles.truncateCell, fontWeight: 600 }}>{h?.name || '-'}</div>
        <div style={{ fontSize: 12, color: '#666' }}>{h?.city || '-'}</div>
      </div>
    ),
    responsive: ['sm'],
  },
  {
    title: 'Amount',
    dataIndex: 'total',
    key: 'total',
    width: 110,
    align: 'right',
    render: (t) => `₹ ${t ?? 0}`,
    responsive: ['xs', 'sm', 'md', 'lg'],
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 110,
    render: (status) => {
      const color = status === 'paid' ? 'blue' : status === 'pending' ? 'gold' : 'red';
      return <Tag color={color} style={{ textTransform: 'uppercase' }}>{String(status || '-')}</Tag>;
    },
    responsive: ['sm'],
  },
  {
    title: 'Purchased',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 160,
    render: (d) => (d ? dayjs(d).format('DD MMM YYYY, HH:mm') : '-'),
    responsive: ['md'],
  },
];

export default function AdminDashboardFixed() {
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/dashboard');
      const data = res.data?.dashboard ?? res.data;
      setDashboard(data || null);
    } catch (err) {
      console.error('Failed to load dashboard', err);
      message.error(err?.response?.data?.message || err?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const totals = dashboard?.totals ?? { users: 0, hotels: 0, coupons: 0, bookings: 0 };
  const revenueTotal = dashboard?.revenue?.total ?? 0;
  const bookingsByStatus = dashboard?.bookingsByStatus ?? {};
  const recentBookings = dashboard?.recentBookings ?? [];
  const topHotels = dashboard?.topHotelsByBookings ?? [];
  const topCoupons = dashboard?.topCoupons ?? [];
  const monthlyRevenue = dashboard?.monthlyRevenue ?? [];

  const statCards = useMemo(() => [
    {
      title: 'Total Hotels',
      value: totals.hotels ?? 0,
      icon: <AppstoreOutlined style={{ fontSize: 22, color: '#1677ff' }} />,
      trend: '',
      desc: 'all hotels',
    },
    {
      title: 'Active Coupons',
      value: totals.coupons ?? 0,
      icon: <GiftOutlined style={{ fontSize: 22, color: '#1677ff' }} />,
      trend: '',
      desc: 'active offers',
    },
    {
      title: 'Total Users',
      value: totals.users ?? 0,
      icon: <UsergroupAddOutlined style={{ fontSize: 22, color: '#1677ff' }} />,
      trend: '',
      desc: 'registered users',
    },
    {
      title: 'Bookings',
      value: totals.bookings ?? 0,
      icon: <CalendarOutlined style={{ fontSize: 22, color: '#1677ff' }} />,
      trend: bookingsByStatus?.pending ? `Pending ${bookingsByStatus.pending}` : '',
      desc: 'latest bookings',
    },
  ], [totals, bookingsByStatus]);

  const chartData = useMemo(() => {
    if (!monthlyRevenue || !Array.isArray(monthlyRevenue)) return [];
    const sorted = monthlyRevenue.slice().sort((a, b) => (a.year - b.year) || (a.month - b.month));
    return sorted.map((m) => {
      const label = `${String(m.month).padStart(2, '0')}/${String(m.year).slice(-2)}`;
      return { name: label, revenue: Number(m.revenue || 0) };
    });
  }, [monthlyRevenue]);

  return (
    <div style={styles.page}>
      <Row gutter={[16, 16]} style={styles.topRow} align="middle">
        <Col flex="auto">
          <Title level={3} style={{ margin: 0 }}>Admin Dashboard</Title>
          <Text type="secondary">Overview & recent activity</Text>
        </Col>
        <Col>
          <Button icon={<ReloadOutlined />} onClick={fetchDashboard} loading={loading}>Refresh</Button>
        </Col>
      </Row>

      {loading && !dashboard ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
      ) : (
        <>
          <Row gutter={[16, 16]} style={styles.topRow}>
            {statCards.map((s) => (
              <Col xs={24} sm={12} md={6} key={s.title}>
                <Card style={styles.statCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text type="secondary">{s.title}</Text>
                      <Title level={3} style={{ margin: 0 }}>{s.value}</Title>
                      <Text type="secondary">{s.desc}</Text>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
                      {s.trend ? <Tag icon={<ArrowUpOutlined />} color={s.trend.includes('-') ? 'red' : 'blue'}>{s.trend}</Tag> : null}
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title={<Title level={4}>Revenue Overview</Title>} style={styles.mainCard}>
                <Row>
                  <Col span={18}>
                    <div style={{ width: '100%', height: 240 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1677ff" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#1677ff" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => `₹ ${value}`} />
                          <Area type="monotone" dataKey="revenue" stroke="#1677ff" fill="url(#colorRevenue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Col>

                  <Col span={6} style={{ paddingLeft: 16 }}>
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <Card size="small">
                        <Text type="secondary">Total Revenue</Text>
                        <Title level={4} style={{ margin: 0 }}>₹ {revenueTotal}</Title>
                        <Text type="secondary" />
                      </Card>

                      <Card size="small">
                        <Text type="secondary">Bookings by status</Text>
                        <div style={{ marginTop: 8 }}>
                          {Object.entries(bookingsByStatus).length === 0 ? (
                            <Text type="secondary">No data</Text>
                          ) : (
                            Object.entries(bookingsByStatus).map(([k, v]) => (
                              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <Text>{k}</Text>
                                <Text strong>{v}</Text>
                              </div>
                            ))
                          )}
                        </div>
                      </Card>
                    </Space>
                  </Col>
                </Row>

                <Divider />

                <Row>
                  <Col xs={24} md={12}>
                    <Text type="secondary">Bookings (this dashboard)</Text>
                    <Title level={3} style={{ margin: 0 }}>{totals.bookings ?? 0}</Title>
                    <Text type="secondary">Total bookings recorded</Text>
                  </Col>

                  <Col xs={24} md={12} style={{ textAlign: 'right' }}>
                    <Text type="secondary">Avg. Booking Value</Text>
                    <Title level={3} style={{ margin: 0 }}>₹ {totals.bookings ? Math.round((revenueTotal / totals.bookings) || 0) : 0}</Title>
                    <Text type="secondary">Calculated from totals</Text>
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Recent Bookings: fixed/responsive table */}
            <Col xs={24} lg={8}>
              <Card title={<Title level={4}>Recent Bookings</Title>} style={styles.mainCard}>
                {/* horizontal scroll container prevents layout overlap */}
                <div style={{ overflowX: 'auto' }}>
                  <Table
                    columns={ordersColumns}
                    dataSource={recentBookings}
                    rowKey={(r) => r._id || r.id}
                    pagination={false}
                    // set x to approximate total width of columns so horizontal scroll activates when needed
                    scroll={{ x: 880 }}
                    // ensure predictable column distribution
                    style={{ tableLayout: 'fixed' }}
                  />
                </div>
              </Card>

              <Card style={{ marginTop: 16 }}>
                <Title level={5}>Top Hotels by Bookings</Title>
                {topHotels.length === 0 ? <Text type="secondary">No data</Text> : topHotels.map((h) => (
                  <div key={h.hotelId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <Text>{h.hotelName}</Text>
                    <Text strong>₹ {h.revenue}</Text>
                  </div>
                ))}

                <Divider />

                <Title level={5}>Top Coupons</Title>
                {topCoupons.length === 0 ? <Text type="secondary">No data</Text> : topCoupons.map((c) => (
                  <div key={c.couponId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <Text>{c.title} ({c.code})</Text>
                    <Text strong>{c.sold}</Text>
                  </div>
                ))}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}
