import { useNavigate } from 'react-router-dom';
import { Table, Button, Typography, Card, Tag, Space, App, Tooltip, Switch } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsService } from '@/services';
import { CMSPage } from '@/types';
import TableSkeleton from '@/components/TableSkeleton';
import ErrorState from '@/components/ErrorState';
import HorizontalScrollContainer from '@/components/HorizontalScrollContainer';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const CMSListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { modal, message } = App.useApp();

  // Fetch CMS pages
  const {
    data: pages,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['cmsPages'],
    queryFn: () => cmsService.getAll(true),
  });

  // Publish/Unpublish mutation
  const publishMutation = useMutation({
    mutationFn: ({ slug, publish }: { slug: string; publish: boolean }) =>
      publish ? cmsService.publish(slug) : cmsService.unpublish(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cmsPages'] });
      message.success('Page status updated');
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: cmsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cmsPages'] });
      message.success('Page deleted successfully');
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  // Handle delete
  const handleDelete = (page: CMSPage) => {
    modal.confirm({
      title: 'Delete Page',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete "${page.title}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => deleteMutation.mutate(page.slug),
    });
  };

  const pendingPublishSlug = publishMutation.isPending
    ? (publishMutation.variables?.slug ?? null)
    : null;

  // Table columns
  const columns: ColumnsType<CMSPage> = [
    {
      title: <span className="whitespace-nowrap">Slug</span>,
      dataIndex: 'slug',
      key: 'slug',
      width: 200,
      ellipsis: true,
      render: (slug: string) => (
        <Text code className="whitespace-nowrap">
          {slug}
        </Text>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Title</span>,
      dataIndex: 'title',
      key: 'title',
      width: 220,
      ellipsis: true,
      render: (title: string) => (
        <Text strong className="whitespace-nowrap">
          {title}
        </Text>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Version</span>,
      dataIndex: 'version',
      key: 'version',
      width: 90,
      render: (version: number) => (
        <span className="whitespace-nowrap">
          <Tag>v{version}</Tag>
        </span>
      ),
    },
    {
      title: <span className="whitespace-nowrap">Published</span>,
      dataIndex: 'isPublished',
      key: 'isPublished',
      width: 140,
      render: (isPublished: boolean, record) => (
        <Switch
          checked={isPublished}
          onChange={checked => publishMutation.mutate({ slug: record.slug, publish: checked })}
          loading={pendingPublishSlug === record.slug}
          disabled={pendingPublishSlug === record.slug}
          checkedChildren="Yes"
          unCheckedChildren="No"
        />
      ),
    },
    {
      title: <span className="whitespace-nowrap">Last Updated</span>,
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 170,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY HH:mm'),
      sorter: (a, b) => dayjs(a.updatedAt).unix() - dayjs(b.updatedAt).unix(),
    },
    {
      title: <span className="whitespace-nowrap">Actions</span>,
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space>
          <Tooltip title="Preview">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/cms/${record.slug}/preview`)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(`/cms/${record.slug}/edit`)}
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
            CMS Pages
          </Title>
          <Text type="secondary">Manage content pages</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/cms/create')}>
          Add Page
        </Button>
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : isError ? (
          <ErrorState
            title="Unable to load CMS pages"
            description={(error as Error)?.message}
            onRetry={refetch}
          />
        ) : (
          <HorizontalScrollContainer>
            <Table
              columns={columns}
              dataSource={pages}
              rowKey="id"
              tableLayout="fixed"
              scroll={{ x: 'max-content', y: 'clamp(260px, calc(100vh - 360px), 720px)' }}
              pagination={{
                total: pages?.length,
                pageSize: 10,
                showSizeChanger: true,
                showTotal: total => `Total ${total} pages`,
              }}
            />
          </HorizontalScrollContainer>
        )}
      </Card>
    </div>
  );
};

export default CMSListPage;
