export interface StudentSchool {
  id: string;
  name: string;
  city: string;
  address?: string;
}

export interface Student {
  id: string;
  fullName: string;
  grade: number;
  school: StudentSchool | null;
  createdAt: string;
}
