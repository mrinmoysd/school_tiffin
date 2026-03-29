import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCmsPageDto, UpdateCmsPageDto } from './dto';

@Injectable()
export class CmsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private readonly CACHE_KEY_PREFIX = 'cms:';
  private readonly CACHE_TTL = 3600; // 1 hour

  /**
   * Create CMS page (Admin only)
   */
  async create(createCmsPageDto: CreateCmsPageDto) {
    const { slug, title, content, isPublished } = createCmsPageDto;

    // Check if slug already exists
    const existing = await this.prisma.cmsPage.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new BadRequestException('Page with this slug already exists');
    }

    const page = await this.prisma.cmsPage.create({
      data: {
        slug,
        title,
        content,
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null,
        version: 1,
      },
    });

    // Cache if published
    if (page.isPublished) {
      await this.cacheManager.set(`${this.CACHE_KEY_PREFIX}${slug}`, page, this.CACHE_TTL);
    }

    return page;
  }

  /**
   * Get published page by slug (Public)
   */
  async findBySlug(slug: string) {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${slug}`;

    // Try cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database
    const page = await this.prisma.cmsPage.findUnique({
      where: { slug, isPublished: true },
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        isPublished: true,
        version: true,
        publishedAt: true,
        updatedAt: true,
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    // Cache the result
    await this.cacheManager.set(cacheKey, page, this.CACHE_TTL);

    return page;
  }

  /**
   * Get all pages (Admin only)
   */
  async findAll(includeUnpublished = false) {
    const pages = await this.prisma.cmsPage.findMany({
      where: includeUnpublished ? {} : { isPublished: true },
      select: {
        id: true,
        slug: true,
        title: true,
        isPublished: true,
        version: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return pages;
  }

  /**
   * Update CMS page (Admin only)
   */
  async update(slug: string, updateCmsPageDto: UpdateCmsPageDto) {
    const page = await this.prisma.cmsPage.findUnique({
      where: { slug },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    const publishStatusChanged = typeof updateCmsPageDto.isPublished === 'boolean';

    const updated = await this.prisma.cmsPage.update({
      where: { slug },
      data: {
        ...updateCmsPageDto,
        publishedAt: publishStatusChanged
          ? updateCmsPageDto.isPublished
            ? page.publishedAt || new Date()
            : null
          : page.publishedAt,
        version: page.version + 1,
      },
    });

    // Invalidate cache
    await this.cacheManager.del(`${this.CACHE_KEY_PREFIX}${slug}`);

    return updated;
  }

  /**
   * Publish/unpublish page (Admin only)
   */
  async togglePublish(slug: string) {
    const page = await this.prisma.cmsPage.findUnique({
      where: { slug },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    const updated = await this.prisma.cmsPage.update({
      where: { slug },
      data: {
        isPublished: !page.isPublished,
        publishedAt: !page.isPublished ? new Date() : page.publishedAt,
      },
    });

    // Invalidate cache
    await this.cacheManager.del(`${this.CACHE_KEY_PREFIX}${slug}`);

    return updated;
  }

  /**
   * Delete CMS page (Admin only)
   */
  async remove(slug: string) {
    const page = await this.prisma.cmsPage.findUnique({
      where: { slug },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    await this.prisma.cmsPage.delete({
      where: { slug },
    });

    // Invalidate cache
    await this.cacheManager.del(`${this.CACHE_KEY_PREFIX}${slug}`);

    return { message: 'Page deleted successfully' };
  }
}
