import api from '@/lib/axios';
import { ApiResponse, CMSPage, CreateCMSPageDto, UpdateCMSPageDto } from '@/types';

export const cmsService = {
  // Get all pages
  getAll: async (): Promise<CMSPage[]> => {
    const response = await api.get<ApiResponse<CMSPage[]>>('/cms');
    return response.data.data;
  },

  // Get page by ID
  getById: async (id: string): Promise<CMSPage> => {
    const response = await api.get<ApiResponse<CMSPage>>(`/cms/${id}`);
    return response.data.data;
  },

  // Get page by slug
  getBySlug: async (slug: string): Promise<CMSPage> => {
    const response = await api.get<ApiResponse<CMSPage>>(`/cms/slug/${slug}`);
    return response.data.data;
  },

  // Create page
  create: async (data: CreateCMSPageDto): Promise<CMSPage> => {
    const response = await api.post<ApiResponse<CMSPage>>('/cms', data);
    return response.data.data;
  },

  // Update page
  update: async (id: string, data: UpdateCMSPageDto): Promise<CMSPage> => {
    const response = await api.patch<ApiResponse<CMSPage>>(`/cms/${id}`, data);
    return response.data.data;
  },

  // Delete page
  delete: async (id: string): Promise<void> => {
    await api.delete(`/cms/${id}`);
  },

  // Publish page
  publish: async (id: string): Promise<CMSPage> => {
    const response = await api.post<ApiResponse<CMSPage>>(`/cms/${id}/publish`);
    return response.data.data;
  },

  // Unpublish page
  unpublish: async (id: string): Promise<CMSPage> => {
    const response = await api.post<ApiResponse<CMSPage>>(`/cms/${id}/unpublish`);
    return response.data.data;
  },
};
