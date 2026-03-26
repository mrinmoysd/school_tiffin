import { promises as fs } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { Buffer } from 'buffer';
import type { Readable } from 'stream';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { Express } from 'express';
import {
  extractUploadStorageKey,
  getUploadsRootPath,
  sanitizeUploadFolder,
  toPublicUploadPath,
} from './upload-storage.util';

type FilesystemError = {
  code?: string;
  message?: string;
  stack?: string;
};

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadsRootPath = getUploadsRootPath();

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

  private readonly MIME_EXTENSION_MAP: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/avif': '.avif',
    'image/heic': '.heic',
    'image/heif': '.heif',
    'image/jfif': '.jpg',
    'image/pjpeg': '.jpg',
    'image/x-png': '.png',
  };

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
      .replace(/&#x2f;|&#x2F;|&#47;/g, '/');
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

    const safeFolder = sanitizeUploadFolder(folder);
    const extension = this.resolveImageExtension(file);
    const fileName = `${randomUUID()}${extension}`;
    const key = `${safeFolder}/${fileName}`;
    const filePath = this.resolveAbsolutePathForKey(key);
    const fileBuffer = await this.getFileBuffer(file);

    await fs.mkdir(join(this.uploadsRootPath, safeFolder), { recursive: true });

    try {
      await fs.writeFile(filePath, fileBuffer);
    } catch (error) {
      const fsError = error as FilesystemError;
      this.logger.error(
        `Failed to save uploaded image at ${filePath}: ${fsError.message || 'unknown error'}`,
        fsError.stack,
      );
      throw new InternalServerErrorException('Failed to save uploaded image');
    }

    return {
      url: toPublicUploadPath(key),
      key,
      originalName: file.originalname,
      mimeType: (file.mimetype || '').replace(/&#x2f;|&#x2F;|&#47;/g, '/'),
      size: file.size,
    };
  }

  /**
   * Delete image
   */
  async deleteImage(keyOrPathOrUrl: string) {
    const key = extractUploadStorageKey(keyOrPathOrUrl);
    if (!key) {
      throw new BadRequestException('Invalid image key/path');
    }

    const filePath = this.resolveAbsolutePathForKey(key);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      const fsError = error as FilesystemError;
      // Deleting a non-existent file should not block cleanup flows.
      if (fsError.code !== 'ENOENT') {
        throw new InternalServerErrorException('Failed to delete image');
      }
    }

    return { message: 'Image deleted successfully' };
  }

  private resolveImageExtension(file: Express.Multer.File): string {
    const extensionFromName = extname(file.originalname || '').toLowerCase();
    if (this.ALLOWED_IMAGE_EXTENSIONS.includes(extensionFromName)) {
      return extensionFromName;
    }

    const normalizedMimeType = (file.mimetype || '')
      .toLowerCase()
      .trim()
      .replace(/&#x2f;|&#x2F;|&#47;/g, '/');

    return this.MIME_EXTENSION_MAP[normalizedMimeType] || '.jpg';
  }

  private resolveAbsolutePathForKey(key: string): string {
    const safeKey = extractUploadStorageKey(key);
    if (!safeKey) {
      throw new BadRequestException('Invalid image key/path');
    }

    const filePath = join(this.uploadsRootPath, ...safeKey.split('/'));
    const normalizedRoot = (
      this.uploadsRootPath.endsWith('/') ? this.uploadsRootPath : `${this.uploadsRootPath}/`
    ).replace(/\\/g, '/');
    const normalizedPath = filePath.replace(/\\/g, '/');

    if (!normalizedPath.startsWith(normalizedRoot)) {
      throw new BadRequestException('Invalid image key/path');
    }

    return filePath;
  }

  private async getFileBuffer(file: Express.Multer.File): Promise<Buffer> {
    const rawBuffer = file?.buffer as unknown;
    if (rawBuffer) {
      if (Buffer.isBuffer(rawBuffer) && rawBuffer.length > 0) {
        return rawBuffer;
      }

      if (rawBuffer instanceof Uint8Array && rawBuffer.byteLength > 0) {
        return Buffer.from(rawBuffer);
      }

      if (rawBuffer instanceof ArrayBuffer && rawBuffer.byteLength > 0) {
        return Buffer.from(rawBuffer);
      }

      if (typeof rawBuffer === 'string' && rawBuffer.length > 0) {
        return Buffer.from(rawBuffer, 'binary');
      }

      if (
        typeof rawBuffer === 'object' &&
        rawBuffer !== null &&
        'data' in (rawBuffer as Record<string, unknown>) &&
        Array.isArray((rawBuffer as { data?: unknown[] }).data)
      ) {
        const nestedDataBuffer = Buffer.from((rawBuffer as { data: number[] }).data);
        if (nestedDataBuffer.length > 0) {
          return nestedDataBuffer;
        }
      }

      if (typeof rawBuffer === 'object' && rawBuffer !== null) {
        const numericKeyedBuffer = rawBuffer as Record<string, unknown>;
        const numericKeys = Object.keys(numericKeyedBuffer)
          .filter(key => /^\d+$/.test(key))
          .sort((left, right) => Number(left) - Number(right));

        if (numericKeys.length > 0) {
          const normalizedBytes = numericKeys.map(key => Number(numericKeyedBuffer[key]) || 0);
          return Buffer.from(normalizedBytes);
        }
      }
    }

    if (file?.path) {
      const diskBuffer = await fs.readFile(file.path);
      // Clean up temporary multer file when disk storage is used.
      await fs.unlink(file.path).catch(() => undefined);
      return diskBuffer;
    }

    const stream = (file as Express.Multer.File & { stream?: Readable })?.stream;
    if (stream) {
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      if (chunks.length > 0) {
        return Buffer.concat(chunks);
      }
    }

    this.logger.error(
      `Uploaded file content is missing. Available file keys: ${Object.keys(file || {}).join(', ')}, buffer constructor: ${(rawBuffer as { constructor?: { name?: string } })?.constructor?.name || 'unknown'}, buffer object keys: ${typeof rawBuffer === 'object' && rawBuffer !== null ? Object.keys(rawBuffer as Record<string, unknown>).join(',') : 'n/a'}`,
    );
    throw new InternalServerErrorException('Uploaded file content is missing');
  }
}
