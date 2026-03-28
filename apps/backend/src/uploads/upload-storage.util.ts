import { existsSync } from 'fs';
import { isAbsolute, join, posix } from 'path';

const DEFAULT_UPLOADS_DIR_NAME = 'uploads';
const PUBLIC_UPLOADS_PREFIX = '/uploads';

const ENCODED_SLASH_PATTERN = /&#x2f;|&#x2F;|&#47;/g;

const decodeEscapedSlashes = (value: string): string => value.replace(ENCODED_SLASH_PATTERN, '/');

const safeDecodeURIComponent = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const normalizePathLikeInput = (value: string): string =>
  safeDecodeURIComponent(decodeEscapedSlashes(value.trim())).replace(/\\/g, '/');

const resolveBackendRoot = (): string => {
  const cwd = process.cwd();
  if (existsSync(join(cwd, 'src', 'main.ts'))) {
    return cwd;
  }

  const monorepoBackendRoot = join(cwd, 'apps', 'backend');
  if (existsSync(join(monorepoBackendRoot, 'src', 'main.ts'))) {
    return monorepoBackendRoot;
  }

  return cwd;
};

export const getUploadsRootPath = (): string => {
  const configuredDir = process.env.UPLOAD_DIR?.trim();
  if (configuredDir) {
    return isAbsolute(configuredDir) ? configuredDir : join(resolveBackendRoot(), configuredDir);
  }

  return join(resolveBackendRoot(), DEFAULT_UPLOADS_DIR_NAME);
};

export const sanitizeUploadFolder = (folder?: string): string => {
  const normalized = normalizePathLikeInput(folder || '');

  const safeSegments = normalized
    .split('/')
    .map(segment => segment.trim())
    .filter(Boolean)
    .filter(segment => segment !== '.' && segment !== '..')
    .map(segment => segment.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-'))
    .map(segment => segment.replace(/^-+|-+$/g, ''))
    .filter(Boolean);

  return safeSegments.length > 0 ? safeSegments.join('/') : 'images';
};

export const extractUploadStorageKey = (value?: string | null): string | null => {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  let candidate = normalizePathLikeInput(trimmed);

  try {
    const parsed = new URL(candidate);
    candidate = parsed.pathname;
  } catch {
    // Keep non-URL values as-is (key/path references).
  }

  candidate = candidate.split('?')[0].split('#')[0];
  candidate = candidate.replace(/^\/+/, '');

  if (candidate.startsWith('uploads/')) {
    candidate = candidate.slice('uploads/'.length);
  }

  const normalizedKey = posix.normalize(candidate).replace(/^\/+/, '');

  if (
    !normalizedKey ||
    normalizedKey === '.' ||
    normalizedKey.startsWith('..') ||
    normalizedKey.includes('/..') ||
    normalizedKey.includes('\0')
  ) {
    return null;
  }

  return normalizedKey;
};

export const toPublicUploadPath = (key: string): string => {
  const normalizedKey = extractUploadStorageKey(key);
  if (!normalizedKey) {
    return PUBLIC_UPLOADS_PREFIX;
  }

  const encodedPath = normalizedKey
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');

  return `${PUBLIC_UPLOADS_PREFIX}/${encodedPath}`;
};

export const normalizeImageReferencePath = (value?: string | null): string | null => {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalizedInput = normalizePathLikeInput(trimmed);

  try {
    const parsed = new URL(normalizedInput);
    if (parsed.pathname.startsWith('/uploads/')) {
      const key = extractUploadStorageKey(parsed.pathname);
      return key ? toPublicUploadPath(key) : null;
    }
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed;
    }
    return null;
  } catch {
    // Not a full URL, continue with path/key handling.
  }

  if (normalizedInput.startsWith('/uploads/') || normalizedInput.startsWith('uploads/')) {
    const key = extractUploadStorageKey(normalizedInput);
    return key ? toPublicUploadPath(key) : null;
  }

  const key = extractUploadStorageKey(normalizedInput);
  if (key && normalizedInput.includes('/')) {
    return toPublicUploadPath(key);
  }

  return null;
};
