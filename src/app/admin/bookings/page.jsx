'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Space,
  Input,
  Button,
  Table,
  Tag,
  Avatar,
  message,
  Modal,
  Form,
  Pagination,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import api from '@/app/lib/axios';
import { useSession } from 'next-auth/react';

export default function AdminAgentsPanel() {
  const { data: session, status: sessionStatus } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  console.log(isAdmin, session);

  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [form] = Form.useForm();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // API wrapper
  const apiClient = {
    list: async ({ page, pageSize, q } = {}) => {
      const url = isAdmin ? '/admin/agents' : '/agents/me';
      const res = await api.get(url, { params: { q, page, pageSize } });
      console.log(res);
      // expect { data: [...], total }
      if (res.data?.data || Array.isArray(res.data)) {
        return { data: res.data.data ?? res.data, total: res.data.total ?? (res.data.data?.length ?? res.data.length) };
      }
      // fallback
      return { data: [], total: 0 };
    },
    create: async (payload) => {
      const res = await api.post(isAdmin ? '/admin/agents' : '/agents', payload);
      return res.data;
    },
    update: async (id, payload) => {
      const res = await api.put(isAdmin ? `/admin/agents/${id}` : `/agents/${id}`, payload);
      return res.data;
    },
    remove: async (id) => {
      const res = await api.delete(isAdmin ? `/admin/agents/${id}` : `/agents/${id}`);
      return res.data;
    },
  };

  const fetchAgents = useCallback(async (opts = {}) => {
    setLoading(true);
    try {
      const resp = await apiClient.list({ page: opts.page || page, pageSize: opts.pageSize || pageSize, q: opts.q ?? search });
      setAgents(resp.data || []);
      setTotal(resp.total ?? (resp.data ? resp.data.length : 0));
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.message || err?.message || 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, page, pageSize, search]);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    fetchAgents({ page, pageSize });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAgents, sessionStatus, page, pageSize]);

  const openCreate = () => {
    setEditingAgent(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingAgent(record);
    form.setFieldsValue({ name: record.name, email: record.email, address: record.address });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.remove(id);
      message.success('Agent deleted');
      // refresh
      fetchAgents({ page });
    } catch (err) {
      console.error(err);
      message.error('Delete failed');
    }
  };

  const handleFinish = async (values) => {
    try {
      if (editingAgent) {
        await apiClient.update(editingAgent._id || editingAgent.id, values);
        message.success('Agent updated');
      } else {
        await apiClient.create(values);
        message.success('Agent created');
      }
      setModalOpen(false);
      // reset to first page after create
      fetchAgents({ page: 1 });
      setPage(1);
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.message || err?.message || 'Save failed');
    }
  };

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (text) => <Tag color="blue">{text}</Tag>,
      width: 160,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar>{(record.name || 'A')[0]}</Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{text}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{record.email || '-'}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)}>Edit</Button>
          <Button icon={<DeleteOutlined />} danger size="small" onClick={() => handleDelete(record._id || record.id)}>Delete</Button>
        </Space>
      ),
    },
  ];

  // client-side filtered list for instant search
  const filtered = agents.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(a.code || '').toLowerCase().includes(q) ||
      String(a.name || '').toLowerCase().includes(q) ||
      String(a.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <h2 style={{ margin: 0 }}>Agents</h2>
        </Col>
        <Col>
          <Space>
            <Input
              placeholder="Search by code, name or email"
              prefix={<SearchOutlined />}
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 260 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>New Agent</Button>
          </Space>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey={(r) => r._id || r.id || r.code}
          loading={loading}
          pagination={false}
          scroll={{ x: 900 }}
          bordered
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={(p, ps) => {
              setPage(p);
              setPageSize(ps);
            }}
            showSizeChanger
          />
        </div>
      </Card>

      <Modal
        title={editingAgent ? 'Edit Agent' : 'Create Agent'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFinish} preserve={false}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter name' }]}>
            <Input placeholder="Agent name" />
          </Form.Item>

          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Please enter email' }, { type: 'email', message: 'Invalid email' }]}>
            <Input placeholder="agent@example.com" />
          </Form.Item>

          <Form.Item name="address" label="Address">
            <Input.TextArea rows={3} placeholder="Address (optional)" />
          </Form.Item>

          {editingAgent && (
            <Form.Item label="Code">
              <Input value={editingAgent.code} readOnly />
            </Form.Item>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">{editingAgent ? 'Update' : 'Create'}</Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
