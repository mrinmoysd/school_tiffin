import api from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import type { ApiResponse } from '@/types';

type UploadResult = {
  url: string;
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
};

const extractStorageKey = (value?: string | null): string | null => {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

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

export const uploadService = {
  uploadImage: async (file: File, folder: string = 'images'): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const token = useAuthStore.getState().accessToken;
    const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';
    const response = await fetch(`${baseUrl}/uploads/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    const payload = (await response.json()) as
      | ApiResponse<UploadResult>
      | { message?: string; error?: string; statusCode?: number };

    if (!response.ok) {
      const message =
        ('message' in payload && payload.message) || 'Image upload failed. Please try again.';
      throw new Error(message);
    }

    if (!('data' in payload) || !payload.data) {
      throw new Error('Invalid upload response from server.');
    }

    return payload.data;
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
