import { useEffect } from 'react';
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
  Select,
  InputNumber,
  Switch,
  Spin,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mealPlanService, schoolService } from '@/services';
import { UpdateMealPlanDto, MealPlanType } from '@/types';

const { Title, Text } = Typography;
const { TextArea } = Input;

const MealPlanEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  // Watch for price changes
  const pricePerDay = Form.useWatch('pricePerDay', form);
  const durationDays = Form.useWatch('durationDays', form);

  useEffect(() => {
    if (pricePerDay && durationDays) {
      form.setFieldValue('totalPrice', pricePerDay * durationDays);
    }
  }, [pricePerDay, durationDays, form]);

  // Fetch meal plan
  const { data: mealPlan, isLoading } = useQuery({
    queryKey: ['mealPlan', id],
    queryFn: () => mealPlanService.getById(id!),
    enabled: !!id,
  });

  // Fetch schools
  const { data: schools } = useQuery({
    queryKey: ['schools'],
    queryFn: () => schoolService.getAll(),
  });

  // Set form values when data loads
  useEffect(() => {
    if (mealPlan) {
      form.setFieldsValue(mealPlan);
    }
  }, [mealPlan, form]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateMealPlanDto) => mealPlanService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      queryClient.invalidateQueries({ queryKey: ['mealPlan', id] });
      message.success('Meal plan updated successfully');
      navigate('/meal-plans');
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const onFinish = (values: UpdateMealPlanDto) => {
    updateMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (!mealPlan) {
    return (
      <div className="text-center py-12">
        <Text type="secondary">Meal plan not found</Text>
        <br />
        <Button type="link" onClick={() => navigate('/meal-plans')}>
          Back to Meal Plans
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/meal-plans')}
        />
        <div>
          <Title level={2} className="!mb-1">Edit Meal Plan</Title>
          <Text type="secondary">{mealPlan.name}</Text>
        </div>
      </div>

      {/* Form */}
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
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
                  showSearch
                  optionFilterProp="label"
                  options={schools?.map((s) => ({ label: s.name, value: s.id }))}
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
                  options={Object.values(MealPlanType).map((type) => ({
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
                <InputNumber
                  min={1}
                  max={365}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea
              rows={3}
              placeholder="Describe the meal plan..."
            />
          </Form.Item>

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item
                name="pricePerDay"
                label="Price per Day (in paise)"
                rules={[{ required: true, message: 'Please enter price' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="totalPrice"
                label="Total Price (in paise)"
                rules={[{ required: true, message: 'Please enter total price' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="currency"
                label="Currency"
              >
                <Select
                  options={[
                    { label: 'INR (₹)', value: 'INR' },
                    { label: 'USD ($)', value: 'USD' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
          >
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <Button onClick={() => navigate('/meal-plans')}>
              Cancel
            </Button>
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

export default MealPlanEditPage;
