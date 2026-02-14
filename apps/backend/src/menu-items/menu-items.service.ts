import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuItemsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private readonly CACHE_KEY_PREFIX = 'menuitems:';
  private readonly CACHE_KEY_BY_MEAL_PLAN = 'menuitems:mealplan:';
  private readonly CACHE_TTL = 600; // 10 minutes

  /**
   * Create a new menu item (Admin only)
   */
  async create(createMenuItemDto: CreateMenuItemDto) {
    // Verify meal plan exists
    const mealPlan = await this.prisma.mealPlan.findUnique({
      where: { id: createMenuItemDto.mealPlanId },
    });

    if (!mealPlan) {
      throw new BadRequestException('Meal plan not found');
    }

    const { mealPlanId, ...rest } = createMenuItemDto;
    const menuItem = await this.prisma.menuItem.create({
      data: {
        ...rest,
        mealPlan: { connect: { id: mealPlanId } },
      },
      include: {
        mealPlan: {
          select: {
            id: true,
            name: true,
            school: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Invalidate cache
    await this.cacheManager.del(`${this.CACHE_KEY_BY_MEAL_PLAN}${createMenuItemDto.mealPlanId}`);
    await this.cacheManager.del(`mealplans:${createMenuItemDto.mealPlanId}`); // Also invalidate meal plan cache

    return menuItem;
  }

  /**
   * Get all menu items for a meal plan with caching
   */
  async findByMealPlan(mealPlanId: string) {
    const cacheKey = `${this.CACHE_KEY_BY_MEAL_PLAN}${mealPlanId}`;

    // Try to get from cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        mealPlanId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        allergenInfo: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Store in cache
    await this.cacheManager.set(cacheKey, menuItems, this.CACHE_TTL);

    return menuItems;
  }

  /**
   * Get menu item by ID
   */
  async findOne(id: string) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id, deletedAt: null },
      include: {
        mealPlan: {
          select: {
            id: true,
            name: true,
            pricePerDay: true,
            currency: true,
            school: {
              select: {
                id: true,
                name: true,
                city: true,
              },
            },
          },
        },
      },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    return menuItem;
  }

  /**
   * Update menu item (Admin only)
   */
  async update(id: string, updateMenuItemDto: UpdateMenuItemDto) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id, deletedAt: null },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    const updated = await this.prisma.menuItem.update({
      where: { id },
      data: updateMenuItemDto,
      include: {
        mealPlan: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Invalidate cache
    await this.cacheManager.del(`${this.CACHE_KEY_BY_MEAL_PLAN}${menuItem.mealPlanId}`);
    await this.cacheManager.del(`mealplans:${menuItem.mealPlanId}`);

    return updated;
  }

  /**
   * Soft delete menu item (Admin only)
   */
  async remove(id: string) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id, deletedAt: null },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    await this.prisma.menuItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Invalidate cache
    await this.cacheManager.del(`${this.CACHE_KEY_BY_MEAL_PLAN}${menuItem.mealPlanId}`);
    await this.cacheManager.del(`mealplans:${menuItem.mealPlanId}`);

    return { message: 'Menu item deleted successfully' };
  }
}
