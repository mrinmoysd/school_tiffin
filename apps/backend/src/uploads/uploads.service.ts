import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Service } from './s3.service';

@Injectable()
export class UploadsService {
  constructor(private s3Service: S3Service) {}

  // Allowed file types
  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  /**
   * Validate image file
   */
  private validateImageFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!this.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.ALLOWED_IMAGE_TYPES.join(', ')}`,
      );
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(`File size exceeds maximum limit of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
  }

  /**
   * Upload image
   */
  async uploadImage(file: Express.Multer.File, folder: string = 'images') {
    this.validateImageFile(file);

    const result = await this.s3Service.uploadFile(file, folder);

    return {
      url: result.url,
      key: result.key,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  /**
   * Delete image
   */
  async deleteImage(key: string) {
    await this.s3Service.deleteFile(key);
    return { message: 'Image deleted successfully' };
  }
}
