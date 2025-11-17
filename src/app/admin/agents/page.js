'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  Popconfirm,
  Empty,
  Spin,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import api from '@/app/lib/axios'; // your axios instance
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

export default function AdminAgentsPanel() {
  const { data: session, status: sessionStatus } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [form] = Form.useForm();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [search, setSearch] = useState('');
  const searchRef = useRef(null);

  // Fetch all agents once
  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/agents');
      const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setAgents(data);
      setFilteredAgents(data);
    } catch (err) {
      console.error('fetchAgents error', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    fetchAgents();
  }, [sessionStatus]);

  // Client-side search/filter
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      const q = val.toLowerCase();
      const filtered = agents.filter(
        (a) =>
          (a.name || '').toLowerCase().includes(q) ||
          (a.email || '').toLowerCase().includes(q) ||
          (a.code || '').toLowerCase().includes(q)
      );
      setFilteredAgents(filtered);
      setPage(1);
    }, 300);
  };

  const openCreate = () => {
    setEditingAgent(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (agent) => {
    setEditingAgent(agent);
    form.resetFields();
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/agents/${id}`);
      toast.success('Agent deleted');
      fetchAgents();
    } catch (err) {
      console.error('delete error', err);
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  const handleFinish = async (values) => {
    try {
      if (editingAgent) {
        await api.put(`/admin/agents/${editingAgent._id || editingAgent.id}`, values);
        toast.success('Agent updated');
      } else {
        await api.post('/admin/agents', values);
        toast.success('Agent created');
      }
      setModalOpen(false);
      form.resetFields();
      setEditingAgent(null);
      fetchAgents();
    } catch (err) {
      console.error('save error', err);
      toast.error(err?.response?.data?.message || err?.message || 'Save failed');
    }
  };

  // Slice data for client-side pagination
  const pagedAgents = filteredAgents.slice((page - 1) * pageSize, page * pageSize);

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Agent',
      dataIndex: 'name',
      key: 'name',
      render: (name, rec) => (
        <Space>
          <Avatar>{(rec.name || 'A')[0]}</Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{name}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{rec.email || '-'}</div>
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
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (d) => (d ? dayjs(d).format('DD MMM YYYY') : '-'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, rec) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(rec)}>
            Edit
          </Button>
          <Popconfirm title="Delete this agent?" onConfirm={() => handleDelete(rec._id || rec.id)}>
            <Button danger size="small" icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
              onChange={handleSearchChange}
              style={{ width: 320 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              New Agent
            </Button>
          </Space>
        </Col>
      </Row>

      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 30 }}>
            <Spin size="large" />
          </div>
        ) : pagedAgents.length === 0 ? (
          <div style={{ padding: 40 }}>
            <Empty description="No agents found" />
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              dataSource={pagedAgents}
              rowKey={(r) => r._id || r.id || r.code}
              pagination={false}
              bordered
              scroll={{ x: 900 }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={filteredAgents.length}
                showSizeChanger
                onChange={(p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                }}
                onShowSizeChange={(p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                }}
              />
            </div>
          </>
        )}
      </Card>

      <Modal
        title={editingAgent ? 'Edit Agent' : 'Create Agent'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setEditingAgent(null);
        }}
        footer={null}
        destroyOnHidden
      >
        <Form
          key={editingAgent ? editingAgent._id : 'new'} // important for re-render
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            name: editingAgent?.name || '',
            email: editingAgent?.email || '',
            address: editingAgent?.address || '',
          }}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter name' }]}>
            <Input placeholder="Agent name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Invalid email' },
            ]}
          >
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
              <Button
                onClick={() => {
                  setModalOpen(false);
                  form.resetFields();
                  setEditingAgent(null);
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingAgent ? 'Update' : 'Create'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
