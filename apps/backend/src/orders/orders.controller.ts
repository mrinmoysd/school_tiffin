import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CurrentUser } from '../common/decorators';
import { OrderStatus } from '@prisma/client';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Get all orders for current parent
   */
  @Get()
  @ApiOperation({
    summary: 'Get all orders',
    description: 'List all orders for the authenticated parent.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: OrderStatus,
    description: 'Filter by order status',
  })
  @ApiResponse({ status: 200, description: 'Orders list retrieved successfully' })
  async findAll(
    @CurrentUser('sub') parentId: string,
    @Query('status') status?: OrderStatus,
  ) {
    return this.ordersService.findAllByParent(parentId, status);
  }

  /**
   * Get order by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get order by ID',
    description: 'Get detailed information about a specific order including transaction history.',
  })
  @ApiParam({
    name: 'id',
    description: 'Order UUID',
  })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('sub') parentId: string) {
    return this.ordersService.findOne(id, parentId);
  }
}
