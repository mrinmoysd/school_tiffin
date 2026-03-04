import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  message,
  Row,
  Col,
  Checkbox,
  Space,
  Switch,
  Spin,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolService } from '@/services';
import { UpdateSchoolDto } from '@/types';
import { useEffect } from 'react';

const { Title, Text } = Typography;
const { TextArea } = Input;

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const SchoolEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  // Fetch school data
  const { data: school, isLoading } = useQuery({
    queryKey: ['school', id],
    queryFn: () => schoolService.getById(id!),
    enabled: !!id,
  });

  // Update form when data is loaded
  useEffect(() => {
    if (school) {
      let operatingDaysArray: string[] = [];

      if (Array.isArray((school as any).operatingDays)) {
        // If backend already returns an array
        operatingDaysArray = (school as any).operatingDays;
      } else if (typeof school.operatingDays === 'string') {
        const value = school.operatingDays.trim();
        // Try JSON first
        if (value.startsWith('[')) {
          try {
            operatingDaysArray = JSON.parse(value);
          } catch {
            operatingDaysArray = value
              .split(',')
              .map(d => d.trim())
              .filter(Boolean);
          }
        } else {
          operatingDaysArray = value
            .split(',')
            .map(d => d.trim())
            .filter(Boolean);
        }
      }

      form.setFieldsValue({
        ...school,
        operatingDaysArray,
      });
    }
  }, [school, form]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateSchoolDto) => schoolService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['school', id] });
      message.success('School updated successfully');
      navigate('/schools');
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const onFinish = (
    values: UpdateSchoolDto & { operatingDaysArray: string[] } & { code?: string },
  ) => {
    const { operatingDaysArray, code: _code, ...rest } = values;
    const data: UpdateSchoolDto = {
      ...rest,
      // Backend expects comma-separated values
      operatingDays: operatingDaysArray.join(','),
    };
    updateMutation.mutate(data);
  };

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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/schools')} />
        <div>
          <Title level={2} className="!mb-1">
            Edit School
          </Title>
          <Text type="secondary">
            {school.name} ({school.code})
          </Text>
        </div>
      </div>

      {/* Form */}
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark="optional">
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="School Name"
                rules={[
                  { required: true, message: 'Please enter school name' },
                  { min: 3, message: 'Name must be at least 3 characters' },
                ]}
              >
                <Input placeholder="e.g., Delhi Public School" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="code"
                label="School Code"
                rules={[{ required: true, message: 'Please enter school code' }]}
              >
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: 'Please enter address' }]}
          >
            <TextArea rows={2} placeholder="Full school address" />
          </Form.Item>

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="city" label="City">
                <Input placeholder="e.g., New Delhi" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="state" label="State">
                <Input placeholder="e.g., Delhi" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="pincode"
                label="Pincode"
                rules={[{ pattern: /^\d{6}$/, message: 'Please enter valid 6-digit pincode' }]}
              >
                <Input placeholder="e.g., 110001" maxLength={6} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="contactEmail"
                label="Contact Email"
                rules={[{ type: 'email', message: 'Please enter valid email' }]}
              >
                <Input placeholder="e.g., admin@school.edu" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="contactPhone"
                label="Contact Phone"
                rules={[{ pattern: /^\d{10}$/, message: 'Please enter valid 10-digit phone' }]}
              >
                <Input placeholder="e.g., 9876543210" maxLength={10} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="operatingDaysArray"
            label="Operating Days"
            rules={[{ required: true, message: 'Please select at least one day' }]}
          >
            <Checkbox.Group>
              <Space wrap>
                {DAYS_OF_WEEK.map(day => (
                  <Checkbox key={day} value={day}>
                    {day}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item name="deliveryInstructions" label="Delivery Instructions">
            <TextArea
              rows={3}
              placeholder="e.g., Deliver to school cafeteria between 11:30 AM - 12:00 PM"
            />
          </Form.Item>

          <Form.Item name="isServiceAvailable" label="Service Available" valuePropName="checked">
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <Button onClick={() => navigate('/schools')}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={updateMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default SchoolEditPage;
