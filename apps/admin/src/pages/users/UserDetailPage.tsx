import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Typography,
  Tag,
  Table,
  Spin,
  Tabs,
  Switch,
  message,
  Avatar,
  Image,
  Modal,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { userService } from '@/services';
import { UserRole, SubscriptionStatus, OrderStatus } from '@/types';
import HorizontalScrollContainer from '@/components/HorizontalScrollContainer';
import { formatStudentName, formatUserName } from '@/utils/formatters';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const UserDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isProfileImagePreviewOpen, setIsProfileImagePreviewOpen] = useState(false);

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

  const canPreviewProfileImage = Boolean(user.profileImageUrl);

  // Students columns
  const studentColumns = [
    {
      title: <span className="whitespace-nowrap">Image</span>,
      dataIndex: 'profileImageUrl',
      key: 'profileImageUrl',
      width: 90,
      render: (profileImageUrl?: string | null) =>
        profileImageUrl ? (
          <Image
            src={profileImageUrl}
            alt="Student"
            width={44}
            height={44}
            className="rounded-full object-cover"
            preview={{ mask: 'View' }}
          />
        ) : (
          <Avatar size={44} icon={<UserOutlined />} style={{ backgroundColor: '#16a34a' }} />
        ),
    },
    {
      title: <span className="whitespace-nowrap">Name</span>,
      dataIndex: 'firstName',
      key: 'name',
      width: 160,
      ellipsis: true,
      render: (_: string, record: { firstName?: string; lastName?: string }) =>
        formatStudentName(record),
    },
    {
      title: <span className="whitespace-nowrap">Grade</span>,
      dataIndex: 'grade',
      key: 'grade',
      width: 90,
    },
    {
      title: <span className="whitespace-nowrap">School</span>,
      dataIndex: ['school', 'name'],
      key: 'school',
      width: 180,
      ellipsis: true,
    },
    {
      title: <span className="whitespace-nowrap">Active</span>,
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>{active ? 'Yes' : 'No'}</Tag>
      ),
    },
  ];

  // Subscriptions columns
  const subscriptionColumns = [
    {
      title: <span className="whitespace-nowrap">Subscription #</span>,
      dataIndex: 'subscriptionNumber',
      key: 'subscriptionNumber',
      width: 160,
      ellipsis: true,
      render: (text: string, record: { id: string }) => (
        <Button type="link" className="p-0" onClick={() => navigate(`/subscriptions/${record.id}`)}>
          {text}
        </Button>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Student</span>,
      dataIndex: 'student',
      key: 'student',
      width: 150,
      ellipsis: true,
      render: (student: { firstName?: string; lastName?: string }) => formatStudentName(student),
    },
    {
      title: <span className="whitespace-nowrap">Meal Plan</span>,
      dataIndex: ['mealPlan', 'name'],
      key: 'mealPlan',
      width: 150,
      ellipsis: true,
    },
    {
      title: <span className="whitespace-nowrap">Status</span>,
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: SubscriptionStatus) => (
        <Tag color={subscriptionStatusColors[status]}>{status}</Tag>
      ),
    },
    {
      title: <span className="whitespace-nowrap">End Date</span>,
      dataIndex: 'endDate',
      key: 'endDate',
      width: 140,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
  ];

  // Orders columns
  const orderColumns = [
    {
      title: <span className="whitespace-nowrap">Order #</span>,
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 150,
      ellipsis: true,
      render: (text: string, record: { id: string }) => (
        <Button type="link" className="p-0" onClick={() => navigate(`/orders/${record.id}`)}>
          {text}
        </Button>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Amount</span>,
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      width: 120,
      render: (amount: number) => `₹${(amount / 100).toLocaleString()}`,
    },
    {
      title: <span className="whitespace-nowrap">Status</span>,
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: OrderStatus) => <Tag color={orderStatusColors[status]}>{status}</Tag>,
    },
    {
      title: <span className="whitespace-nowrap">Date</span>,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
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
        <HorizontalScrollContainer>
          <Table
            columns={studentColumns}
            dataSource={students}
            rowKey="id"
            pagination={false}
            size="small"
            tableLayout="fixed"
            scroll={{ x: 'max-content', y: 'clamp(260px, calc(100vh - 360px), 720px)' }}
          />
        </HorizontalScrollContainer>
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
        <HorizontalScrollContainer>
          <Table
            columns={subscriptionColumns}
            dataSource={subscriptions}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            size="small"
            tableLayout="fixed"
            scroll={{ x: 'max-content', y: 'clamp(260px, calc(100vh - 360px), 720px)' }}
          />
        </HorizontalScrollContainer>
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
        <HorizontalScrollContainer>
          <Table
            columns={orderColumns}
            dataSource={orders}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            size="small"
            tableLayout="fixed"
            scroll={{ x: 'max-content', y: 'clamp(260px, calc(100vh - 360px), 720px)' }}
          />
        </HorizontalScrollContainer>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/users')} />
        <div>
          <Title level={2} className="!mb-0">
            {formatUserName(user)}
          </Title>
          <Text type="secondary">User Profile</Text>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card>
          <div className="text-center mb-6">
            <button
              type="button"
              className="bg-transparent border-0 p-0"
              disabled={!canPreviewProfileImage}
              onClick={() => {
                if (!canPreviewProfileImage) return;
                setIsProfileImagePreviewOpen(true);
              }}
              aria-label="Preview profile image"
            >
              <Avatar
                size={80}
                src={user.profileImageUrl || undefined}
                icon={!user.profileImageUrl ? <UserOutlined /> : undefined}
                style={{ backgroundColor: '#16a34a' }}
                className={canPreviewProfileImage ? 'cursor-zoom-in' : ''}
              />
            </button>
            <Title level={4} className="!mt-4 !mb-1">
              {formatUserName(user)}
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
        <div className="xl:col-span-2">
          <Card>
            <Tabs items={tabItems} />
          </Card>
        </div>
      </div>

      <Modal
        open={isProfileImagePreviewOpen}
        footer={null}
        onCancel={() => setIsProfileImagePreviewOpen(false)}
        centered
        width={520}
      >
        {user.profileImageUrl && (
          <Image
            src={user.profileImageUrl}
            alt={`${formatUserName(user)} profile image`}
            preview={false}
            className="w-full rounded-lg"
          />
        )}
      </Modal>
    </div>
  );
};

export default UserDetailPage;
