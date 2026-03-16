import { apiRequest } from '../client/apiClient';
import { UpdateUserProfilePayload, UserProfile } from './usersApi.types';

export const usersApi = {
  getCurrentUserProfile: async (): Promise<UserProfile> =>
    apiRequest<UserProfile>('/users/me', {
      method: 'GET',
      requiresAuth: true,
    }),

  updateCurrentUserProfile: async (payload: UpdateUserProfilePayload): Promise<UserProfile> =>
    apiRequest<UserProfile>('/users/me', {
      method: 'PATCH',
      requiresAuth: true,
      body: JSON.stringify(payload),
    }),
};
