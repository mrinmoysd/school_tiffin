import { apiRequest } from '../client/apiClient';
import { UpdateUserProfilePayload, UserProfile } from './usersApi.types';
import { resolveNameParts, splitFullName } from '../../utils/name';

type RawUserProfile = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  profileImageUrl?: string | null;
  role: string;
  isActive?: boolean;
  maxStudents?: number | null;
  phoneNumber?: string | null;
  phone?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  emailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
};

const mapUserProfile = (profile: RawUserProfile): UserProfile => {
  const nameParts = resolveNameParts(profile);

  return {
    ...profile,
    firstName: nameParts.firstName || null,
    lastName: nameParts.lastName || null,
    fullName: nameParts.fullName,
    maxStudents: typeof profile.maxStudents === 'number' ? profile.maxStudents : null,
  };
};

export const usersApi = {
  getCurrentUserProfile: async (): Promise<UserProfile> => {
    const profile = await apiRequest<RawUserProfile>('/users/me', {
      method: 'GET',
      requiresAuth: true,
    });

    return mapUserProfile(profile);
  },

  updateCurrentUserProfile: async (payload: UpdateUserProfilePayload): Promise<UserProfile> => {
    const splitName = splitFullName(payload.fullName);
    const firstName = payload.firstName?.trim() || splitName.firstName;
    const lastName = payload.lastName?.trim() || splitName.lastName;

    const response = await apiRequest<RawUserProfile>('/users/me', {
      method: 'PATCH',
      requiresAuth: true,
      body: JSON.stringify({
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        ...(payload.email ? { email: payload.email } : {}),
        ...(payload.phone ? { phone: payload.phone } : {}),
        ...(payload.profileImageUrl ? { profileImageUrl: payload.profileImageUrl } : {}),
      }),
    });

    return mapUserProfile(response);
  },
};
