import { apiRequest } from '../client/apiClient';
import { School, SchoolDetails } from './schoolsApi.types';

export const schoolsApi = {
  getSchools: async (city?: string): Promise<School[]> => {
    const query = city ? `?city=${encodeURIComponent(city)}` : '';

    return apiRequest<School[]>(`/schools${query}`, {
      method: 'GET',
    });
  },

  getSchoolDetails: async (schoolId: string): Promise<SchoolDetails> =>
    apiRequest<SchoolDetails>(`/schools/${schoolId}`, {
      method: 'GET',
    }),
};
