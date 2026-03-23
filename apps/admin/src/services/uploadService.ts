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

  deleteImage: async (key: string): Promise<void> => {
    await api.delete('/uploads/image', {
      data: { key },
    });
  },
};
