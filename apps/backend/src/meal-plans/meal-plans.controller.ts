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
import { MealPlanType } from '@prisma/client';
import { Public, Roles, UserRole } from '../common/decorators';
import { CreateMealPlanDto, UpdateMealPlanDto } from './dto';
import { MealPlansService } from './meal-plans.service';

@ApiTags('Meal Plans')
@Controller({ path: 'meal-plans', version: '1' })
export class MealPlansController {
  constructor(private readonly mealPlansService: MealPlansService) {}

  /**
   * Create a new meal plan (Admin only)
   */
  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new meal plan',
    description: 'Admin only: Add a new meal plan to a school.',
  })
  @ApiResponse({ status: 201, description: 'Meal plan created successfully' })
  @ApiResponse({ status: 400, description: 'School not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async create(@Body() createMealPlanDto: CreateMealPlanDto) {
    return this.mealPlansService.create(createMealPlanDto);
  }

  /**
   * Get all meal plans with optional filters (Public)
   *
   * Used by:
   * - Public clients: typically provide schoolId only
   * - Admin panel: may provide schoolId, planType, search, isActive
   */
  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get meal plans',
    description:
      'Public endpoint: Get meal plans with optional filters for school, type, active status, and search. Results are cached for 5 minutes.',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    description: 'School UUID (optional)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'planType',
    required: false,
    enum: MealPlanType,
    description: 'Filter by meal plan type',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by meal plan name (case-insensitive)',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status (true/false)',
  })
  @ApiResponse({
    status: 200,
    description: 'Meal plans retrieved successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: [
          {
            id: '660e8400-e29b-41d4-a716-446655440000',
            name: 'Standard Meal Plan',
            description: 'Healthy and nutritious meals',
            pricePerDay: 10000,
            currency: 'INR',
            isActive: true,
            menuItems: [
              {
                id: '770e8400-e29b-41d4-a716-446655440000',
                name: 'Dal Rice',
                description: 'Protein-rich lentils with steamed rice',
                imageUrl: 'https://example.com/dal-rice.jpg',
              },
            ],
          },
        ],
        timestamp: '2026-02-09T10:00:00.000Z',
      },
    },
  })
  async findBySchool(
    @Query('schoolId', new ParseUUIDPipe({ optional: true })) schoolId?: string,
    @Query('planType') planType?: MealPlanType,
    @Query('search') search?: string,
    @Query('isActive') isActiveRaw?: string,
  ) {
    const isActive =
      typeof isActiveRaw === 'string'
        ? isActiveRaw.toLowerCase() === 'true'
          ? true
          : isActiveRaw.toLowerCase() === 'false'
            ? false
            : undefined
        : undefined;

    return this.mealPlansService.findAll(schoolId, isActive, planType, search);
  }

  /**
   * Get meal plan by ID (Public)
   */
  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get meal plan by ID',
    description:
      'Public endpoint: Get detailed information about a specific meal plan including menu items.',
  })
  @ApiParam({
    name: 'id',
    description: 'Meal Plan UUID',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 200, description: 'Meal plan found' })
  @ApiResponse({ status: 404, description: 'Meal plan not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.mealPlansService.findOne(id);
  }

  /**
   * Update meal plan (Admin only)
   */
  @Patch(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update meal plan',
    description: 'Admin only: Update meal plan information.',
  })
  @ApiParam({
    name: 'id',
    description: 'Meal Plan UUID',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 200, description: 'Meal plan updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Meal plan not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMealPlanDto: UpdateMealPlanDto,
  ) {
    return this.mealPlansService.update(id, updateMealPlanDto);
  }

  /**
   * Delete meal plan (Admin only)
   */
  @Delete(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete meal plan',
    description:
      'Admin only: Soft delete a meal plan. Cannot delete if there are active subscriptions.',
  })
  @ApiParam({
    name: 'id',
    description: 'Meal Plan UUID',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 200, description: 'Meal plan deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete meal plan with active subscriptions' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.mealPlansService.remove(id);
  }
}
