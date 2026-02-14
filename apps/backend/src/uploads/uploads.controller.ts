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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { Roles, UserRole } from '../common/decorators';

@ApiTags('Uploads')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller({ path: 'uploads', version: '1' })
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  /**
   * Upload image (Admin only)
   */
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '[Admin] Upload image',
    description: 'Upload an image to AWS S3. Allowed types: JPEG, PNG, WebP. Max size: 5MB.',
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
          description: 'S3 folder (optional)',
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
          url: 'https://bucket.s3.region.amazonaws.com/images/uuid.jpg',
          key: 'images/uuid.jpg',
          originalName: 'meal.jpg',
          mimeType: 'image/jpeg',
          size: 245678,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.uploadsService.uploadImage(file, folder || 'images');
  }

  /**
   * Delete image (Admin only)
   */
  @Delete('image')
  @ApiOperation({
    summary: '[Admin] Delete image',
    description: 'Delete an image from AWS S3 by providing its key.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'S3 object key',
          example: 'images/uuid.jpg',
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
}
