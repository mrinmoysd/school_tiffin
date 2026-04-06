import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  App as AntdApp,
  Form,
  Input,
  Button,
  Card,
  Typography,
  Row,
  Col,
  Select,
  InputNumber,
  Switch,
  Spin,
  Upload,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  isAllowedUploadImageMimeType,
  MAX_IMAGE_SIZE,
  MAX_IMAGE_SIZE_MB,
  mealPlanService,
  mealPlanTypeService,
  schoolService,
  uploadService,
} from '@/services';
import { UpdateMealPlanDto } from '@/types';
import { DEFAULT_MEAL_PLAN_IMAGE } from '@/constants/images';

const { Title, Text } = Typography;
const { TextArea } = Input;

const formatRupeesInput = (value?: string | number) => {
  if (value === undefined || value === null || value === '') return '';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return '';
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

const parseRupeesInput = (value?: string) => (value ? value.replace(/[₹,\s]/g, '') : '');

const paiseToRupees = (value?: number) =>
  value === undefined || value === null ? value : Number((value / 100).toFixed(2));

const rupeesToPaise = (value?: number) =>
  value === undefined || value === null ? value : Math.round(value * 100);

const FLOAT_COMPARISON_EPSILON = 0.0001;

const shouldUpdateComputedTotalPrice = (currentValue: unknown, nextValue: number): boolean => {
  if (typeof currentValue === 'number') {
    return Math.abs(currentValue - nextValue) > FLOAT_COMPARISON_EPSILON;
  }

  if (typeof currentValue === 'string' && currentValue.trim() !== '') {
    const parsedCurrentValue = Number(currentValue);
    if (Number.isFinite(parsedCurrentValue)) {
      return Math.abs(parsedCurrentValue - nextValue) > FLOAT_COMPARISON_EPSILON;
    }
  }

  return true;
};

const toSafeErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  if (error && typeof error === 'object') {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
      return maybeMessage;
    }
  }

  return fallback;
};

const MealPlanEditPage = () => {
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [imagePreview, setImagePreview] = useState<string>(DEFAULT_MEAL_PLAN_IMAGE);
  const [hasCustomImage, setHasCustomImage] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadedImageKey, setUploadedImageKey] = useState<string | null>(null);

  // Watch for price changes
  const pricePerDay = Form.useWatch('pricePerDay', form);
  const durationDays = Form.useWatch('durationDays', form);

  useEffect(() => {
    if (typeof pricePerDay === 'number' && typeof durationDays === 'number') {
      const total = Number((pricePerDay * durationDays).toFixed(2));
      const currentTotal = form.getFieldValue('totalPrice');
      if (shouldUpdateComputedTotalPrice(currentTotal, total)) {
        form.setFieldValue('totalPrice', total);
      }
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

  const { data: mealPlanTypes, isLoading: mealPlanTypesLoading } = useQuery({
    queryKey: ['mealPlanTypes', 'all'],
    queryFn: () => mealPlanTypeService.getAll(),
  });

  // Set form values when data loads
  useEffect(() => {
    if (mealPlan) {
      form.setFieldsValue({
        schoolId: mealPlan.schoolId,
        mealPlanTypeId: mealPlan.mealPlanTypeId,
        name: mealPlan.name,
        description: mealPlan.description,
        durationDays: mealPlan.durationDays,
        imageUrl: mealPlan.imageUrl ?? null,
        currency: mealPlan.currency,
        isActive: mealPlan.isActive,
        pricePerDay: paiseToRupees(mealPlan.pricePerDay),
        totalPrice: paiseToRupees(mealPlan.totalPrice),
      });
      setImagePreview(mealPlan.imageUrl || DEFAULT_MEAL_PLAN_IMAGE);
      setHasCustomImage(Boolean(mealPlan.imageUrl));
      setUploadedImageKey(null);
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
    onError: error => {
      message.error(toSafeErrorMessage(error, 'Failed to update meal plan.'));
    },
  });

  const onFinish = (values: UpdateMealPlanDto) => {
    const payload: UpdateMealPlanDto = {
      ...values,
      pricePerDay: rupeesToPaise(values.pricePerDay) ?? values.pricePerDay,
      totalPrice: rupeesToPaise(values.totalPrice) ?? values.totalPrice,
    };
    updateMutation.mutate(payload);
  };

  const handleImageUpload = async (file: File) => {
    if (!isAllowedUploadImageMimeType(file.type || '')) {
      message.error('Please upload an image file (JPG or PNG only).');
      return Upload.LIST_IGNORE;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      message.error(`Image must be ${MAX_IMAGE_SIZE_MB}MB or smaller.`);
      return Upload.LIST_IGNORE;
    }

    try {
      setImageUploading(true);
      const result = await uploadService.uploadImage(file, 'meal-plans');
      const uploadedUrl = result.url.trim();
      const uploadedKey = result.key.trim();
      setImagePreview(uploadedUrl);
      setHasCustomImage(true);
      setUploadedImageKey(uploadedKey);
      form.setFieldValue('imageUrl', uploadedUrl);
    } catch (error) {
      message.error(toSafeErrorMessage(error, 'Image upload failed. Please try again.'));
    } finally {
      setImageUploading(false);
    }

    return Upload.LIST_IGNORE;
  };

  const handleRemoveImage = async () => {
    if (uploadedImageKey) {
      try {
        await uploadService.deleteImage(uploadedImageKey);
      } catch {
        message.error('Failed to remove image from storage.');
      }
    }
    setImagePreview(DEFAULT_MEAL_PLAN_IMAGE);
    setHasCustomImage(false);
    setUploadedImageKey(null);
    form.setFieldValue('imageUrl', null);
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
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/meal-plans')} />
        <div>
          <Title level={2} className="!mb-1">
            Edit Meal Plan
          </Title>
          <Text type="secondary">{mealPlan.name}</Text>
        </div>
      </div>

      {/* Form */}
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark="optional">
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
                  options={schools?.map(s => ({ label: s.name, value: s.id }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="mealPlanTypeId"
                label="Plan Type"
                rules={[{ required: true, message: 'Please select plan type' }]}
              >
                <Select
                  placeholder="Select type"
                  loading={mealPlanTypesLoading}
                  showSearch
                  optionFilterProp="label"
                  options={mealPlanTypes
                    ?.filter(type => type.isActive || type.id === mealPlan.mealPlanTypeId)
                    .map(type => ({
                      label: type.displayName,
                      value: type.id,
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
                <InputNumber min={1} max={365} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Describe the meal plan..." />
          </Form.Item>

          <Form.Item
            label="Plan Image (optional)"
            extra={`JPG or PNG. Max ${MAX_IMAGE_SIZE_MB}MB.`}
          >
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <img
                  src={imagePreview}
                  alt="Meal plan preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Upload
                  beforeUpload={handleImageUpload}
                  showUploadList={false}
                  accept="image/png,image/jpeg"
                >
                  <Button icon={<UploadOutlined />} loading={imageUploading}>
                    Upload Image
                  </Button>
                </Upload>
                {hasCustomImage && (
                  <Button danger onClick={handleRemoveImage} disabled={imageUploading}>
                    Remove Image
                  </Button>
                )}
              </div>
            </div>
            <Form.Item name="imageUrl" noStyle>
              <Input type="hidden" />
            </Form.Item>
          </Form.Item>

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item
                name="pricePerDay"
                label="Price per Day (₹)"
                rules={[{ required: true, message: 'Please enter price' }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
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
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
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
