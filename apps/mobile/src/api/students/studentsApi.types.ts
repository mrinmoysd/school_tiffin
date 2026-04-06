export interface StudentSchool {
  id: string;
  name: string;
  city: string;
  address?: string;
}

export interface Student {
  id: string;
  fullName: string;
  dateOfBirth?: string | null;
  grade: number | string | null;
  profileImageUrl?: string | null;
  school: StudentSchool | null;
  createdAt: string;
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
