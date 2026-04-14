import { appSettingService, notificationService, pauseRequestService } from '@/services';
import { useAuthStore } from '@/stores/authStore';
import { AppNotification } from '@/types';
import { formatRelativeTime, formatUserName } from '@/utils/formatters';
import {
  ArrowRightOutlined,
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MenuProps } from 'antd';
import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  Empty,
  Image,
  Layout,
  Menu,
  Modal,
  Popover,
  Spin,
  Typography,
  theme,
} from 'antd';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
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

  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    isError: notificationsError,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ['notifications', 'all'],
    queryFn: () => notificationService.getAll(),
    refetchInterval: 60000,
    enabled: !!accessToken,
    retry: 1,
  });

  const { data: unreadNotificationsCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationService.getUnreadCount,
    refetchInterval: 60000,
    enabled: !!accessToken,
    retry: 1,
  });

  const markNotificationReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllNotificationsReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
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

  const getNotificationDataString = (notification: AppNotification, key: string): string | null => {
    const value = notification.data?.[key];
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  };

  const resolveNotificationPath = (notification: AppNotification): string => {
    const referenceType = notification.referenceType?.toUpperCase();
    const referenceId = notification.referenceId;
    if (referenceId) {
      if (referenceType === 'SUBSCRIPTION') return `/subscriptions/${referenceId}`;
      if (referenceType === 'ORDER') return `/orders/${referenceId}`;
      if (referenceType === 'USER' || referenceType === 'PARENT') return `/users/${referenceId}`;
      if (referenceType === 'PAUSE_REQUEST') return `/pause-requests?requestId=${referenceId}`;
      if (referenceType === 'DELIVERY' || referenceType === 'SUBSCRIPTION_DAY') {
        return `/deliveries?deliveryId=${referenceId}`;
      }
    }

    const subscriptionId = getNotificationDataString(notification, 'subscriptionId');
    if (subscriptionId) return `/subscriptions/${subscriptionId}`;

    const orderId = getNotificationDataString(notification, 'orderId');
    if (orderId) return `/orders/${orderId}`;

    const userId = getNotificationDataString(notification, 'userId');
    if (userId) return `/users/${userId}`;

    const parentId = getNotificationDataString(notification, 'parentId');
    if (parentId) return `/users/${parentId}`;

    const pauseRequestId = getNotificationDataString(notification, 'pauseRequestId');
    if (pauseRequestId) return `/pause-requests?requestId=${pauseRequestId}`;

    const deliveryId = getNotificationDataString(notification, 'deliveryId');
    if (deliveryId) return `/deliveries?deliveryId=${deliveryId}`;

    const notificationType =
      getNotificationDataString(notification, 'type')?.toUpperCase() ||
      notification.notificationType?.toUpperCase() ||
      '';

    if (notificationType.includes('PAUSE')) return '/pause-requests';
    if (notificationType.includes('DELIVERY')) return '/deliveries';
    if (notificationType.includes('SUBSCRIPTION')) return '/subscriptions';
    if (notificationType.includes('ORDER') || notificationType.includes('PAYMENT'))
      return '/orders';

    return '/dashboard';
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.isRead) {
      try {
        await markNotificationReadMutation.mutateAsync(notification.id);
      } catch {
        // Ignore and continue navigation even if read update fails.
      }
    }

    setIsNotificationOpen(false);
    navigate(resolveNotificationPath(notification));
  };

  const notificationShade = (
    <div className="w-[360px] max-w-[calc(100vw-24px)] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-b from-slate-100/80 to-white">
        <div className="flex items-center justify-between gap-3">
          <Text strong className="text-base">
            Notifications
          </Text>
          <div className="flex items-center gap-2">
            {unreadNotificationsCount > 0 && (
              <Button
                type="link"
                size="small"
                className="!px-0"
                loading={markAllNotificationsReadMutation.isPending}
                onClick={() => markAllNotificationsReadMutation.mutate()}
              >
                Mark all read
              </Button>
            )}
            <Button type="text" size="small" onClick={() => refetchNotifications()}>
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-h-[440px] overflow-y-auto p-2 bg-white">
        {notificationsLoading ? (
          <div className="py-8 flex justify-center">
            <Spin size="small" />
          </div>
        ) : notificationsError ? (
          <div className="py-8 text-center">
            <Text type="secondary">Unable to load notifications</Text>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-6">
            <Empty description="no notification" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          notifications.map(item => (
            <button
              key={item.id}
              type="button"
              className={`w-full text-left rounded-xl border px-3 py-3 mb-2 last:mb-0 transition-all ${
                item.isRead
                  ? 'border-slate-200 bg-white hover:bg-slate-50'
                  : 'border-slate-300 bg-slate-50 shadow-sm hover:bg-slate-100'
              }`}
              onClick={() => handleNotificationClick(item)}
            >
              <div className="flex items-start gap-3">
                {!item.isRead && (
                  <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Text strong className="leading-5">
                      {item.title}
                    </Text>
                    <ArrowRightOutlined className="text-slate-400 mt-0.5" />
                  </div>
                  <div className="mt-1 text-xs text-slate-600 break-words">{item.body}</div>
                  <div className="mt-2 text-[11px] text-slate-500">
                    {formatRelativeTime(item.createdAt)}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

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
            height: 56,
            lineHeight: '56px',
            padding: '0 16px',
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
            onClick={() => setCollapsed(previous => !previous)}
            style={{ fontSize: '15px', width: 40, height: 40 }}
          />

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Popover
              trigger="click"
              placement="bottomRight"
              open={isNotificationOpen}
              onOpenChange={setIsNotificationOpen}
              content={notificationShade}
              styles={{
                body: { padding: 0, borderRadius: 16, overflow: 'hidden' },
              }}
            >
              <Badge count={unreadNotificationsCount} size="small">
                <Button type="text" icon={<BellOutlined style={{ fontSize: '18px' }} />} />
              </Badge>
            </Popover>

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
            padding: '0 24px 24px',
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
