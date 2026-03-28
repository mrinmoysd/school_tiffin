import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeImageReferencePath } from '../uploads/upload-storage.util';
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

  private normalizeTypeCode(code: string): string {
    return code.trim().toUpperCase().replace(/\s+/g, '_');
  }

  private withLegacyPlanType<T extends { mealPlanType?: { code: string } | null }>(mealPlan: T) {
    return {
      ...mealPlan,
      planType: mealPlan.mealPlanType?.code ?? null,
    };
  }

  private async resolveMealPlanTypeId(mealPlanTypeId?: string, planType?: string) {
    if (mealPlanTypeId) {
      const mealPlanType = await this.prisma.mealPlanTypeMaster.findUnique({
        where: { id: mealPlanTypeId, deletedAt: null },
      });

      if (!mealPlanType) {
        throw new BadRequestException('Meal plan type not found');
      }

      return mealPlanType.id;
    }

    if (planType) {
      const normalizedCode = this.normalizeTypeCode(planType);
      const mealPlanType = await this.prisma.mealPlanTypeMaster.findUnique({
        where: { code: normalizedCode, deletedAt: null },
      });

      if (!mealPlanType) {
        throw new BadRequestException('Meal plan type not found');
      }

      return mealPlanType.id;
    }

    throw new BadRequestException('Meal plan type is required');
  }

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

    const { schoolId, mealPlanTypeId, planType, ...rest } = createMealPlanDto;
    const resolvedMealPlanTypeId = await this.resolveMealPlanTypeId(mealPlanTypeId, planType);
    const normalizedImageUrl =
      createMealPlanDto.imageUrl === undefined
        ? undefined
        : normalizeImageReferencePath(createMealPlanDto.imageUrl);

    const mealPlan = await this.prisma.mealPlan.create({
      data: {
        ...rest,
        ...(createMealPlanDto.imageUrl !== undefined ? { imageUrl: normalizedImageUrl } : {}),
        school: { connect: { id: schoolId } },
        mealPlanType: { connect: { id: resolvedMealPlanTypeId } },
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        mealPlanType: {
          select: {
            id: true,
            code: true,
            displayName: true,
            isActive: true,
          },
        },
      },
    });

    // Invalidate cache
    await this.cacheManager.del(`${this.CACHE_KEY_BY_SCHOOL}${createMealPlanDto.schoolId}`);

    return this.withLegacyPlanType(mealPlan);
  }

  /**
   * Get all meal plans with optional filters
   *
   * - schoolId: filter by school (optional)
   * - isActive: filter by active status (optional)
   * - mealPlanTypeId / planType: filter by meal plan type (optional)
   * - search: case-insensitive search on name (optional)
   */
  async findAll(
    schoolId?: string,
    isActive?: boolean,
    mealPlanTypeId?: string,
    planType?: string,
    search?: string,
  ) {
    let resolvedMealPlanTypeId = mealPlanTypeId;

    if (!resolvedMealPlanTypeId && planType) {
      const normalizedCode = this.normalizeTypeCode(planType);
      const mealPlanType = await this.prisma.mealPlanTypeMaster.findUnique({
        where: { code: normalizedCode, deletedAt: null },
        select: { id: true },
      });

      if (!mealPlanType) {
        return [];
      }

      resolvedMealPlanTypeId = mealPlanType.id;
    }

    const cacheKey = `${this.CACHE_KEY_BY_SCHOOL}${schoolId || 'all'}:${isActive !== undefined ? isActive : 'all'}:${
      resolvedMealPlanTypeId || planType || 'all'
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
        ...(resolvedMealPlanTypeId && { mealPlanTypeId: resolvedMealPlanTypeId }),
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
        mealPlanType: {
          select: {
            id: true,
            code: true,
            displayName: true,
            isActive: true,
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

    const response = mealPlans.map(mealPlan => this.withLegacyPlanType(mealPlan));

    // Store in cache
    await this.cacheManager.set(cacheKey, response, this.CACHE_TTL);

    return response;
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
        mealPlanType: {
          select: {
            id: true,
            code: true,
            displayName: true,
            isActive: true,
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

    const response = this.withLegacyPlanType(mealPlan);

    // Store in cache
    await this.cacheManager.set(cacheKey, response, this.CACHE_TTL);

    return response;
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

    const { schoolId, mealPlanTypeId, planType, ...rest } = updateMealPlanDto;

    if (schoolId && schoolId !== mealPlan.schoolId) {
      const school = await this.prisma.school.findUnique({
        where: { id: schoolId },
      });

      if (!school) {
        throw new BadRequestException('School not found');
      }
    }

    const data: {
      school?: { connect: { id: string } };
      mealPlanType?: { connect: { id: string } };
      name?: string;
      description?: string;
      imageUrl?: string | null;
      durationDays?: number;
      pricePerDay?: number;
      totalPrice?: number;
      currency?: string;
      isActive?: boolean;
    } = {
      ...rest,
    };

    if (updateMealPlanDto.imageUrl !== undefined) {
      data.imageUrl = normalizeImageReferencePath(updateMealPlanDto.imageUrl);
    }

    if (schoolId) {
      data.school = { connect: { id: schoolId } };
    }

    if (mealPlanTypeId || planType) {
      const resolvedMealPlanTypeId = await this.resolveMealPlanTypeId(mealPlanTypeId, planType);
      data.mealPlanType = { connect: { id: resolvedMealPlanTypeId } };
    }

    const updated = await this.prisma.mealPlan.update({
      where: { id },
      data,
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        mealPlanType: {
          select: {
            id: true,
            code: true,
            displayName: true,
            isActive: true,
          },
        },
      },
    });

    // Invalidate cache
    await this.cacheManager.del(`${this.CACHE_KEY_PREFIX}${id}`);
    await this.cacheManager.del(`${this.CACHE_KEY_BY_SCHOOL}${mealPlan.schoolId}`);
    if (schoolId && schoolId !== mealPlan.schoolId) {
      await this.cacheManager.del(`${this.CACHE_KEY_BY_SCHOOL}${schoolId}`);
    }

    return this.withLegacyPlanType(updated);
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
