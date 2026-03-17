import api from '@/lib/axios';
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

    const response = await api.post<ApiResponse<UploadResult>>('/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  },

  deleteImage: async (key: string): Promise<void> => {
    await api.delete('/uploads/image', {
      data: { key },
    });
  },
};
