import api from '@/lib/axios';
import type { ApiResponse } from '@/types';

type UploadResult = {
  url: string;
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
};

const CLOUDINARY_KEY_PREFIX = 'cloudinary:';
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const BLOCKED_IMAGE_MIME_TYPES = new Set(['image/svg+xml']);

const validateUploadImageFile = (file: File): void => {
  const mimeType = (file.type || '').toLowerCase().trim();
  if (!mimeType.startsWith('image/') || BLOCKED_IMAGE_MIME_TYPES.has(mimeType)) {
    throw new Error('Please upload a valid image file (SVG is not supported).');
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`Image must be ${MAX_IMAGE_SIZE_MB}MB or smaller.`);
  }
};

const normalizeCloudinaryPublicId = (value: string): string | null => {
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
};

const extractCloudinaryPublicIdFromUrl = (value: string): string | null => {
  try {
    const parsed = new URL(value);
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

    return normalizeCloudinaryPublicId(publicIdSegments.join('/'));
  } catch {
    return null;
  }
};

const extractStorageKey = (value?: string | null): string | null => {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith(CLOUDINARY_KEY_PREFIX)) {
    const publicId = normalizeCloudinaryPublicId(trimmed.slice(CLOUDINARY_KEY_PREFIX.length));
    return publicId ? `${CLOUDINARY_KEY_PREFIX}${publicId}` : null;
  }

  const cloudinaryPublicId = extractCloudinaryPublicIdFromUrl(trimmed);
  if (cloudinaryPublicId) {
    return `${CLOUDINARY_KEY_PREFIX}${cloudinaryPublicId}`;
  }

  try {
    const parsed = new URL(trimmed);
    const isLocalUploadsPath = parsed.pathname.startsWith('/uploads/');
    if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && !isLocalUploadsPath) {
      return null;
    }
  } catch {
    // Continue for relative/local key parsing.
  }

  const baseOrigin = globalThis.location?.origin || 'http://localhost';
  let candidate = trimmed.replace(/&#x2f;|&#x2F;|&#47;/g, '/');

  try {
    candidate = new URL(candidate, baseOrigin).pathname;
  } catch {
    // Keep raw key/path value as-is.
  }

  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    // Ignore malformed URI sequences.
  }

  candidate = candidate.split('?')[0].split('#')[0].replace(/\\/g, '/');
  candidate = candidate.replace(/^\/+/, '');

  if (candidate.startsWith('uploads/')) {
    candidate = candidate.slice('uploads/'.length);
  }

  if (
    !candidate ||
    candidate === '.' ||
    candidate.startsWith('..') ||
    candidate.includes('/..') ||
    candidate.includes('\0')
  ) {
    return null;
  }

  return candidate;
};

const parseUploadResult = (payload: unknown): UploadResult => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid upload response from server.');
  }

  const candidate = payload as Partial<UploadResult>;
  const url = typeof candidate.url === 'string' ? candidate.url.trim() : '';
  const key = typeof candidate.key === 'string' ? candidate.key.trim() : '';
  const originalName =
    typeof candidate.originalName === 'string' ? candidate.originalName.trim() : '';
  const mimeType = typeof candidate.mimeType === 'string' ? candidate.mimeType.trim() : '';
  const size = typeof candidate.size === 'number' ? candidate.size : NaN;

  if (!url || !key || !Number.isFinite(size) || size < 0) {
    throw new Error('Invalid upload response from server.');
  }

  return {
    url,
    key,
    originalName,
    mimeType,
    size,
  };
};

export const uploadService = {
  uploadImage: async (file: File, folder: string = 'images'): Promise<UploadResult> => {
    validateUploadImageFile(file);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await api.post<ApiResponse<UploadResult>>('/uploads/image', formData);
    return parseUploadResult(response.data?.data);
  },

  extractStorageKey,

  deleteImage: async (keyOrPathOrUrl: string): Promise<void> => {
    const key = extractStorageKey(keyOrPathOrUrl);
    if (!key) return;

    await api.delete('/uploads/image', {
      data: { key },
    });
  },
};
