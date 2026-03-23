import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get user profile by ID
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        fullName: true,
        role: true,
        isActive: true,
        phoneVerifiedAt: true,
        profileImageUrl: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async update(userId: string, updateUserDto: UpdateUserDto) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check email uniqueness if email is being updated
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    // Check phone uniqueness if phone is being updated
    if (updateUserDto.phone && updateUserDto.phone !== user.phoneNumber) {
      const existingUser = await this.prisma.user.findFirst({
        where: { phoneNumber: updateUserDto.phone },
      });

      if (existingUser) {
        throw new ConflictException('Phone number already in use');
      }
    }

    // Map DTO fields to Prisma user model fields
    const data: {
      fullName?: string;
      email?: string;
      phoneNumber?: string;
      profileImageUrl?: string | null;
    } = {
      ...(updateUserDto.fullName !== undefined ? { fullName: updateUserDto.fullName } : {}),
      ...(updateUserDto.email !== undefined ? { email: updateUserDto.email } : {}),
      ...(updateUserDto.phone !== undefined ? { phoneNumber: updateUserDto.phone } : {}),
      ...(updateUserDto.profileImageUrl !== undefined
        ? { profileImageUrl: updateUserDto.profileImageUrl }
        : {}),
    };

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        fullName: true,
        role: true,
        isActive: true,
        phoneVerifiedAt: true,
        profileImageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  /**
   * Get user by email
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Get user by phone
   */
  async findByPhone(phone: string) {
    return this.prisma.user.findFirst({
      where: { phoneNumber: phone },
    });
  }
}
