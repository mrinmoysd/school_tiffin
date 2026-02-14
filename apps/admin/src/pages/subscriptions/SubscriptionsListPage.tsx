import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Input,
  Select,
  Typography,
  Card,
  Tag,
  DatePicker,
  Space,
  Button,
} from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { subscriptionService, schoolService } from '@/services';
import { Subscription, SubscriptionFilters, SubscriptionStatus } from '@/types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const SubscriptionsListPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SubscriptionFilters>({});

  // Fetch subscriptions
  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['subscriptions', filters],
    queryFn: () => subscriptionService.getAll(filters),
  });

  // Fetch schools for filter
  const { data: schools } = useQuery({
    queryKey: ['schools'],
    queryFn: () => schoolService.getAll(),
  });

  // Status colors
  const statusColors: Record<SubscriptionStatus, string> = {
    [SubscriptionStatus.ACTIVE]: 'green',
    [SubscriptionStatus.PENDING]: 'orange',
    [SubscriptionStatus.PENDING_PAYMENT]: 'gold',
    [SubscriptionStatus.PAUSED]: 'blue',
    [SubscriptionStatus.COMPLETED]: 'cyan',
    [SubscriptionStatus.CANCELLED]: 'red',
  };

  // Table columns
  const columns: ColumnsType<Subscription> = [
    {
      title: 'Subscription #',
      dataIndex: 'subscriptionNumber',
      key: 'subscriptionNumber',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Parent',
      dataIndex: ['parent', 'fullName'],
      key: 'parent',
    },
    {
      title: 'Student',
      dataIndex: ['student', 'fullName'],
      key: 'student',
    },
    {
      title: 'School',
      dataIndex: ['school', 'name'],
      key: 'school',
      ellipsis: true,
    },
    {
      title: 'Meal Plan',
      dataIndex: ['mealPlan', 'name'],
      key: 'mealPlan',
      ellipsis: true,
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_, record) => (
        <div className="text-xs">
          <div>{dayjs(record.startDate).format('MMM DD')} - {dayjs(record.endDate).format('MMM DD, YYYY')}</div>
        </div>
      ),
    },
    {
      title: 'Days',
      key: 'days',
      render: (_, record) => (
        <div className="text-xs">
          <div>Total: {record.totalDays}</div>
          <div className="text-green-600">Remaining: {record.remainingDays}</div>
        </div>
      ),
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_, record) => (
        <div>
          <div>₹{(record.totalPrice / 100).toLocaleString()}</div>
          <div className="text-xs text-gray-500">
            Paid: ₹{(record.paidAmount / 100).toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: SubscriptionStatus) => (
        <Tag color={statusColors[status]}>{status}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/subscriptions/${record.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Title level={2} className="!mb-1">Subscriptions</Title>
        <Text type="secondary">View and manage all subscriptions</Text>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Search by subscription #..."
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="Filter by status"
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
            style={{ width: 180 }}
            allowClear
            options={Object.values(SubscriptionStatus).map((s) => ({
              label: s,
              value: s,
            }))}
          />
          <Select
            placeholder="Filter by school"
            value={filters.schoolId}
            onChange={(value) => setFilters({ ...filters, schoolId: value })}
            style={{ width: 200 }}
            allowClear
            showSearch
            optionFilterProp="label"
            options={schools?.map((s) => ({ label: s.name, value: s.id }))}
          />
          <RangePicker
            onChange={(dates) => {
              if (dates) {
                setFilters({
                  ...filters,
                  startDate: dates[0]?.format('YYYY-MM-DD'),
                  endDate: dates[1]?.format('YYYY-MM-DD'),
                });
              } else {
                setFilters({ ...filters, startDate: undefined, endDate: undefined });
              }
            }}
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={subscriptions}
          rowKey="id"
          loading={isLoading}
          pagination={{
            total: subscriptions?.length,
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} subscriptions`,
          }}
          onRow={(record) => ({
            onClick: () => navigate(`/subscriptions/${record.id}`),
            className: 'cursor-pointer hover:bg-gray-50',
          })}
        />
      </Card>
    </div>
  );
};

export default SubscriptionsListPage;
