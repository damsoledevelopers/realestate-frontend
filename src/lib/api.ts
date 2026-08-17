import { getApiBaseUrl } from '@/lib/apiBase';

const API_URL = getApiBaseUrl();

export interface ApiError {
  message: string;
  errors?: { msg: string; path?: string }[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  token: string | null;
}

export function getApiErrorMessage(err: unknown, fallback = 'Request failed'): string {
  const error = err as ApiError;
  if (error?.errors?.length) {
    return error.errors.map((e) => e.msg).join('. ');
  }
  return error?.message || fallback;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.success === false) {
    throw {
      message: data.message || 'Request failed',
      errors: data.data?.errors || data.errors,
    } as ApiError;
  }

  if (data.success === true && data.data !== undefined && !data.token) {
    return data.data as T;
  }

  return data as T;
}

async function formRequest<T>(
  endpoint: string,
  method: 'POST' | 'PUT',
  formData: FormData,
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, { method, headers, body: formData });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.success === false) {
    throw {
      message: data.message || 'Request failed',
      errors: data.data?.errors || data.errors,
    } as ApiError;
  }

  if (data.success === true && data.data !== undefined && !data.token) {
    return data.data as T;
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string, token?: string | null) =>
    request<T>(endpoint, { method: 'GET' }, token),

  post: <T>(endpoint: string, body: unknown, token?: string | null) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }, token),

  put: <T>(endpoint: string, body: unknown, token?: string | null) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }, token),

  patch: <T>(endpoint: string, body: unknown, token?: string | null) =>
    request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }, token),

  delete: <T>(endpoint: string, token?: string | null, body?: unknown) =>
    request<T>(
      endpoint,
      { method: 'DELETE', body: body ? JSON.stringify(body) : undefined },
      token
    ),

  postForm: <T>(endpoint: string, formData: FormData, token?: string | null) =>
    formRequest<T>(endpoint, 'POST', formData, token),

  putForm: <T>(endpoint: string, formData: FormData, token?: string | null) =>
    formRequest<T>(endpoint, 'PUT', formData, token),
};
