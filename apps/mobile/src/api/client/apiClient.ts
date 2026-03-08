import { API_BASE_URL } from './apiConfig';

interface ApiSuccessResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

type ApiErrorPayload = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

const getErrorMessage = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const { message, error } = payload as ApiErrorPayload;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  if (typeof message === 'string' && message.trim().length > 0) {
    return message;
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  return null;
};

export class ApiClientError extends Error {
  statusCode?: number;
  payload?: unknown;

  constructor(message: string, statusCode?: number, payload?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.payload = payload;
  }
}

export const apiRequest = async <T>(endpoint: string, init: RequestInit = {}): Promise<T> => {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...(init.headers as Record<string, string>),
  };

  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers,
    });
  } catch {
    throw new ApiClientError('Unable to connect to server. Please check your internet connection.');
  }

  const contentType = response.headers.get('content-type') ?? '';
  const canParseJson = contentType.includes('application/json');
  const payload = canParseJson ? await response.json() : null;

  if (!response.ok) {
    const message = getErrorMessage(payload) ?? `Request failed with status ${response.status}`;
    throw new ApiClientError(message, response.status, payload);
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiSuccessResponse<T>).data;
  }

  return payload as T;
};
