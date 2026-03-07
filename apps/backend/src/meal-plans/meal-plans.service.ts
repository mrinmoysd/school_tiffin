import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { MealPlanType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMealPlanDto, UpdateMealPlanDto } from './dto';

@Injectable()
export class MealPlansService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private readonly CACHE_KEY_PREFIX = 'mealplans:';
  private readonly CACHE_KEY_BY_SCHOOL = 'mealplans:school:';
  private readonly CACHE_TTL = 300; // 5 minutes

  /**
   * Create a new meal plan (Admin only)
   */
  async create(createMealPlanDto: CreateMealPlanDto) {
    // Verify school exists
    const school = await this.prisma.school.findUnique({
      where: { id: createMealPlanDto.schoolId },
    });

    if (!school) {
      throw new BadRequestException('School not found');
    }

    const { schoolId, ...rest } = createMealPlanDto;
    const mealPlan = await this.prisma.mealPlan.create({
      data: {
        ...rest,
        school: { connect: { id: schoolId } },
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Invalidate cache
    await this.cacheManager.del(`${this.CACHE_KEY_BY_SCHOOL}${createMealPlanDto.schoolId}`);

    return mealPlan;
  }

  /**
   * Get all meal plans with optional filters
   *
   * - schoolId: filter by school (optional)
   * - isActive: filter by active status (optional)
   * - planType: filter by meal plan type (optional)
   * - search: case-insensitive search on name (optional)
   */
  async findAll(schoolId?: string, isActive?: boolean, planType?: MealPlanType, search?: string) {
    const cacheKey = `${this.CACHE_KEY_BY_SCHOOL}${schoolId || 'all'}:${isActive !== undefined ? isActive : 'all'}:${
      planType || 'all'
    }:${search || 'all'}`;

    // Try to get from cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database
    const mealPlans = await this.prisma.mealPlan.findMany({
      where: {
        ...(schoolId && { schoolId }),
        ...(isActive !== undefined && { isActive }),
        ...(planType && { planType }),
        ...(search && {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        }),
        deletedAt: null,
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        menuItems: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            dayOfWeek: true,
            dayNumber: true,
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Store in cache
    await this.cacheManager.set(cacheKey, mealPlans, this.CACHE_TTL);

    return mealPlans;
  }

  /**
   * Get meal plan by ID with menu items
   */
  async findOne(id: string) {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${id}`;

    // Try to get from cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database
    const mealPlan = await this.prisma.mealPlan.findUnique({
      where: { id, deletedAt: null },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
          },
        },
        menuItems: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            dayOfWeek: true,
            dayNumber: true,
            items: true,
            description: true,
            calories: true,
            allergenInfo: true,
            imageUrl: true,
          },
          orderBy: [{ dayNumber: 'asc' }, { dayOfWeek: 'asc' }],
        },
      },
    });

    if (!mealPlan) {
      throw new NotFoundException('Meal plan not found');
    }

    // Store in cache
    await this.cacheManager.set(cacheKey, mealPlan, this.CACHE_TTL);

    return mealPlan;
  }

  /**
   * Update meal plan (Admin only)
   */
  async update(id: string, updateMealPlanDto: UpdateMealPlanDto) {
    const mealPlan = await this.prisma.mealPlan.findUnique({
      where: { id, deletedAt: null },
    });

    if (!mealPlan) {
      throw new NotFoundException('Meal plan not found');
    }

    const updated = await this.prisma.mealPlan.update({
      where: { id },
      data: updateMealPlanDto,
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Invalidate cache
    await this.cacheManager.del(`${this.CACHE_KEY_PREFIX}${id}`);
    await this.cacheManager.del(`${this.CACHE_KEY_BY_SCHOOL}${mealPlan.schoolId}`);

    return updated;
  }

  /**
   * Soft delete meal plan (Admin only)
   */
  async remove(id: string) {
    const mealPlan = await this.prisma.mealPlan.findUnique({
      where: { id, deletedAt: null },
    });

    if (!mealPlan) {
      throw new NotFoundException('Meal plan not found');
    }

    await this.prisma.mealPlan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Invalidate cache
    await this.cacheManager.del(`${this.CACHE_KEY_PREFIX}${id}`);
    await this.cacheManager.del(`${this.CACHE_KEY_BY_SCHOOL}${mealPlan.schoolId}`);

    return { message: 'Meal plan deleted successfully' };
  }
}
