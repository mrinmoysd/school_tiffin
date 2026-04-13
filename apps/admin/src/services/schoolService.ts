/* global URLSearchParams */
import api from '@/lib/axios';
import { ApiResponse, School, CreateSchoolDto, UpdateSchoolDto, SchoolFilters } from '@/types';
import { toCapitalizedWords } from '@/utils/formatters';

export const schoolService = {
  // Get all schools
  getAll: async (filters?: SchoolFilters): Promise<School[]> => {
    const normalizedCityFilter = filters?.city ? toCapitalizedWords(filters.city) : undefined;
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (normalizedCityFilter) params.append('city', normalizedCityFilter);
    if (filters?.isServiceAvailable !== undefined) {
      params.append('isServiceAvailable', String(filters.isServiceAvailable));
    }

    const response = await api.get<ApiResponse<School[]>>(`/schools?${params.toString()}`);
    return response.data.data;
  },

  // Get school by ID
  getById: async (id: string): Promise<School> => {
    const response = await api.get<ApiResponse<School>>(`/schools/${id}`);
    return response.data.data;
  },

  // Create school
  create: async (data: CreateSchoolDto): Promise<School> => {
    const payload: CreateSchoolDto = {
      ...data,
      city: toCapitalizedWords(data.city),
    };

    const response = await api.post<ApiResponse<School>>('/schools', payload);
    return response.data.data;
  },

  // Update school
  update: async (id: string, data: UpdateSchoolDto): Promise<School> => {
    const payload: UpdateSchoolDto = {
      ...data,
      city: data.city === undefined ? undefined : toCapitalizedWords(data.city),
    };

    const response = await api.patch<ApiResponse<School>>(`/schools/${id}`, payload);
    return response.data.data;
  },

  // Delete school (soft delete)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/schools/${id}`);
  },

  // Toggle service availability
  toggleService: async (id: string, isServiceAvailable: boolean): Promise<School> => {
    const response = await api.patch<ApiResponse<School>>(`/schools/${id}`, { isServiceAvailable });
    return response.data.data;
  },

  // Get unique cities for filter
  getCities: async (): Promise<string[]> => {
    const schools = await schoolService.getAll();
    const normalizedByKey = new Map<string, string>();

    schools.forEach(school => {
      const normalized = toCapitalizedWords(school.city);
      if (!normalized) return;

      const key = normalized.toLowerCase();
      if (!normalizedByKey.has(key)) {
        normalizedByKey.set(key, normalized);
      }
    });

    return Array.from(normalizedByKey.values()).sort((a, b) => a.localeCompare(b));
  },
};
