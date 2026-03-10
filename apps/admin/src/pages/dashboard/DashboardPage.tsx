import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Row, Col, Card, Statistic, Table, Typography, Skeleton, Tag, Space, Button } from 'antd';
import {
  CalendarOutlined,
  CarOutlined,
  DollarOutlined,
  PauseCircleOutlined,
  BankOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services';
import { useAuthStore } from '@/stores/authStore';
import { SubscriptionStatus, OrderStatus, RecentActivity } from '@/types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// Stats card component
interface StatsCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  gradient: string;
  suffix?: string;
  loading?: boolean;
}

const StatsCard = ({ title, value, icon, gradient, suffix, loading }: StatsCardProps) => (
  <Card className={`stats-card ${gradient} text-white border-0`} bodyStyle={{ padding: '20px' }}>
    {loading ? (
      <Skeleton active paragraph={false} />
    ) : (
      <div className="flex items-center justify-between">
        <div>
          <Text className="text-white/80 text-sm">{title}</Text>
          <div className="text-3xl font-bold mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix && <span className="text-lg ml-1">{suffix}</span>}
          </div>
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    )}
  </Card>
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();

  // Fetch dashboard stats - only when we have a token
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: adminService.getDashboard,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    retry: 1,
    enabled: !!accessToken, // Only fetch if we have a token
  });

  const {
    data: activity,
    isLoading: activityLoading,
    refetch: refetchActivity,
  } = useQuery({
    queryKey: ['dashboardRecentActivity'],
    queryFn: adminService.getRecentActivity,
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
    enabled: !!accessToken,
  });

  type RecentSubscriptionRow = RecentActivity['recentSubscriptions'][number];
  type RecentOrderRow = RecentActivity['recentOrders'][number];

  // Subscription status tag
  const getStatusTag = (status: SubscriptionStatus) => {
    const colors: Record<SubscriptionStatus, string> = {
      [SubscriptionStatus.ACTIVE]: 'green',
      [SubscriptionStatus.PENDING]: 'orange',
      [SubscriptionStatus.PENDING_PAYMENT]: 'gold',
      [SubscriptionStatus.PAUSED]: 'blue',
      [SubscriptionStatus.COMPLETED]: 'cyan',
      [SubscriptionStatus.CANCELLED]: 'red',
    };
    return <Tag color={colors[status]}>{status}</Tag>;
  };

  // Order status tag
  const getOrderStatusTag = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      [OrderStatus.PAID]: 'green',
      [OrderStatus.PENDING]: 'orange',
      [OrderStatus.PROCESSING]: 'blue',
      [OrderStatus.FAILED]: 'red',
      [OrderStatus.REFUNDED]: 'purple',
      [OrderStatus.CANCELLED]: 'default',
    };
    return <Tag color={colors[status]}>{status}</Tag>;
  };

  // Recent subscriptions columns
  const subscriptionColumns: ColumnsType<RecentSubscriptionRow> = [
    {
      title: <span className="whitespace-nowrap">Subscription</span>,
      dataIndex: 'subscriptionNumber',
      key: 'subscriptionNumber',
      width: 140,
      ellipsis: true,
      render: (text: string) => (
        <Text strong className="whitespace-nowrap">
          {text}
        </Text>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Student</span>,
      dataIndex: ['student', 'fullName'],
      key: 'student',
      width: 160,
      ellipsis: true,
    },
    {
      title: <span className="whitespace-nowrap">School</span>,
      dataIndex: ['school', 'name'],
      key: 'school',
      width: 160,
      ellipsis: true,
    },
    {
      title: <span className="whitespace-nowrap">Status</span>,
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: SubscriptionStatus) => (
        <span className="whitespace-nowrap">{getStatusTag(status)}</span>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Date</span>,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
  ];

  // Recent orders columns
  const orderColumns: ColumnsType<RecentOrderRow> = [
    {
      title: 'Order',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Amount',
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      render: (amount: number) => `₹${(amount / 100).toLocaleString()}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: OrderStatus) => getOrderStatusTag(status),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM DD, HH:mm'),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Title level={2} className="!mb-1">
            Dashboard
          </Title>
          <Text type="secondary">Welcome back! Here's what's happening today.</Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            refetchStats();
            refetchActivity();
          }}
        >
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Active Subscriptions"
            value={stats?.activeSubscriptions || 0}
            icon={<CalendarOutlined />}
            gradient="gradient-green"
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Today's Deliveries"
            value={stats?.todayDeliveries || 0}
            icon={<CarOutlined />}
            gradient="gradient-blue"
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Monthly Revenue"
            value={stats ? `₹${((stats.monthlyRevenue || 0) / 100).toLocaleString()}` : '₹0'}
            icon={<DollarOutlined />}
            gradient="gradient-orange"
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Pending Pause Requests"
            value={stats?.pendingPauseRequests || 0}
            icon={<PauseCircleOutlined />}
            gradient="gradient-purple"
            loading={statsLoading}
          />
        </Col>
      </Row>

      {/* Secondary Stats */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Active Schools"
              value={stats?.activeSchools || 0}
              prefix={<BankOutlined className="text-green-500" />}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Parents"
              value={stats?.totalParents || 0}
              prefix={<UserOutlined className="text-blue-500" />}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Completed Deliveries Today"
              value={stats?.completedDeliveriesToday || 0}
              prefix={<CheckCircleOutlined className="text-green-500" />}
              loading={statsLoading}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <CalendarOutlined />
                Recent Subscriptions
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/subscriptions')}>
                View All <ArrowRightOutlined />
              </Button>
            }
          >
            <Table
              columns={subscriptionColumns}
              dataSource={activity?.recentSubscriptions || []}
              rowKey="id"
              pagination={false}
              loading={activityLoading}
              size="small"
              tableLayout="fixed"
              scroll={{ x: 'max-content' }}
              onRow={record => ({
                onClick: () => navigate(`/subscriptions/${record.id}`),
                className: 'cursor-pointer hover:bg-gray-50',
              })}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <DollarOutlined />
                Recent Orders
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/orders')}>
                View All <ArrowRightOutlined />
              </Button>
            }
          >
            <Table
              columns={orderColumns}
              dataSource={activity?.recentOrders || []}
              rowKey="id"
              pagination={false}
              loading={activityLoading}
              size="small"
              onRow={record => ({
                onClick: () => navigate(`/orders/${record.id}`),
                className: 'cursor-pointer hover:bg-gray-50',
              })}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
