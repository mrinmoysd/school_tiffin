import api from '@/lib/axios';
import { ApiResponse, CMSPage, CreateCMSPageDto, UpdateCMSPageDto } from '@/types';

export const cmsService = {
  // Get all pages
  getAll: async (): Promise<CMSPage[]> => {
    const response = await api.get<ApiResponse<CMSPage[]>>('/cms');
    return response.data.data;
  },

  // Get page by slug
  getById: async (slug: string): Promise<CMSPage> => {
    const response = await api.get<ApiResponse<CMSPage>>(`/cms/${slug}`);
    return response.data.data;
  },

  // Get page by slug
  getBySlug: async (slug: string): Promise<CMSPage> => {
    const response = await api.get<ApiResponse<CMSPage>>(`/cms/${slug}`);
    return response.data.data;
  },

  // Create page
  create: async (data: CreateCMSPageDto): Promise<CMSPage> => {
    const response = await api.post<ApiResponse<CMSPage>>('/cms', data);
    return response.data.data;
  },

  // Update page
  update: async (slug: string, data: UpdateCMSPageDto): Promise<CMSPage> => {
    const response = await api.patch<ApiResponse<CMSPage>>(`/cms/${slug}`, data);
    return response.data.data;
  },

  // Delete page
  delete: async (slug: string): Promise<void> => {
    await api.delete(`/cms/${slug}`);
  },

  // Publish page
  publish: async (slug: string): Promise<CMSPage> => {
    const response = await api.patch<ApiResponse<CMSPage>>(`/cms/${slug}/publish`);
    return response.data.data;
  },

  // Unpublish page
  unpublish: async (slug: string): Promise<CMSPage> => {
    const response = await api.patch<ApiResponse<CMSPage>>(`/cms/${slug}/publish`);
    return response.data.data;
  },
};
