import api from '@/lib/axios';
import { ApiResponse, PauseRequest, PauseRequestFilters, PauseRequestStatus } from '@/types';

export const pauseRequestService = {
  // Get all pause requests
  getAll: async (filters?: PauseRequestFilters): Promise<PauseRequest[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get<ApiResponse<PauseRequest[]>>(`/pause-requests?${params.toString()}`);
    return response.data.data;
  },

  // Get pause request by ID
  getById: async (id: string): Promise<PauseRequest> => {
    const response = await api.get<ApiResponse<PauseRequest>>(`/pause-requests/${id}`);
    return response.data.data;
  },

  // Get pending count
  getPendingCount: async (): Promise<number> => {
    const response = await api.get<ApiResponse<PauseRequest[]>>(`/pause-requests?status=${PauseRequestStatus.PENDING}`);
    return response.data.data.length;
  },

  // Approve pause request
  approve: async (id: string): Promise<PauseRequest> => {
    const response = await api.post<ApiResponse<PauseRequest>>(`/pause-requests/${id}/approve`);
    return response.data.data;
  },

  // Reject pause request
  reject: async (id: string, reason?: string): Promise<PauseRequest> => {
    const response = await api.post<ApiResponse<PauseRequest>>(`/pause-requests/${id}/reject`, { reason });
    return response.data.data;
  },
};
