import axios, { AxiosError, type AxiosInstance } from 'axios';
import i18n from '@/i18n';
import type { ErrorResponse } from './types';

const TOKEN_STORAGE_KEY = 'cphos.token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * Callback invoked when the API returns 401 Unauthorized so the app can
 * clear auth state and redirect to the login screen.
 */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

const baseURL = import.meta.env.VITE_API_BASE_URL || '';

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/** Extract a human-readable message from an axios error / FastAPI detail. */
export function extractErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (axios.isAxiosError(error)) {
    // 4xx (except 422) use the stable {code, detail} envelope; 422 keeps the
    // FastAPI {detail: ValidationError[]} shape.
    const data = error.response?.data as
      | (Partial<Omit<ErrorResponse, 'detail'>> & {
          detail?: string | Array<{ msg?: string }>;
        })
      | undefined;
    if (data) {
      // Prefer a localized message for known codes, else the backend detail.
      if (typeof data.code === 'string' && data.code) {
        const localized = i18n.t(`errors.${data.code}`, { defaultValue: '' });
        if (localized) return localized;
      }
      if (typeof data.detail === 'string') return data.detail;
      if (Array.isArray(data.detail) && data.detail[0]?.msg) {
        return data.detail.map((d) => d.msg).join('; ');
      }
    }
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
