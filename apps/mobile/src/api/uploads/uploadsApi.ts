import { apiRequest } from '../client/apiClient';
import { UploadImagePayload, UploadImageResponse } from './uploadsApi.types';

export const uploadsApi = {
  uploadImage: async (payload: UploadImagePayload): Promise<UploadImageResponse> => {
    const formData = new FormData();

    formData.append('file', {
      uri: payload.file.uri,
      name: payload.file.name,
      type: payload.file.type,
    } as any);
    formData.append('folder', payload.folder);

    return apiRequest<UploadImageResponse>('/uploads/image', {
      method: 'POST',
      requiresAuth: true,
      body: formData,
    });
  },
};
