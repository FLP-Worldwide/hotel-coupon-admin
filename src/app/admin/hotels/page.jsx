// app/(admin)/hotels/page.jsx  (or wherever you keep it)
'use client';
import React, { useEffect, useState, useMemo } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Typography,
  Upload,
  message,
  Popconfirm,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import api from '@/app/lib/axios';
import { useSession } from 'next-auth/react';
import toast from "react-hot-toast";

const { Title } = Typography;

/**
 * Helper: convert server image entry to full URL for preview
 * If image is full URL -> return as is
 * If image is filename -> prefix with NEXT_PUBLIC_API_URL + '/uploads/hotels/'
 */
function buildImageUrl(img) {
  if (!img) return '';
  try {
    // if already a full url
    const url = new URL(img);
    return url.href;
  } catch (e) {
    // treat as filename or relative path
    const base = process.env.NEXT_PUBLIC_API_URL || '';
    // ensure no double slashes
    return `${base.replace(/\/$/, '')}/uploads/hotels/${img}`;
  }
}

export default function HotelsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  // Build auth headers if session contains token
  const authHeaders = useMemo(() => {
    // adapt this according to how your session stores tokens
    const token =
      session?.accessToken || session?.user?.accessToken || session?.user?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [session]);

  // set axios default header when session changes (optional convenience)
  useEffect(() => {
    if (authHeaders.Authorization) {
      api.defaults.headers.common['Authorization'] = authHeaders.Authorization;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [authHeaders]);

  // ---- Fetch hotels
  const fetchHotels = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hotels/admin');
      // support both {hotels: []} or an array directly
      const data = res.data?.hotels ?? res.data ?? [];
      setHotels(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetchHotels error', err);
      toast.error(err?.response?.data?.message || 'Failed to load hotels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  // ---- Submit (Create or Update)
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // Build FormData
      const fd = new FormData();

      // basic fields
      if (values.name) fd.append('name', values.name);
      if (values.description) fd.append('description', values.description || '');
      if(values.price) fd.append('price', values.price);
      fd.append('ownerName', values.ownerName || '');
      fd.append('status', values.status || 'active');

      // address object
      const address = {
        street: values.street || '',
        city: values.city || '',
        state: values.state || '',
        country: values.country || '',
        postalCode: values.postalCode || '',
      };
      fd.append('address', JSON.stringify(address));

      // contact object — phone required by server
      const contact = {
        phone: values.phone || '',
        email: values.email || '',
      };
      fd.append('contact', JSON.stringify(contact));

      // location -> server expects { coordinates: [lng, lat] }
      const lng = values.longitude !== undefined && values.longitude !== '' ? Number(values.longitude) : null;
      const lat = values.latitude !== undefined && values.latitude !== '' ? Number(values.latitude) : null;
      if (lng !== null && !Number.isNaN(lng) && lat !== null && !Number.isNaN(lat)) {
        fd.append('location', JSON.stringify({ coordinates: [lng, lat] }));
      }

      // amenities array
      fd.append('amenities', JSON.stringify(values.amenities || []));

      // images:
      // Ant Upload fileList items: for new files they have originFileObj
      // for existing images (we fed them with .url) they will NOT have originFileObj
      const filesList = values.images || [];
      const existingImageUrls = [];

      filesList.forEach((f) => {
        if (!f) return;
        if (f.originFileObj) {
          // new file selected in Upload
          fd.append('images', f.originFileObj);
        } else if (f.url) {
          // existing image — send as existingImages so server can keep it
          existingImageUrls.push(f.url);
        } else if (f.response && f.response.url) {
          // sometimes upload control saves response
          existingImageUrls.push(f.response.url);
        }
      });

      if (existingImageUrls.length) {
        fd.append('existingImages', JSON.stringify(existingImageUrls));
      }

      // If editing -> PUT else -> POST
      if (editingHotel && editingHotel._id) {
        await api.put(`/admin/hotels/${editingHotel._id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Hotel updated');
      } else {
        await api.post('/admin/hotels', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Hotel created');
      }

      form.resetFields();
      setOpen(false);
      setEditingHotel(null);
      await fetchHotels();
    } catch (err) {
      console.error('Hotel save error:', err);
      const serverMessage = err?.response?.data?.message || err?.message || 'Failed to save hotel';
      // alert(serverMessage);
      toast.error(serverMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Delete hotel
  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/hotels/${id}`);
      toast.success('Hotel deleted');
      fetchHotels();
    } catch (err) {
      console.error('delete error', err);
      toast.error(err?.response?.data?.message || 'Failed to delete hotel');
    }
  };

  // ---- Edit
  const handleEdit = (hotel) => {
    setEditingHotel(hotel);
    setOpen(true);

    // Prepare images fileList for Upload component:
    // convert each server image entry to object with url so Upload shows thumbnail
    const imagesFileList = (hotel.images || []).map((img, idx) => {
      const url = buildImageUrl(img);
      return {
        uid: `old-${idx}`,
        name: url.split('/').pop(),
        status: 'done',
        url,
      };
    });

    form.setFieldsValue({
      name: hotel.name,
      description: hotel.description,
      price: hotel.price,
      street: hotel.address?.street,
      city: hotel.address?.city,
      state: hotel.address?.state,
      country: hotel.address?.country,
      postalCode: hotel.address?.postalCode,
      phone: hotel.contact?.phone,
      email: hotel.contact?.email,
      longitude: hotel.location?.coordinates?.[0],
      latitude: hotel.location?.coordinates?.[1],
      amenities: hotel.amenities || [],
      ownerName: hotel.ownerName,
      status: hotel.status || 'active',
      images: imagesFileList,
    });
  };

  const columns = [
    { title: 'Hotel Name', dataIndex: 'name', key: 'name' },
    {
      title: 'City',
      dataIndex: ['address', 'city'],
      key: 'city',
      render: (city) => city || '-',
    },
    {
      title: 'Contact',
      dataIndex: ['contact', 'phone'],
      key: 'contact',
      render: (phone) => phone || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'blue' : 'red'}>
          {String(status || '').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Images',
      key: 'images',
      render: (_, record) => {
        const imgs = record.images || [];
        const first = imgs[0];
        const url = first ? buildImageUrl(first) : null;
        return url ? (
          <img src={url} alt="thumb" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4 }} />
        ) : '-';
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Delete this hotel?" onConfirm={() => handleDelete(record._id)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Upload props (we keep files client-side until submit)
  const uploadProps = {
    multiple: true,
    listType: 'picture',
    beforeUpload: () => false, // prevent auto upload
    accept: 'image/*',
    // we rely on Form.Item valuePropName="fileList" to manage the file list via form
    // optionally implement onRemove or onChange here if you want custom behavior
  };

  // When opening create modal, ensure form is reset
  const openCreate = () => {
    form.resetFields();
    setEditingHotel(null);
    setOpen(true);

    // set default status
    form.setFieldsValue({ status: 'active', images: [] });
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
        <Title level={3} style={{ margin: 0 }}>
          Hotels
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreate}
        >
          Create Hotel
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={hotels}
        rowKey="_id"
        loading={loading}
      />

      {/* Modal Form */}
      <Modal
        title={editingHotel ? 'Edit Hotel' : 'Create New Hotel'}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditingHotel(null);
        }}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={720}
        okText="Save"
      >
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Hotel Name"
                rules={[{ required: true, message: 'Please enter hotel name' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ownerName" label="Owner Name">
                <Input placeholder={session?.user?.name || session?.user?.email || ''} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="price" label="Price" rules={[{ required: true, message: 'Please enter hotel price' }]}>
            <Input rows={3} />
          </Form.Item>

          <Title level={5}>Address</Title>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="street" label="Street">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="city" label="City">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="state" label="State">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="country" label="Country">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="postalCode" label="Postal Code">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>Contact</Title>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[{ required: true, message: 'Phone is required' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>Location</Title>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="longitude" label="Longitude">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="latitude" label="Latitude">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="amenities" label="Amenities">
            <Select mode="tags" placeholder="Select or type amenities">
              <Select.Option value="wifi">WiFi</Select.Option>
              <Select.Option value="pool">Pool</Select.Option>
              <Select.Option value="spa">Spa</Select.Option>
              <Select.Option value="bar">Bar</Select.Option>
              <Select.Option value="parking">Parking</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="images"
            label="Hotel Images"
            valuePropName="fileList"
            getValueFromEvent={(e) => e && e.fileList}
          >
            <Upload.Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Click or drag images to upload</p>
              <p className="ant-upload-hint">You can upload multiple images (max 5MB each)</p>
            </Upload.Dragger>
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true }]}
            initialValue="active"
          >
            <Select>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
