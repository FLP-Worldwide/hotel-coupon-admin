"use client";
import React from "react";
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
} from "antd";
import {
  AppstoreOutlined,
  GiftOutlined,
  UsergroupAddOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const { Text, Title } = Typography;

/* -------------------------
   Admin-focused static data
   ------------------------- */
const statCards = [
  {
    title: "Total Hotels",
    value: 128,
    icon: <AppstoreOutlined style={{ fontSize: 22, color: "#1677ff" }} />,
    trend: "+6%",
    desc: "new this month",
  },
  {
    title: "Active Coupons",
    value: 42,
    icon: <GiftOutlined style={{ fontSize: 22, color: "#1677ff" }} />,
    trend: "-2%",
    desc: "valid now",
  },
  {
    title: "Total Users",
    value: 5120,
    icon: <UsergroupAddOutlined style={{ fontSize: 22, color: "#1677ff" }} />,
    trend: "+4.5%",
    desc: "active users",
  },
  {
    title: "Bookings (30d)",
    value: 1840,
    icon: <CalendarOutlined style={{ fontSize: 22, color: "#1677ff" }} />,
    trend: "+9%",
    desc: "last 30 days",
  },
];

const ordersColumns = [
  { title: "Booking ID", dataIndex: "id", key: "id" },
  {
    title: "Guest",
    dataIndex: "guest",
    key: "guest",
    render: (name) => (
      <Space align="center">
        <Avatar style={{ backgroundColor: "#e6f4ff", color: "#1677ff" }}>{name[0]}</Avatar>
        <Text strong>{name}</Text>
      </Space>
    ),
  },
  { title: "Hotel", dataIndex: "hotel", key: "hotel" },
  { title: "Amount", dataIndex: "amount", key: "amount" },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status) => {
      const color =
        status === "Confirmed"
          ? "blue"
          : status === "Pending"
            ? "gold"
            : "default";
      return <Tag color={color}>{status}</Tag>;
    },
  },
];

const ordersData = [
  {
    id: "BKG-1001",
    guest: "John Doe",
    hotel: "Sea View Resort",
    amount: "$250",
    status: "Confirmed",
  },
  {
    id: "BKG-1002",
    guest: "Asha Patel",
    hotel: "Grand Palace",
    amount: "$450",
    status: "Pending",
  },
  {
    id: "BKG-1003",
    guest: "Ravi Kumar",
    hotel: "Hilltop Inn",
    amount: "$120",
    status: "Confirmed",
  },
];

const bookingsChart = [
  { name: "Week 1", bookings: 120 },
  { name: "Week 2", bookings: 200 },
  { name: "Week 3", bookings: 260 },
  { name: "Week 4", bookings: 340 },
];

/* -------------------------
   Styles
   ------------------------- */
const styles = {
  page: { padding: 24, background: "#f9fbff" },
  topRow: { marginBottom: 24 },
  statCard: {
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(22, 119, 255, 0.08)",
    background: "#fff",
  },
  mainCard: {
    borderRadius: 12,
    boxShadow: "0 6px 16px rgba(22, 119, 255, 0.08)",
    background: "#fff",
  },
};

export default function AdminDashboardBlue() {
  return (
    <div style={styles.page}>
      {/* Stat cards */}
      <Row gutter={[16, 16]} style={styles.topRow}>
        {statCards.map((s) => (
          <Col xs={24} sm={12} md={6} key={s.title}>
            <Card style={styles.statCard} styles={{ body: { padding: 18 } }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <Text type="secondary">{s.title}</Text>
                  <Title level={3} style={{ margin: 0 }}>
                    {s.value}
                  </Title>
                  <Text type="secondary">{s.desc}</Text>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
                  <Tag
                    icon={<ArrowUpOutlined />}
                    color={s.trend.includes("-") ? "red" : "blue"}
                  >
                    {s.trend}
                  </Tag>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* Bookings Overview */}
        <Col xs={24} lg={16}>
          <Card
            title={<Title level={4}>Bookings Overview (monthly)</Title>}
            style={styles.mainCard}
            styles={{ body: { padding: 16 } }}
          >
            <Row>
              <Col span={18}>
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={bookingsChart}>
                      <defs>
                        <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1677ff" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#1677ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="bookings"
                        stroke="#1677ff"
                        fill="url(#colorBookings)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Col>
              <Col span={6} style={{ paddingLeft: 16 }}>
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <Card size="small">
                    <Text type="secondary">This month</Text>
                    <Title level={4} style={{ margin: 0 }}>
                      $ 28,420
                    </Title>
                    <Text type="secondary">
                      <RiseOutlined /> 6.7% from last month
                    </Text>
                  </Card>
                  <Card size="small">
                    <Text type="secondary">Conversion</Text>
                    <Title level={4} style={{ margin: 0 }}>
                      5.2%
                    </Title>
                    <Progress percent={52} size="small" strokeColor="#1677ff" />
                  </Card>
                </Space>
              </Col>
            </Row>

            <Divider />

            <Row>
              <Col xs={24} md={12}>
                <Text type="secondary">Bookings Today</Text>
                <Title level={3} style={{ margin: 0 }}>
                  72
                </Title>
                <Text type="secondary">Compared to 58 yesterday</Text>
              </Col>

              <Col xs={24} md={12} style={{ textAlign: "right" }}>
                <Text type="secondary">Avg. Booking Value</Text>
                <Title level={3} style={{ margin: 0 }}>
                  $ 155
                </Title>
                <Text type="secondary">+2.1% this month</Text>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Recent Bookings */}
        <Col xs={24} lg={8}>
          <Card
            title={<Title level={4}>Recent Bookings</Title>}
            style={styles.mainCard}
            styles={{ body: { padding: 12 } }}
          >
            <Table
              columns={ordersColumns}
              dataSource={ordersData}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
