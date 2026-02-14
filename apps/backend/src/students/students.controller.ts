import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto } from './dto';
import { CurrentUser } from '../common/decorators';

@ApiTags('Students')
@ApiBearerAuth()
@Controller({ path: 'students', version: '1' })
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  /**
   * Create a new student
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new student',
    description: 'Add a student to your account. Parent can manage multiple students.',
  })
  @ApiResponse({
    status: 201,
    description: 'Student created successfully',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          fullName: 'Jane Doe',
          grade: 5,
          schoolId: '660e8400-e29b-41d4-a716-446655440000',
          parentId: '770e8400-e29b-41d4-a716-446655440000',
          school: {
            id: '660e8400-e29b-41d4-a716-446655440000',
            name: 'ABC Public School',
            city: 'Mumbai',
          },
          createdAt: '2026-02-09T10:00:00.000Z',
          updatedAt: '2026-02-09T10:00:00.000Z',
        },
        timestamp: '2026-02-09T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'School not found or inactive',
  })
  async create(@CurrentUser('sub') parentId: string, @Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(parentId, createStudentDto);
  }

  /**
   * Get all students for current parent
   */
  @Get()
  @ApiOperation({
    summary: 'Get all students',
    description: 'List all students belonging to the authenticated parent.',
  })
  @ApiResponse({
    status: 200,
    description: 'Students list retrieved successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            fullName: 'Jane Doe',
            grade: 5,
            school: {
              id: '660e8400-e29b-41d4-a716-446655440000',
              name: 'ABC Public School',
              city: 'Mumbai',
              address: '123 Main Street, Mumbai',
            },
            createdAt: '2026-02-09T10:00:00.000Z',
          },
        ],
        timestamp: '2026-02-09T10:00:00.000Z',
      },
    },
  })
  async findAll(@CurrentUser('sub') parentId: string) {
    return this.studentsService.findAllByParent(parentId);
  }

  /**
   * Get a specific student
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get student by ID',
    description: 'Get detailed information about a specific student. Only accessible by student\'s parent.',
  })
  @ApiParam({
    name: 'id',
    description: 'Student UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Student found',
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('sub') parentId: string) {
    return this.studentsService.findOne(id, parentId);
  }

  /**
   * Update a student
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update student',
    description: 'Update student information such as name, grade, or school.',
  })
  @ApiParam({
    name: 'id',
    description: 'Student UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Student updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') parentId: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentsService.update(id, parentId, updateStudentDto);
  }

  /**
   * Delete a student
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete student',
    description: 'Soft delete a student. Cannot delete if student has active subscriptions.',
  })
  @ApiParam({
    name: 'id',
    description: 'Student UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Student deleted successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          message: 'Student deleted successfully',
        },
        timestamp: '2026-02-09T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete student with active subscriptions',
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('sub') parentId: string) {
    return this.studentsService.remove(id, parentId);
  }
}
