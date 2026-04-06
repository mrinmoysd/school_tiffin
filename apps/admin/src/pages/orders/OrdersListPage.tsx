import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Input, Select, Typography, Card, Tag, DatePicker, Button, message } from 'antd';
import { SearchOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services';
import { Order, OrderFilters, OrderStatus } from '@/types';
import TableSkeleton from '@/components/TableSkeleton';
import ErrorState from '@/components/ErrorState';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const DATE_FORMAT = 'YYYY-MM-DD';

const OrdersListPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<OrderFilters>({});
  const [isExporting, setIsExporting] = useState(false);
  const startDateValue = filters.startDate ? dayjs(filters.startDate) : null;
  const endDateValue = filters.endDate ? dayjs(filters.endDate) : null;

  const handleStartDateChange = (date: Dayjs | null) => {
    if (!date) {
      setFilters(prev => ({ ...prev, startDate: undefined, endDate: undefined }));
      return;
    }

    setFilters(prev => ({
      ...prev,
      startDate: date.format(DATE_FORMAT),
      endDate: date.add(1, 'month').format(DATE_FORMAT),
    }));
  };

  const handleEndDateChange = (date: Dayjs | null) => {
    if (!date) {
      setFilters(prev => ({ ...prev, endDate: undefined }));
      return;
    }

    if (startDateValue && date.isBefore(startDateValue, 'day')) {
      return;
    }

    setFilters(prev => ({ ...prev, endDate: date.format(DATE_FORMAT) }));
  };

  // Fetch orders
  const {
    data: orders,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['orders', filters],
    queryFn: () => orderService.getAll(filters),
  });

  // Export handler
  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await orderService.exportCSV(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-${dayjs().format('YYYY-MM-DD')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.info('Export started');
    } catch (error) {
      message.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  // Status colors
  const statusColors: Record<OrderStatus, string> = {
    [OrderStatus.PAID]: 'green',
    [OrderStatus.PENDING]: 'orange',
    [OrderStatus.PROCESSING]: 'blue',
    [OrderStatus.FAILED]: 'red',
    [OrderStatus.REFUNDED]: 'purple',
    [OrderStatus.CANCELLED]: 'default',
  };

  // Table columns
  const columns: ColumnsType<Order> = [
    {
      title: <span className="whitespace-nowrap">Order #</span>,
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 140,
      ellipsis: true,
      render: (text: string) => (
        <Text strong className="whitespace-nowrap">
          {text}
        </Text>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Parent</span>,
      dataIndex: ['parent', 'fullName'],
      key: 'parent',
      width: 150,
      ellipsis: true,
    },
    {
      title: <span className="whitespace-nowrap">Subscription</span>,
      dataIndex: ['subscription', 'subscriptionNumber'],
      key: 'subscription',
      width: 150,
      ellipsis: true,
      render: (text: string, record) =>
        record.subscriptionId ? (
          <Button
            type="link"
            className="p-0 whitespace-nowrap"
            onClick={() => navigate(`/subscriptions/${record.subscriptionId}`)}
          >
            {text}
          </Button>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: <span className="whitespace-nowrap">Amount</span>,
      key: 'amount',
      width: 140,
      render: (_, record) => (
        <div>
          <div>₹{(record.finalAmount / 100).toLocaleString()}</div>
          {record.discountAmount > 0 && (
            <div className="text-xs text-green-600">
              -₹{(record.discountAmount / 100).toLocaleString()} discount
            </div>
          )}
        </div>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Payment Method</span>,
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 140,
      ellipsis: true,
      render: (method: string) => method || '-',
    },
    {
      title: <span className="whitespace-nowrap">Status</span>,
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: OrderStatus) => (
        <span className="whitespace-nowrap">
          <Tag color={statusColors[status]}>{status}</Tag>
        </span>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Date</span>,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY HH:mm'),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: <span className="whitespace-nowrap">Actions</span>,
      key: 'actions',
      width: 110,
      render: (_, record) => (
        <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/orders/${record.id}`)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Title level={2} className="!mb-1">
            Orders
          </Title>
          <Text type="secondary">View and manage all orders</Text>
        </div>
        <Button icon={<DownloadOutlined />} onClick={handleExport} loading={isExporting}>
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Search by order #..."
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="Filter by status"
            value={filters.status}
            onChange={value => setFilters({ ...filters, status: value })}
            style={{ width: 180 }}
            allowClear
            options={Object.values(OrderStatus).map(s => ({
              label: s,
              value: s,
            }))}
          />
          <DatePicker
            placeholder="Start date"
            format={DATE_FORMAT}
            value={startDateValue}
            onChange={handleStartDateChange}
            allowClear
          />
          <DatePicker
            placeholder="End date"
            format={DATE_FORMAT}
            value={endDateValue}
            onChange={handleEndDateChange}
            disabledDate={current => !!startDateValue && current.isBefore(startDateValue, 'day')}
            allowClear
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : isError ? (
          <ErrorState
            title="Unable to load orders"
            description={(error as Error)?.message}
            onRetry={refetch}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={orders}
            rowKey="id"
            tableLayout="fixed"
            scroll={{ x: 'max-content' }}
            pagination={{
              total: orders?.length,
              pageSize: 10,
              showSizeChanger: true,
              showTotal: total => `Total ${total} orders`,
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default OrdersListPage;
