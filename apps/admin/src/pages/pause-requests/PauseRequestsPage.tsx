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
  Button,
  Space,
  Modal,
  message,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pauseRequestService } from '@/services';
import { PauseRequest, PauseRequestFilters, PauseRequestStatus } from '@/types';
import TableSkeleton from '@/components/TableSkeleton';
import ErrorState from '@/components/ErrorState';
import HorizontalScrollContainer from '@/components/HorizontalScrollContainer';
import { formatStudentName, formatUserName } from '@/utils/formatters';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const DATE_FORMAT = 'YYYY-MM-DD';
const { confirm } = Modal;

const PauseRequestsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<PauseRequestFilters>({});
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

  // Fetch pause requests
  const {
    data: pauseRequests,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['pauseRequests', filters],
    queryFn: () => pauseRequestService.getAll(filters),
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: pauseRequestService.approve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pauseRequests'] });
      queryClient.invalidateQueries({ queryKey: ['pendingPauseRequests'] });
      message.success('Pause request approved');
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      pauseRequestService.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pauseRequests'] });
      queryClient.invalidateQueries({ queryKey: ['pendingPauseRequests'] });
      message.success('Pause request rejected');
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  // Handle approve
  const handleApprove = (request: PauseRequest) => {
    confirm({
      title: 'Approve Pause Request',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>
            Approve pause for <strong>{formatStudentName(request.subscription?.student)}</strong>?
          </p>
          <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
            <div>
              Period: {dayjs(request.startDate).format('MMM DD')} -{' '}
              {dayjs(request.endDate).format('MMM DD, YYYY')}
            </div>
            <div>Days: {request.pauseDays}</div>
            {request.newEndDate && (
              <div className="text-blue-600">
                New subscription end date: {dayjs(request.newEndDate).format('MMM DD, YYYY')}
              </div>
            )}
          </div>
        </div>
      ),
      okText: 'Approve',
      onOk: () => approveMutation.mutate(request.id),
    });
  };

  // Handle reject
  const handleReject = (request: PauseRequest) => {
    confirm({
      title: 'Reject Pause Request',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to reject this pause request?`,
      okText: 'Reject',
      okType: 'danger',
      onOk: () => rejectMutation.mutate({ id: request.id }),
    });
  };

  // Status colors
  const statusColors: Record<PauseRequestStatus, string> = {
    [PauseRequestStatus.PENDING]: 'orange',
    [PauseRequestStatus.APPROVED]: 'green',
    [PauseRequestStatus.REJECTED]: 'red',
    [PauseRequestStatus.PROCESSED]: 'blue',
  };

  // Table columns
  const columns: ColumnsType<PauseRequest> = [
    {
      title: <span className="whitespace-nowrap">Parent</span>,
      dataIndex: ['parent', 'firstName'],
      key: 'parent',
      width: 160,
      ellipsis: true,
      render: (_name: string, record) => (
        <Text strong className="whitespace-nowrap">
          {formatUserName(record.parent) || '-'}
        </Text>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Student</span>,
      dataIndex: ['subscription', 'student'],
      key: 'student',
      width: 160,
      ellipsis: true,
      render: (_: unknown, record) => formatStudentName(record.subscription?.student),
    },
    {
      title: <span className="whitespace-nowrap">Subscription</span>,
      dataIndex: ['subscription', 'subscriptionNumber'],
      key: 'subscription',
      width: 150,
      ellipsis: true,
      render: (text: string, record) => (
        <Button
          type="link"
          className="p-0"
          onClick={() => navigate(`/subscriptions/${record.subscriptionId}`)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Pause Period</span>,
      key: 'period',
      width: 170,
      render: (_, record) => (
        <div>
          <div>
            {dayjs(record.startDate).format('MMM DD')} - {dayjs(record.endDate).format('MMM DD')}
          </div>
          <div className="text-xs text-gray-500">{record.pauseDays} days</div>
        </div>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Reason</span>,
      dataIndex: 'reason',
      key: 'reason',
      width: 200,
      ellipsis: true,
      render: (reason: string) => reason || '-',
    },
    {
      title: <span className="whitespace-nowrap">Status</span>,
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: PauseRequestStatus) => (
        <span className="whitespace-nowrap">
          <Tag color={statusColors[status]}>{status}</Tag>
        </span>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Requested</span>,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: <span className="whitespace-nowrap">Actions</span>,
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space>
          {record.status === PauseRequestStatus.PENDING && (
            <>
              <Tooltip title="Approve">
                <Button
                  type="text"
                  icon={<CheckOutlined />}
                  className="text-green-600"
                  onClick={() => handleApprove(record)}
                  loading={approveMutation.isPending}
                />
              </Tooltip>
              <Tooltip title="Reject">
                <Button
                  type="text"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => handleReject(record)}
                  loading={rejectMutation.isPending}
                />
              </Tooltip>
            </>
          )}
          <Tooltip title="View Subscription">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/subscriptions/${record.subscriptionId}`)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Title level={2} className="!mb-1">
          Pause Requests
        </Title>
        <Text type="secondary">Review and manage subscription pause requests</Text>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Search..."
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
            style={{ width: 150 }}
            allowClear
            options={Object.values(PauseRequestStatus).map(s => ({
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
            title="Unable to load pause requests"
            description={(error as Error)?.message}
            onRetry={refetch}
          />
        ) : (
          <HorizontalScrollContainer>
            <Table
              columns={columns}
              dataSource={pauseRequests}
              rowKey="id"
              tableLayout="fixed"
              scroll={{ x: 'max-content', y: 'clamp(260px, calc(100vh - 360px), 720px)' }}
              pagination={{
                total: pauseRequests?.length,
                pageSize: 10,
                showSizeChanger: true,
                showTotal: total => `Total ${total} requests`,
              }}
              rowClassName={record =>
                record.status === PauseRequestStatus.PENDING ? 'bg-orange-50' : ''
              }
            />
          </HorizontalScrollContainer>
        )}
      </Card>
    </div>
  );
};

export default PauseRequestsPage;
