const DEFAULT_API_BASE_URL = 'http://localhost:3000/v1';

const normalizeBaseUrl = (value?: string): string => {
  if (!value) {
    return DEFAULT_API_BASE_URL;
  }

  return value.replace(/\/+$/, '');
};

export const API_BASE_URL = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
