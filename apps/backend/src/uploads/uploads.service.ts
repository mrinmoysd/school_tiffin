import { Injectable, BadRequestException } from '@nestjs/common';
import type { Express } from 'express';
import { extname } from 'path';
import { S3Service } from './s3.service';

@Injectable()
export class UploadsService {
  constructor(private s3Service: S3Service) {}

  // Common explicit image types (kept for error messaging/reference)
  private readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/heic',
    'image/heif',
    'image/jfif',
    'image/pjpeg',
    'image/x-png',
  ];
  private readonly BLOCKED_IMAGE_TYPES = ['image/svg+xml'];
  private readonly ALLOWED_IMAGE_EXTENSIONS = [
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.avif',
    '.heic',
    '.heif',
    '.jfif',
  ];
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  private isKnownImageByContent(file: Express.Multer.File): boolean {
    const buffer = file?.buffer;
    if (!buffer || buffer.length < 12) return false;

    // PNG signature: 89 50 4E 47
    const isPng =
      buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    // JPEG/JFIF signature: FF D8 FF
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    // WebP: RIFF....WEBP
    const isWebp =
      buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    // AVIF/HEIC/HEIF: ....ftyp + known brand
    const hasFtyp = buffer.toString('ascii', 4, 8) === 'ftyp';
    const brand = buffer.toString('ascii', 8, 12);
    const isIsoImage =
      hasFtyp && ['avif', 'avis', 'heic', 'heix', 'heif', 'heis', 'mif1', 'msf1'].includes(brand);

    return isPng || isJpeg || isWebp || isIsoImage;
  }

  /**
   * Validate image file
   */
  private validateImageFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const mimeType = (file.mimetype || '')
      .toLowerCase()
      .trim()
      .replace(/&#x2f;|&#47;/g, '/');
    const isImageMime = mimeType.startsWith('image/');
    const isBlockedType = this.BLOCKED_IMAGE_TYPES.includes(mimeType);
    const fileExtension = extname(file.originalname || '').toLowerCase();
    const isAllowedImageExtension = this.ALLOWED_IMAGE_EXTENSIONS.includes(fileExtension);
    const isOctetStream =
      mimeType === 'application/octet-stream' ||
      mimeType === 'binary/octet-stream' ||
      mimeType === '';
    const isKnownByContent = this.isKnownImageByContent(file);
    const isOctetStreamImage = isOctetStream && (isAllowedImageExtension || isKnownByContent);

    if ((!isImageMime && !isOctetStreamImage) || isBlockedType) {
      throw new BadRequestException(
        `Invalid file type. Allowed image formats include: ${this.ALLOWED_IMAGE_TYPES.join(', ')}`,
      );
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum limit of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
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
