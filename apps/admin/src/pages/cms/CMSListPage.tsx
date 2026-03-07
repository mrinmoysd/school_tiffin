import { useNavigate } from 'react-router-dom';
import { Table, Button, Typography, Card, Tag, Space, Modal, message, Tooltip, Switch } from 'antd';
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
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { confirm } = Modal;

const CMSListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch CMS pages
  const { data: pages, isLoading } = useQuery({
    queryKey: ['cmsPages'],
    queryFn: cmsService.getAll,
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
    confirm({
      title: 'Delete Page',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete "${page.title}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => deleteMutation.mutate(page.slug),
    });
  };

  // Table columns
  const columns: ColumnsType<CMSPage> = [
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      render: (slug: string) => <Text code>{slug}</Text>,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title: string) => <Text strong>{title}</Text>,
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      render: (version: number) => <Tag>v{version}</Tag>,
    },
    {
      title: 'Published',
      dataIndex: 'isPublished',
      key: 'isPublished',
      render: (isPublished: boolean, record) => (
        <Switch
          checked={isPublished}
          onChange={checked => publishMutation.mutate({ slug: record.slug, publish: checked })}
          loading={publishMutation.isPending}
          checkedChildren="Yes"
          unCheckedChildren="No"
        />
      ),
    },
    {
      title: 'Last Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY HH:mm'),
      sorter: (a, b) => dayjs(a.updatedAt).unix() - dayjs(b.updatedAt).unix(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Preview">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => window.open(`/page/${record.slug}`, '_blank')}
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
        <Table
          columns={columns}
          dataSource={pages}
          rowKey="id"
          loading={isLoading}
          pagination={{
            total: pages?.length,
            pageSize: 10,
            showSizeChanger: true,
            showTotal: total => `Total ${total} pages`,
          }}
        />
      </Card>
    </div>
  );
};

export default CMSListPage;
