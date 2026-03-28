import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Table,
  Button,
  Typography,
  Card,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Space,
  Tooltip,
  Tag,
  Spin,
  Descriptions,
  Tooltip as AntTooltip,
  Upload,
  Image,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mealPlanService, menuItemService, uploadService } from '@/services';
import { MenuItem, CreateMenuItemDto, UpdateMenuItemDto } from '@/types';
import { DEFAULT_MEAL_PLAN_IMAGE } from '@/constants/images';
import TableSkeleton from '@/components/TableSkeleton';
import ErrorState from '@/components/ErrorState';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { confirm } = Modal;

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE = MAX_IMAGE_SIZE_MB * 1024 * 1024;

const MenuManagementPage = () => {
  const navigate = useNavigate();
  const { id: mealPlanId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form] = Form.useForm();
  const [imagePreview, setImagePreview] = useState<string>(DEFAULT_MEAL_PLAN_IMAGE);
  const [hasCustomImage, setHasCustomImage] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadedImageKey, setUploadedImageKey] = useState<string | null>(null);

  const EllipsisCell = ({ text, className }: { text?: string; className?: string }) => {
    const spanRef = useRef<{ scrollWidth: number; clientWidth: number } | null>(null);
    const [isOverflow, setIsOverflow] = useState(false);

    const checkOverflow = () => {
      const el = spanRef.current;
      if (!el) return;
      setIsOverflow(el.scrollWidth > el.clientWidth);
    };

    return (
      <AntTooltip
        title={text}
        open={isOverflow ? undefined : false}
        mouseEnterDelay={0.05}
        mouseLeaveDelay={0.1}
        overlayClassName="st-ellipsis-tooltip"
      >
        <span
          ref={node => {
            spanRef.current = node;
          }}
          onMouseEnter={checkOverflow}
          className={`block truncate ${className || ''}`}
        >
          {text || '-'}
        </span>
      </AntTooltip>
    );
  };

  // Fetch meal plan
  const {
    data: mealPlan,
    isLoading: mealPlanLoading,
    isError: mealPlanError,
    error: mealPlanErrorDetails,
    refetch: refetchMealPlan,
  } = useQuery({
    queryKey: ['mealPlan', mealPlanId],
    queryFn: () => mealPlanService.getById(mealPlanId!),
    enabled: !!mealPlanId,
  });

  // Fetch menu items
  const {
    data: menuItems,
    isLoading: menuItemsLoading,
    isError: menuItemsError,
    error: menuItemsErrorDetails,
    refetch: refetchMenuItems,
  } = useQuery({
    queryKey: ['menuItems', mealPlanId],
    queryFn: () => menuItemService.getByMealPlan(mealPlanId!),
    enabled: !!mealPlanId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: menuItemService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems', mealPlanId] });
      message.success('Menu item created successfully');
      handleCloseModal();
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMenuItemDto }) =>
      menuItemService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems', mealPlanId] });
      message.success('Menu item updated successfully');
      handleCloseModal();
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: menuItemService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems', mealPlanId] });
      message.success('Menu item deleted successfully');
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const handleOpenModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      form.setFieldsValue(item);
      setImagePreview(item.imageUrl || DEFAULT_MEAL_PLAN_IMAGE);
      setHasCustomImage(Boolean(item.imageUrl));
      setUploadedImageKey(null);
    } else {
      setEditingItem(null);
      form.resetFields();
      setImagePreview(DEFAULT_MEAL_PLAN_IMAGE);
      setHasCustomImage(false);
      setUploadedImageKey(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    form.resetFields();
    setImagePreview(DEFAULT_MEAL_PLAN_IMAGE);
    setHasCustomImage(false);
    setUploadedImageKey(null);
  };

  const handleSubmit = (values: CreateMenuItemDto | UpdateMenuItemDto) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: values });
    } else {
      createMutation.mutate({ ...values, mealPlanId: mealPlanId! } as CreateMenuItemDto);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      message.error('Please upload an image file (JPG, PNG, or WEBP).');
      return Upload.LIST_IGNORE;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      message.error(`Image must be smaller than ${MAX_IMAGE_SIZE_MB}MB.`);
      return Upload.LIST_IGNORE;
    }

    try {
      setImageUploading(true);
      const result = await uploadService.uploadImage(file, 'menu-items');
      setImagePreview(result.url);
      setHasCustomImage(true);
      setUploadedImageKey(result.key);
      form.setFieldValue('imageUrl', result.url);
    } catch {
      message.error('Image upload failed. Please check server upload storage settings.');
    } finally {
      setImageUploading(false);
    }

    return false;
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

  const handleDelete = (item: MenuItem) => {
    confirm({
      title: 'Delete Menu Item',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete "${item.name}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => deleteMutation.mutate(item.id),
    });
  };

  // Table columns
  const columns: ColumnsType<MenuItem> = [
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 70,
      render: (url?: string) => (
        <Image
          src={url || DEFAULT_MEAL_PLAN_IMAGE}
          alt="Menu item"
          width={40}
          height={40}
          className="rounded-md object-cover"
          fallback={DEFAULT_MEAL_PLAN_IMAGE}
        />
      ),
    },
    {
      title: 'Day',
      key: 'day',
      width: 120,
      render: (_, record) => (
        <div>
          {record.dayOfWeek && <Tag color="blue">{record.dayOfWeek}</Tag>}
          {record.dayNumber && <Tag color="green">Day {record.dayNumber}</Tag>}
          {!record.dayOfWeek && !record.dayNumber && <Tag>General</Tag>}
        </div>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <EllipsisCell text={name} className="font-semibold" />,
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      ellipsis: true,
      render: (items: string) => <EllipsisCell text={items} className="text-gray-600" />,
    },
    {
      title: 'Calories',
      dataIndex: 'calories',
      key: 'calories',
      width: 100,
      render: (calories: number) => (calories ? `${calories} kcal` : '-'),
    },
    {
      title: 'Allergens',
      dataIndex: 'allergenInfo',
      key: 'allergenInfo',
      ellipsis: true,
      render: (info: string) => <EllipsisCell text={info} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
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

  if (mealPlanLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (mealPlanError) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <ErrorState
          title="Unable to load meal plan"
          description={(mealPlanErrorDetails as Error)?.message}
          onRetry={refetchMealPlan}
        />
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
            Menu Management
          </Title>
          <Text type="secondary">{mealPlan.name}</Text>
        </div>
      </div>

      {/* Meal Plan Info */}
      <Card className="mb-4">
        <Descriptions column={{ xs: 1, sm: 2, md: 4 }}>
          <Descriptions.Item label="School">{mealPlan.school?.name}</Descriptions.Item>
          <Descriptions.Item label="Type">
            <Tag color="blue">{mealPlan.mealPlanType?.displayName || mealPlan.planType}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Duration">{mealPlan.durationDays} days</Descriptions.Item>
          <Descriptions.Item label="Price">
            ₹
            {(mealPlan.pricePerDay / 100).toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            /day
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Menu Items */}
      <Card
        title="Menu Items"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
            Add Menu Item
          </Button>
        }
      >
        <div className="table-scrollbar">
          {menuItemsLoading ? (
            <TableSkeleton rows={6} />
          ) : menuItemsError ? (
            <ErrorState
              title="Unable to load menu items"
              description={(menuItemsErrorDetails as Error)?.message}
              onRetry={refetchMenuItems}
            />
          ) : (
            <Table
              columns={columns}
              dataSource={menuItems}
              rowKey="id"
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          )}
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Item Name"
            rules={[{ required: true, message: 'Please enter item name' }]}
          >
            <Input placeholder="e.g., Monday Lunch Special" />
          </Form.Item>

          <Form.Item
            name="items"
            label="Items (comma-separated)"
            rules={[{ required: true, message: 'Please enter items' }]}
          >
            <TextArea rows={2} placeholder="e.g., Dal, Rice, Mixed Vegetables, Roti, Salad" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={2} placeholder="Optional description..." />
          </Form.Item>

          <Form.Item
            label="Item Image (optional)"
            extra={`JPG, PNG, or WEBP. Max ${MAX_IMAGE_SIZE_MB}MB.`}
          >
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <img
                  src={imagePreview}
                  alt="Menu item preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Upload beforeUpload={handleImageUpload} showUploadList={false} accept="image/*">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item name="dayOfWeek" label="Day of Week">
              <Select
                placeholder="Select day"
                allowClear
                options={DAYS_OF_WEEK.map(day => ({ label: day, value: day }))}
              />
            </Form.Item>

            <Form.Item name="dayNumber" label="Day Number">
              <InputNumber min={1} max={365} placeholder="e.g., 1" style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item name="calories" label="Calories (kcal)">
              <InputNumber min={0} placeholder="e.g., 450" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="allergenInfo" label="Allergen Info">
              <Input placeholder="e.g., Contains gluten, dairy" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button onClick={handleCloseModal}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default MenuManagementPage;
