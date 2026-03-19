'use client';
import React, { useEffect, useState } from 'react';
import {
  Button,
  Modal,
  Input,
  Typography,
  Table,
  Tag,
  Space,
} from 'antd';
import api from '@/app/lib/axios';
import toast from 'react-hot-toast';

const { Title } = Typography;

export default function RedeemPage() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    const res = await api.get('/admin/redeem/history');
    setHistory(res.data || []);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRedeem = async () => {
    if (!code || !phone) {
      return toast.error("Enter code & phone");
    }

    try {
      setLoading(true);

      const res = await api.post('/admin/redeem/by-code', {
        code,
        phone,
      });

      toast.success(res.data.message);
      setOpen(false);
      setCode('');
      setPhone('');
      fetchHistory();

    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'User', render: (_, r) => r.user?.name || 'N/A' },
    { title: 'Phone', render: (_, r) => r.user?.phone },
    { title: 'Coupon', render: (_, r) => r.coupon?.code },
    { title: 'Benefit', render: (_, r) => r.coupon?.benefitName },
    {
      title: 'Time',
      render: (_, r) => new Date(r.usedAt).toLocaleString(),
    },
    {
      title: 'Status',
      render: () => <Tag color="red">USED</Tag>,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Title level={3}>Coupon Redemption</Title>

        <Button type="primary" onClick={() => setOpen(true)}>
          Redeem Coupon
        </Button>
      </Space>

      <Table dataSource={history} columns={columns} rowKey="_id" />

      <Modal
        title="Redeem Coupon"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleRedeem}
        confirmLoading={loading}
      >
        <Input
          placeholder="Enter coupon code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{ marginBottom: 10 }}
        />

        <Input
          placeholder="Enter phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </Modal>
    </div>
  );
}