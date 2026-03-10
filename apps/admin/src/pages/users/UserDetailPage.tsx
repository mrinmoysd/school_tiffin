import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Typography, Tag, Table, Spin, Tabs, Switch, message, Avatar } from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services';
import { UserRole, SubscriptionStatus, OrderStatus } from '@/types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const UserDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // Fetch user
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getById(id!),
    enabled: !!id,
  });

  // Fetch user's students
  const { data: students } = useQuery({
    queryKey: ['userStudents', id],
    queryFn: () => userService.getStudents(id!),
    enabled: !!id,
  });

  // Fetch user's subscriptions
  const { data: subscriptions } = useQuery({
    queryKey: ['userSubscriptions', id],
    queryFn: () => userService.getSubscriptions(id!),
    enabled: !!id,
  });

  // Fetch user's orders
  const { data: orders } = useQuery({
    queryKey: ['userOrders', id],
    queryFn: () => userService.getOrders(id!),
    enabled: !!id,
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: () => userService.toggleActive(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('User status updated');
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  // Role colors
  const roleColors: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'red',
    [UserRole.PARENT]: 'blue',
    [UserRole.SCHOOL_ADMIN]: 'purple',
  };

  const subscriptionStatusColors: Record<SubscriptionStatus, string> = {
    [SubscriptionStatus.ACTIVE]: 'green',
    [SubscriptionStatus.PENDING]: 'orange',
    [SubscriptionStatus.PENDING_PAYMENT]: 'gold',
    [SubscriptionStatus.PAUSED]: 'blue',
    [SubscriptionStatus.COMPLETED]: 'cyan',
    [SubscriptionStatus.CANCELLED]: 'red',
  };

  const orderStatusColors: Record<OrderStatus, string> = {
    [OrderStatus.PAID]: 'green',
    [OrderStatus.PENDING]: 'orange',
    [OrderStatus.PROCESSING]: 'blue',
    [OrderStatus.FAILED]: 'red',
    [OrderStatus.REFUNDED]: 'purple',
    [OrderStatus.CANCELLED]: 'default',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <Text type="secondary">User not found</Text>
        <br />
        <Button type="link" onClick={() => navigate('/users')}>
          Back to Users
        </Button>
      </div>
    );
  }

  // Students columns
  const studentColumns = [
    { title: 'Name', dataIndex: 'fullName', key: 'fullName' },
    { title: 'Grade', dataIndex: 'grade', key: 'grade' },
    { title: 'School', dataIndex: ['school', 'name'], key: 'school' },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>{active ? 'Yes' : 'No'}</Tag>
      ),
    },
  ];

  // Subscriptions columns
  const subscriptionColumns = [
    {
      title: 'Subscription #',
      dataIndex: 'subscriptionNumber',
      key: 'subscriptionNumber',
      render: (text: string, record: { id: string }) => (
        <Button type="link" className="p-0" onClick={() => navigate(`/subscriptions/${record.id}`)}>
          {text}
        </Button>
      ),
    },
    { title: 'Student', dataIndex: ['student', 'fullName'], key: 'student' },
    { title: 'Meal Plan', dataIndex: ['mealPlan', 'name'], key: 'mealPlan' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: SubscriptionStatus) => (
        <Tag color={subscriptionStatusColors[status]}>{status}</Tag>
      ),
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
  ];

  // Orders columns
  const orderColumns = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string, record: { id: string }) => (
        <Button type="link" className="p-0" onClick={() => navigate(`/orders/${record.id}`)}>
          {text}
        </Button>
      ),
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
      render: (status: OrderStatus) => <Tag color={orderStatusColors[status]}>{status}</Tag>,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
  ];

  const tabItems = [
    {
      key: 'students',
      label: (
        <span>
          <UserOutlined /> Students ({students?.length || 0})
        </span>
      ),
      children: (
        <Table
          columns={studentColumns}
          dataSource={students}
          rowKey="id"
          pagination={false}
          size="small"
        />
      ),
    },
    {
      key: 'subscriptions',
      label: (
        <span>
          <CalendarOutlined /> Subscriptions ({subscriptions?.length || 0})
        </span>
      ),
      children: (
        <Table
          columns={subscriptionColumns}
          dataSource={subscriptions}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          size="small"
        />
      ),
    },
    {
      key: 'orders',
      label: (
        <span>
          <ShoppingCartOutlined /> Orders ({orders?.length || 0})
        </span>
      ),
      children: (
        <Table
          columns={orderColumns}
          dataSource={orders}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          size="small"
        />
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/users')} />
        <div>
          <Title level={2} className="!mb-0">
            {user.fullName}
          </Title>
          <Text type="secondary">User Profile</Text>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card>
          <div className="text-center mb-6">
            <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: '#16a34a' }} />
            <Title level={4} className="!mt-4 !mb-1">
              {user.fullName}
            </Title>
            <Tag color={roleColors[user.role]}>{user.role}</Tag>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <MailOutlined className="text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Email</div>
                <div>{user.email}</div>
              </div>
              {user.emailVerified && (
                <Tag color="green" className="ml-auto text-xs">
                  Verified
                </Tag>
              )}
            </div>
            {user.phoneNumber && (
              <div className="flex items-center gap-3">
                <PhoneOutlined className="text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500">Phone</div>
                  <div>{user.phoneNumber}</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <CalendarOutlined className="text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Joined</div>
                <div>{dayjs(user.createdAt).format('MMM DD, YYYY')}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <Text>Account Active</Text>
              <Switch
                checked={user.isActive}
                onChange={() => toggleActiveMutation.mutate()}
                loading={toggleActiveMutation.isPending}
              />
            </div>
          </div>
        </Card>

        {/* Activity */}
        <div className="lg:col-span-2">
          <Card>
            <Tabs items={tabItems} />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;
