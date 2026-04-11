import { useRef, useState, type ChangeEvent, type ComponentRef } from 'react';
import {
  App as AntdApp,
  Button,
  Card,
  Collapse,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import { PlusOutlined, EditOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  appSettingService,
  isAllowedUploadImageMimeType,
  MAX_IMAGE_SIZE,
  MAX_IMAGE_SIZE_MB,
  mealPlanTypeService,
  uploadService,
} from '@/services';
import { CreateMealPlanTypeDto, MealPlanTypeMaster, UpdateMealPlanTypeDto } from '@/types';
import ErrorState from '@/components/ErrorState';
import TableSkeleton from '@/components/TableSkeleton';
import HorizontalScrollContainer from '@/components/HorizontalScrollContainer';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { TextArea } = Input;

const SettingsPage = () => {
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<MealPlanTypeMaster | null>(null);
  const [form] = Form.useForm<CreateMealPlanTypeDto & { isActive: boolean }>();
  const logoInputRef = useRef<ComponentRef<'input'> | null>(null);

  const {
    data: mealPlanTypes,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['mealPlanTypes', 'settings'],
    queryFn: () => mealPlanTypeService.getAll(),
  });

  const {
    data: taxSetting,
    isLoading: taxSettingLoading,
    isError: taxSettingError,
    error: taxSettingErrorDetails,
    refetch: refetchTaxSetting,
  } = useQuery({
    queryKey: ['appSettings', 'tax'],
    queryFn: () => appSettingService.getTaxSetting(),
  });

  const {
    data: brandingSetting,
    isLoading: brandingSettingLoading,
    isError: brandingSettingError,
    error: brandingSettingErrorDetails,
    refetch: refetchBrandingSetting,
  } = useQuery({
    queryKey: ['appSettings', 'branding'],
    queryFn: () => appSettingService.getBrandingSetting(),
  });

  const createMutation = useMutation({
    mutationFn: mealPlanTypeService.create,
    onSuccess: () => {
      message.success('Meal plan type added successfully');
      queryClient.invalidateQueries({ queryKey: ['mealPlanTypes'] });
      handleCloseModal();
    },
    onError: (err: Error) => {
      message.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMealPlanTypeDto }) =>
      mealPlanTypeService.update(id, data),
    onSuccess: () => {
      message.success('Meal plan type updated successfully');
      queryClient.invalidateQueries({ queryKey: ['mealPlanTypes'] });
      handleCloseModal();
    },
    onError: (err: Error) => {
      message.error(err.message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      mealPlanTypeService.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlanTypes'] });
      message.success('Status updated');
    },
    onError: (err: Error) => {
      message.error(err.message);
    },
  });

  const updateTaxMutation = useMutation({
    mutationFn: (taxPercentage: number) => appSettingService.updateTaxSetting(taxPercentage),
    onSuccess: () => {
      message.success('Tax percentage updated successfully');
      queryClient.invalidateQueries({ queryKey: ['appSettings', 'tax'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: Error) => {
      message.error(err.message);
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const previousLogoUrl = brandingSetting?.logoUrl ?? null;
      const uploadResult = await uploadService.uploadImage(file, 'app-branding');
      const updatedBranding = await appSettingService.updateBrandingSetting(uploadResult.url);

      if (previousLogoUrl && previousLogoUrl !== uploadResult.url) {
        const previousKey = uploadService.extractStorageKey(previousLogoUrl);
        if (previousKey) {
          try {
            await uploadService.deleteImage(previousKey);
          } catch {
            // Best effort cleanup; logo update has already succeeded.
          }
        }
      }

      return updatedBranding;
    },
    onSuccess: () => {
      message.success('Application logo updated successfully');
      queryClient.invalidateQueries({ queryKey: ['appSettings', 'branding'] });
    },
    onError: (err: Error) => {
      message.error(err.message);
    },
  });

  const removeLogoMutation = useMutation({
    mutationFn: async () => {
      const previousLogoUrl = brandingSetting?.logoUrl ?? null;
      const updatedBranding = await appSettingService.updateBrandingSetting(null);

      const previousKey = uploadService.extractStorageKey(previousLogoUrl);
      if (previousKey) {
        try {
          await uploadService.deleteImage(previousKey);
        } catch {
          // Best effort cleanup; setting update has already succeeded.
        }
      }

      return updatedBranding;
    },
    onSuccess: () => {
      message.success('Application logo removed successfully');
      queryClient.invalidateQueries({ queryKey: ['appSettings', 'branding'] });
    },
    onError: (err: Error) => {
      message.error(err.message);
    },
  });

  const handleOpenModal = (mealPlanType?: MealPlanTypeMaster) => {
    if (mealPlanType) {
      setEditingType(mealPlanType);
      form.setFieldsValue({
        code: mealPlanType.code,
        displayName: mealPlanType.displayName,
        description: mealPlanType.description,
        sortOrder: mealPlanType.sortOrder,
        isActive: mealPlanType.isActive,
      });
    } else {
      setEditingType(null);
      form.resetFields();
      form.setFieldValue('isActive', true);
    }

    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingType(null);
    form.resetFields();
  };

  const handleSubmit = (values: CreateMealPlanTypeDto) => {
    const payload: CreateMealPlanTypeDto = {
      ...values,
      code: values.code.trim().toUpperCase().replace(/\s+/g, '_'),
    };

    if (editingType) {
      updateMutation.mutate({ id: editingType.id, data: payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const columns: ColumnsType<MealPlanTypeMaster> = [
    {
      title: 'Display Name',
      dataIndex: 'displayName',
      key: 'displayName',
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (value: string) => <Tag>{value}</Tag>,
      width: 160,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (value?: string) => value || '-',
    },
    {
      title: 'Sort Order',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 120,
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive: boolean, record) => (
        <Switch
          checked={isActive}
          loading={toggleMutation.isPending}
          onChange={checked => toggleMutation.mutate({ id: record.id, isActive: checked })}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
      ),
    },
  ];

  const handleTaxSubmit = (values: { taxPercentage: number }) => {
    updateTaxMutation.mutate(values.taxPercentage);
  };

  const handleLogoSelect = (event: ChangeEvent<ComponentRef<'input'>>) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';

    if (!selectedFile) return;

    const mimeType = (selectedFile.type || '').toLowerCase().trim();
    if (!isAllowedUploadImageMimeType(mimeType)) {
      message.error('Please upload a valid image file (JPG or PNG only).');
      return;
    }

    if (selectedFile.size > MAX_IMAGE_SIZE) {
      message.error(`Image must be ${MAX_IMAGE_SIZE_MB}MB or smaller.`);
      return;
    }

    uploadLogoMutation.mutate(selectedFile);
  };

  const handleRemoveLogo = () => {
    if (!brandingSetting?.logoUrl) return;
    removeLogoMutation.mutate();
  };

  return (
    <div>
      <div className="mb-6">
        <Title level={2} className="!mb-1">
          Settings
        </Title>
        <Text type="secondary">
          Manage central meal plan types, global tax, and branding. Updates here reflect across
          admin and connected clients.
        </Text>
      </div>

      <Card styles={{ body: { padding: 0 } }}>
        <Collapse
          defaultActiveKey={['meal-plan-types']}
          items={[
            {
              key: 'meal-plan-types',
              label: <span className="text-xl font-semibold">Meal Plan Types</span>,
              extra: (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={event => {
                    event.stopPropagation();
                    handleOpenModal();
                  }}
                >
                  Add Type
                </Button>
              ),
              children: (
                <div className="pt-2">
                  {isLoading ? (
                    <TableSkeleton rows={6} />
                  ) : isError ? (
                    <ErrorState
                      title="Unable to load meal plan types"
                      description={(error as Error)?.message}
                      onRetry={refetch}
                    />
                  ) : (
                    <HorizontalScrollContainer>
                      <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={mealPlanTypes}
                        pagination={{
                          pageSize: 10,
                          showSizeChanger: true,
                          showTotal: total => `Total ${total} types`,
                        }}
                        scroll={{ x: 'max-content', y: 'clamp(260px, calc(100vh - 360px), 720px)' }}
                      />
                    </HorizontalScrollContainer>
                  )}
                </div>
              ),
            },
            {
              key: 'tax-settings',
              label: <span className="text-xl font-semibold">Tax Settings</span>,
              children: (
                <div className="max-w-xl pt-2">
                  {taxSettingError ? (
                    <ErrorState
                      title="Unable to load tax setting"
                      description={(taxSettingErrorDetails as Error)?.message}
                      onRetry={refetchTaxSetting}
                    />
                  ) : (
                    <Form
                      key={taxSetting?.updatedAt ?? 'tax-default'}
                      layout="vertical"
                      onFinish={handleTaxSubmit}
                      initialValues={{ taxPercentage: taxSetting?.taxPercentage ?? 0 }}
                    >
                      <Form.Item
                        name="taxPercentage"
                        label="Global Tax Percentage (%)"
                        rules={[
                          { required: true, message: 'Please enter tax percentage' },
                          {
                            type: 'number',
                            min: 0,
                            max: 100,
                            message: 'Tax must be between 0 and 100',
                          },
                        ]}
                        extra="This tax is applied globally when orders are created."
                      >
                        <InputNumber
                          min={0}
                          max={100}
                          step={0.01}
                          precision={2}
                          style={{ width: '100%' }}
                          placeholder="e.g., 5.00"
                          disabled={taxSettingLoading}
                        />
                      </Form.Item>

                      <div className="flex items-center justify-between gap-4">
                        <Text type="secondary">
                          Last updated:{' '}
                          {taxSetting?.updatedAt
                            ? new Date(taxSetting.updatedAt).toLocaleString()
                            : 'Not available'}
                        </Text>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={updateTaxMutation.isPending}
                        >
                          Save Tax
                        </Button>
                      </div>
                    </Form>
                  )}
                </div>
              ),
            },
            {
              key: 'branding-settings',
              label: <span className="text-xl font-semibold">Branding Settings</span>,
              children: (
                <div className="max-w-2xl pt-2">
                  {brandingSettingError ? (
                    <ErrorState
                      title="Unable to load branding setting"
                      description={(brandingSettingErrorDetails as Error)?.message}
                      onRetry={refetchBrandingSetting}
                    />
                  ) : (
                    <div className="space-y-4">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={handleLogoSelect}
                      />

                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <Text strong className="block">
                            Application Logo
                          </Text>
                          <Text type="secondary">
                            This logo is used across admin, browser tab icon, and mobile app clients
                            via the public branding API.
                          </Text>
                          <br />
                          <Text type="secondary">
                            Supported formats: JPG, PNG. Max {MAX_IMAGE_SIZE_MB}
                            MB.
                          </Text>
                        </div>

                        <Space>
                          <Button
                            icon={<UploadOutlined />}
                            loading={uploadLogoMutation.isPending}
                            disabled={brandingSettingLoading || removeLogoMutation.isPending}
                            onClick={() => logoInputRef.current?.click()}
                          >
                            Upload Logo
                          </Button>
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            loading={removeLogoMutation.isPending}
                            disabled={
                              brandingSettingLoading ||
                              uploadLogoMutation.isPending ||
                              !brandingSetting?.logoUrl
                            }
                            onClick={handleRemoveLogo}
                          >
                            Remove Logo
                          </Button>
                        </Space>
                      </div>

                      <div className="rounded-lg border border-dashed border-gray-300 p-4">
                        {brandingSettingLoading ? (
                          <Text type="secondary">Loading current logo...</Text>
                        ) : brandingSetting?.logoUrl ? (
                          <Image
                            src={brandingSetting.logoUrl}
                            alt="Application logo"
                            width={180}
                            className="rounded-md bg-white p-2"
                          />
                        ) : (
                          <Text type="secondary">
                            No custom logo configured. Default branding is currently active.
                          </Text>
                        )}
                      </div>

                      <Text type="secondary">
                        Last updated:{' '}
                        {brandingSetting?.updatedAt
                          ? new Date(brandingSetting.updatedAt).toLocaleString()
                          : 'Not available'}
                      </Text>
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editingType ? 'Edit Meal Plan Type' : 'Add Meal Plan Type'}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ isActive: true, sortOrder: 0 }}
        >
          <Form.Item
            name="displayName"
            label="Display Name"
            rules={[{ required: true, message: 'Please enter a display name' }]}
          >
            <Input placeholder="e.g., Breakfast" />
          </Form.Item>

          <Form.Item
            name="code"
            label="Code"
            rules={[
              { required: true, message: 'Please enter a unique code' },
              {
                pattern: /^[A-Za-z0-9_\-\s]+$/,
                message: 'Only letters, numbers, spaces, _ and - are allowed',
              },
            ]}
            extra="Will be stored in uppercase, e.g., BREAKFAST"
          >
            <Input placeholder="e.g., BREAKFAST" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Optional description" />
          </Form.Item>

          <Form.Item name="sortOrder" label="Sort Order">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Space className="w-full justify-end">
            <Button onClick={handleCloseModal}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingType ? 'Save Changes' : 'Add Type'}
            </Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default SettingsPage;
