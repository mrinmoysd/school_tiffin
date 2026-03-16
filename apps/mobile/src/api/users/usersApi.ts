import { apiRequest } from '../client/apiClient';
import { UserProfile } from './usersApi.types';

export const usersApi = {
  getCurrentUserProfile: async (): Promise<UserProfile> =>
    apiRequest<UserProfile>('/users/me', {
      method: 'GET',
      requiresAuth: true,
    }),
};
