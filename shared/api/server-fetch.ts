// ─────────────────────────────────────────────────────────────────────────────
// lib/api/server-fetch.ts
// Server-side HTTP client for Server Components and Route Handlers.
// Runs exclusively in Node.js — never in the browser.
// ─────────────────────────────────────────────────────────────────────────────
import { cookies } from 'next/headers';
import { makeAuthError, type ApiError, type AuthError } from '@/shared/api/types';

const BACKEND_URL = process.env.BACKEND_API_URL ?? 'http://localhost:3001';
const TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function withTimeout(ms: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller;
}

/**
 * Typed error thrown by serverFetch when the caller receives a 401 and a
 * second attempt also fails, or when a refresh cycle itself fails.
 */
export class ServerAuthError extends Error {
  public readonly authError: AuthError;

  constructor(authError: AuthError) {
    super(authError.message);
    this.name = 'ServerAuthError';
    this.authError = authError;
  }
}

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

/**
 * Performs an authenticated HTTP request to the NestJS backend from the
 * server side (Server Components, Route Handlers).
 *
 * Behaviour:
 *  - Reads `access_token` from the incoming cookie store and injects it as
 *    `Authorization: Bearer <token>`.
 *  - On a 401 response, calls `/api/auth/refresh` internally (one retry).
 *  - If the refresh succeeds, the original request is retried once with the
 *    new access token obtained from the refresh response cookie. Because the
 *    Next.js cookie store is **read-only** in Server Components we read the
 *    token returned in the `Set-Cookie` header of the refresh response.
 *  - If the retry also fails, a `ServerAuthError` is thrown; the calling
 *    Server Component is responsible for redirecting.
 *  - No side-effects (no redirects). Keeps transport and navigation concerns
 *    separate.
 *
 * @param path    - Absolute path on NestJS, e.g. `/auth/otp/verify`
 * @param options - Standard RequestInit, extended with a typed `body`
 * @template T   - Expected response payload shape
 */
export async function serverFetch<T>(
  path: string,
  options: RequestInit & { body?: unknown } = {},
): Promise<T> {
  const { body, ...restOptions } = options;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;
  const orgId = cookieStore.get('x-organization-id')?.value;

  const buildHeaders = (token: string | undefined): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(orgId ? { 'x-organization-id': orgId } : {}),
    ...(restOptions.headers as Record<string, string> | undefined),
  });

  const serializedBody =
    body !== undefined ? JSON.stringify(body) : undefined;

  const doFetch = async (token: string | undefined): Promise<Response> => {
    const controller = withTimeout(TIMEOUT_MS);
    return fetch(`${BACKEND_URL}${path}`, {
      ...restOptions,
      headers: buildHeaders(token),
      body: serializedBody,
      signal: controller.signal,
    });
  };

  let response = await doFetch(accessToken);

  // ── 401: attempt a silent token refresh ──────────────────────────────────
  if (response.status === 401) {
    const refreshed = await attemptRefresh(refreshToken);

    if (!refreshed.ok) {
      throw new ServerAuthError(
        makeAuthError(401, 'AUTH_REFRESH_FAILED', 'Session expired'),
      );
    }

    // Extract the new access_token from the Set-Cookie of the refresh response
    const newToken = extractTokenFromSetCookie(
      refreshed.headers.get('set-cookie'),
    );

    response = await doFetch(newToken ?? accessToken);

    if (response.status === 401) {
      throw new ServerAuthError(
        makeAuthError(401, 'AUTH_UNAUTHORIZED', 'Unauthorized after refresh'),
      );
    }
  }

  // ── Non-2xx: normalise to ApiError ───────────────────────────────────────
  if (!response.ok) {
    const apiError = await parseNestError(response);
    throw apiError;
  }

  if (response.status === 204) {
    return null as T;
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (null as T);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Calls the BFF refresh route to obtain new tokens. */
async function attemptRefresh(refreshToken?: string): Promise<Response> {
  const controller = withTimeout(TIMEOUT_MS);
  // Use an absolute URL so this works in both Node and Edge runtimes.
  const nextUrl =
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000';

  return fetch(`${nextUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(refreshToken ? { Cookie: `refresh_token=${refreshToken}` } : {}),
    },
    signal: controller.signal,
  });
}

/**
 * Parses the `Set-Cookie` header from a refresh response and extracts the
 * `access_token` value. This is necessary because in Server Components the
 * cookie store is read-only and we cannot call `cookies().set()`.
 */
function extractTokenFromSetCookie(
  setCookieHeader: string | null,
): string | undefined {
  if (!setCookieHeader) return undefined;

  // Set-Cookie may contain multiple cookies separated by commas (non-standard
  // but common) or a single one. We look for `access_token=<value>`.
  const match = setCookieHeader.match(/(?:^|,\s*)access_token=([^;,]+)/);
  return match?.[1];
}

/** Converts a NestJS error response into a typed ApiError. */
async function parseNestError(response: Response): Promise<ApiError> {
  try {
    const json = (await response.json()) as Record<string, unknown>;
    return {
      status: response.status,
      code: typeof json['error'] === 'string' ? json['error'] : 'API_ERROR',
      message:
        typeof json['message'] === 'string'
          ? json['message']
          : response.statusText,
    };
  } catch {
    return {
      status: response.status,
      code: 'NETWORK_ERROR',
      message: response.statusText || 'Unknown error',
    };
  }
}
