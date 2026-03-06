import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public, Roles, UserRole } from '../common/decorators';
import { CreateSchoolDto, UpdateSchoolDto } from './dto';
import { SchoolsService } from './schools.service';

@ApiTags('Schools')
@Controller({ path: 'schools', version: '1' })
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  /**
   * Create a new school (Admin only)
   */
  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new school',
    description: 'Admin only: Add a new school to the platform.',
  })
  @ApiResponse({
    status: 201,
    description: 'School created successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async create(@Body() createSchoolDto: CreateSchoolDto) {
    return this.schoolsService.create(createSchoolDto);
  }

  /**
   * Get all schools (Public)
   */
  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get all schools',
    description:
      'Public endpoint: List all schools with optional city filter. Results are cached for 5 minutes.',
  })
  @ApiQuery({
    name: 'city',
    required: false,
    description: 'Filter schools by city',
    example: 'Mumbai',
  })
  @ApiResponse({
    status: 200,
    description: 'Schools list retrieved successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'ABC Public School',
            address: '123 Main Street, Mumbai',
            city: 'Mumbai',
            contactPhone: '+912212345678',
            contactEmail: 'contact@abcschool.edu',
            operatingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
            isServiceAvailable: true,
            createdAt: '2026-02-09T10:00:00.000Z',
          },
        ],
        timestamp: '2026-02-09T10:00:00.000Z',
      },
    },
  })
  async findAll(
    @Query('city') city?: string,
    @Query('search') search?: string,
    @Query('isServiceAvailable') isServiceAvailableRaw?: string,
  ) {
    const isServiceAvailable =
      typeof isServiceAvailableRaw === 'string'
        ? isServiceAvailableRaw.toLowerCase() === 'true'
          ? true
          : isServiceAvailableRaw.toLowerCase() === 'false'
            ? false
            : undefined
        : undefined;
    return this.schoolsService.findAll(city, search, isServiceAvailable);
  }

  /**
   * Get school by ID (Public)
   */
  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get school by ID',
    description:
      'Public endpoint: Get detailed information about a specific school including available meal plans.',
  })
  @ApiParam({
    name: 'id',
    description: 'School UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'School found',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'ABC Public School',
          address: '123 Main Street, Mumbai',
          city: 'Mumbai',
          contactPhone: '+912212345678',
          contactEmail: 'contact@abcschool.edu',
          operatingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
          isServiceAvailable: true,
          mealPlans: [
            {
              id: '660e8400-e29b-41d4-a716-446655440000',
              name: 'Standard Meal Plan',
              description: 'Healthy and nutritious meals',
              pricePerDay: 100,
              currency: 'INR',
              isActive: true,
            },
          ],
          createdAt: '2026-02-09T10:00:00.000Z',
        },
        timestamp: '2026-02-09T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'School not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolsService.findOne(id);
  }

  /**
   * Update school (Admin only)
   */
  @Patch(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update school',
    description: 'Admin only: Update school information.',
  })
  @ApiParam({
    name: 'id',
    description: 'School UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'School updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({
    status: 404,
    description: 'School not found',
  })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateSchoolDto: UpdateSchoolDto) {
    return this.schoolsService.update(id, updateSchoolDto);
  }

  /**
   * Update service availability (Admin only)
   */
  @Patch(':id/service-availability')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update service availability',
    description: 'Admin only: Enable or disable service for a school.',
  })
  @ApiParam({
    name: 'id',
    description: 'School UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Service availability updated',
  })
  async updateServiceAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isServiceAvailable') isServiceAvailable: boolean,
  ) {
    return this.schoolsService.updateServiceAvailability(id, isServiceAvailable);
  }

  /**
   * Delete school (Admin only)
   */
  @Delete(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete school',
    description: 'Admin only: Soft delete a school.',
  })
  @ApiParam({
    name: 'id',
    description: 'School UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'School deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolsService.remove(id);
  }
}
