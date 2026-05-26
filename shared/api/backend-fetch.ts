// ─────────────────────────────────────────────────────────────────────────────
// shared/api/backend-fetch.ts
//
// Server-side fetch utility for the BFF catch-all proxy route.
// Runs exclusively in Next.js Route Handlers and Server Components.
// NEVER imported in the browser.
//
// Moved from: server/backend-api-client.ts
//
// Difference vs shared/api/server-fetch.ts:
//   - server-fetch.ts  → used by Server Components (auth-aware, with retry)
//   - backend-fetch.ts → used by the generic /api/v1/[...path] proxy route
//     (forwards any authenticated request from Axios/clientFetch to NestJS)
// ─────────────────────────────────────────────────────────────────────────────
import { cookies } from 'next/headers';
import type { BackendFetchOptions } from '@/shared/types/api.types';
import { BackendApiError } from '@/shared/utils/api-error';

const BACKEND_URL = process.env.BACKEND_API_URL ?? 'http://localhost:3001';
const API_VERSION = process.env.API_VERSION ?? 'v1';

/**
 * Builds the full URL for a versioned backend endpoint.
 *
 * Example:
 *   buildApiUrl('auth/login')  →  http://localhost:3001/api/v1/auth/login
 *   buildApiUrl('/auth/login') →  http://localhost:3001/api/v1/auth/login
 *
 * @param endpoint - The module-relative path (e.g. 'auth/login', '/products')
 */
export function buildApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${BACKEND_URL}/api/${API_VERSION}/${cleanEndpoint}`;
}

/**
 * Server-side fetch wrapper for the BFF proxy.
 *
 * Features:
 * - Automatically attaches the Authorization header from the `access_token` cookie.
 * - Forwards x-organization-id from cookies when present.
 * - Forwards Content-Type: application/json for JSON bodies.
 * - Throws a typed `BackendApiError` on non-2xx responses.
 * - Returns `null` for 204 No Content responses.
 *
 * Usage (in the catch-all proxy Route Handler):
 * ```ts
 * const data = await backendFetch<User[]>('users');
 * const user = await backendFetch<User>('users/1');
 * await backendFetch('auth/logout', { method: 'POST', skipAuth: false });
 * ```
 *
 * @param endpoint - Relative path from the API version root (e.g. 'auth/login')
 * @param options  - Extended RequestInit with typed body and BFF-specific flags
 * @template T     - Expected response body type
 */
export async function backendFetch<T = unknown>(
  endpoint: string,
  options: BackendFetchOptions = {},
): Promise<T> {
  const { body, skipAuth = false, rawUrl, ...restOptions } = options;

  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const orgId = cookieStore.get('x-organization-id')?.value;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(orgId && { 'x-organization-id': orgId }),
    ...(restOptions.headers as Record<string, string>),
  };

  if (token && !skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let serializedBody: BodyInit | undefined;

  const isFormData = body instanceof FormData || (body && typeof body === 'object' && body.constructor && body.constructor.name === 'FormData');

  if (isFormData) {
    delete headers['Content-Type'];
    serializedBody = body as unknown as BodyInit;
  } else if (body !== undefined) {
    serializedBody = JSON.stringify(body);
  }

  const url = rawUrl ?? buildApiUrl(endpoint);

  const response = await fetch(url, {
    ...restOptions,
    headers,
    body: serializedBody,
  });

  if (response.status === 204) {
    return null as T;
  }

  if (!response.ok) {
    let apiError: { statusCode: number; message: string | string[]; error?: string } = {
      statusCode: response.status,
      message: response.statusText,
    };
    try {
      const json = await response.json();
      apiError = { ...apiError, ...(json as object) };
    } catch {
      // non-JSON error body — keep defaults
    }
    throw new BackendApiError(response.status, apiError);
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (null as T);
}
