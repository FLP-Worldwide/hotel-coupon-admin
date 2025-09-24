'use client';
import React, { useState, useMemo } from 'react';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Button, Avatar, Dropdown, theme } from 'antd';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../components/hooks/useAuth';
const { Header, Sider, Content } = Layout;

const AdminLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '';

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Menu items
  const menuItems = [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/admin/hotels', icon: <AppstoreOutlined />, label: 'Hotels' },
    { key: '/admin/bookings', icon: <ShoppingOutlined />, label: 'Bookings' },
    { key: '/admin/coupons', icon: <ShoppingOutlined />, label: 'Coupons' },
    { key: '/admin/users', icon: <UserOutlined />, label: 'Users' },
  ];

  const userMenuItems = [
    { key: 'profile', label: 'Profile' },
    { key: 'logout', label: 'Logout' },
  ];

  const handleMenuClick = ({ key }) => {
    if (key && key !== pathname) router.push(key);
  };

  const handleUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      if (typeof logout === 'function') logout();
      router.push('/');
    }
    if (key === 'profile') router.push('/admin/profile');
  };

  const selectedKey = useMemo(() => {
    const found = menuItems.find((m) => pathname.startsWith(m.key));
    return found ? found.key : '/admin/dashboard';
  }, [pathname]);

  const initials = useMemo(() => {
    const name = user?.name || user?.email || 'Admin';
    return name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [user]);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f3f7fb' }}>
      {/* SIDEBAR */}
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={220}
        style={{
          background: '#052A56', // deep blue
          boxShadow: '2px 0 10px rgba(6,30,72,0.08)',
          paddingTop: 12,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 20px',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: collapsed ? 18 : 18,
            letterSpacing: 0.4,
          }}
        >
          {collapsed ? 'NA' : 'Notion Advertising'}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            marginTop: 12,
            background: 'transparent',
            borderRight: 'none',
            color: '#EAF2FF',
          }}
          inlineCollapsed={collapsed}
        />
      </Sider>

      {/* MAIN */}
      <Layout>
        <Header
          style={{
            padding: '0 18px',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 0 rgba(12,20,30,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button
              type="text"
              onClick={() => setCollapsed(!collapsed)}
              style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: collapsed ? 'transparent' : 'rgba(22,119,255,0.06)',
                color: '#0f1724',
                border: '1px solid rgba(22,119,255,0.08)',
              }}
            >
              {collapsed ? (
                <MenuUnfoldOutlined style={{ fontSize: 18, color: '#1677ff' }} />
              ) : (
                <MenuFoldOutlined style={{ fontSize: 18, color: '#1677ff' }} />
              )}
            </Button>

            <div style={{ fontWeight: 600, fontSize: 16, color: '#0f1724' }}>
              Admin Panel
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right', marginRight: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1724' }}>
                {user?.name || 'Admin'}
              </div>
              {/* <div style={{ fontSize: 12, color: '#6B7280' }}>{user?.email || ''}</div> */}
            </div>

            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
            >
              <div
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: 6,
                  borderRadius: 8,
                }}
              >
                <Avatar
                  size="large"
                  style={{
                    background: '#e6f4ff',
                    color: '#0b57d0',
                    border: '2px solid rgba(22,119,255,0.12)',
                    fontWeight: 700,
                  }}
                >
                  {initials}
                </Avatar>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* CONTENT */}
        <Content
          style={{
            margin: 16,
            padding: 24,
            minHeight: 'calc(100vh - 64px - 32px)',
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            boxShadow: '0 6px 20px rgba(12,15,20,0.06)',
            overflow: 'auto',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
