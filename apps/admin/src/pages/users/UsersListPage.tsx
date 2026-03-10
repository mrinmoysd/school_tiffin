import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Input, Select, Typography, Card, Tag, Switch, Button, message } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services';
import { User, UserFilters, UserRole } from '@/types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const UsersListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<UserFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Fetch users
  const skip = (page - 1) * pageSize;
  const { data, isLoading } = useQuery({
    queryKey: ['users', filters, page, pageSize],
    queryFn: () => userService.getAll(filters, skip, pageSize),
  });

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

  // Role colors
  const roleColors: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'red',
    [UserRole.PARENT]: 'blue',
    [UserRole.SCHOOL_ADMIN]: 'purple',
  };

  // Table columns
  const columns: ColumnsType<User> = [
    {
      title: 'Name',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (name: string) => <Text strong>{name}</Text>,
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string, record) => (
        <div>
          <div>{email}</div>
          {record.emailVerified && (
            <Tag color="green" className="text-xs">
              Verified
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      render: (phone: string) => phone || '-',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => <Tag color={roleColors[role]}>{role}</Tag>,
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record) => (
        <Switch
          checked={isActive}
          onChange={() => toggleActiveMutation.mutate({ id: record.id })}
          loading={toggleActiveMutation.isPending}
        />
      ),
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (date: string) => (date ? dayjs(date).format('MMM DD, HH:mm') : 'Never'),
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: 'Actions',
      key: 'actions',
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
        <Table
          columns={columns}
          dataSource={data?.users}
          rowKey="id"
          loading={isLoading}
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
      </Card>
    </div>
  );
};

export default UsersListPage;
