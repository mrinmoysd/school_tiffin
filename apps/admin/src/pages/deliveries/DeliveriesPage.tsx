import { useState } from 'react';
import type { Key } from 'react';
import { Table, Select, Typography, Card, Tag, DatePicker, Button, Space, message } from 'antd';
import { DownloadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, schoolService } from '@/services';
import { DeliveryItem, DeliveryFilters, DeliveryStatus } from '@/types';
import TableSkeleton from '@/components/TableSkeleton';
import ErrorState from '@/components/ErrorState';
import HorizontalScrollContainer from '@/components/HorizontalScrollContainer';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const DeliveriesPage = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedSchool, setSelectedSchool] = useState<string | undefined>();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const filters: DeliveryFilters = {
    date: selectedDate.format('YYYY-MM-DD'),
    schoolId: selectedSchool,
  };

  // Fetch deliveries
  const {
    data: deliveries,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['deliveries', filters],
    queryFn: () => adminService.getDeliveries(filters),
  });

  // Fetch schools
  const { data: schools } = useQuery({
    queryKey: ['schools'],
    queryFn: () => schoolService.getAll(),
  });

  // Mark delivered mutation
  const markDeliveredMutation = useMutation({
    mutationFn: adminService.markDelivered,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      setSelectedRows([]);
      message.success('Deliveries marked as delivered');
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  // Export handler
  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setIsExporting(true);
      const blob = await adminService.exportDeliveries(filters, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deliveries-${selectedDate.format('YYYY-MM-DD')}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.info('Export started');
    } catch (error) {
      message.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle bulk mark as delivered
  const handleMarkDelivered = () => {
    if (selectedRows.length === 0) {
      message.warning('Please select deliveries to mark as delivered');
      return;
    }
    markDeliveredMutation.mutate(selectedRows);
  };

  // Status colors
  const statusColors: Record<DeliveryStatus, string> = {
    [DeliveryStatus.SCHEDULED]: 'default',
    [DeliveryStatus.DELIVERED]: 'green',
    [DeliveryStatus.PAUSED]: 'blue',
    [DeliveryStatus.CANCELLED]: 'red',
    [DeliveryStatus.SKIPPED]: 'orange',
  };

  // Table columns
  const columns: ColumnsType<DeliveryItem> = [
    {
      title: <span className="whitespace-nowrap">Student</span>,
      dataIndex: 'studentName',
      key: 'studentName',
      width: 180,
      ellipsis: true,
      render: (name: string, record) => (
        <div className="min-w-0">
          <Text strong className="whitespace-nowrap">
            {name}
          </Text>
          {record.grade && <div className="text-xs text-gray-500">Grade: {record.grade}</div>}
        </div>
      ),
    },
    {
      title: <span className="whitespace-nowrap">School</span>,
      dataIndex: 'schoolName',
      key: 'schoolName',
      width: 160,
      ellipsis: true,
    },
    {
      title: <span className="whitespace-nowrap">Meal Plan</span>,
      dataIndex: 'mealPlanName',
      key: 'mealPlanName',
      width: 150,
      ellipsis: true,
    },
    {
      title: <span className="whitespace-nowrap">Subscription #</span>,
      dataIndex: 'subscriptionNumber',
      key: 'subscriptionNumber',
      width: 150,
      ellipsis: true,
      render: (text: string) => (
        <Text code className="whitespace-nowrap">
          {text}
        </Text>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Parent Contact</span>,
      dataIndex: 'parentPhone',
      key: 'parentPhone',
      width: 140,
      ellipsis: true,
      render: (phone: string) => phone || '-',
    },
    {
      title: <span className="whitespace-nowrap">Status</span>,
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: DeliveryStatus) => (
        <span className="whitespace-nowrap">
          <Tag color={statusColors[status]}>{status}</Tag>
        </span>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Notes</span>,
      dataIndex: 'notes',
      key: 'notes',
      width: 200,
      ellipsis: true,
      render: (notes: string) => notes || '-',
    },
  ];

  // Row selection
  const rowSelection = {
    selectedRowKeys: selectedRows,
    onChange: (keys: Key[]) => setSelectedRows(keys as string[]),
    getCheckboxProps: (record: DeliveryItem) => ({
      disabled: record.status !== DeliveryStatus.SCHEDULED,
    }),
  };

  // Stats
  const scheduledCount = deliveries?.filter(d => d.status === DeliveryStatus.SCHEDULED).length || 0;
  const deliveredCount = deliveries?.filter(d => d.status === DeliveryStatus.DELIVERED).length || 0;
  const totalCount = deliveries?.length || 0;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Title level={2} className="!mb-1">
            Deliveries
          </Title>
          <Text type="secondary">Manage daily deliveries</Text>
        </div>
        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => handleExport('csv')}
            loading={isExporting}
          >
            Export CSV
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <Text type="secondary" className="mr-2">
              Date:
            </Text>
            <DatePicker
              value={selectedDate}
              onChange={date => date && setSelectedDate(date)}
              allowClear={false}
            />
          </div>
          <div>
            <Text type="secondary" className="mr-2">
              School:
            </Text>
            <Select
              placeholder="All Schools"
              value={selectedSchool}
              onChange={setSelectedSchool}
              style={{ width: 200 }}
              allowClear
              showSearch
              optionFilterProp="label"
              options={schools?.map(s => ({ label: s.name, value: s.id }))}
            />
          </div>
          <div className="ml-auto flex gap-4">
            <div className="text-center px-4">
              <div className="text-2xl font-bold text-gray-800">{totalCount}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center px-4 border-l">
              <div className="text-2xl font-bold text-orange-500">{scheduledCount}</div>
              <div className="text-xs text-gray-500">Scheduled</div>
            </div>
            <div className="text-center px-4 border-l">
              <div className="text-2xl font-bold text-green-500">{deliveredCount}</div>
              <div className="text-xs text-gray-500">Delivered</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedRows.length > 0 && (
        <Card className="mb-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <Text>{selectedRows.length} deliveries selected</Text>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleMarkDelivered}
              loading={markDeliveredMutation.isPending}
            >
              Mark as Delivered
            </Button>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card>
        {isLoading ? (
          <TableSkeleton rows={10} />
        ) : isError ? (
          <ErrorState
            title="Unable to load deliveries"
            description={(error as Error)?.message}
            onRetry={refetch}
          />
        ) : (
          <HorizontalScrollContainer>
            <Table
              columns={columns}
              dataSource={deliveries}
              rowKey="id"
              rowSelection={rowSelection}
              tableLayout="fixed"
              scroll={{ x: 'max-content', y: 'clamp(260px, calc(100vh - 360px), 720px)' }}
              pagination={{
                total: deliveries?.length,
                pageSize: 20,
                showSizeChanger: true,
                showTotal: total => `Total ${total} deliveries`,
              }}
            />
          </HorizontalScrollContainer>
        )}
      </Card>
    </div>
  );
};

export default DeliveriesPage;
