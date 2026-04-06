import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  App as AntdApp,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Switch,
  Typography,
  Card,
  Modal,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolService } from '@/services';
import { School, SchoolFilters } from '@/types';
import TableSkeleton from '@/components/TableSkeleton';
import ErrorState from '@/components/ErrorState';
import HorizontalScrollContainer from '@/components/HorizontalScrollContainer';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { confirm } = Modal;
const SCHOOL_NAME_TOOLTIP_TRIM_LIMIT = 30;

const SchoolsListPage = () => {
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<SchoolFilters>({});

  // Fetch schools
  const {
    data: schools,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['schools', filters],
    queryFn: () => schoolService.getAll(filters),
  });

  // Fetch cities for filter
  const { data: cities } = useQuery({
    queryKey: ['schoolCities'],
    queryFn: schoolService.getCities,
  });

  // Toggle service mutation
  const toggleServiceMutation = useMutation({
    mutationFn: ({ id, isServiceAvailable }: { id: string; isServiceAvailable: boolean }) =>
      schoolService.toggleService(id, isServiceAvailable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      message.success('Service availability updated');
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: schoolService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      message.success('School deleted successfully');
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const pendingServiceToggleSchoolId = toggleServiceMutation.isPending
    ? (toggleServiceMutation.variables?.id ?? null)
    : null;

  // Handle delete confirmation
  const handleDelete = (school: School) => {
    confirm({
      title: 'Delete School',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>
            Are you sure you want to delete <strong>{school.name}</strong>?
          </p>
          <p className="text-gray-500 text-sm mt-2">
            This action cannot be undone. All associated meal plans and subscriptions will be
            affected.
          </p>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteMutation.mutate(school.id),
    });
  };

  // Table columns
  const columns: ColumnsType<School> = [
    {
      title: <span className="whitespace-nowrap">Actions</span>,
      key: 'actions',
      align: 'center',
      width: 170,
      render: (_, record) => (
        <Space>
          <Tooltip title="View">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/schools/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(`/schools/${record.id}/edit`)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: <span className="whitespace-nowrap">School Name</span>,
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string, record) => {
        const trimmedName = (name || '').trim();
        const showTruncatedName = trimmedName.length > SCHOOL_NAME_TOOLTIP_TRIM_LIMIT;
        const displayName = showTruncatedName
          ? `${trimmedName.slice(0, SCHOOL_NAME_TOOLTIP_TRIM_LIMIT)}...`
          : trimmedName || '-';

        return (
          <div className="min-w-0">
            <Tooltip title={showTruncatedName ? trimmedName : undefined}>
              <Text strong className="whitespace-nowrap">
                {displayName}
              </Text>
            </Tooltip>
            <div className="text-xs text-gray-500 truncate">{record.code}</div>
          </div>
        );
      },
    },
    {
      title: <span className="whitespace-nowrap">City</span>,
      dataIndex: 'city',
      key: 'city',
      width: 140,
      ellipsis: true,
      render: (city: string) => city || '-',
    },
    {
      title: <span className="whitespace-nowrap">Contact</span>,
      key: 'contact',
      width: 200,
      ellipsis: true,
      render: (_, record) => (
        <div className="min-w-0">
          {record.contactEmail && <div className="text-xs truncate">{record.contactEmail}</div>}
          {record.contactPhone && (
            <div className="text-xs text-gray-500 truncate">{record.contactPhone}</div>
          )}
          {!record.contactEmail && !record.contactPhone && '-'}
        </div>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Operating Days</span>,
      dataIndex: 'operatingDays',
      key: 'operatingDays',
      width: 220,
      render: (days: string) => (
        <div className="flex flex-wrap gap-1">
          {days.split(',').map(day => (
            <Tag key={day} className="text-xs">
              {day}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Service Available</span>,
      dataIndex: 'isServiceAvailable',
      key: 'isServiceAvailable',
      align: 'center',
      width: 160,
      render: (isAvailable: boolean, record) => (
        <Switch
          checked={isAvailable}
          onChange={checked =>
            toggleServiceMutation.mutate({ id: record.id, isServiceAvailable: checked })
          }
          loading={pendingServiceToggleSchoolId === record.id}
          disabled={pendingServiceToggleSchoolId === record.id}
          checkedChildren="Yes"
          unCheckedChildren="No"
        />
      ),
    },
    {
      title: <span className="whitespace-nowrap">Created</span>,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Title level={2} className="!mb-1">
            Schools
          </Title>
          <Text type="secondary">Manage schools and their service availability</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/schools/create')}>
          Add School
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search by name or code..."
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            style={{ maxWidth: 300 }}
            allowClear
          />
          <Select
            placeholder="Filter by city"
            value={filters.city}
            onChange={value => setFilters({ ...filters, city: value })}
            style={{ width: 200 }}
            allowClear
            options={cities?.map(city => ({ label: city, value: city }))}
          />
          <Select
            placeholder="Service status"
            value={filters.isServiceAvailable}
            onChange={value => setFilters({ ...filters, isServiceAvailable: value })}
            style={{ width: 180 }}
            allowClear
            options={[
              { label: 'Service Available', value: true },
              { label: 'Service Unavailable', value: false },
            ]}
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isError ? (
          <ErrorState
            title="Failed to load schools"
            description={(error as Error)?.message}
            onRetry={refetch}
          />
        ) : isLoading ? (
          <TableSkeleton rows={8} />
        ) : (
          <HorizontalScrollContainer>
            <Table
              columns={columns}
              dataSource={schools}
              rowKey="id"
              tableLayout="fixed"
              scroll={{ x: 'max-content', y: 'clamp(260px, calc(100vh - 360px), 720px)' }}
              pagination={{
                total: schools?.length,
                pageSize: 10,
                showSizeChanger: true,
                showTotal: total => `Total ${total} schools`,
              }}
            />
          </HorizontalScrollContainer>
        )}
      </Card>
    </div>
  );
};

export default SchoolsListPage;
