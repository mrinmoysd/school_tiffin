import { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Checkbox } from 'antd';
import type { InputRef } from 'antd';
import { UserOutlined, LockOutlined, CoffeeOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services';
import { useAuthStore } from '@/stores/authStore';
import { LoginRequest, UserRole } from '@/types';

const { Title, Text } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const [form] = Form.useForm();
  const [rememberMe, setRememberMe] = useState(true);
  const passwordRef = useRef<InputRef>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: data => {
      // Check if user is admin
      if (data.user.role !== UserRole.ADMIN && data.user.role !== UserRole.SCHOOL_ADMIN) {
        message.error('Access denied. Admin privileges required.');
        return;
      }

      // Store auth data - backend returns tokens nested in 'tokens' object
      login(
        {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.fullName || '',
          role: data.user.role as UserRole,
          isActive: true,
          emailVerified: true,
          createdAt: new Date().toISOString(),
        },
        data.tokens.accessToken,
        data.tokens.refreshToken,
      );
      message.success(`Welcome back, ${data.user.fullName || 'Admin'}!`);
      navigate(from, { replace: true });
    },
    onError: () => {
      message.error('The username or password you entered is incorrect. Please try again.');
      passwordRef.current?.input?.select();
    },
  });

  const onFinish = (values: LoginRequest) => {
    loginMutation.mutate(values);
  };

  return (
    <div className="w-full max-w-md">
      <Card className="shadow-2xl" style={{ borderRadius: 16 }} bordered={false}>
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg mb-4">
            <CoffeeOutlined className="text-white text-3xl" />
          </div>
          <Title level={2} className="!mb-1">
            School Tiffin
          </Title>
          <Text type="secondary">Admin Portal</Text>
        </div>

        {/* Login Form */}
        <Form
          name="login"
          form={form}
          onFinish={onFinish}
          layout="vertical"
          size="large"
          requiredMark={false}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="admin@schooltiffin.com"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please enter your password' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
          >
            <Input.Password
              ref={passwordRef}
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <div className="flex items-center justify-between">
              <Checkbox checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}>
                Remember me
              </Checkbox>
              <a href="#" className="text-green-600 hover:text-green-700">
                Forgot password?
              </a>
            </div>
          </Form.Item>

          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loginMutation.isPending}
              className="h-12 text-base font-medium"
              style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                border: 'none',
              }}
            >
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </Form.Item>
        </Form>

        {/* Footer */}
        <div className="text-center mt-6 pt-6 border-t border-gray-100">
          <Text type="secondary" className="text-xs">
            © 2026 School Tiffin Platform. All rights reserved.
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
