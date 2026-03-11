import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Spin, Tag, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { cmsService } from '@/services';

const { Title, Text } = Typography;

const CMSPreviewPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading } = useQuery({
    queryKey: ['cmsPreview', slug],
    queryFn: () => cmsService.getBySlug(slug!),
    enabled: !!slug,
    retry: 0,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="text-center py-12">
        <Text type="secondary">Preview unavailable for this page.</Text>
        <br />
        <Button type="link" onClick={() => navigate('/cms')}>
          Back to CMS
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/cms')} />
        <div>
          <Title level={3} className="!mb-1">
            {page.title}
          </Title>
          <Tag>{page.slug}</Tag>
        </div>
      </div>

      <Card>
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
      </Card>
    </div>
  );
};

export default CMSPreviewPage;
