import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMealPlanTypeDto, UpdateMealPlanTypeDto } from './dto';

@Injectable()
export class MealPlanTypesService {
  constructor(private prisma: PrismaService) {}

  private normalizeCode(code: string): string {
    return code.trim().toUpperCase().replace(/\s+/g, '_');
  }

  async create(createMealPlanTypeDto: CreateMealPlanTypeDto) {
    const code = this.normalizeCode(createMealPlanTypeDto.code);

    const existing = await this.prisma.mealPlanTypeMaster.findUnique({
      where: { code },
    });

    if (existing && existing.deletedAt === null) {
      throw new BadRequestException('Meal plan type code already exists');
    }

    if (existing && existing.deletedAt !== null) {
      return this.prisma.mealPlanTypeMaster.update({
        where: { id: existing.id },
        data: {
          code,
          displayName: createMealPlanTypeDto.displayName,
          description: createMealPlanTypeDto.description,
          sortOrder: createMealPlanTypeDto.sortOrder ?? existing.sortOrder,
          isActive: createMealPlanTypeDto.isActive ?? true,
          deletedAt: null,
        },
      });
    }

    return this.prisma.mealPlanTypeMaster.create({
      data: {
        code,
        displayName: createMealPlanTypeDto.displayName,
        description: createMealPlanTypeDto.description,
        sortOrder: createMealPlanTypeDto.sortOrder ?? 0,
        isActive: createMealPlanTypeDto.isActive ?? true,
      },
    });
  }

  async findAll(isActive?: boolean) {
    return this.prisma.mealPlanTypeMaster.findMany({
      where: {
        deletedAt: null,
        ...(typeof isActive === 'boolean' && { isActive }),
      },
      orderBy: [{ sortOrder: 'asc' }, { displayName: 'asc' }],
    });
  }

  async findOne(id: string) {
    const mealPlanType = await this.prisma.mealPlanTypeMaster.findUnique({
      where: { id, deletedAt: null },
    });

    if (!mealPlanType) {
      throw new NotFoundException('Meal plan type not found');
    }

    return mealPlanType;
  }

  async update(id: string, updateMealPlanTypeDto: UpdateMealPlanTypeDto) {
    const mealPlanType = await this.prisma.mealPlanTypeMaster.findUnique({
      where: { id, deletedAt: null },
    });

    if (!mealPlanType) {
      throw new NotFoundException('Meal plan type not found');
    }

    const data: UpdateMealPlanTypeDto = { ...updateMealPlanTypeDto };

    if (updateMealPlanTypeDto.code) {
      const normalizedCode = this.normalizeCode(updateMealPlanTypeDto.code);
      const existing = await this.prisma.mealPlanTypeMaster.findUnique({
        where: { code: normalizedCode },
      });

      if (existing && existing.id !== id && existing.deletedAt === null) {
        throw new BadRequestException('Meal plan type code already exists');
      }

      data.code = normalizedCode;
    }

    return this.prisma.mealPlanTypeMaster.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const mealPlanType = await this.prisma.mealPlanTypeMaster.findUnique({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: {
            mealPlans: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    if (!mealPlanType) {
      throw new NotFoundException('Meal plan type not found');
    }

    if (mealPlanType._count.mealPlans > 0) {
      throw new BadRequestException('This meal plan type is in use and cannot be deleted');
    }

    await this.prisma.mealPlanTypeMaster.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    return { message: 'Meal plan type deleted successfully' };
  }
}
