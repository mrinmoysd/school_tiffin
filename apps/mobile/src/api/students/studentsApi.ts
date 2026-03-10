import { apiRequest } from '../client/apiClient';
import { Student } from './studentsApi.types';

export const studentsApi = {
  getStudents: async (): Promise<Student[]> =>
    apiRequest<Student[]>('/students', {
      method: 'GET',
      requiresAuth: true,
    }),
};
