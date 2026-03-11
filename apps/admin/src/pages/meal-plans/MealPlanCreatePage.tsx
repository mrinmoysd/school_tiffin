import { useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  message,
  Row,
  Col,
  Select,
  InputNumber,
  Switch,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mealPlanService, schoolService } from '@/services';
import { CreateMealPlanDto, MealPlanType } from '@/types';
import { useEffect } from 'react';

const { Title, Text } = Typography;
const { TextArea } = Input;

const formatRupeesInput = (value?: string | number) => {
  if (value === undefined || value === null || value === '') return '';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return '';
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const parseRupeesInput = (value?: string) => (value ? value.replace(/[₹,\s]/g, '') : '');

const rupeesToPaise = (value?: number) =>
  value === undefined || value === null ? value : Math.round(value * 100);

const MealPlanCreatePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  // Watch for price changes to auto-calculate total
  const pricePerDay = Form.useWatch('pricePerDay', form);
  const durationDays = Form.useWatch('durationDays', form);

  useEffect(() => {
    if (typeof pricePerDay === 'number' && typeof durationDays === 'number') {
      const total = Number((pricePerDay * durationDays).toFixed(2));
      form.setFieldValue('totalPrice', total);
    }
  }, [pricePerDay, durationDays, form]);

  // Fetch schools
  const { data: schools, isLoading: schoolsLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: () => schoolService.getAll({ isServiceAvailable: true }),
  });

  const createMutation = useMutation({
    mutationFn: mealPlanService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      message.success('Meal plan created successfully');
      navigate('/meal-plans');
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const onFinish = (values: CreateMealPlanDto) => {
    const payload: CreateMealPlanDto = {
      ...values,
      pricePerDay: rupeesToPaise(values.pricePerDay) ?? values.pricePerDay,
      totalPrice: rupeesToPaise(values.totalPrice) ?? values.totalPrice,
    };
    createMutation.mutate(payload);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/meal-plans')} />
        <div>
          <Title level={2} className="!mb-1">
            Add New Meal Plan
          </Title>
          <Text type="secondary">Create a new meal plan for a school</Text>
        </div>
      </div>

      {/* Form */}
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            currency: 'INR',
            isActive: true,
            durationDays: 30,
          }}
          requiredMark="optional"
        >
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="schoolId"
                label="School"
                rules={[{ required: true, message: 'Please select a school' }]}
              >
                <Select
                  placeholder="Select school"
                  loading={schoolsLoading}
                  showSearch
                  optionFilterProp="label"
                  options={schools?.map(s => ({ label: s.name, value: s.id }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="planType"
                label="Plan Type"
                rules={[{ required: true, message: 'Please select plan type' }]}
              >
                <Select
                  placeholder="Select type"
                  options={Object.values(MealPlanType).map(type => ({
                    label: type,
                    value: type,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={16}>
              <Form.Item
                name="name"
                label="Plan Name"
                rules={[
                  { required: true, message: 'Please enter plan name' },
                  { min: 3, message: 'Name must be at least 3 characters' },
                ]}
              >
                <Input placeholder="e.g., Standard Lunch Plan" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="durationDays"
                label="Duration (Days)"
                rules={[{ required: true, message: 'Please enter duration' }]}
              >
                <InputNumber min={1} max={365} placeholder="30" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Describe the meal plan..." />
          </Form.Item>

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item
                name="pricePerDay"
                label="Price per Day (₹)"
                rules={[{ required: true, message: 'Please enter price' }]}
                extra="Enter amount in rupees (e.g., 100.50)"
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  placeholder="100.00"
                  style={{ width: '100%' }}
                  formatter={formatRupeesInput}
                  parser={parseRupeesInput}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="totalPrice"
                label="Total Price (₹)"
                rules={[{ required: true, message: 'Please enter total price' }]}
                extra="Auto-calculated based on duration"
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  placeholder="3000.00"
                  style={{ width: '100%' }}
                  formatter={formatRupeesInput}
                  parser={parseRupeesInput}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="currency" label="Currency">
                <Select
                  options={[
                    { label: 'INR (₹)', value: 'INR' },
                    { label: 'USD ($)', value: 'USD' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <Button onClick={() => navigate('/meal-plans')}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={createMutation.isPending}
            >
              Create Meal Plan
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default MealPlanCreatePage;
