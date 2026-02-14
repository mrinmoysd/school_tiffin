import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';

@Injectable()
export class SchoolsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private readonly CACHE_KEY_ALL = 'schools:all';
  private readonly CACHE_KEY_PREFIX = 'schools:';
  private readonly CACHE_TTL = 300; // 5 minutes

  /**
   * Create a new school (Admin only)
   */
  async create(createSchoolDto: CreateSchoolDto) {
    const school = await this.prisma.school.create({
      data: createSchoolDto,
    });

    // Invalidate cache
    await this.cacheManager.del(this.CACHE_KEY_ALL);

    return school;
  }

  /**
   * Get all schools with caching and filters
   */
  async findAll(city?: string) {
    const cacheKey = city ? `${this.CACHE_KEY_ALL}:city:${city}` : this.CACHE_KEY_ALL;

    // Try to get from cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database
    const schools = await this.prisma.school.findMany({
      where: {
        ...(city && { city }),
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        contactPhone: true,
        contactEmail: true,
        operatingDays: true,
        isServiceAvailable: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Store in cache
    await this.cacheManager.set(cacheKey, schools, this.CACHE_TTL);

    return schools;
  }

  /**
   * Get school by ID with caching
   */
  async findOne(id: string) {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${id}`;

    // Try to get from cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database
    const school = await this.prisma.school.findUnique({
      where: { id, deletedAt: null },
      include: {
        mealPlans: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            pricePerDay: true,
            currency: true,
            isActive: true,
          },
        },
      },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    // Store in cache
    await this.cacheManager.set(cacheKey, school, this.CACHE_TTL);

    return school;
  }

  /**
   * Update school (Admin only)
   */
  async update(id: string, updateSchoolDto: UpdateSchoolDto) {
    const school = await this.prisma.school.findUnique({
      where: { id, deletedAt: null },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const updated = await this.prisma.school.update({
      where: { id },
      data: updateSchoolDto,
    });

    // Invalidate cache
    await this.cacheManager.del(this.CACHE_KEY_ALL);
    await this.cacheManager.del(`${this.CACHE_KEY_PREFIX}${id}`);

    return updated;
  }

  /**
   * Update service availability (Admin only)
   */
  async updateServiceAvailability(id: string, isServiceAvailable: boolean) {
    const school = await this.prisma.school.findUnique({
      where: { id, deletedAt: null },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const updated = await this.prisma.school.update({
      where: { id },
      data: { isServiceAvailable },
    });

    // Invalidate cache
    await this.cacheManager.del(this.CACHE_KEY_ALL);
    await this.cacheManager.del(`${this.CACHE_KEY_PREFIX}${id}`);

    return updated;
  }

  /**
   * Soft delete school (Admin only)
   */
  async remove(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id, deletedAt: null },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    await this.prisma.school.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Invalidate cache
    await this.cacheManager.del(this.CACHE_KEY_ALL);
    await this.cacheManager.del(`${this.CACHE_KEY_PREFIX}${id}`);

    return { message: 'School deleted successfully' };
  }
}
