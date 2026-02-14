import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public, Roles, UserRole } from '../common/decorators';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto';
import { MenuItemsService } from './menu-items.service';

@ApiTags('Menu Items')
@Controller({ path: 'menu-items', version: '1' })
export class MenuItemsController {
  constructor(private readonly menuItemsService: MenuItemsService) {}

  /**
   * Create a new menu item (Admin only)
   */
  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new menu item',
    description: 'Admin only: Add a new menu item to a meal plan.',
  })
  @ApiResponse({ status: 201, description: 'Menu item created successfully' })
  @ApiResponse({ status: 400, description: 'Meal plan not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async create(@Body() createMenuItemDto: CreateMenuItemDto) {
    return this.menuItemsService.create(createMenuItemDto);
  }

  /**
   * Get all menu items for a meal plan (Public)
   */
  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get menu items by meal plan',
    description: 'Public endpoint: Get all menu items for a meal plan. Results are cached for 10 minutes.',
  })
  @ApiQuery({
    name: 'mealPlanId',
    required: true,
    description: 'Meal Plan UUID',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 200, description: 'Menu items retrieved successfully' })
  async findByMealPlan(@Query('mealPlanId', ParseUUIDPipe) mealPlanId: string) {
    return this.menuItemsService.findByMealPlan(mealPlanId);
  }

  /**
   * Get menu item by ID (Public)
   */
  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get menu item by ID',
    description: 'Public endpoint: Get detailed information about a specific menu item.',
  })
  @ApiParam({
    name: 'id',
    description: 'Menu Item UUID',
    example: '770e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 200, description: 'Menu item found' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.menuItemsService.findOne(id);
  }

  /**
   * Update menu item (Admin only)
   */
  @Patch(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update menu item',
    description: 'Admin only: Update menu item information.',
  })
  @ApiParam({
    name: 'id',
    description: 'Menu Item UUID',
    example: '770e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 200, description: 'Menu item updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateMenuItemDto: UpdateMenuItemDto) {
    return this.menuItemsService.update(id, updateMenuItemDto);
  }

  /**
   * Delete menu item (Admin only)
   */
  @Delete(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete menu item',
    description: 'Admin only: Soft delete a menu item.',
  })
  @ApiParam({
    name: 'id',
    description: 'Menu Item UUID',
    example: '770e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 200, description: 'Menu item deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.menuItemsService.remove(id);
  }
}
