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
import { CreateMealPlanTypeDto, UpdateMealPlanTypeDto } from './dto';
import { MealPlanTypesService } from './meal-plan-types.service';

@ApiTags('Meal Plan Types')
@Controller({ path: 'meal-plan-types', version: '1' })
export class MealPlanTypesController {
  constructor(private readonly mealPlanTypesService: MealPlanTypesService) {}

  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create meal plan type',
    description: 'Admin only: Create a reusable meal plan type master entry.',
  })
  @ApiResponse({ status: 201, description: 'Meal plan type created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  create(@Body() createMealPlanTypeDto: CreateMealPlanTypeDto) {
    return this.mealPlanTypesService.create(createMealPlanTypeDto);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get meal plan types',
    description:
      'Public endpoint: Retrieve meal plan type master data. Use isActive=true to load only selectable types.',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status (true/false)',
  })
  @ApiResponse({ status: 200, description: 'Meal plan types retrieved successfully' })
  findAll(@Query('isActive') isActiveRaw?: string) {
    const isActive =
      typeof isActiveRaw === 'string'
        ? isActiveRaw.toLowerCase() === 'true'
          ? true
          : isActiveRaw.toLowerCase() === 'false'
            ? false
            : undefined
        : undefined;

    return this.mealPlanTypesService.findAll(isActive);
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get meal plan type by ID',
    description: 'Public endpoint: Fetch a specific meal plan type.',
  })
  @ApiParam({ name: 'id', description: 'Meal plan type UUID' })
  @ApiResponse({ status: 200, description: 'Meal plan type retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Meal plan type not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.mealPlanTypesService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update meal plan type',
    description: 'Admin only: Update a meal plan type master entry.',
  })
  @ApiParam({ name: 'id', description: 'Meal plan type UUID' })
  @ApiResponse({ status: 200, description: 'Meal plan type updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Meal plan type not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMealPlanTypeDto: UpdateMealPlanTypeDto,
  ) {
    return this.mealPlanTypesService.update(id, updateMealPlanTypeDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete meal plan type',
    description: 'Admin only: Soft delete a meal plan type if it is not in use.',
  })
  @ApiParam({ name: 'id', description: 'Meal plan type UUID' })
  @ApiResponse({ status: 200, description: 'Meal plan type deleted successfully' })
  @ApiResponse({ status: 400, description: 'Meal plan type is currently in use' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.mealPlanTypesService.remove(id);
  }
}
