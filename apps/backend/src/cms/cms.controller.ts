import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseBoolPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CmsService } from './cms.service';
import { CreateCmsPageDto, UpdateCmsPageDto } from './dto';
import { Public, Roles, UserRole } from '../common/decorators';

@ApiTags('CMS')
@Controller({ path: 'cms', version: '1' })
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  /**
   * Create CMS page (Admin only)
   */
  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: '[Admin] Create CMS page',
    description: 'Create a new CMS page. Can be published immediately or saved as draft.',
  })
  @ApiResponse({ status: 201, description: 'Page created successfully' })
  @ApiResponse({ status: 400, description: 'Page with this slug already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async create(@Body() createCmsPageDto: CreateCmsPageDto) {
    return this.cmsService.create(createCmsPageDto);
  }

  /**
   * Get all pages (Admin) or published pages (Public)
   */
  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get all CMS pages',
    description: 'Get all published pages (public) or all pages including unpublished (admin with query param).',
  })
  @ApiQuery({
    name: 'includeUnpublished',
    required: false,
    type: Boolean,
    description: 'Include unpublished pages (admin only)',
  })
  @ApiResponse({ status: 200, description: 'Pages retrieved successfully' })
  async findAll(@Query('includeUnpublished', new ParseBoolPipe({ optional: true })) includeUnpublished?: boolean) {
    return this.cmsService.findAll(includeUnpublished);
  }

  /**
   * Get published page by slug (Public)
   */
  @Get(':slug')
  @Public()
  @ApiOperation({
    summary: 'Get CMS page by slug',
    description: 'Get published page content by slug. Cached for 1 hour.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Page slug',
    example: 'about-us',
  })
  @ApiResponse({ status: 200, description: 'Page found' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async findOne(@Param('slug') slug: string) {
    return this.cmsService.findBySlug(slug);
  }

  /**
   * Update CMS page (Admin only)
   */
  @Patch(':slug')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: '[Admin] Update CMS page',
    description: 'Update page content. Version is automatically incremented.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Page slug',
    example: 'about-us',
  })
  @ApiResponse({ status: 200, description: 'Page updated successfully' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async update(@Param('slug') slug: string, @Body() updateCmsPageDto: UpdateCmsPageDto) {
    return this.cmsService.update(slug, updateCmsPageDto);
  }

  /**
   * Toggle publish status (Admin only)
   */
  @Patch(':slug/publish')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: '[Admin] Toggle publish status',
    description: 'Publish or unpublish a page.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Page slug',
    example: 'about-us',
  })
  @ApiResponse({ status: 200, description: 'Publish status toggled' })
  async togglePublish(@Param('slug') slug: string) {
    return this.cmsService.togglePublish(slug);
  }

  /**
   * Delete CMS page (Admin only)
   */
  @Delete(':slug')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: '[Admin] Delete CMS page',
    description: 'Permanently delete a CMS page.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Page slug',
    example: 'about-us',
  })
  @ApiResponse({ status: 200, description: 'Page deleted successfully' })
  async remove(@Param('slug') slug: string) {
    return this.cmsService.remove(slug);
  }
}
