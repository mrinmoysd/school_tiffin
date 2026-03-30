import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  App as AntdApp,
  Form,
  Input,
  Button,
  Card,
  Typography,
  Switch,
  Spin,
  Row,
  Col,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsService } from '@/services';
import { CreateCMSPageDto, UpdateCMSPageDto } from '@/types';
import VisualPageBuilder from '@/components/cms/VisualPageBuilder';

const { Title, Text } = Typography;

const CMSEditorPage = () => {
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const isEditing = !!slug;

  // Fetch page if editing
  const { data: page, isLoading } = useQuery({
    queryKey: ['cmsPage', slug],
    queryFn: () => cmsService.getById(slug!),
    enabled: isEditing,
  });

  // Set form values when page loads
  useEffect(() => {
    if (page) {
      form.setFieldsValue(page);
    }
  }, [page, form]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: cmsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cmsPages'] });
      message.success('Page created successfully');
      navigate('/cms');
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateCMSPageDto) => cmsService.update(slug!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cmsPages'] });
      queryClient.invalidateQueries({ queryKey: ['cmsPage', slug] });
      message.success('Page updated successfully');
      navigate('/cms');
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const onFinish = (values: CreateCMSPageDto | UpdateCMSPageDto) => {
    if (isEditing) {
      const updatePayload: UpdateCMSPageDto = {};
      const typedValues = values as CreateCMSPageDto & UpdateCMSPageDto;

      if (typeof typedValues.title === 'string') {
        updatePayload.title = typedValues.title;
      }
      if (typeof typedValues.content === 'string') {
        updatePayload.content = typedValues.content;
      }
      if (typeof typedValues.isPublished === 'boolean') {
        updatePayload.isPublished = typedValues.isPublished;
      }

      updateMutation.mutate(updatePayload);
    } else {
      // New pages are created as published so they are visible immediately in CMS list.
      createMutation.mutate({
        ...(values as CreateCMSPageDto),
        isPublished: true,
      });
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (isEditing && !page) {
    return (
      <div className="text-center py-12">
        <Text type="secondary">Page not found</Text>
        <br />
        <Button type="link" onClick={() => navigate('/cms')}>
          Back to CMS
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/cms')} />
        <div>
          <Title level={2} className="!mb-1">
            {isEditing ? 'Edit Page' : 'Create New Page'}
          </Title>
          {isEditing && page && <Text type="secondary">Version {page.version}</Text>}
        </div>
      </div>

      {/* Form */}
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={isEditing ? {} : { isPublished: false }}
          requiredMark="optional"
        >
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="slug"
                label="Slug"
                rules={[
                  { required: true, message: 'Please enter slug' },
                  {
                    pattern: /^[a-z0-9-]+$/,
                    message: 'Only lowercase letters, numbers, and hyphens',
                  },
                ]}
                extra="URL-friendly identifier (e.g., about-us, terms-of-service)"
              >
                <Input placeholder="e.g., about-us" disabled={isEditing} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: 'Please enter title' }]}
              >
                <Input placeholder="e.g., About Us" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="content"
            label="Page Builder"
            rules={[{ required: true, message: 'Please add content using the visual builder' }]}
          >
            <VisualPageBuilder />
          </Form.Item>

          {isEditing && (
            <Form.Item name="isPublished" label="Published" valuePropName="checked">
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <Button onClick={() => navigate('/cms')}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {isEditing ? 'Save Changes' : 'Create Page'}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default CMSEditorPage;
