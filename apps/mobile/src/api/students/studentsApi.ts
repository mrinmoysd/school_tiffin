import { apiRequest } from '../client/apiClient';
import {
  CreateStudentPayload,
  DeleteStudentResponse,
  Student,
  UpdateStudentPayload,
} from './studentsApi.types';
import { resolveNameParts } from '../../utils/name';

type RawStudent = {
  id: string;
  parentId?: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  dateOfBirth?: string | null;
  grade: number | string | null;
  section?: string | null;
  schoolId?: string | null;
  allergies?: string | null;
  dietaryPreferences?: string | null;
  isActive?: boolean;
  profileImageUrl?: string | null;
  school: Student['school'];
  createdAt: string;
  updatedAt?: string;
};

const mapStudent = (student: RawStudent): Student => {
  const nameParts = resolveNameParts(student);

  return {
    ...student,
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    fullName: nameParts.fullName ?? '',
    dateOfBirth: student.dateOfBirth ?? null,
    schoolId: student.schoolId ?? student.school?.id ?? null,
  };
};

export const studentsApi = {
  getStudents: async (): Promise<Student[]> => {
    const students = await apiRequest<RawStudent[]>('/students', {
      method: 'GET',
      requiresAuth: true,
    });

    return students.map(mapStudent);
  },

  getStudentById: async (studentId: string): Promise<Student> => {
    const student = await apiRequest<RawStudent>(`/students/${studentId}`, {
      method: 'GET',
      requiresAuth: true,
    });

    return mapStudent(student);
  },

  createStudent: async (payload: CreateStudentPayload): Promise<Student> => {
    const student = await apiRequest<RawStudent>('/students', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(payload),
    });

    return mapStudent(student);
  },

  updateStudent: async (studentId: string, payload: UpdateStudentPayload): Promise<Student> => {
    const student = await apiRequest<RawStudent>(`/students/${studentId}`, {
      method: 'PATCH',
      requiresAuth: true,
      body: JSON.stringify(payload),
    });

    return mapStudent(student);
  },

  deleteStudent: async (studentId: string): Promise<DeleteStudentResponse> =>
    apiRequest<DeleteStudentResponse>(`/students/${studentId}`, {
      method: 'DELETE',
      requiresAuth: true,
    }),
};
