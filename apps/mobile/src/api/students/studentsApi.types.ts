export interface StudentSchool {
  id: string;
  name: string;
  city: string;
  address?: string;
}

export interface Student {
  id: string;
  parentId?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth?: string | null;
  grade: number | string | null;
  section?: string | null;
  schoolId?: string | null;
  allergies?: string | null;
  dietaryPreferences?: string | null;
  isActive?: boolean;
  profileImageUrl?: string | null;
  school: StudentSchool | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateStudentPayload {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  grade: string;
  schoolId: string;
  profileImageUrl?: string;
}

export interface UpdateStudentPayload {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  grade?: string;
  schoolId?: string;
  profileImageUrl?: string;
}

export interface DeleteStudentResponse {
  message: string;
}
