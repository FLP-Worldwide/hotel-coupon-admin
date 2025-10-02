'use client';
import React, { useEffect, useState } from 'react';
import { Table, Typography, Space, message } from 'antd';
import api from '@/app/lib/axios';

import toast from 'react-hot-toast';


const { Title } = Typography;

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      const data = res.data?.users ?? res.data ?? [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch users', err);
      toast.error(err?.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (n) => n || '-' },
    { title: 'Email', dataIndex: 'email', key: 'email', render: (e) => e || '-' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', render: (p) => p || '-' },
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
        <Title level={3} style={{ margin: 0 }}>Users</Title>
      </Space>

      <Table
        columns={columns}
        dataSource={users}
        rowKey={(r) => r._id || r.id || r.email}
        loading={loading}
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
}
