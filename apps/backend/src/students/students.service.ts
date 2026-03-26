import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeImageReferencePath } from '../uploads/upload-storage.util';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new student
   */
  async create(parentId: string, createStudentDto: CreateStudentDto) {
    // Verify school exists
    const school = await this.prisma.school.findUnique({
      where: { id: createStudentDto.schoolId },
    });

    if (!school) {
      throw new BadRequestException('School not found');
    }

    // Check if school is active
    if (!school.isServiceAvailable) {
      throw new BadRequestException('School is not accepting registrations');
    }

    const { schoolId, profileImageUrl, imageUrl, ...rest } = createStudentDto;
    const normalizedProfileImagePath =
      profileImageUrl === undefined && imageUrl === undefined
        ? undefined
        : normalizeImageReferencePath(profileImageUrl ?? imageUrl);

    const student = await this.prisma.student.create({
      data: {
        ...rest,
        ...(profileImageUrl !== undefined || imageUrl !== undefined
          ? { profileImageUrl: normalizedProfileImagePath }
          : {}),
        parent: { connect: { id: parentId } },
        ...(schoolId && { school: { connect: { id: schoolId } } }),
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
    });

    return student;
  }

  /**
   * Get all students for a parent
   */
  async findAllByParent(parentId: string) {
    const students = await this.prisma.student.findMany({
      where: {
        parentId,
        deletedAt: null,
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return students;
  }

  /**
   * Get student by ID
   */
  async findOne(id: string, parentId: string) {
    const student = await this.prisma.student.findFirst({
      where: {
        id,
        parentId,
        deletedAt: null,
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
            operatingDays: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  /**
   * Update student
   */
  async update(id: string, parentId: string, updateStudentDto: UpdateStudentDto) {
    // Check ownership
    const existingStudent = await this.prisma.student.findFirst({
      where: {
        id,
        parentId,
        deletedAt: null,
      },
    });

    if (!existingStudent) {
      throw new NotFoundException('Student not found');
    }

    // If updating school, verify it exists
    if (updateStudentDto.schoolId) {
      const school = await this.prisma.school.findUnique({
        where: { id: updateStudentDto.schoolId },
      });

      if (!school) {
        throw new BadRequestException('School not found');
      }

      if (!school.isServiceAvailable) {
        throw new BadRequestException('School is not accepting registrations');
      }
    }

    const { schoolId, profileImageUrl, imageUrl, ...rest } = updateStudentDto;
    const normalizedProfileImagePath =
      profileImageUrl === undefined && imageUrl === undefined
        ? undefined
        : normalizeImageReferencePath(profileImageUrl ?? imageUrl);

    const updatedStudent = await this.prisma.student.update({
      where: { id },
      data: {
        ...rest,
        ...(profileImageUrl !== undefined || imageUrl !== undefined
          ? { profileImageUrl: normalizedProfileImagePath }
          : {}),
        ...(schoolId !== undefined && {
          school: schoolId ? { connect: { id: schoolId } } : { disconnect: true },
        }),
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
    });

    return updatedStudent;
  }

  /**
   * Soft delete student
   */
  async remove(id: string, parentId: string) {
    // Check ownership
    const student = await this.prisma.student.findFirst({
      where: {
        id,
        parentId,
        deletedAt: null,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Check if student has active subscriptions
    const activeSubscriptions = await this.prisma.subscription.count({
      where: {
        studentId: id,
        status: 'ACTIVE',
      },
    });

    if (activeSubscriptions > 0) {
      throw new BadRequestException('Cannot delete student with active subscriptions');
    }

    // Soft delete
    await this.prisma.student.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: 'Student deleted successfully' };
  }
}
