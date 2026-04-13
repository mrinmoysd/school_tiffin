import { Injectable, NotFoundException, Inject, BadRequestException } from '@nestjs/common';
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
  private readonly DASHBOARD_CACHE_KEY = 'admin:dashboard:v2';
  private readonly CACHE_TTL = 300; // 5 minutes

  private normalizeOperatingDays(operatingDays: string): string {
    const rawOperatingDays = operatingDays?.trim();
    if (!rawOperatingDays) {
      throw new BadRequestException('Operating days is required');
    }

    let days: string[];
    try {
      const parsed = JSON.parse(rawOperatingDays);
      if (!Array.isArray(parsed)) {
        throw new Error('Operating days JSON is not an array');
      }
      days = parsed;
    } catch {
      days = rawOperatingDays.split(',');
    }

    days = days.map(day => day.trim().toUpperCase()).filter(Boolean);

    const validDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    if (!days.length || !days.every(day => validDays.includes(day))) {
      throw new BadRequestException('Invalid operating days');
    }

    return days.join(',');
  }

  private normalizeCityName(city?: string): string | undefined {
    if (typeof city !== 'string') return undefined;

    const normalized = city.trim().replace(/\s+/g, ' ');
    if (!normalized) return undefined;

    return normalized
      .split(' ')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private normalizeSchoolName(name: string): string {
    const normalized = name.trim().replace(/\s+/g, ' ');

    return normalized
      .split(' ')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Create a new school (Admin only)
   */
  async create(createSchoolDto: CreateSchoolDto) {
    const school = await this.prisma.school.create({
      data: {
        ...createSchoolDto,
        name: this.normalizeSchoolName(createSchoolDto.name),
        city: this.normalizeCityName(createSchoolDto.city),
        operatingDays: this.normalizeOperatingDays(createSchoolDto.operatingDays),
      },
    });

    // Invalidate cache
    await this.cacheManager.del(this.CACHE_KEY_ALL);
    await this.cacheManager.del(this.DASHBOARD_CACHE_KEY);

    return school;
  }

  /**
   * Get all schools with caching and filters
   */
  async findAll(city?: string, search?: string, isServiceAvailable?: boolean) {
    const normalizedCityFilter = city?.trim();
    const cacheKey = `${this.CACHE_KEY_ALL}:city:${normalizedCityFilter?.toLowerCase() || ''}:search:${
      search || ''
    }:service:${isServiceAvailable === undefined ? 'any' : isServiceAvailable}`;

    // Try to get from cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database
    const schools = await this.prisma.school.findMany({
      where: {
        ...(normalizedCityFilter && {
          city: {
            equals: normalizedCityFilter,
            mode: 'insensitive',
          },
        }),
        ...(typeof isServiceAvailable === 'boolean' && { isServiceAvailable }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        }),
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

    const normalizedUpdate = {
      ...updateSchoolDto,
      ...(typeof updateSchoolDto.name === 'string'
        ? { name: this.normalizeSchoolName(updateSchoolDto.name) }
        : {}),
      ...(typeof updateSchoolDto.city === 'string'
        ? { city: this.normalizeCityName(updateSchoolDto.city) }
        : {}),
      ...(typeof updateSchoolDto.operatingDays === 'string'
        ? { operatingDays: this.normalizeOperatingDays(updateSchoolDto.operatingDays) }
        : {}),
    };

    const updated = await this.prisma.school.update({
      where: { id },
      data: normalizedUpdate,
    });

    // Invalidate cache
    await this.cacheManager.del(this.CACHE_KEY_ALL);
    await this.cacheManager.del(`${this.CACHE_KEY_PREFIX}${id}`);
    await this.cacheManager.del(this.DASHBOARD_CACHE_KEY);

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
    await this.cacheManager.del(this.DASHBOARD_CACHE_KEY);

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
    await this.cacheManager.del(this.DASHBOARD_CACHE_KEY);

    return { message: 'School deleted successfully' };
  }
}
