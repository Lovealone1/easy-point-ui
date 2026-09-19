// ─────────────────────────────────────────────────────────────────────────────
// shared/api/auth-bff.ts
//
// The refresh and logout machinery, parameterised by application.
//
// The dashboard and the console run the same rotation dance against different
// cookies and different NestJS routes. Keeping one implementation means the
// console cannot quietly drift away from the dashboard's — in particular the
// in-flight mutex below, which is the fiddly part.
// ─────────────────────────────────────────────────────────────────────────────
import { type NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, RefreshResponse } from '@/shared/api/types';
import { ok, fail, makeApiError } from '@/shared/api/types';
import { NEST_AUTH_PREFIX, SESSION_COOKIES, type SessionScope } from '@/shared/api/session-cookies';

const BACKEND_URL = process.env.BACKEND_API_URL ?? 'http://localhost:3001';
const TIMEOUT_MS = 10_000;
const NODE_ENV = process.env.NODE_ENV;

/**
 * Key: SHA-256 hex hash of the refresh cookie value.
 * Value: the in-flight Promise of the NestJS refresh call.
 *
 * Prevents a thundering herd when several Server Components and the client
 * interceptor all notice an expired access token at once. Keyed by the token
 * itself, so the two applications never share an entry.
 */
const inflightRefreshMap = new Map<string, Promise<Response>>();

export interface LogoutResponse {
  message: string;
}

// ---------------------------------------------------------------------------
// Refresh
// ---------------------------------------------------------------------------

export async function handleRefresh(
  request: NextRequest,
  scope: SessionScope,
): Promise<NextResponse<ApiResponse<RefreshResponse>>> {
  const refreshToken = request.cookies.get(SESSION_COOKIES[scope].refresh)?.value;

  if (!refreshToken) {
    return clearSessionCookies(
      NextResponse.json(
        fail(makeApiError(401, 'MISSING_REFRESH_TOKEN', 'No refresh token found')),
        { status: 401 },
      ),
      scope,
    );
  }

  const tokenKey = await hashToken(refreshToken);

  let nestResponsePromise = inflightRefreshMap.get(tokenKey);

  if (!nestResponsePromise) {
    nestResponsePromise = callNestRefresh(refreshToken, request, scope).finally(() => {
      inflightRefreshMap.delete(tokenKey);
    });
    inflightRefreshMap.set(tokenKey, nestResponsePromise);
  }

  let nestResponse: Response;
  try {
    // Each caller must own its body stream, including error responses.
    nestResponse = (await nestResponsePromise).clone();
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      fail(
        makeApiError(
          503,
          isTimeout ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
          isTimeout ? 'Auth service timed out during refresh' : 'Auth service unavailable',
        ),
      ),
      { status: 503 },
    );
  }

  if (!nestResponse.ok) {
    // 401 from NestJS means the refresh token is invalid/revoked/expired.
    if (nestResponse.status === 401) {
      return clearSessionCookies(
        NextResponse.json(
          fail(makeApiError(401, 'REFRESH_TOKEN_INVALID', 'Session expired, please log in again')),
          { status: 401 },
        ),
        scope,
      );
    }

    const error = await parseNestError(nestResponse);
    return NextResponse.json(fail(error), { status: nestResponse.status });
  }

  type NestRefreshBody = { message?: string };
  let nestBody: NestRefreshBody = {};
  const text = await nestResponse.text();
  if (text) {
    try {
      nestBody = JSON.parse(text) as NestRefreshBody;
    } catch {
      // Non-JSON 2xx — tolerate silently
    }
  }

  const bffResponse = NextResponse.json<ApiResponse<RefreshResponse>>(
    ok<RefreshResponse>({ message: nestBody.message ?? 'Tokens refreshed' }),
    { status: 200 },
  );

  relayCookies(nestResponse, bffResponse);

  return bffResponse;
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

/**
 * Revokes one application's session and clears only its cookies. Signing out
 * of the console leaves any dashboard session alone, and the reverse — which
 * is the behaviour the split exists to provide.
 */
export async function handleLogout(
  request: NextRequest,
  scope: SessionScope,
): Promise<NextResponse<ApiResponse<LogoutResponse>>> {
  const accessToken = request.cookies.get(SESSION_COOKIES[scope].access)?.value;
  const refreshToken = request.cookies.get(SESSION_COOKIES[scope].refresh)?.value;

  // NestJS needs a valid Bearer token to revoke the server-side session, but
  // the browser cookies get cleared either way.
  if (accessToken) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      await fetch(`${BACKEND_URL}${NEST_AUTH_PREFIX[scope]}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'X-Forwarded-For': forwardedFor(request),
          ...(refreshToken
            ? { Cookie: `${SESSION_COOKIES[scope].refresh}=${refreshToken}` }
            : {}),
        },
        signal: controller.signal,
      });
      // Non-2xx is ignored on purpose: the session may already be revoked.
    } catch {
      // Network error or timeout — proceed to clear browser cookies regardless
    } finally {
      clearTimeout(timeout);
    }
  }

  return clearSessionCookies(
    NextResponse.json<ApiResponse<LogoutResponse>>(
      ok<LogoutResponse>({ message: 'Logged out successfully' }),
      { status: 200 },
    ),
    scope,
  );
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

export function clearSessionCookies<T>(
  response: NextResponse<T>,
  scope: SessionScope,
): NextResponse<T> {
  for (const name of [SESSION_COOKIES[scope].access, SESSION_COOKIES[scope].refresh]) {
    response.cookies.set(name, '', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: NODE_ENV === 'production',
      maxAge: 0,
    });
  }
  return response;
}

export function forwardedFor(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for') ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'
  );
}

async function callNestRefresh(
  refreshToken: string,
  originalRequest: NextRequest,
  scope: SessionScope,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    return await fetch(`${BACKEND_URL}${NEST_AUTH_PREFIX[scope]}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // NestJS reads the refresh token from req.cookies, under the name
        // belonging to this application.
        Cookie: `${SESSION_COOKIES[scope].refresh}=${refreshToken}`,
        'X-Forwarded-For': forwardedFor(originalRequest),
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Computes the SHA-256 hex digest of a string using the Web Crypto API.
 * Available natively in both Node.js (≥15) and Edge Runtime — no imports needed.
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Copies `Set-Cookie` headers from the NestJS response to the BFF response.
 * Strips the `Secure` flag in non-production environments.
 */
export function relayCookies(from: Response, to: NextResponse): void {
  const setCookies: string[] =
    from.headers.getSetCookie?.() ?? splitSetCookieHeader(from.headers.get('set-cookie'));

  const isProduction = NODE_ENV === 'production';

  for (const cookie of setCookies) {
    const normalized = isProduction ? cookie : cookie.replace(/;\s*Secure/gi, '');
    to.headers.append('Set-Cookie', normalized);
  }
}

function splitSetCookieHeader(header: string | null): string[] {
  if (!header) return [];
  return header.split(/,(?=\s*[\w-]+=)/);
}

export async function parseNestError(
  response: Response,
): Promise<ReturnType<typeof makeApiError>> {
  try {
    const json = (await response.json()) as Record<string, unknown>;
    return makeApiError(
      response.status,
      typeof json['error'] === 'string' ? json['error'] : 'API_ERROR',
      typeof json['message'] === 'string' ? json['message'] : response.statusText,
    );
  } catch {
    return makeApiError(response.status, 'API_ERROR', response.statusText || 'Unknown error');
  }
}
