import { useState } from 'react';
import {
  Typography,
  Card,
  DatePicker,
  Select,
  Button,
  Table,
  Statistic,
  Row,
  Col,
  Skeleton,
  message,
} from 'antd';
import {
  DownloadOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { adminService, schoolService } from '@/services';
import { ReportFilters, SchoolRevenueItem } from '@/types';
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
  BarChart,
  Bar,
} from 'recharts';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const SalesReportPage = () => {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });
  const [isExporting, setIsExporting] = useState(false);

  // Fetch sales report
  const {
    data: report,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['salesReport', filters],
    queryFn: () => adminService.getSalesReport(filters),
    enabled: !!filters.startDate && !!filters.endDate,
  });

  // Fetch schools
  const { data: schools } = useQuery({
    queryKey: ['schools'],
    queryFn: () => schoolService.getAll(),
  });

  // Export handler
  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await adminService.exportSalesReport(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-report-${filters.startDate}-${filters.endDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.info('Export started');
    } catch (error) {
      message.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  // School breakdown columns
  const schoolColumns = [
    {
      title: 'School',
      dataIndex: 'schoolName',
      key: 'schoolName',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => `₹${(revenue / 100).toLocaleString()}`,
      sorter: (a: SchoolRevenueItem, b: SchoolRevenueItem) => a.revenue - b.revenue,
    },
    {
      title: 'Subscriptions',
      dataIndex: 'subscriptionCount',
      key: 'subscriptionCount',
      sorter: (a: SchoolRevenueItem, b: SchoolRevenueItem) =>
        a.subscriptionCount - b.subscriptionCount,
    },
    {
      title: 'Avg per Subscription',
      key: 'avg',
      render: (_: unknown, record: SchoolRevenueItem) =>
        record.subscriptionCount > 0
          ? `₹${(record.revenue / record.subscriptionCount / 100).toFixed(2)}`
          : '-',
    },
  ];

  // Format chart data
  const chartData =
    report?.dailyRevenue.map(item => ({
      ...item,
      date: dayjs(item.date).format('MMM DD'),
      revenue: item.revenue / 100,
    })) || [];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Title level={2} className="!mb-1">
            Sales Report
          </Title>
          <Text type="secondary">Revenue and subscription analytics</Text>
        </div>
        <Button icon={<DownloadOutlined />} onClick={handleExport} loading={isExporting}>
          Export CSV
        </Button>
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
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={8}>
              <Card>
                <Skeleton active paragraph={{ rows: 2 }} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Skeleton active paragraph={{ rows: 2 }} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Skeleton active paragraph={{ rows: 2 }} />
              </Card>
            </Col>
          </Row>
          <Card title="Revenue Over Time" className="mb-6">
            <Skeleton active paragraph={{ rows: 8 }} />
          </Card>
          <Card title="Revenue by School">
            <Skeleton active paragraph={{ rows: 8 }} />
          </Card>
        </div>
      ) : isError ? (
        <Card>
          <ErrorState
            title="Unable to load sales report"
            description={(error as Error)?.message}
            onRetry={refetch}
          />
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Total Revenue"
                  value={(report?.totalRevenue || 0) / 100}
                  prefix={<DollarOutlined />}
                  precision={2}
                  formatter={value => `₹${Number(value).toLocaleString()}`}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Total Subscriptions"
                  value={report?.totalSubscriptions || 0}
                  prefix={<ShoppingCartOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Average Order Value"
                  value={(report?.averageOrderValue || 0) / 100}
                  prefix={<PercentageOutlined />}
                  precision={2}
                  formatter={value => `₹${Number(value).toLocaleString()}`}
                />
              </Card>
            </Col>
          </Row>

          {/* Revenue Chart */}
          <Card title="Revenue Over Time" className="mb-6">
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* School Breakdown */}
          <Card title="Revenue by School">
            <Row gutter={24}>
              <Col xs={24} lg={12}>
                <HorizontalScrollContainer>
                  <Table
                    columns={schoolColumns}
                    dataSource={report?.schoolBreakdown}
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
                    <BarChart
                      data={(report?.schoolBreakdown || []).map(item => ({
                        ...item,
                        revenue: item.revenue / 100,
                      }))}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="schoolName" type="category" width={150} />
                      <Tooltip
                        formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="#16a34a" />
                    </BarChart>
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

export default SalesReportPage;
