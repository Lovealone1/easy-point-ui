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
 *
 * Token refresh strategy:
 *   On 401, this interceptor calls /api/auth/refresh (BFF) to silently rotate
 *   the access_token using the HttpOnly refresh_token cookie.
 *   A module-level Promise mutex prevents concurrent refresh races.
 *   If the refresh also fails with 401, the user is evicted via auth:unauthorized.
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

// ─────────────────────────────────────────────────────────────────────────────
// Refresh mutex
// A single in-flight Promise shared by all concurrent 401 retries.
// ─────────────────────────────────────────────────────────────────────────────
let refreshPromise: Promise<boolean> | null = null;

async function silentRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch('/api/auth/refresh', { method: 'POST' })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

// ─────────────────────────────────────────────────────────────────────────────
// Request interceptor — no-op (org header is set imperatively by the store)
// ─────────────────────────────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => config,
  (error: AxiosError) => Promise.reject(error),
);

// ─────────────────────────────────────────────────────────────────────────────
// Response interceptor — auto-refresh on 401, evict on second 401
// ─────────────────────────────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retried?: boolean };

    if (error.response?.status === 401 && !originalRequest._retried) {
      originalRequest._retried = true;

      const refreshed = await silentRefresh();

      if (refreshed) {
        // Cookies have been rotated — retry the original request.
        return apiClient(originalRequest);
      }
    }

    // Token refresh failed or this is already a retry — evict the user.
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }

    return Promise.reject(error);
  },
);

