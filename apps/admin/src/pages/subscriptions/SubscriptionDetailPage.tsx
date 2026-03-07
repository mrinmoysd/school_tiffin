import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Typography,
  Descriptions,
  Tag,
  Table,
  Spin,
  Tabs,
  Badge,
  Modal,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  UserOutlined,
  BankOutlined,
  CoffeeOutlined,
  PauseCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '@/services';
import { SubscriptionStatus, DeliveryStatus, PauseRequestStatus } from '@/types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { confirm } = Modal;

const SubscriptionDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // Fetch subscription
  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', id],
    queryFn: () => subscriptionService.getById(id!),
    enabled: !!id,
  });

  // Fetch schedule
  const { data: schedule } = useQuery({
    queryKey: ['subscriptionSchedule', id],
    queryFn: () => subscriptionService.getSchedule(id!),
    enabled: !!id,
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: () => subscriptionService.cancel(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      message.success('Subscription cancelled successfully');
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const handleCancel = () => {
    confirm({
      title: 'Cancel Subscription',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to cancel this subscription? This action cannot be undone.',
      okText: 'Yes, Cancel',
      okType: 'danger',
      onOk: () => cancelMutation.mutate(),
    });
  };

  // Status colors
  const statusColors: Record<SubscriptionStatus, string> = {
    [SubscriptionStatus.ACTIVE]: 'green',
    [SubscriptionStatus.PENDING]: 'orange',
    [SubscriptionStatus.PENDING_PAYMENT]: 'gold',
    [SubscriptionStatus.PAUSED]: 'blue',
    [SubscriptionStatus.COMPLETED]: 'cyan',
    [SubscriptionStatus.CANCELLED]: 'red',
  };

  const deliveryStatusColors: Record<DeliveryStatus, string> = {
    [DeliveryStatus.SCHEDULED]: 'default',
    [DeliveryStatus.DELIVERED]: 'green',
    [DeliveryStatus.PAUSED]: 'blue',
    [DeliveryStatus.CANCELLED]: 'red',
    [DeliveryStatus.SKIPPED]: 'orange',
  };

  const pauseStatusColors: Record<PauseRequestStatus, string> = {
    [PauseRequestStatus.PENDING]: 'orange',
    [PauseRequestStatus.APPROVED]: 'green',
    [PauseRequestStatus.REJECTED]: 'red',
    [PauseRequestStatus.PROCESSED]: 'blue',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="text-center py-12">
        <Text type="secondary">Subscription not found</Text>
        <br />
        <Button type="link" onClick={() => navigate('/subscriptions')}>
          Back to Subscriptions
        </Button>
      </div>
    );
  }

  // Schedule table columns
  const scheduleColumns = [
    {
      title: 'Date',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
      render: (date: string) => dayjs(date).format('ddd, MMM DD, YYYY'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: DeliveryStatus) => <Tag color={deliveryStatusColors[status]}>{status}</Tag>,
    },
    {
      title: 'Confirmed At',
      dataIndex: 'deliveryConfirmedAt',
      key: 'deliveryConfirmedAt',
      render: (date: string) => (date ? dayjs(date).format('MMM DD, HH:mm') : '-'),
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes: string) => notes || '-',
    },
  ];

  // Pause requests columns
  const pauseColumns = [
    {
      title: 'Period',
      key: 'period',
      render: (_: unknown, record: { startDate: string; endDate: string }) => (
        <span>
          {dayjs(record.startDate).format('MMM DD')} -{' '}
          {dayjs(record.endDate).format('MMM DD, YYYY')}
        </span>
      ),
    },
    {
      title: 'Days',
      dataIndex: 'pauseDays',
      key: 'pauseDays',
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (reason: string) => reason || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: PauseRequestStatus) => <Tag color={pauseStatusColors[status]}>{status}</Tag>,
    },
    {
      title: 'Requested',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
  ];

  const tabItems = [
    {
      key: 'schedule',
      label: (
        <span>
          <CalendarOutlined /> Delivery Schedule
        </span>
      ),
      children: (
        <Table
          columns={scheduleColumns}
          dataSource={schedule}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="small"
        />
      ),
    },
    {
      key: 'pauses',
      label: (
        <span>
          <PauseCircleOutlined /> Pause Requests
          {subscription.pauseRequests && subscription.pauseRequests.length > 0 && (
            <Badge count={subscription.pauseRequests.length} className="ml-2" />
          )}
        </span>
      ),
      children: (
        <Table
          columns={pauseColumns}
          dataSource={subscription.pauseRequests}
          rowKey="id"
          pagination={false}
          size="small"
          locale={{ emptyText: 'No pause requests' }}
        />
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/subscriptions')}
          />
          <div>
            <div className="flex items-center gap-3">
              <Title level={2} className="!mb-0">
                {subscription.subscriptionNumber}
              </Title>
              <Tag color={statusColors[subscription.status]} className="text-sm">
                {subscription.status}
              </Tag>
            </div>
            <Text type="secondary">
              Created {dayjs(subscription.createdAt).format('MMM DD, YYYY')}
            </Text>
          </div>
        </div>
        {subscription.status === SubscriptionStatus.ACTIVE && (
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={handleCancel}
            loading={cancelMutation.isPending}
          >
            Cancel Subscription
          </Button>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <UserOutlined className="text-blue-600" />
            </div>
            <div>
              <Text type="secondary" className="text-xs">
                Parent
              </Text>
              <div className="font-medium">{subscription.parent?.fullName}</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <UserOutlined className="text-green-600" />
            </div>
            <div>
              <Text type="secondary" className="text-xs">
                Student
              </Text>
              <div className="font-medium">{subscription.student?.fullName}</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <BankOutlined className="text-purple-600" />
            </div>
            <div>
              <Text type="secondary" className="text-xs">
                School
              </Text>
              <div className="font-medium">{subscription.school?.name}</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <CoffeeOutlined className="text-orange-600" />
            </div>
            <div>
              <Text type="secondary" className="text-xs">
                Meal Plan
              </Text>
              <div className="font-medium">{subscription.mealPlan?.name}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Details */}
      <Card className="mb-6">
        <Descriptions title="Subscription Details" column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="Start Date">
            {dayjs(subscription.startDate).format('MMM DD, YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="End Date">
            {dayjs(subscription.endDate).format('MMM DD, YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Total Days">{subscription.totalDays}</Descriptions.Item>
          <Descriptions.Item label="Delivered Days">
            <Text type="success">{subscription.deliveredDays}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Paused Days">
            <Text type="warning">{subscription.pausedDays}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Remaining Days">
            <Text strong>{subscription.remainingDays}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Total Price">
            ₹{(subscription.totalPrice / 100).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Paid Amount">
            <Text type="success">₹{(subscription.paidAmount / 100).toLocaleString()}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Currency">{subscription.currency}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Schedule & Pause Requests */}
      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
};

export default SubscriptionDetailPage;
