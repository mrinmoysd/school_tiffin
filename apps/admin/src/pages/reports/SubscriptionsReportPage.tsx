import { useState } from 'react';
import { Typography, Card, DatePicker, Select, Table, Skeleton, Row, Col } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { adminService, schoolService } from '@/services';
import { ReportFilters, SchoolSubscriptionItem } from '@/types';
import ErrorState from '@/components/ErrorState';
import HorizontalScrollContainer from '@/components/HorizontalScrollContainer';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const COLORS = ['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#ef4444', '#14b8a6'];

const SubscriptionsReportPage = () => {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });

  // Fetch subscriptions report
  const {
    data: report,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['subscriptionsReport', filters],
    queryFn: () => adminService.getSubscriptionsReport(filters),
    enabled: !!filters.startDate && !!filters.endDate,
  });

  // Fetch schools
  const { data: schools } = useQuery({
    queryKey: ['schools'],
    queryFn: () => schoolService.getAll(),
  });

  // School breakdown columns
  const schoolColumns = [
    {
      title: 'School',
      dataIndex: 'schoolName',
      key: 'schoolName',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Active',
      dataIndex: 'activeCount',
      key: 'activeCount',
      sorter: (a: SchoolSubscriptionItem, b: SchoolSubscriptionItem) =>
        a.activeCount - b.activeCount,
    },
    {
      title: 'Total',
      dataIndex: 'totalCount',
      key: 'totalCount',
      sorter: (a: SchoolSubscriptionItem, b: SchoolSubscriptionItem) => a.totalCount - b.totalCount,
    },
    {
      title: 'Active Rate',
      key: 'rate',
      render: (_: unknown, record: SchoolSubscriptionItem) =>
        record.totalCount > 0
          ? `${((record.activeCount / record.totalCount) * 100).toFixed(1)}%`
          : '-',
    },
  ];

  // Format chart data
  const trendData =
    report?.trends.map(item => ({
      ...item,
      date: dayjs(item.date).format('MMM DD'),
    })) || [];

  // Pie chart data
  const pieData =
    report?.activeBySchool.map(item => ({
      name: item.schoolName,
      value: item.activeCount,
    })) || [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Title level={2} className="!mb-1">
          Subscriptions Report
        </Title>
        <Text type="secondary">Subscription trends and analytics</Text>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <Text type="secondary" className="mr-2">
              Period:
            </Text>
            <RangePicker
              value={[dayjs(filters.startDate), dayjs(filters.endDate)]}
              onChange={dates => {
                if (dates) {
                  setFilters({
                    ...filters,
                    startDate: dates[0]!.format('YYYY-MM-DD'),
                    endDate: dates[1]!.format('YYYY-MM-DD'),
                  });
                }
              }}
            />
          </div>
          <div>
            <Text type="secondary" className="mr-2">
              School:
            </Text>
            <Select
              placeholder="All Schools"
              value={filters.schoolId}
              onChange={value => setFilters({ ...filters, schoolId: value })}
              style={{ width: 200 }}
              allowClear
              showSearch
              optionFilterProp="label"
              options={schools?.map(s => ({ label: s.name, value: s.id }))}
            />
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-6">
          <Card title="Subscription Trends" className="mb-6">
            <Skeleton active paragraph={{ rows: 8 }} />
          </Card>
          <Card title="Active Subscriptions by School">
            <Skeleton active paragraph={{ rows: 8 }} />
          </Card>
        </div>
      ) : isError ? (
        <Card>
          <ErrorState
            title="Unable to load subscriptions report"
            description={(error as Error)?.message}
            onRetry={refetch}
          />
        </Card>
      ) : (
        <>
          {/* Trends Chart */}
          <Card title="Subscription Trends" className="mb-6">
            <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="newSubscriptions"
                    name="New"
                    stroke="#22c55e"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="completedSubscriptions"
                    name="Completed"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="cancelledSubscriptions"
                    name="Cancelled"
                    stroke="#ef4444"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* School Breakdown */}
          <Card title="Active Subscriptions by School">
            <Row gutter={24}>
              <Col xs={24} lg={12}>
                <HorizontalScrollContainer>
                  <Table
                    columns={schoolColumns}
                    dataSource={report?.activeBySchool}
                    rowKey="schoolId"
                    pagination={false}
                    size="small"
                    scroll={{ x: 'max-content' }}
                  />
                </HorizontalScrollContainer>
              </Col>
              <Col xs={24} lg={12}>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Col>
            </Row>
          </Card>
        </>
      )}
    </div>
  );
};

export default SubscriptionsReportPage;
