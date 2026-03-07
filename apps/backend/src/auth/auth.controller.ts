import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser, Public } from '../common/decorators';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, RegisterDto, SendOtpDto, VerifyOtpDto } from './dto';

@ApiTags('Authentication')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  // eslint-disable-next-line prettier/prettier
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   */
  @Public()
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Create a new user account with email and password. Returns user data and JWT tokens (access + refresh).',
  })
  @ApiBody({
    type: RegisterDto,
    description: 'User registration data',
    examples: {
      example1: {
        summary: 'Complete registration',
        value: {
          email: 'parent@example.com',
          password: 'Password123!',
          fullName: 'John Doe',
          phone: '+919876543210',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        data: {
          user: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'parent@example.com',
            fullName: 'John Doe',
            role: 'PARENT',
          },
          tokens: {
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
        timestamp: '2026-02-06T15:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email or phone already registered',
    schema: {
      example: {
        success: false,
        statusCode: 409,
        message: 'Email or phone already registered',
        timestamp: '2026-02-06T15:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        message: 'Validation failed',
        errors: [
          'email must be a valid email',
          'password must be longer than or equal to 8 characters',
        ],
        timestamp: '2026-02-06T15:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded (3 requests per hour)',
    schema: {
      example: {
        success: false,
        statusCode: 429,
        message: 'Too Many Requests',
        timestamp: '2026-02-06T15:30:00.000Z',
      },
    },
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Login with email and password
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 requests per 15 minutes
  @ApiOperation({
    summary: 'Login with email and password',
    description: 'Authenticate user with email and password. Returns user data and JWT tokens.',
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      example1: {
        summary: 'Standard login',
        value: {
          email: 'parent@example.com',
          password: 'Password123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          user: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'parent@example.com',
            fullName: 'John Doe',
            role: 'PARENT',
          },
          tokens: {
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
        timestamp: '2026-02-06T15:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or account deactivated',
    schema: {
      example: {
        success: false,
        statusCode: 401,
        message: 'Invalid credentials',
        timestamp: '2026-02-06T15:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded (5 requests per 15 minutes)',
    schema: {
      example: {
        success: false,
        statusCode: 429,
        message: 'Too Many Requests',
        timestamp: '2026-02-06T15:30:00.000Z',
      },
    },
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Refresh access token
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Get a new access token using a valid refresh token. Use when access token expires.',
  })
  @ApiBody({
    type: RefreshTokenDto,
    examples: {
      example1: {
        summary: 'Refresh token',
        value: {
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        timestamp: '2026-02-06T15:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
    schema: {
      example: {
        success: false,
        statusCode: 401,
        message: 'Invalid refresh token',
        timestamp: '2026-02-06T15:30:00.000Z',
      },
    },
  })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  /**
   * Logout (revoke refresh token)
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout and revoke refresh token',
    description: 'Logout user and revoke the refresh token. Requires authentication.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          message: 'Logged out successfully',
        },
        timestamp: '2026-02-06T15:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
    schema: {
      example: {
        success: false,
        statusCode: 401,
        message: 'Unauthorized',
        timestamp: '2026-02-06T15:30:00.000Z',
      },
    },
  })
  async logout(@CurrentUser('sub') userId: string, @Body('refreshToken') refreshToken: string) {
    return this.authService.logout(userId, refreshToken);
  }

  /**
   * Forgot password - send reset email
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Send password reset email. Returns same response whether email exists or not (security best practice).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'parent@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Reset email sent (if email exists)',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          message: 'If the email exists, a reset link has been sent',
        },
        timestamp: '2026-02-06T15:30:00.000Z',
      },
    },
  })
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  /**
   * Reset password with token
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with token',
    description: 'Reset password using the token from reset email.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        newPassword: {
          type: 'string',
          example: 'NewPassword123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          message: 'Password reset successfully',
        },
        timestamp: '2026-02-06T15:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired token',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        message: 'Invalid or expired reset token',
        timestamp: '2026-02-06T15:30:00.000Z',
      },
    },
  })
  async resetPassword(@Body('token') token: string, @Body('newPassword') newPassword: string) {
    return this.authService.resetPassword(token, newPassword);
  }

  /**
   * Change password (authenticated)
   */
  @Patch('change-password')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change password for authenticated user',
    description:
      'Change password by providing current password and new password. Requires authentication.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        currentPassword: {
          type: 'string',
          example: 'OldPassword123!',
        },
        newPassword: {
          type: 'string',
          example: 'NewPassword123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          message: 'Password changed successfully',
        },
        timestamp: '2026-02-06T15:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Current password incorrect',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        message: 'Current password is incorrect',
        timestamp: '2026-02-06T15:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      example: {
        success: false,
        statusCode: 401,
        message: 'Unauthorized',
        timestamp: '2026-02-06T15:30:00.000Z',
      },
    },
  })
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.changePassword(userId, currentPassword, newPassword);
  }

  /**
   * Get current user profile
   */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description: "Get currently authenticated user's profile data. Requires authentication.",
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          user: {
            sub: '550e8400-e29b-41d4-a716-446655440000',
            email: 'parent@example.com',
            role: 'PARENT',
          },
        },
        timestamp: '2026-02-06T15:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
    schema: {
      example: {
        success: false,
        statusCode: 401,
        message: 'User not found or inactive',
        timestamp: '2026-02-06T15:30:00.000Z',
      },
    },
  })
  getCurrentUser(@CurrentUser() user: unknown) {
    return { user };
  }

  /**
   * Send OTP to phone number
   */
  @Public()
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour
  @ApiOperation({
    summary: 'Send OTP to phone number',
    description:
      'Send a 6-digit OTP to the provided phone number. OTP expires in 5 minutes. Rate limited to 3 requests per hour.',
  })
  @ApiBody({
    type: SendOtpDto,
    examples: {
      example1: {
        summary: 'Send OTP',
        value: {
          phone: '+919876543210',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          message: 'OTP sent successfully',
          expiresIn: 300,
        },
        timestamp: '2026-02-06T15:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Rate limit exceeded or invalid phone format',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        message: 'Too many OTP requests. Please try again after 1 hour',
        timestamp: '2026-02-06T15:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests',
    schema: {
      example: {
        success: false,
        statusCode: 429,
        message: 'Too Many Requests',
        timestamp: '2026-02-06T15:30:00.000Z',
      },
    },
  })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  /**
   * Verify OTP and login/register
   */
  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 requests per 15 minutes
  @ApiOperation({
    summary: 'Verify OTP and login/register user',
    description:
      "Verify the OTP sent to phone. If user doesn't exist, auto-registers them. Returns JWT tokens. Max 3 attempts per OTP.",
  })
  @ApiBody({
    type: VerifyOtpDto,
    examples: {
      example1: {
        summary: 'Verify OTP',
        value: {
          phone: '+919876543210',
          otp: '123456',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'OTP verified, user logged in',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          user: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: '+919876543210@temp.com',
            fullName: '',
            role: 'PARENT',
          },
          tokens: {
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
        timestamp: '2026-02-06T15:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired OTP',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        message: 'Invalid OTP. 2 attempts remaining',
        timestamp: '2026-02-06T15:30:00.000Z',
      },
    },
  })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }
}
