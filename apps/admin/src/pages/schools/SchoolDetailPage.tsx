import { useNavigate, useParams } from 'react-router-dom';
import {
  App as AntdApp,
  Button,
  Card,
  Typography,
  Tag,
  Table,
  Spin,
  Switch,
  Descriptions,
} from 'antd';
import { ArrowLeftOutlined, BankOutlined, EditOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mealPlanService, schoolService } from '@/services';
import { MealPlan } from '@/types';
import HorizontalScrollContainer from '@/components/HorizontalScrollContainer';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const parseOperatingDays = (rawOperatingDays?: string): string[] => {
  if (!rawOperatingDays) return [];
  const normalizedValue = rawOperatingDays.trim();
  if (!normalizedValue) return [];

  if (normalizedValue.startsWith('[')) {
    try {
      const parsedValue = JSON.parse(normalizedValue);
      if (Array.isArray(parsedValue)) {
        return parsedValue.map(value => String(value).trim().toUpperCase()).filter(Boolean);
      }
    } catch {
      // Fallback to comma-separated parsing below.
    }
  }

  return normalizedValue
    .split(',')
    .map(value => value.trim().toUpperCase())
    .filter(Boolean);
};

const formatRupees = (amount: number) =>
  (amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SchoolDetailPage = () => {
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: school, isLoading } = useQuery({
    queryKey: ['school', id],
    queryFn: () => schoolService.getById(id!),
    enabled: !!id,
  });

  const { data: mealPlans, isLoading: mealPlansLoading } = useQuery({
    queryKey: ['mealPlans', { schoolId: id }],
    queryFn: () => mealPlanService.getAll({ schoolId: id }),
    enabled: !!id,
  });

  const toggleServiceMutation = useMutation({
    mutationFn: (isServiceAvailable: boolean) =>
      schoolService.toggleService(id!, isServiceAvailable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['school', id] });
      message.success('Service availability updated');
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="text-center py-12">
        <Text type="secondary">School not found</Text>
        <br />
        <Button type="link" onClick={() => navigate('/schools')}>
          Back to Schools
        </Button>
      </div>
    );
  }

  const operatingDays = parseOperatingDays(school.operatingDays);

  const mealPlanColumns: ColumnsType<MealPlan> = [
    {
      title: <span className="whitespace-nowrap">Meal Plan</span>,
      dataIndex: 'name',
      key: 'name',
      width: 220,
      ellipsis: true,
      render: (value: string, record) => (
        <Button
          type="link"
          className="p-0"
          onClick={() => navigate(`/meal-plans/${record.id}/edit`)}
        >
          {value}
        </Button>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Type</span>,
      dataIndex: ['mealPlanType', 'displayName'],
      key: 'type',
      width: 140,
      ellipsis: true,
      render: (value: string, record) => value || record.planType || '-',
    },
    {
      title: <span className="whitespace-nowrap">Duration</span>,
      dataIndex: 'durationDays',
      key: 'durationDays',
      width: 120,
      render: (durationDays: number) => `${durationDays} days`,
    },
    {
      title: <span className="whitespace-nowrap">Price/Day</span>,
      dataIndex: 'pricePerDay',
      key: 'pricePerDay',
      width: 130,
      render: (pricePerDay: number) => `₹${formatRupees(pricePerDay)}`,
    },
    {
      title: <span className="whitespace-nowrap">Status</span>,
      dataIndex: 'isActive',
      key: 'isActive',
      width: 110,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/schools')} />
          <div>
            <Title level={2} className="!mb-0">
              {school.name}
            </Title>
            <Text type="secondary">School Details</Text>
          </div>
        </div>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/schools/${school.id}/edit`)}
        >
          Edit School
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card>
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-green-50 text-green-700 flex items-center justify-center">
              <BankOutlined style={{ fontSize: 32 }} />
            </div>
            <Title level={4} className="!mb-1">
              {school.name}
            </Title>
            <Tag>{school.code}</Tag>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500">City</div>
              <div>{school.city || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">State</div>
              <div>{school.state || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Created</div>
              <div>{dayjs(school.createdAt).format('MMM DD, YYYY')}</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <Text>Service Available</Text>
              <Switch
                checked={school.isServiceAvailable}
                loading={toggleServiceMutation.isPending}
                onChange={checked => toggleServiceMutation.mutate(checked)}
                checkedChildren="Yes"
                unCheckedChildren="No"
              />
            </div>
          </div>
        </Card>

        <div className="xl:col-span-2 space-y-6">
          <Card title="School Information">
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Address">{school.address || '-'}</Descriptions.Item>
              <Descriptions.Item label="Pincode">{school.pincode || '-'}</Descriptions.Item>
              <Descriptions.Item label="Contact Email">
                {school.contactEmail || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Contact Phone">
                {school.contactPhone || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Operating Days">
                <div className="flex flex-wrap gap-1">
                  {operatingDays.length > 0
                    ? operatingDays.map(day => (
                        <Tag key={day} className="text-xs">
                          {day}
                        </Tag>
                      ))
                    : '-'}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Delivery Instructions">
                {school.deliveryInstructions || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {dayjs(school.updatedAt).format('MMM DD, YYYY, hh:mm A')}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={`Meal Plans (${mealPlans?.length || 0})`}>
            <HorizontalScrollContainer>
              <Table
                loading={mealPlansLoading}
                rowKey="id"
                columns={mealPlanColumns}
                dataSource={mealPlans}
                pagination={{ pageSize: 5 }}
                size="small"
                tableLayout="fixed"
                scroll={{ x: 'max-content', y: 'clamp(260px, calc(100vh - 360px), 720px)' }}
              />
            </HorizontalScrollContainer>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SchoolDetailPage;
