import { useState } from 'react';
import {
  CheckCircleFilled,
  DeleteOutlined,
  EditOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import {
  App as AntdApp,
  Avatar,
  Button,
  Card,
  Descriptions,
  Form,
  Image,
  Input,
  Modal,
  Typography,
  Upload,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  isAllowedUploadImageMimeType,
  MAX_IMAGE_SIZE,
  MAX_IMAGE_SIZE_MB,
  uploadService,
  userService,
} from '@/services';
import { useAuthStore } from '@/stores/authStore';
import { isValidIndianPhone, normalizeIndianPhone } from '@/constants/validation';
import { formatUserName } from '@/utils/formatters';

const { Title, Text } = Typography;

interface ProfileFormValues {
  firstName: string;
  lastName: string;
  phone?: string;
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const { user, setUser } = useAuthStore();
  const [form] = Form.useForm<ProfileFormValues>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [initialImageUrl, setInitialImageUrl] = useState<string | null>(null);
  const [pendingProfileImageUrl, setPendingProfileImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [latestUploadedImageKey, setLatestUploadedImageKey] = useState<string | null>(null);

  const updateProfileMutation = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      userService.updateMyProfile({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone?.trim() ? normalizeIndianPhone(values.phone) : undefined,
        profileImageUrl: pendingProfileImageUrl,
      }),
    onSuccess: updatedUser => {
      if (!user) return;
      const previousImageUrl = user.profileImageUrl || null;
      const nextImageUrl = updatedUser.profileImageUrl || null;

      setUser({ ...user, ...updatedUser });

      // Best-effort cleanup of previous image object when image changed or removed.
      if (previousImageUrl && previousImageUrl !== nextImageUrl) {
        const previousKey = uploadService.extractStorageKey(previousImageUrl);
        if (previousKey) {
          void uploadService.deleteImage(previousKey).catch(() => {
            // Silent cleanup failure to avoid blocking profile update success.
          });
        }
      }

      message.success('Profile updated successfully');
      setIsEditModalOpen(false);
      form.resetFields();
      setInitialImageUrl(null);
      setPendingProfileImageUrl(null);
      setImagePreview(null);
      setLatestUploadedImageKey(null);
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const handleOpenEditModal = () => {
    if (!user) return;
    const currentImage = user.profileImageUrl || null;
    form.setFieldsValue({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phoneNumber || '',
    });
    setInitialImageUrl(currentImage);
    setPendingProfileImageUrl(currentImage);
    setImagePreview(currentImage);
    setLatestUploadedImageKey(null);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    if (
      latestUploadedImageKey &&
      pendingProfileImageUrl &&
      pendingProfileImageUrl !== initialImageUrl
    ) {
      void uploadService.deleteImage(latestUploadedImageKey).catch(() => {
        // Ignore cleanup errors when user closes modal without saving.
      });
    }

    setIsEditModalOpen(false);
    form.resetFields();
    setInitialImageUrl(null);
    setPendingProfileImageUrl(null);
    setImagePreview(null);
    setLatestUploadedImageKey(null);
  };

  const handleImageUpload = async (file: File) => {
    const mimeType = (file.type || '').toLowerCase().trim();
    if (!isAllowedUploadImageMimeType(mimeType)) {
      message.error('Please upload a valid image file (JPG or PNG only).');
      return Upload.LIST_IGNORE;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      message.error(`Image must be ${MAX_IMAGE_SIZE_MB}MB or smaller.`);
      return Upload.LIST_IGNORE;
    }

    try {
      setImageUploading(true);
      const result = await uploadService.uploadImage(file, 'users');
      const uploadedUrl = result.url.trim();
      const uploadedKey = result.key.trim();

      if (!uploadedUrl || !uploadedKey) {
        throw new Error('Invalid upload response from server.');
      }

      // Cleanup temporary image uploaded in this modal session when replacing it.
      if (latestUploadedImageKey && latestUploadedImageKey !== uploadedKey) {
        await uploadService.deleteImage(latestUploadedImageKey).catch(() => {
          // Ignore cleanup errors; latest image still applies.
        });
      }

      setLatestUploadedImageKey(uploadedKey);
      setImagePreview(uploadedUrl);
      setPendingProfileImageUrl(uploadedUrl);
      message.success('Image uploaded. Click Save Changes to update your profile.');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Image upload failed. Please try again.';
      message.error(errorMessage);
    } finally {
      setImageUploading(false);
    }

    return Upload.LIST_IGNORE;
  };

  const handleRemoveImage = async () => {
    if (
      latestUploadedImageKey &&
      pendingProfileImageUrl &&
      pendingProfileImageUrl !== initialImageUrl
    ) {
      await uploadService.deleteImage(latestUploadedImageKey).catch(() => {
        // Ignore cleanup errors and still allow removing selection from UI.
      });
      setLatestUploadedImageKey(null);
    }

    setImagePreview(null);
    setPendingProfileImageUrl(null);
  };

  const handleUpdateProfile = async () => {
    try {
      const values = await form.validateFields();
      updateProfileMutation.mutate(values);
    } catch {
      // Form validation errors are displayed inline by Ant Design
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <Title level={3} className="!mb-2">
          Profile not available
        </Title>
        <Text type="secondary">Please login again to view your profile.</Text>
        <div className="mt-6">
          <Button type="primary" onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Title level={2} className="!mb-1">
            Profile
          </Title>
          <Text type="secondary">Your account details</Text>
        </div>
        <Button type="primary" icon={<EditOutlined />} onClick={handleOpenEditModal}>
          Update Details
        </Button>
      </div>

      <Card>
        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label="Profile Image">
            {user.profileImageUrl ? (
              <Image
                src={user.profileImageUrl}
                width={96}
                height={96}
                className="rounded-lg object-cover"
                preview={{ mask: null }}
              />
            ) : (
              <Avatar size={96} icon={<UserOutlined />} style={{ backgroundColor: '#16a34a' }} />
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Name">{formatUserName(user)}</Descriptions.Item>
          <Descriptions.Item label="Email">
            <div className="flex items-center gap-2">
              <span>{user.email}</span>
              {user.emailVerified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-green-300 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                  <CheckCircleFilled />
                  Verified
                </span>
              )}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="Role">{user.role}</Descriptions.Item>
          <Descriptions.Item label="Phone">{user.phoneNumber || 'Not provided'}</Descriptions.Item>
          <Descriptions.Item label="Last Login">
            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Not available'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Modal
        title="Update Profile Details"
        open={isEditModalOpen}
        onCancel={handleCloseEditModal}
        onOk={handleUpdateProfile}
        okText="Save Changes"
        confirmLoading={updateProfileMutation.isPending}
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item label="Profile Image">
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  width={88}
                  height={88}
                  className="rounded-lg object-cover"
                  preview={{ mask: 'View' }}
                />
              ) : (
                <Avatar size={88} icon={<UserOutlined />} style={{ backgroundColor: '#16a34a' }} />
              )}

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

                <Button
                  icon={<DeleteOutlined />}
                  danger
                  onClick={handleRemoveImage}
                  disabled={!imagePreview}
                >
                  Remove Image
                </Button>
              </div>
            </div>
          </Form.Item>
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[
              { required: true, message: 'Please enter first name' },
              { min: 1, message: 'First name must be at least 1 character' },
              { max: 255, message: 'First name must be 255 characters or less' },
            ]}
          >
            <Input placeholder="Enter first name" />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[
              { required: true, message: 'Please enter last name' },
              { min: 1, message: 'Last name must be at least 1 character' },
              { max: 255, message: 'Last name must be 255 characters or less' },
            ]}
          >
            <Input placeholder="Enter last name" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[
              {
                validator: (_, value: string | undefined) => {
                  if (isValidIndianPhone(value)) return Promise.resolve();
                  return Promise.reject(
                    new Error('Enter a valid mobile or landline number (optional +91).'),
                  );
                },
              },
            ]}
          >
            <Input placeholder="e.g., 9876543210 or 02212345678" maxLength={16} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
