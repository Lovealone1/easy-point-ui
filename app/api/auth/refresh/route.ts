// ─────────────────────────────────────────────────────────────────────────────
// app/api/auth/refresh/route.ts
//
// BFF Route — Silent token refresh.
//
// Flow:
//   Browser (or middleware) → POST /api/auth/refresh
//     → NestJS POST /auth/refresh  (Cookie: refresh_token=<value>)
//       ← Set-Cookie: access_token, refresh_token (rotated)
//     ← Next.js reinjected cookies to browser
//     ← 200 { data: { message } }
//
// Mutex:
//   Uses a module-level Map keyed by SHA-256 hash of the refresh_token to
//   deduplicate concurrent refresh requests for the same token. All callers
//   sharing the same in-flight token await the same Promise.
// ─────────────────────────────────────────────────────────────────────────────
import { type NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, RefreshResponse } from '@/shared/api/types';
import { ok, fail, makeApiError } from '@/shared/api/types';

const BACKEND_URL = process.env.BACKEND_API_URL ?? 'http://localhost:3001';
const TIMEOUT_MS = 10_000;
const NODE_ENV = process.env.NODE_ENV;

// ---------------------------------------------------------------------------
// In-flight mutex — module singleton (per Next.js worker process)
// ---------------------------------------------------------------------------

/**
 * Key: SHA-256 hex hash of the refresh_token cookie value.
 * Value: The in-flight Promise returned by the NestJS /auth/refresh call.
 *
 * This prevents thundering-herd refreshes when the middleware and multiple
 * concurrent Server Components all detect an expired access_token at the
 * same time.
 */
const inflightRefreshMap = new Map<string, Promise<Response>>();

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<RefreshResponse>>> {
  // ── 1. Read refresh_token from incoming cookies ────────────────────────────
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!refreshToken) {
    return NextResponse.json(
      fail(makeApiError(401, 'MISSING_REFRESH_TOKEN', 'No refresh token found')),
      { status: 401 },
    );
  }

  // ── 2. Hash the token to use as mutex key ─────────────────────────────────
  const tokenKey = await hashToken(refreshToken);

  // ── 3. Deduplicate concurrent refreshes ───────────────────────────────────
  let nestResponsePromise = inflightRefreshMap.get(tokenKey);

  if (!nestResponsePromise) {
    nestResponsePromise = callNestRefresh(refreshToken, request);
    inflightRefreshMap.set(tokenKey, nestResponsePromise);

    // Clean up the mutex entry when the request completes (success or error)
    nestResponsePromise.finally(() => {
      inflightRefreshMap.delete(tokenKey);
    });
  }

  let nestResponse: Response;
  try {
    nestResponse = await nestResponsePromise;
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

  // ── 4. Handle NestJS errors ────────────────────────────────────────────────
  if (!nestResponse.ok) {
    // 401 from NestJS means the refresh token is invalid/revoked/expired
    if (nestResponse.status === 401) {
      return NextResponse.json(
        fail(makeApiError(401, 'REFRESH_TOKEN_INVALID', 'Session expired, please log in again')),
        { status: 401 },
      );
    }

    const error = await parseNestError(nestResponse);
    return NextResponse.json(fail(error), { status: nestResponse.status });
  }

  // ── 5. Parse NestJS body ───────────────────────────────────────────────────
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

  // ── 6. Reinject cookies and respond ───────────────────────────────────────
  const bffResponse = NextResponse.json<ApiResponse<RefreshResponse>>(
    ok<RefreshResponse>({
      message: nestBody.message ?? 'Tokens refreshed',
    }),
    { status: 200 },
  );

  relayCookies(nestResponse, bffResponse);

  return bffResponse;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Performs the actual HTTP call to NestJS.
 * The refresh_token is sent as a Cookie header (NestJS reads it from there),
 * NOT in the request body.
 */
async function callNestRefresh(
  refreshToken: string,
  originalRequest: NextRequest,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const forwardedFor =
      originalRequest.headers.get('x-forwarded-for') ??
      originalRequest.headers.get('x-real-ip') ??
      '127.0.0.1';

    return await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Send refresh_token as a cookie header — NestJS reads req.cookies
        Cookie: `refresh_token=${refreshToken}`,
        'X-Forwarded-For': forwardedFor,
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
function relayCookies(from: Response, to: NextResponse): void {
  const setCookies: string[] = from.headers.getSetCookie?.() ??
    splitSetCookieHeader(from.headers.get('set-cookie'));

  const isProduction = NODE_ENV === 'production';

  for (const cookie of setCookies) {
    const normalized = isProduction
      ? cookie
      : cookie.replace(/;\s*Secure/gi, '');

    to.headers.append('Set-Cookie', normalized);
  }
}

function splitSetCookieHeader(header: string | null): string[] {
  if (!header) return [];
  return header.split(/,(?=\s*[\w-]+=)/);
}

async function parseNestError(
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
