import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
  message,
  Tooltip,
  Image,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  UnorderedListOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mealPlanService, schoolService } from '@/services';
import { MealPlan, MealPlanFilters, MealPlanType } from '@/types';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { confirm } = Modal;

const formatRupees = (amount: number) =>
  (amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MealPlansListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<MealPlanFilters>({});

  // Fetch meal plans
  const { data: mealPlans, isLoading } = useQuery({
    queryKey: ['mealPlans', filters],
    queryFn: () => mealPlanService.getAll(filters),
  });

  // Fetch schools for filter
  const { data: schools } = useQuery({
    queryKey: ['schools'],
    queryFn: () => schoolService.getAll(),
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      mealPlanService.toggleActive(id, isActive),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      queryClient.invalidateQueries({ queryKey: ['mealPlan', variables.id] });
      message.success('Status updated');
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: mealPlanService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      message.success('Meal plan deleted successfully');
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  // Handle delete confirmation
  const handleDelete = (mealPlan: MealPlan) => {
    confirm({
      title: 'Delete Meal Plan',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>
            Are you sure you want to delete <strong>{mealPlan.name}</strong>?
          </p>
          <p className="text-gray-500 text-sm mt-2">
            This will affect all associated subscriptions.
          </p>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteMutation.mutate(mealPlan.id),
    });
  };

  // Plan type colors
  const planTypeColors: Record<MealPlanType, string> = {
    [MealPlanType.BREAKFAST]: 'orange',
    [MealPlanType.LUNCH]: 'green',
    [MealPlanType.SNACK]: 'purple',
    [MealPlanType.COMBO]: 'blue',
  };

  // Table columns
  const columns: ColumnsType<MealPlan> = [
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 80,
      render: (url: string) =>
        url ? (
          <Image
            src={url}
            alt="Meal plan"
            width={50}
            height={50}
            className="rounded-lg object-cover"
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAJpAN4pokyXwAAAABJRU5ErkJggg=="
          />
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <Text type="secondary" className="text-xs">
              No img
            </Text>
          </div>
        ),
    },
    {
      title: 'Meal Plan',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string, record) => (
        <div>
          <Text strong>{name}</Text>
          {record.description && (
            <div className="text-xs text-gray-500 truncate max-w-xs">{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: 'School',
      dataIndex: ['school', 'name'],
      key: 'school',
      ellipsis: true,
    },
    {
      title: 'Type',
      dataIndex: 'planType',
      key: 'planType',
      render: (type: MealPlanType) => <Tag color={planTypeColors[type]}>{type}</Tag>,
    },
    {
      title: 'Duration',
      dataIndex: 'durationDays',
      key: 'durationDays',
      render: (days: number) => `${days} days`,
    },
    {
      title: 'Price',
      key: 'price',
      render: (_, record) => (
        <div>
          <div>₹{formatRupees(record.pricePerDay)}/day</div>
          <div className="text-xs text-gray-500">Total: ₹{formatRupees(record.totalPrice)}</div>
        </div>
      ),
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      align: 'center',
      render: (isActive: boolean, record) => (
        <Switch
          checked={isActive}
          onChange={checked => toggleActiveMutation.mutate({ id: record.id, isActive: checked })}
          loading={toggleActiveMutation.isPending}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip title="Manage Menu">
            <Button
              type="text"
              icon={<UnorderedListOutlined />}
              onClick={() => navigate(`/meal-plans/${record.id}/menu`)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(`/meal-plans/${record.id}/edit`)}
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
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Title level={2} className="!mb-1">
            Meal Plans
          </Title>
          <Text type="secondary">Manage meal plans and pricing</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/meal-plans/create')}
        >
          Add Meal Plan
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search by name..."
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            style={{ maxWidth: 300 }}
            allowClear
          />
          <Select
            placeholder="Filter by school"
            value={filters.schoolId}
            onChange={value => setFilters({ ...filters, schoolId: value })}
            style={{ width: 200 }}
            allowClear
            showSearch
            optionFilterProp="label"
            options={schools?.map(s => ({ label: s.name, value: s.id }))}
          />
          <Select
            placeholder="Filter by type"
            value={filters.planType}
            onChange={value => setFilters({ ...filters, planType: value })}
            style={{ width: 150 }}
            allowClear
            options={Object.values(MealPlanType).map(type => ({
              label: type,
              value: type,
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
          dataSource={mealPlans}
          rowKey="id"
          loading={isLoading}
          pagination={{
            total: mealPlans?.length,
            pageSize: 10,
            showSizeChanger: true,
            showTotal: total => `Total ${total} meal plans`,
          }}
        />
      </Card>
    </div>
  );
};

export default MealPlansListPage;
