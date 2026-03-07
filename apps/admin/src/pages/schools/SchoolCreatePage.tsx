import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Row, Col, Checkbox, Space } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolService } from '@/services';
import { CreateSchoolDto } from '@/types';

const { Title, Text } = Typography;
const { TextArea } = Input;

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const SchoolCreatePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const createMutation = useMutation({
    mutationFn: schoolService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      message.success('School created successfully');
      navigate('/schools');
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const onFinish = (values: CreateSchoolDto & { operatingDaysArray: string[] }) => {
    const { operatingDaysArray, ...rest } = values;
    const data: CreateSchoolDto = {
      ...rest,
      // Backend expects comma-separated values
      operatingDays: operatingDaysArray.join(','),
    };
    createMutation.mutate(data);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/schools')} />
        <div>
          <Title level={2} className="!mb-1">
            Add New School
          </Title>
          <Text type="secondary">Create a new school for tiffin service</Text>
        </div>
      </div>

      {/* Form */}
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            operatingDaysArray: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
          }}
          requiredMark="optional"
        >
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
                rules={[
                  { required: true, message: 'Please enter school code' },
                  { pattern: /^[A-Z0-9_-]+$/i, message: 'Only letters, numbers, hyphens allowed' },
                ]}
                extra="Unique identifier for the school"
              >
                <Input placeholder="e.g., DPS-DELHI-001" style={{ textTransform: 'uppercase' }} />
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
            extra="Days when tiffin service is available"
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

          <Form.Item
            name="deliveryInstructions"
            label="Delivery Instructions"
            extra="Special instructions for delivery personnel"
          >
            <TextArea
              rows={3}
              placeholder="e.g., Deliver to school cafeteria between 11:30 AM - 12:00 PM"
            />
          </Form.Item>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <Button onClick={() => navigate('/schools')}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={createMutation.isPending}
            >
              Create School
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default SchoolCreatePage;
