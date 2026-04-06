import { useRef, useState } from 'react';
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
import { mealPlanService, mealPlanTypeService, schoolService } from '@/services';
import { DEFAULT_MEAL_PLAN_IMAGE } from '@/constants/images';
import { MealPlan, MealPlanFilters } from '@/types';
import TableSkeleton from '@/components/TableSkeleton';
import ErrorState from '@/components/ErrorState';
import HorizontalScrollContainer from '@/components/HorizontalScrollContainer';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { confirm } = Modal;

const formatRupees = (amount: number) =>
  (amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TYPE_TAG_COLORS = ['orange', 'green', 'blue', 'magenta', 'cyan', 'purple', 'gold', 'lime'];

const getTypeTagColor = (value?: string) => {
  if (!value) return 'default';
  const hash = value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return TYPE_TAG_COLORS[hash % TYPE_TAG_COLORS.length];
};

const MealPlansListPage = () => {
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<MealPlanFilters>({});

  const ellipsisTooltip = {
    mouseEnterDelay: 0.05,
    mouseLeaveDelay: 0.1,
    rootClassName: 'st-ellipsis-tooltip',
  };

  const EllipsisCell = ({
    text,
    strong,
    className,
  }: {
    text?: string;
    strong?: boolean;
    className?: string;
  }) => {
    const spanRef = useRef<{ scrollWidth: number; clientWidth: number } | null>(null);
    const [isOverflow, setIsOverflow] = useState(false);

    const checkOverflow = () => {
      const el = spanRef.current;
      if (!el) return;
      setIsOverflow(el.scrollWidth > el.clientWidth);
    };

    return (
      <Tooltip
        title={text}
        open={isOverflow ? undefined : false}
        mouseEnterDelay={ellipsisTooltip.mouseEnterDelay}
        mouseLeaveDelay={ellipsisTooltip.mouseLeaveDelay}
        classNames={{ root: ellipsisTooltip.rootClassName }}
      >
        <span
          ref={node => {
            spanRef.current = node;
          }}
          onMouseEnter={checkOverflow}
          className={`block truncate ${strong ? 'font-semibold' : ''} ${className || ''}`}
        >
          {text || '-'}
        </span>
      </Tooltip>
    );
  };

  // Fetch meal plans
  const {
    data: mealPlans,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['mealPlans', filters],
    queryFn: () => mealPlanService.getAll(filters),
  });

  // Fetch schools for filter
  const { data: schools } = useQuery({
    queryKey: ['schools'],
    queryFn: () => schoolService.getAll(),
  });

  const { data: mealPlanTypes } = useQuery({
    queryKey: ['mealPlanTypes', 'all'],
    queryFn: () => mealPlanTypeService.getAll(),
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

  const handleToggleActive = (record: MealPlan, nextActive: boolean) => {
    if (!nextActive) {
      confirm({
        title: 'Deactivate Meal Plan',
        icon: <ExclamationCircleOutlined />,
        content: `Deactivate "${record.name}"? New subscriptions will be blocked until it is reactivated.`,
        okText: 'Deactivate',
        okType: 'danger',
        onOk: () => toggleActiveMutation.mutate({ id: record.id, isActive: nextActive }),
      });
      return;
    }
    toggleActiveMutation.mutate({ id: record.id, isActive: nextActive });
  };

  // Table columns
  const columns: ColumnsType<MealPlan> = [
    {
      title: <span className="whitespace-nowrap">Image</span>,
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 80,
      render: (url: string) => (
        <Image
          src={url || DEFAULT_MEAL_PLAN_IMAGE}
          alt="Meal plan"
          width={50}
          height={50}
          className="rounded-lg object-cover"
          fallback={DEFAULT_MEAL_PLAN_IMAGE}
        />
      ),
    },
    {
      title: <span className="whitespace-nowrap">Meal Plan</span>,
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string, record) => (
        <div className="min-w-0">
          <EllipsisCell text={name} strong />
          {record.description && (
            <EllipsisCell text={record.description} className="text-xs text-gray-500 max-w-xs" />
          )}
        </div>
      ),
    },
    {
      title: <span className="whitespace-nowrap">School</span>,
      dataIndex: ['school', 'name'],
      key: 'school',
      width: 160,
      ellipsis: true,
      render: (text: string) => <EllipsisCell text={text} />,
    },
    {
      title: <span className="whitespace-nowrap">Type</span>,
      dataIndex: ['mealPlanType', 'displayName'],
      key: 'planType',
      width: 130,
      render: (_, record) => (
        <Tooltip title={record.mealPlanType?.displayName || record.planType || '-'}>
          <span className="whitespace-nowrap">
            <Tag
              color={getTypeTagColor(record.planType)}
              className="max-w-[105px] overflow-hidden text-ellipsis whitespace-nowrap align-middle"
            >
              {record.mealPlanType?.displayName || record.planType || '-'}
            </Tag>
          </span>
        </Tooltip>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Duration</span>,
      dataIndex: 'durationDays',
      key: 'durationDays',
      width: 110,
      render: (days: number) => `${days} days`,
    },
    {
      title: <span className="whitespace-nowrap">Price</span>,
      key: 'price',
      width: 160,
      render: (_, record) => (
        <div className="min-w-0">
          <EllipsisCell text={`₹${formatRupees(record.pricePerDay)}/day`} />
          <EllipsisCell
            text={`Total: ₹${formatRupees(record.totalPrice)}`}
            className="text-xs text-gray-500"
          />
        </div>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Active</span>,
      dataIndex: 'isActive',
      key: 'isActive',
      align: 'center',
      width: 110,
      render: (isActive: boolean, record) => (
        <Switch
          checked={isActive}
          onChange={checked => handleToggleActive(record, checked)}
          loading={toggleActiveMutation.isPending}
        />
      ),
    },
    {
      title: <span className="whitespace-nowrap">Actions</span>,
      key: 'actions',
      align: 'center',
      width: 140,
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
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
          <Input
            placeholder="Search by name..."
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            className="w-full sm:w-72"
            allowClear
          />
          <Select
            placeholder="Filter by school"
            value={filters.schoolId}
            onChange={value => setFilters({ ...filters, schoolId: value })}
            className="w-full sm:w-52"
            allowClear
            showSearch
            optionFilterProp="label"
            options={schools?.map(s => ({ label: s.name, value: s.id }))}
          />
          <Select
            placeholder="Filter by type"
            value={filters.mealPlanTypeId}
            onChange={value => setFilters({ ...filters, mealPlanTypeId: value })}
            className="w-full sm:w-40"
            allowClear
            options={mealPlanTypes?.map(type => ({
              label: type.displayName,
              value: type.id,
            }))}
          />
          <Select
            placeholder="Status"
            value={filters.isActive}
            onChange={value => setFilters({ ...filters, isActive: value })}
            className="w-full sm:w-32"
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
        <HorizontalScrollContainer>
          {isLoading ? (
            <TableSkeleton rows={8} />
          ) : isError ? (
            <ErrorState
              title="Unable to load meal plans"
              description={(error as Error)?.message}
              onRetry={refetch}
            />
          ) : (
            <Table
              columns={columns}
              dataSource={mealPlans}
              rowKey="id"
              tableLayout="fixed"
              scroll={{ x: 960 }}
              pagination={{
                total: mealPlans?.length,
                pageSize: 10,
                showSizeChanger: true,
                showTotal: total => `Total ${total} meal plans`,
              }}
            />
          )}
        </HorizontalScrollContainer>
      </Card>
    </div>
  );
};

export default MealPlansListPage;
