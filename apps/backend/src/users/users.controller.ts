import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../common/decorators';

@ApiTags('Users')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get current user profile
   */
  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve the profile of the currently authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'parent@example.com',
          phone: '+919876543210',
          firstName: 'John',
          lastName: 'Doe',
          maxStudents: 4,
          role: 'PARENT',
          isActive: true,
          phoneVerifiedAt: '2026-02-06T15:30:00.000Z',
          emailVerifiedAt: null,
          createdAt: '2026-02-06T15:30:00.000Z',
          updatedAt: '2026-02-06T15:30:00.000Z',
          lastLoginAt: '2026-02-09T10:00:00.000Z',
        },
        timestamp: '2026-02-09T10:00:00.000Z',
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
        timestamp: '2026-02-09T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        message: 'User not found',
        timestamp: '2026-02-09T10:00:00.000Z',
      },
    },
  })
  async getProfile(@CurrentUser('sub') userId: string) {
    return this.usersService.findById(userId);
  }

  /**
   * Update current user profile
   */
  @Patch('me')
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Update profile information of the currently authenticated user. Can update name, email, and phone.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'updated@example.com',
          phone: '+919876543210',
          firstName: 'John',
          lastName: 'Updated Doe',
          maxStudents: 4,
          role: 'PARENT',
          isActive: true,
          phoneVerifiedAt: '2026-02-06T15:30:00.000Z',
          emailVerifiedAt: null,
          createdAt: '2026-02-06T15:30:00.000Z',
          updatedAt: '2026-02-09T10:05:00.000Z',
        },
        timestamp: '2026-02-09T10:05:00.000Z',
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
        errors: ['email must be a valid email'],
        timestamp: '2026-02-09T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email or phone already in use',
    schema: {
      example: {
        success: false,
        statusCode: 409,
        message: 'Email already in use',
        timestamp: '2026-02-09T10:00:00.000Z',
      },
    },
  })
  async updateProfile(@CurrentUser('sub') userId: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(userId, updateUserDto);
  }
}
