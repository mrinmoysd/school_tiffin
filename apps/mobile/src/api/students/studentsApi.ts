import { apiRequest } from '../client/apiClient';
import {
  CreateStudentPayload,
  DeleteStudentResponse,
  Student,
  UpdateStudentPayload,
} from './studentsApi.types';

export const studentsApi = {
  getStudents: async (): Promise<Student[]> =>
    apiRequest<Student[]>('/students', {
      method: 'GET',
      requiresAuth: true,
    }),

  getStudentById: async (studentId: string): Promise<Student> =>
    apiRequest<Student>(`/students/${studentId}`, {
      method: 'GET',
      requiresAuth: true,
    }),

  createStudent: async (payload: CreateStudentPayload): Promise<Student> =>
    apiRequest<Student>('/students', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(payload),
    }),

  updateStudent: async (studentId: string, payload: UpdateStudentPayload): Promise<Student> =>
    apiRequest<Student>(`/students/${studentId}`, {
      method: 'PATCH',
      requiresAuth: true,
      body: JSON.stringify(payload),
    }),

  deleteStudent: async (studentId: string): Promise<DeleteStudentResponse> =>
    apiRequest<DeleteStudentResponse>(`/students/${studentId}`, {
      method: 'DELETE',
      requiresAuth: true,
    }),
};
