import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Input,
  Select,
  Typography,
  Card,
  Tag,
  Switch,
  Button,
  InputNumber,
  message,
  Modal,
} from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services';
import { User, UserFilters, UserRole } from '@/types';
import TableSkeleton from '@/components/TableSkeleton';
import ErrorState from '@/components/ErrorState';
import HorizontalScrollContainer from '@/components/HorizontalScrollContainer';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { confirm } = Modal;

const UsersListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<UserFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [editedMaxStudents, setEditedMaxStudents] = useState<Record<string, number>>({});

  // Fetch users
  const skip = (page - 1) * pageSize;
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['users', filters, page, pageSize],
    queryFn: () => userService.getAll(filters, skip, pageSize),
  });

  useEffect(() => {
    if (!data?.users) return;

    const next: Record<string, number> = {};
    for (const user of data.users) {
      if (user.role === UserRole.PARENT) {
        next[user.id] = user.maxStudents;
      }
    }

    setEditedMaxStudents(next);
  }, [data?.users]);

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => userService.toggleActive(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
      message.success('User status updated');
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const updateMaxStudentsMutation = useMutation({
    mutationFn: ({ id, maxStudents }: { id: string; maxStudents: number }) =>
      userService.updateMaxStudents(id, maxStudents),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
      message.success('Student limit updated');
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

  // Table columns
  const handleToggleActive = (record: User, nextActive: boolean) => {
    if (!nextActive) {
      confirm({
        title: 'Deactivate User',
        content: `Deactivate ${record.fullName}? They will no longer be able to access the admin portal.`,
        okText: 'Deactivate',
        okType: 'danger',
        onOk: () => toggleActiveMutation.mutate({ id: record.id }),
      });
      return;
    }
    toggleActiveMutation.mutate({ id: record.id });
  };

  const columns: ColumnsType<User> = [
    {
      title: <span className="whitespace-nowrap">Name</span>,
      dataIndex: 'fullName',
      key: 'fullName',
      width: 160,
      ellipsis: true,
      render: (name: string) => (
        <Text strong className="whitespace-nowrap">
          {name}
        </Text>
      ),
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
    },
    {
      title: <span className="whitespace-nowrap">Email</span>,
      dataIndex: 'email',
      key: 'email',
      width: 220,
      ellipsis: true,
      render: (email: string, record) => (
        <div className="min-w-0">
          <div className="truncate">{email}</div>
          {record.emailVerified && (
            <Tag color="green" className="text-xs">
              Verified
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Phone</span>,
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      width: 140,
      ellipsis: true,
      render: (phone: string) => phone || '-',
    },
    {
      title: <span className="whitespace-nowrap">Role</span>,
      dataIndex: 'role',
      key: 'role',
      width: 140,
      render: (role: UserRole) => (
        <span className="whitespace-nowrap">
          <Tag color={roleColors[role]}>{role}</Tag>
        </span>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Active</span>,
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean, record) => (
        <Switch
          checked={isActive}
          onChange={checked => handleToggleActive(record, checked)}
          loading={toggleActiveMutation.isPending}
        />
      ),
    },
    {
      title: <span className="whitespace-nowrap">Last Login</span>,
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 150,
      render: (date: string) => (date ? dayjs(date).format('MMM DD, HH:mm') : 'Never'),
    },
    {
      title: <span className="whitespace-nowrap">Max Students</span>,
      dataIndex: 'maxStudents',
      key: 'maxStudents',
      width: 180,
      render: (_value: number, record) => {
        if (record.role !== UserRole.PARENT) return '-';

        const value = editedMaxStudents[record.id] ?? record.maxStudents;
        const hasChanged = value !== record.maxStudents;
        const isSaving =
          updateMaxStudentsMutation.isPending &&
          updateMaxStudentsMutation.variables?.id === record.id;

        return (
          <div className="flex items-center gap-2">
            <InputNumber
              min={1}
              max={20}
              value={value}
              onChange={nextValue => {
                if (typeof nextValue !== 'number') return;
                setEditedMaxStudents(prev => ({ ...prev, [record.id]: nextValue }));
              }}
              style={{ width: 90 }}
            />
            <Button
              type="link"
              size="small"
              className="!px-0"
              disabled={!hasChanged}
              loading={isSaving}
              onClick={() =>
                updateMaxStudentsMutation.mutate({
                  id: record.id,
                  maxStudents: value,
                })
              }
            >
              Save
            </Button>
          </div>
        );
      },
    },
    {
      title: <span className="whitespace-nowrap">Joined</span>,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: <span className="whitespace-nowrap">Actions</span>,
      key: 'actions',
      width: 110,
      render: (_, record) => (
        <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/users/${record.id}`)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Title level={2} className="!mb-1">
          Users
        </Title>
        <Text type="secondary">Manage platform users</Text>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Search by email or phone..."
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            style={{ width: 280 }}
            allowClear
          />
          <Select
            placeholder="Filter by role"
            value={filters.role}
            onChange={value => setFilters({ ...filters, role: value })}
            style={{ width: 150 }}
            allowClear
            options={Object.values(UserRole).map(r => ({
              label: r,
              value: r,
            }))}
          />
          <Select
            placeholder="Status"
            value={filters.isActive}
            onChange={value => setFilters({ ...filters, isActive: value })}
            style={{ width: 120 }}
            allowClear
            options={[
              { label: 'Active', value: true },
              { label: 'Inactive', value: false },
            ]}
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : isError ? (
          <ErrorState
            title="Unable to load users"
            description={(error as Error)?.message}
            onRetry={refetch}
          />
        ) : (
          <HorizontalScrollContainer>
            <Table
              columns={columns}
              dataSource={data?.users}
              rowKey="id"
              tableLayout="fixed"
              scroll={{ x: 'max-content', y: 'clamp(260px, calc(100vh - 360px), 720px)' }}
              pagination={{
                current: page,
                pageSize,
                total: data?.pagination.total,
                showSizeChanger: true,
                onChange: (nextPage, nextPageSize) => {
                  setPage(nextPage);
                  if (nextPageSize && nextPageSize !== pageSize) {
                    setPageSize(nextPageSize);
                    setPage(1);
                  }
                },
                showTotal: total => `Total ${total} users`,
              }}
            />
          </HorizontalScrollContainer>
        )}
      </Card>
    </div>
  );
};

export default UsersListPage;
