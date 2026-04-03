export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  profileImageUrl?: string | null;
  role: string;
  isActive?: boolean;
  phoneNumber?: string | null;
  phone?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  emailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
}

export interface UpdateUserProfilePayload {
  fullName?: string;
  email?: string;
  phone?: string;
  profileImageUrl?: string;
}
