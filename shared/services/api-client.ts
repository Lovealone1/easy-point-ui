/**
 * @file shared/services/api-client.ts
 *
 * Client-side Axios instance — runs in the BROWSER only.
 *
 * Architecture:
 *   Browser → this Axios instance → /api/v1/[module]/... (Next.js Route Handlers)
 *                                            ↓
 *                                   backendFetch() in server/
 *                                            ↓
 *                                   NestJS Backend (localhost:3001)
 *
 * The browser never talks to localhost:3001 directly.
 * Cookies (access_token) are managed exclusively server-side.
 */

import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';


/**
 * Pre-configured Axios instance targeting the Next.js BFF API.
 *
 * Base URL is always `/api/v1` — relative to the current origin,
 * so it works on any environment (localhost, staging, production)
 * without extra configuration.
 */
export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);


apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Do NOT use window.location.href here — that causes a full page reload
      // and loses all in-flight React state. Instead, dispatch the global event
      // that AuthWatcher (in the root layout) listens to for a soft redirect.
      // This mirrors the behaviour of clientFetch in @/shared/api/client-fetch.
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }

    return Promise.reject(error);
  },
);
