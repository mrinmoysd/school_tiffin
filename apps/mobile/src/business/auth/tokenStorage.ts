import * as Keychain from 'react-native-keychain';
import { AuthTokens } from '../../api/auth/authApi.types';

const KEYCHAIN_SERVICE = 'school-tiffin-auth';
const KEYCHAIN_ACCOUNT = 'session';

export const tokenStorage = {
  saveTokens: async (tokens: AuthTokens): Promise<void> => {
    await Keychain.setGenericPassword(KEYCHAIN_ACCOUNT, JSON.stringify(tokens), {
      service: KEYCHAIN_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },

  getTokens: async (): Promise<AuthTokens | null> => {
    const credentials = await Keychain.getGenericPassword({
      service: KEYCHAIN_SERVICE,
    });

    if (!credentials) {
      return null;
    }

    try {
      return JSON.parse(credentials.password) as AuthTokens;
    } catch {
      await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
      return null;
    }
  },

  clearTokens: async (): Promise<void> => {
    await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
  },
};
