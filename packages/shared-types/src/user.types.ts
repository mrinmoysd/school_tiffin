import { UserRole } from './auth.types';

export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  section?: string;
  schoolId: string;
  parentId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
