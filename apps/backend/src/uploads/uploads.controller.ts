import {
  Controller,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import type { Express } from 'express';
import { UploadsService } from './uploads.service';
import { CurrentUser, Roles, UserRole } from '../common/decorators';
import { sanitizeUploadFolder } from './upload-storage.util';

@ApiTags('Uploads')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller({ path: 'uploads', version: '1' })
export class UploadsController {
  private readonly ADMIN_ALLOWED_UPLOAD_TOP_LEVEL_FOLDERS = new Set([
    'app-branding',
    'cms-pages',
    'images',
    'meal-plans',
    'menu-items',
    'students',
    'users',
  ]);

  constructor(private readonly uploadsService: UploadsService) {}

  /**
   * Upload image (Admin/Parent)
   */
  @Post('image')
  @Roles(UserRole.ADMIN, UserRole.PARENT)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '[Admin/Parent] Upload image',
    description:
      'Upload an image through backend-managed Cloudinary integration. Allowed types: JPEG, PNG, WebP. Max size: 5MB. Admin uploads are restricted to approved folders; parents are restricted to profile folders.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file',
        },
        folder: {
          type: 'string',
          description: 'Storage folder (optional)',
          example: 'meal-plans',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        data: {
          url: 'https://res.cloudinary.com/demo/image/upload/v1736793442/meal-plans/3de8f7fd-53e7-4f6c-96fb-f7b84762bf6d.jpg',
          key: 'cloudinary:meal-plans/3de8f7fd-53e7-4f6c-96fb-f7b84762bf6d',
          originalName: 'meal.jpg',
          mimeType: 'image/jpeg',
          size: 245678,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Parent access required' })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
    @CurrentUser('role') role?: string,
    @CurrentUser('sub') userId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const uploadFolder =
      role === UserRole.PARENT
        ? this.resolveParentUploadFolder(folder, userId)
        : this.resolveAdminUploadFolder(folder);

    return this.uploadsService.uploadImage(file, uploadFolder);
  }

  /**
   * Delete image (Admin only)
   */
  @Delete('image')
  @ApiOperation({
    summary: '[Admin] Delete image',
    description: 'Delete an image from Cloudinary (or legacy local storage) by key/path/url.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Storage key/path/url',
          example: 'meal-plans/3de8f7fd-53e7-4f6c-96fb-f7b84762bf6d.jpg',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  async deleteImage(@Body('key') key: string) {
    if (!key) {
      throw new BadRequestException('Key is required');
    }

    return this.uploadsService.deleteImage(key);
  }

  private resolveParentUploadFolder(folder: string | undefined, userId?: string): string {
    if (!userId) {
      throw new BadRequestException('User context missing for upload');
    }

    const normalizedFolder = sanitizeUploadFolder(folder || 'users');
    const topLevelFolder = normalizedFolder.split('/')[0];

    if (topLevelFolder !== 'users' && topLevelFolder !== 'students') {
      throw new BadRequestException('Parents can upload images only to users or students folders');
    }

    return `parents/${userId}/${topLevelFolder}`;
  }

  private resolveAdminUploadFolder(folder: string | undefined): string {
    const normalizedFolder = sanitizeUploadFolder(folder || 'images');
    const topLevelFolder = normalizedFolder.split('/')[0];

    if (!this.ADMIN_ALLOWED_UPLOAD_TOP_LEVEL_FOLDERS.has(topLevelFolder)) {
      throw new BadRequestException(
        `Invalid upload folder. Allowed folders: ${Array.from(
          this.ADMIN_ALLOWED_UPLOAD_TOP_LEVEL_FOLDERS,
        ).join(', ')}`,
      );
    }

    return normalizedFolder;
  }
}
