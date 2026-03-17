import { Button, Card, Descriptions, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const { Title, Text } = Typography;

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

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
      <div className="mb-6">
        <Title level={2} className="!mb-1">
          Profile
        </Title>
        <Text type="secondary">Your account details</Text>
      </div>

      <Card>
        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label="Full Name">{user.fullName}</Descriptions.Item>
          <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
          <Descriptions.Item label="Role">{user.role}</Descriptions.Item>
          <Descriptions.Item label="Phone">{user.phoneNumber || 'Not provided'}</Descriptions.Item>
          <Descriptions.Item label="Status">
            {user.isActive ? 'Active' : 'Inactive'}
          </Descriptions.Item>
          <Descriptions.Item label="Email Verified">
            {user.emailVerified ? 'Yes' : 'No'}
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {new Date(user.createdAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Last Login">
            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Not available'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default ProfilePage;
