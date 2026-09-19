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
import { ACTIVE_ORG_COOKIE, SESSION_COOKIES } from '@/shared/api/session-cookies';

const BACKEND_URL = process.env.BACKEND_API_URL ?? 'http://localhost:3001';
const API_VERSION = process.env.API_VERSION ?? 'v1';
const TIMEOUT_MS = Number(process.env.BACKEND_TIMEOUT_MS) || 30_000;

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
 * - Attaches the Authorization header from the cookie of the requested
 *   application (`scope`), so the admin proxy can never send the dashboard's
 *   token or the other way round.
 * - Forwards x-organization-id from the active-org cookie when present.
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
  const { body, skipAuth = false, rawUrl, scope = 'tenant', ...restOptions } = options;

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIES[scope].access)?.value;

  // The console is not a tenant and must never carry one implicitly: admin
  // pages that operate on a specific organization pass the header themselves,
  // per request, so it is always a deliberate choice.
  //
  // Read from ACTIVE_ORG_COOKIE, which the workspace picker actually writes.
  // This used to read a cookie named 'x-organization-id' that nothing ever
  // set, so no server-rendered dashboard request carried a tenant at all.
  const orgId = scope === 'tenant' ? cookieStore.get(ACTIVE_ORG_COOKIE)?.value : undefined;

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      ...restOptions,
      headers,
      body: serializedBody,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new BackendApiError(504, {
        statusCode: 504,
        message: 'Request to backend service timed out',
      });
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

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
