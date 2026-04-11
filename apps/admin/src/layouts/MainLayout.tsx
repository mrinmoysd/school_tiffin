import { appSettingService, pauseRequestService } from '@/services';
import { useAuthStore } from '@/stores/authStore';
import {
  BankOutlined,
  BarChartOutlined,
  BellOutlined,
  CalendarOutlined,
  CarOutlined,
  CoffeeOutlined,
  DashboardOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PauseCircleOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import type { MenuProps } from 'antd';
import { Avatar, Badge, Button, Dropdown, Image, Layout, Menu, Modal, theme } from 'antd';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { formatUserName } from '@/utils/formatters';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Get access token to check if authenticated
  const { accessToken } = useAuthStore();

  // Fetch pending pause requests count for badge - only if authenticated
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['pendingPauseRequests'],
    queryFn: pauseRequestService.getPendingCount,
    refetchInterval: 60000, // Refresh every minute
    enabled: !!accessToken, // Only fetch if we have a token
    retry: 1,
  });

  const { data: brandingSetting } = useQuery({
    queryKey: ['appSettings', 'branding'],
    queryFn: appSettingService.getBrandingSetting,
    retry: 1,
  });

  const appLogoUrl = brandingSetting?.logoUrl || null;

  useEffect(() => {
    document.title = 'School Tiffin - Admin Panel';

    const faviconElement = document.querySelector('link[rel~="icon"]');
    if (faviconElement) {
      faviconElement.setAttribute('href', appLogoUrl || '/vite.svg');
    }
  }, [appLogoUrl]);

  // Menu items
  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/schools',
      icon: <BankOutlined />,
      label: 'Schools',
    },
    {
      key: '/meal-plans',
      icon: <CoffeeOutlined />,
      label: 'Meal Plans',
    },
    {
      key: '/subscriptions',
      icon: <CalendarOutlined />,
      label: 'Subscriptions',
    },
    {
      key: '/orders',
      icon: <ShoppingCartOutlined />,
      label: 'Orders',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: 'Users',
    },
    {
      key: '/pause-requests',
      icon: <PauseCircleOutlined />,
      label: (
        <span className="flex items-center justify-between w-full">
          Pause Requests
          {pendingCount > 0 && <Badge count={pendingCount} size="small" className="ml-2" />}
        </span>
      ),
    },
    {
      key: '/deliveries',
      icon: <CarOutlined />,
      label: 'Deliveries',
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
      children: [
        {
          key: '/reports/sales',
          label: 'Sales Report',
        },
        {
          key: '/reports/subscriptions',
          label: 'Subscriptions Report',
        },
      ],
    },
    {
      key: '/cms',
      icon: <FileTextOutlined />,
      label: 'CMS',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  // User dropdown menu
  const userMenuItems: MenuProps['items'] = [
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
      return;
    }
    navigate(key);
  };

  // Get current selected menu key
  const getSelectedKey = () => {
    const path = location.pathname;
    // Handle nested routes
    if (path.startsWith('/schools')) return '/schools';
    if (path.startsWith('/meal-plans')) return '/meal-plans';
    if (path.startsWith('/subscriptions')) return '/subscriptions';
    if (path.startsWith('/orders')) return '/orders';
    if (path.startsWith('/users')) return '/users';
    if (path.startsWith('/reports/sales')) return '/reports/sales';
    if (path.startsWith('/reports/subscriptions')) return '/reports/subscriptions';
    if (path.startsWith('/cms')) return '/cms';
    if (path.startsWith('/settings')) return '/settings';
    if (path.startsWith('/profile')) return '/profile';
    return path;
  };

  // Get open keys for submenu
  const getOpenKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/reports')) return ['reports'];
    return [];
  };

  return (
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        breakpoint="lg"
        collapsed={collapsed}
        width={260}
        className="shadow-md"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
        onBreakpoint={broken => setCollapsed(broken)}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-700">
          <div className="flex items-center gap-2">
            {appLogoUrl ? (
              <img
                src={appLogoUrl}
                alt="School Tiffin logo"
                className="w-8 h-8 rounded-md object-cover bg-white"
              />
            ) : (
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <CoffeeOutlined className="text-white text-lg" />
              </div>
            )}
            {!collapsed && <span className="text-white font-semibold text-lg">School Tiffin</span>}
          </div>
        </div>

        {/* Navigation Menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={handleMenuClick}
          className="border-none"
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'margin-left 0.2s' }}>
        {/* Header */}
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 48, height: 48 }}
          />

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Badge count={pendingCount} size="small">
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: '18px' }} />}
                onClick={() => navigate('/pause-requests')}
              />
            </Badge>

            {/* User Dropdown */}
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors">
                <Avatar
                  src={user?.profileImageUrl || undefined}
                  style={{ backgroundColor: '#16a34a' }}
                  icon={!user?.profileImageUrl ? <UserOutlined /> : undefined}
                  className={user?.profileImageUrl ? 'cursor-zoom-in' : ''}
                  onClick={event => {
                    if (!user?.profileImageUrl) return;
                    event?.stopPropagation();
                    setIsAvatarPreviewOpen(true);
                  }}
                />
                <div className="hidden md:block">
                  <div className="text-sm font-medium">{formatUserName(user)}</div>
                  <div className="text-xs text-gray-500">{user?.role}</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Content */}
        <Content
          style={{
            margin: '24px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <div className="page-transition" key={location.pathname}>
            <Outlet />
          </div>
        </Content>
      </Layout>

      <Modal
        open={isAvatarPreviewOpen}
        footer={null}
        onCancel={() => setIsAvatarPreviewOpen(false)}
        centered
        width={520}
      >
        {user?.profileImageUrl && (
          <Image
            src={user.profileImageUrl}
            alt={formatUserName(user) || 'Profile image'}
            preview={false}
            className="w-full rounded-lg"
          />
        )}
      </Modal>
    </Layout>
  );
};

export default MainLayout;
