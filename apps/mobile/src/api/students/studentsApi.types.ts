export interface StudentSchool {
  id: string;
  name: string;
  city: string;
  address?: string;
}

export interface Student {
  id: string;
  fullName: string;
  grade: number | string | null;
  school: StudentSchool | null;
  createdAt: string;
}

export interface CreateStudentPayload {
  fullName: string;
  grade: string;
  schoolId: string;
}

export interface UpdateStudentPayload {
  fullName?: string;
  grade?: string;
  schoolId?: string;
}

export interface DeleteStudentResponse {
  message: string;
}
