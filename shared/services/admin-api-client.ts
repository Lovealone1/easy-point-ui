/**
 * @file shared/services/admin-api-client.ts
 *
 * Client-side Axios instance for the ADMINISTRATION CONSOLE — browser only.
 *
 * Deliberately a second instance rather than a mode on `apiClient`:
 *
 *   Browser → this instance → /api/admin/v1/...  → console cookie → NestJS
 *   Browser → apiClient     → /api/v1/...        → dashboard cookie → NestJS
 *
 * Both shells live in one SPA, so anything stateful that decides "which
 * credential is this?" gets flipped by navigation. The previous design did
 * exactly that — AdminSessionProvider deleted a default header on mount and
 * BrandingProvider put it back — and the two shells ended up sharing one
 * session. Here the base URL decides, and a base URL cannot be flipped from
 * the other shell.
 *
 * Never set a default x-organization-id on this instance. Console pages that
 * act on one organization pass the header per request, which keeps it a
 * deliberate choice every time.
 *
 * Token refresh strategy mirrors apiClient's, against /api/admin/auth/refresh.
 * A 401 that survives the refresh dispatches `admin-auth:unauthorized`, which
 * the console shell listens for — distinct from the dashboard's event so
 * losing one session never evicts the other.
 */

import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { BFF_API_BASE, BFF_AUTH_BASE } from '@/shared/api/session-cookies';

export const ADMIN_UNAUTHORIZED_EVENT = 'admin-auth:unauthorized';

export const adminApiClient = axios.create({
  baseURL: BFF_API_BASE.admin,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ─────────────────────────────────────────────────────────────────────────────
// Refresh mutex — a single in-flight Promise shared by concurrent 401 retries.
// ─────────────────────────────────────────────────────────────────────────────
let refreshPromise: Promise<Response> | null = null;

async function silentRefresh(): Promise<Response> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch(`${BFF_AUTH_BASE.admin}/refresh`, {
    method: 'POST',
    signal: AbortSignal.timeout(10_000),
  }).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

adminApiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retried?: boolean };

    if (error.response?.status === 401 && !originalRequest._retried) {
      originalRequest._retried = true;

      const refreshed = await silentRefresh();

      if (refreshed.ok) {
        return adminApiClient(originalRequest);
      }
      if (refreshed.status !== 401) {
        throw new axios.AxiosError(
          'Console session refresh unavailable',
          undefined,
          originalRequest,
          undefined,
          {
            status: refreshed.status,
            statusText: refreshed.statusText,
            data: null,
            headers: {},
            config: originalRequest,
          },
        );
      }
    }

    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(ADMIN_UNAUTHORIZED_EVENT));
      }
    }

    // No TRIAL_EXPIRED handling here, unlike apiClient: a lapsed organization
    // subscription has nothing to do with the console, and bouncing an
    // administrator to /trial-expired would be nonsense.

    return Promise.reject(error);
  },
);
