import { useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Checkbox } from 'antd';
import type { InputRef } from 'antd';
import { UserOutlined, LockOutlined, CoffeeOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services';
import { useAuthStore } from '@/stores/authStore';
import { LoginRequest, UserRole } from '@/types';
import { Controller, useForm } from 'react-hook-form';

const { Title, Text } = Typography;

type LoginFormValues = LoginRequest & { rememberMe: boolean };

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, rememberMe: storedRememberMe } = useAuthStore();
  const passwordRef = useRef<InputRef>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: storedRememberMe ?? true,
    },
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormValues) =>
      authService.login({ email: data.email, password: data.password }),
    onSuccess: (data, variables) => {
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
        variables.rememberMe,
      );
      message.success(`Welcome back, ${data.user.fullName || 'Admin'}!`);
      navigate(from, { replace: true });
    },
    onError: () => {
      message.error('The username or password you entered is incorrect. Please try again.');
      passwordRef.current?.input?.select();
    },
  });

  const onSubmit = (values: LoginFormValues) => {
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
        <Form layout="vertical" size="large" requiredMark={false} component={false}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Form.Item
              label="Email"
              validateStatus={errors.email ? 'error' : ''}
              help={errors.email?.message}
            >
              <Controller
                name="email"
                control={control}
                rules={{
                  required: 'Please enter your email',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Please enter a valid email',
                  },
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    prefix={<UserOutlined className="text-gray-400" />}
                    placeholder="admin@schooltiffin.com"
                    autoComplete="email"
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Password"
              validateStatus={errors.password ? 'error' : ''}
              help={errors.password?.message}
            >
              <Controller
                name="password"
                control={control}
                rules={{
                  required: 'Please enter your password',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
                }}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    ref={passwordRef}
                    prefix={<LockOutlined className="text-gray-400" />}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                )}
              />
            </Form.Item>

            <Form.Item>
              <div className="flex items-center justify-between">
                <Controller
                  name="rememberMe"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onChange={e => field.onChange(e.target.checked)}
                    >
                      Remember me
                    </Checkbox>
                  )}
                />
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
          </form>
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
