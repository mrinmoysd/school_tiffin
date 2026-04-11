import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Typography, Descriptions, Tag, Table, Spin, Timeline } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services';
import { OrderStatus, TransactionStatus } from '@/types';
import HorizontalScrollContainer from '@/components/HorizontalScrollContainer';
import { formatUserName } from '@/utils/formatters';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const OrderDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Fetch order
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getById(id!),
    enabled: !!id,
  });

  // Status colors
  const statusColors: Record<OrderStatus, string> = {
    [OrderStatus.PAID]: 'green',
    [OrderStatus.PENDING]: 'orange',
    [OrderStatus.PROCESSING]: 'blue',
    [OrderStatus.FAILED]: 'red',
    [OrderStatus.REFUNDED]: 'purple',
    [OrderStatus.CANCELLED]: 'default',
  };

  const transactionStatusColors: Record<TransactionStatus, string> = {
    [TransactionStatus.SUCCESS]: 'green',
    [TransactionStatus.INITIATED]: 'blue',
    [TransactionStatus.FAILED]: 'red',
    [TransactionStatus.REFUNDED]: 'purple',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <Text type="secondary">Order not found</Text>
        <br />
        <Button type="link" onClick={() => navigate('/orders')}>
          Back to Orders
        </Button>
      </div>
    );
  }

  const taxPercentage =
    order.amount > 0 ? Number(((order.taxAmount / order.amount) * 100).toFixed(2)) : 0;

  // Transaction columns
  const transactionColumns = [
    {
      title: <span className="whitespace-nowrap">Transaction ID</span>,
      dataIndex: 'transactionId',
      key: 'transactionId',
      width: 160,
      ellipsis: true,
      render: (text: string) => (
        <Text code className="whitespace-nowrap">
          {text}
        </Text>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Gateway</span>,
      dataIndex: 'paymentGateway',
      key: 'paymentGateway',
      width: 120,
      ellipsis: true,
    },
    {
      title: <span className="whitespace-nowrap">Gateway Txn ID</span>,
      dataIndex: 'gatewayTransactionId',
      key: 'gatewayTransactionId',
      width: 160,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: <span className="whitespace-nowrap">Amount</span>,
      dataIndex: 'amount',
      key: 'amount',
      width: 110,
      render: (amount: number) => `₹${(amount / 100).toLocaleString()}`,
    },
    {
      title: <span className="whitespace-nowrap">Status</span>,
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: TransactionStatus) => (
        <Tag color={transactionStatusColors[status]}>{status}</Tag>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Date</span>,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY HH:mm'),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')} />
        <div>
          <div className="flex items-center gap-3">
            <Title level={2} className="!mb-0">
              {order.orderNumber}
            </Title>
            <Tag color={statusColors[order.status]} className="text-sm">
              {order.status}
            </Tag>
          </div>
          <Text type="secondary">
            Created {dayjs(order.createdAt).format('MMM DD, YYYY HH:mm')}
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="xl:col-span-2">
          <Card title="Order Details" className="mb-6">
            <Descriptions column={{ xs: 1, sm: 2, md: 3 }}>
              <Descriptions.Item label="Order Number">{order.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColors[order.status]}>{order.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Parent">{formatUserName(order.parent) || '-'}</Descriptions.Item>
              <Descriptions.Item label="Subscription">
                <Button
                  type="link"
                  className="p-0 max-w-full"
                  onClick={() => navigate(`/subscriptions/${order.subscriptionId}`)}
                >
                  <span className="block truncate">{order.subscription?.subscriptionNumber}</span>
                </Button>
              </Descriptions.Item>
              <Descriptions.Item label="Payment Method">
                {order.paymentMethod || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Gateway Order ID">
                <Text code className="block break-all">
                  {order.paymentGatewayOrderId || '-'}
                </Text>
              </Descriptions.Item>
              {order.paidAt && (
                <Descriptions.Item label="Paid At">
                  {dayjs(order.paidAt).format('MMM DD, YYYY HH:mm')}
                </Descriptions.Item>
              )}
              {order.notes && (
                <Descriptions.Item label="Notes" span={2}>
                  {order.notes}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Transactions */}
          <Card title="Payment Transactions">
            <HorizontalScrollContainer>
              <Table
                columns={transactionColumns}
                dataSource={order.transactions}
                rowKey="id"
                pagination={false}
                size="small"
                tableLayout="fixed"
                scroll={{ x: 760, y: 'clamp(260px, calc(100vh - 360px), 720px)' }}
                locale={{ emptyText: 'No transactions' }}
              />
            </HorizontalScrollContainer>
          </Card>
        </div>

        {/* Amount Summary & Timeline */}
        <div className="space-y-6">
          <Card title="Amount Summary" className="mb-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <Text type="secondary">Subtotal</Text>
                <Text>₹{(order.amount / 100).toLocaleString()}</Text>
              </div>
              <div className="flex justify-between">
                <Text type="secondary">Tax ({taxPercentage}%)</Text>
                <Text>₹{(order.taxAmount / 100).toLocaleString()}</Text>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between">
                  <Text type="secondary">Discount</Text>
                  <Text type="success">-₹{(order.discountAmount / 100).toLocaleString()}</Text>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t">
                <Text strong>Total</Text>
                <Text strong className="text-lg">
                  ₹{(order.finalAmount / 100).toLocaleString()}
                </Text>
              </div>
            </div>
          </Card>

          <Card title="Order Timeline">
            <Timeline
              items={[
                {
                  color: 'green',
                  dot: <CheckCircleOutlined />,
                  children: (
                    <div>
                      <div className="font-medium">Order Created</div>
                      <div className="text-xs text-gray-500">
                        {dayjs(order.createdAt).format('MMM DD, YYYY HH:mm')}
                      </div>
                    </div>
                  ),
                },
                ...(order.paidAt
                  ? [
                      {
                        color: 'green' as const,
                        dot: <CheckCircleOutlined />,
                        children: (
                          <div>
                            <div className="font-medium">Payment Received</div>
                            <div className="text-xs text-gray-500">
                              {dayjs(order.paidAt).format('MMM DD, YYYY HH:mm')}
                            </div>
                          </div>
                        ),
                      },
                    ]
                  : []),
                ...(order.cancelledAt
                  ? [
                      {
                        color: 'red' as const,
                        dot: <CloseCircleOutlined />,
                        children: (
                          <div>
                            <div className="font-medium">Order Cancelled</div>
                            <div className="text-xs text-gray-500">
                              {dayjs(order.cancelledAt).format('MMM DD, YYYY HH:mm')}
                            </div>
                          </div>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
