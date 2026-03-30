import { existsSync, promises as fs, readFileSync } from 'fs';
import { extname, join } from 'path';
import { createHash } from 'crypto';
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
} from './upload-storage.util';

type FilesystemError = {
  code?: string;
  message?: string;
  stack?: string;
};

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
  error?: {
    message?: string;
  };
};

type CloudinaryDestroyResponse = {
  result?: string;
  error?: {
    message?: string;
  };
};

type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadsRootPath = getUploadsRootPath();
  private readonly CLOUDINARY_KEY_PREFIX = 'cloudinary:';
  private readonly runtimeEnvFallbackCache = new Map<string, string | null>();
  private readonly ALLOWED_TOP_LEVEL_FOLDERS = new Set([
    'app-branding',
    'cms-pages',
    'images',
    'meal-plans',
    'menu-items',
    'parents',
    'students',
    'users',
  ]);

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
        `Image must be ${this.MAX_FILE_SIZE / 1024 / 1024}MB or smaller.`,
      );
    }
  }

  /**
   * Upload image
   */
  async uploadImage(file: Express.Multer.File, folder: string = 'images') {
    this.validateImageFile(file);

    const safeFolder = sanitizeUploadFolder(folder);
    this.assertAllowedTopLevelFolder(safeFolder, 'upload folder');
    const fileBuffer = await this.getFileBuffer(file);
    const cloudinaryResult = await this.uploadToCloudinary(file, fileBuffer, safeFolder);

    return {
      url: cloudinaryResult.secureUrl,
      key: `${this.CLOUDINARY_KEY_PREFIX}${cloudinaryResult.publicId}`,
      originalName: file.originalname,
      mimeType: (file.mimetype || '').replace(/&#x2f;|&#x2F;|&#47;/g, '/'),
      size: file.size,
    };
  }

  /**
   * Delete image
   */
  async deleteImage(keyOrPathOrUrl: string) {
    const cloudinaryPublicId = this.extractCloudinaryPublicId(keyOrPathOrUrl);
    if (cloudinaryPublicId) {
      this.assertAllowedTopLevelFolder(cloudinaryPublicId, 'Cloudinary asset key');
      await this.deleteFromCloudinary(cloudinaryPublicId);
      return { message: 'Image deleted successfully' };
    }

    const key = extractUploadStorageKey(keyOrPathOrUrl);
    if (!key) {
      throw new BadRequestException('Invalid image key/path');
    }
    this.assertAllowedTopLevelFolder(key, 'image key/path');

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

  private getCloudinaryConfig(): CloudinaryConfig {
    const cloudName = this.getRuntimeEnvValue('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.getRuntimeEnvValue('CLOUDINARY_API_KEY');
    const apiSecret = this.getRuntimeEnvValue('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      const missing = [
        !cloudName ? 'CLOUDINARY_CLOUD_NAME' : null,
        !apiKey ? 'CLOUDINARY_API_KEY' : null,
        !apiSecret ? 'CLOUDINARY_API_SECRET' : null,
      ]
        .filter(Boolean)
        .join(', ');

      this.logger.error(
        `Cloudinary is not configured on the server. Missing: ${missing || 'unknown keys'}. cwd=${process.cwd()}`,
      );
      throw new InternalServerErrorException('Cloudinary is not configured on the server');
    }

    return {
      cloudName,
      apiKey,
      apiSecret,
    };
  }

  private buildCloudinarySignature(params: Record<string, string>, apiSecret: string): string {
    const signaturePayload = Object.entries(params)
      .filter(([, value]) => Boolean(value))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    return createHash('sha1').update(`${signaturePayload}${apiSecret}`).digest('hex');
  }

  private async uploadToCloudinary(
    file: Express.Multer.File,
    fileBuffer: Buffer,
    folder: string,
  ): Promise<{ secureUrl: string; publicId: string }> {
    const { cloudName, apiKey, apiSecret } = this.getCloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = this.buildCloudinarySignature({ folder, timestamp }, apiSecret);
    const uploadUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`;
    const normalizedMimeType = (file.mimetype || '')
      .toLowerCase()
      .trim()
      .replace(/&#x2f;|&#x2F;|&#47;/g, '/');
    const fallbackExtension = this.resolveImageExtension(file).replace(/^\./, '') || 'jpg';
    const blobMimeType = normalizedMimeType.startsWith('image/')
      ? normalizedMimeType
      : `image/${fallbackExtension}`;

    const formData = new FormData();
    formData.append(
      'file',
      new Blob([new Uint8Array(fileBuffer)], { type: blobMimeType }),
      file.originalname,
    );
    formData.append('folder', folder);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);

    let response: Awaited<ReturnType<typeof fetch>>;
    try {
      response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });
    } catch (error) {
      const uploadError = error as { message?: string };
      this.logger.error(
        `Cloudinary upload request failed: ${uploadError.message || 'unknown error'}`,
      );
      throw new InternalServerErrorException('Failed to upload image');
    }

    const payload = (await response.json().catch(() => ({}))) as CloudinaryUploadResponse;
    if (!response.ok || !payload.secure_url || !payload.public_id) {
      this.logger.error(
        `Cloudinary upload failed with status ${response.status}: ${
          payload.error?.message || 'invalid upload response'
        }`,
      );
      throw new InternalServerErrorException('Failed to upload image');
    }

    return {
      secureUrl: payload.secure_url,
      publicId: payload.public_id,
    };
  }

  private async deleteFromCloudinary(publicId: string): Promise<void> {
    const { cloudName, apiKey, apiSecret } = this.getCloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const invalidate = 'true';
    const signature = this.buildCloudinarySignature(
      {
        public_id: publicId,
        timestamp,
        invalidate,
      },
      apiSecret,
    );
    const destroyUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/destroy`;
    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('invalidate', invalidate);
    formData.append('signature', signature);

    let response: Awaited<ReturnType<typeof fetch>>;
    try {
      response = await fetch(destroyUrl, {
        method: 'POST',
        body: formData,
      });
    } catch (error) {
      const cloudinaryError = error as { message?: string };
      this.logger.error(
        `Cloudinary delete request failed for ${publicId}: ${cloudinaryError.message || 'unknown error'}`,
      );
      throw new InternalServerErrorException('Failed to delete image');
    }

    const payload = (await response.json().catch(() => ({}))) as CloudinaryDestroyResponse;
    if (!response.ok) {
      this.logger.error(
        `Cloudinary delete failed with status ${response.status}: ${
          payload.error?.message || 'invalid delete response'
        }`,
      );
      throw new InternalServerErrorException('Failed to delete image');
    }

    const normalizedResult = (payload.result || '').toLowerCase();
    if (normalizedResult && normalizedResult !== 'ok' && normalizedResult !== 'not found') {
      this.logger.error(`Cloudinary delete failed for ${publicId}: ${payload.result}`);
      throw new InternalServerErrorException('Failed to delete image');
    }
  }

  private extractCloudinaryPublicId(value?: string | null): string | null {
    if (typeof value !== 'string') return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith(this.CLOUDINARY_KEY_PREFIX)) {
      return this.normalizeCloudinaryPublicId(trimmed.slice(this.CLOUDINARY_KEY_PREFIX.length));
    }

    try {
      const parsed = new URL(trimmed);
      if (!parsed.hostname.endsWith('cloudinary.com')) {
        return null;
      }

      const pathSegments = decodeURIComponent(parsed.pathname)
        .split('/')
        .map(segment => segment.trim())
        .filter(Boolean);
      const uploadIndex = pathSegments.indexOf('upload');
      if (uploadIndex < 0) {
        return null;
      }

      const publicIdSegments = pathSegments.slice(uploadIndex + 1);
      if (publicIdSegments.length === 0) {
        return null;
      }

      if (/^v\d+$/.test(publicIdSegments[0] || '')) {
        publicIdSegments.shift();
      }

      if (publicIdSegments.length === 0) {
        return null;
      }

      const lastSegment = publicIdSegments[publicIdSegments.length - 1];
      publicIdSegments[publicIdSegments.length - 1] = lastSegment.replace(/\.[^/.]+$/, '');

      return this.normalizeCloudinaryPublicId(publicIdSegments.join('/'));
    } catch {
      return null;
    }
  }

  private normalizeCloudinaryPublicId(value: string): string | null {
    const normalized = value.trim().replace(/^\/+/, '');
    if (
      !normalized ||
      normalized === '.' ||
      normalized.startsWith('..') ||
      normalized.includes('/..') ||
      normalized.includes('\0')
    ) {
      return null;
    }

    return normalized;
  }

  private assertAllowedTopLevelFolder(pathLike: string, contextLabel: string): void {
    const topLevelFolder = this.extractTopLevelFolder(pathLike);
    if (!topLevelFolder || !this.ALLOWED_TOP_LEVEL_FOLDERS.has(topLevelFolder)) {
      throw new BadRequestException(`Invalid ${contextLabel}`);
    }
  }

  private extractTopLevelFolder(pathLike: string): string | null {
    const firstSegment = pathLike
      .split('/')
      .map(segment => segment.trim())
      .filter(Boolean)[0];

    return firstSegment || null;
  }

  private getRuntimeEnvValue(key: string): string | undefined {
    const directValue = process.env[key]?.trim();
    if (directValue) {
      return directValue;
    }

    if (this.runtimeEnvFallbackCache.has(key)) {
      const cached = this.runtimeEnvFallbackCache.get(key);
      return cached || undefined;
    }

    const fallbackValue = this.readValueFromEnvFiles(key);
    this.runtimeEnvFallbackCache.set(key, fallbackValue || null);
    return fallbackValue || undefined;
  }

  private readValueFromEnvFiles(key: string): string | null {
    const envFileCandidates = this.getEnvFileCandidates();

    for (const filePath of envFileCandidates) {
      if (!existsSync(filePath)) {
        continue;
      }

      const value = this.readSingleEnvValue(filePath, key);
      if (value) {
        return value;
      }
    }

    return null;
  }

  private getEnvFileCandidates(): string[] {
    const cwd = process.cwd();
    const runtimeAppRoot = join(__dirname, '..', '..');

    return Array.from(
      new Set([
        join(cwd, '.env.local'),
        join(cwd, '.env'),
        join(cwd, 'apps', 'backend', '.env.local'),
        join(cwd, 'apps', 'backend', '.env'),
        join(runtimeAppRoot, '.env.local'),
        join(runtimeAppRoot, '.env'),
      ]),
    );
  }

  private readSingleEnvValue(filePath: string, key: string): string | null {
    try {
      const content = readFileSync(filePath, 'utf8');
      const lines = content.split(/\r?\n/);

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) {
          continue;
        }

        const separatorIndex = line.indexOf('=');
        if (separatorIndex <= 0) {
          continue;
        }

        const parsedKey = line.slice(0, separatorIndex).trim();
        if (parsedKey !== key) {
          continue;
        }

        let rawValue = line.slice(separatorIndex + 1).trim();
        if (
          (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
          (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ) {
          rawValue = rawValue.slice(1, -1);
        } else {
          const inlineCommentIndex = rawValue.indexOf(' #');
          if (inlineCommentIndex >= 0) {
            rawValue = rawValue.slice(0, inlineCommentIndex).trim();
          }
        }

        return rawValue || null;
      }
    } catch {
      return null;
    }

    return null;
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
