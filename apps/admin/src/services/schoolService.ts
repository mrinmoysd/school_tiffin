import api from '@/lib/axios';
import { ApiResponse, School, CreateSchoolDto, UpdateSchoolDto, SchoolFilters } from '@/types';

export const schoolService = {
  // Get all schools
  getAll: async (filters?: SchoolFilters): Promise<School[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.city) params.append('city', filters.city);
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
    const response = await api.post<ApiResponse<School>>('/schools', data);
    return response.data.data;
  },

  // Update school
  update: async (id: string, data: UpdateSchoolDto): Promise<School> => {
    const response = await api.patch<ApiResponse<School>>(`/schools/${id}`, data);
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
    const cities = [...new Set(schools.map(s => s.city).filter(Boolean))];
    return cities as string[];
  },
};
