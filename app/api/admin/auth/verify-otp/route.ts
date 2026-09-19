// ─────────────────────────────────────────────────────────────────────────────
// app/api/admin/auth/verify-otp/route.ts
//
// BFF Route — step 2 of the administration console sign-in.
//
// Flow:
//   Browser → POST /api/admin/auth/verify-otp  { email, code }
//     → NestJS POST /auth/admin/otp/verify     { email, otp }
//       ← Set-Cookie: admin_access_token, admin_refresh_token (HttpOnly)
//     ← Next.js relays the cookies to the browser
//     ← { data: { message, user } }
//
// A valid code is not enough: NestJS answers 403 unless the account is a
// global administrator, and the session it mints carries scope ADMIN, which
// no dashboard route will accept.
// ─────────────────────────────────────────────────────────────────────────────
import { type NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, VerifyOtpResponse } from '@/shared/api/types';
import { ok, fail, makeApiError } from '@/shared/api/types';
import { forwardedFor, parseNestError, relayCookies } from '@/shared/api/auth-bff';
import { NEST_AUTH_PREFIX } from '@/shared/api/session-cookies';

const BACKEND_URL = process.env.BACKEND_API_URL ?? 'http://localhost:3001';
const TIMEOUT_MS = 10_000;

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<VerifyOtpResponse>>> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      fail(makeApiError(400, 'INVALID_JSON', 'Request body must be valid JSON')),
      { status: 400 },
    );
  }

  const body = payload as Record<string, unknown> | null;
  const email = body?.['email'];
  const code = body?.['code'];

  if (typeof email !== 'string' || typeof code !== 'string') {
    return NextResponse.json(
      fail(makeApiError(400, 'VALIDATION_ERROR', '`email` and `code` are required')),
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let nestResponse: Response;
  try {
    nestResponse = await fetch(`${BACKEND_URL}${NEST_AUTH_PREFIX.admin}/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': forwardedFor(request),
        // Forward User-Agent so NestJS can populate session metadata
        'User-Agent': request.headers.get('user-agent') ?? 'unknown',
      },
      // BFF rename: `code` → `otp` (NestJS DTO field name). Nothing else is
      // forwarded — the intent is fixed server-side.
      body: JSON.stringify({ email, otp: code }),
      signal: controller.signal,
    });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      fail(
        makeApiError(
          503,
          isTimeout ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
          isTimeout ? 'Request to auth service timed out' : 'Auth service unavailable',
        ),
      ),
      { status: 503 },
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!nestResponse.ok) {
    const error = await parseNestError(nestResponse);
    return NextResponse.json(fail(error), { status: nestResponse.status });
  }

  type NestSuccess = {
    message: string;
    user: { id: string; email: string };
  };

  let nestData: NestSuccess;
  try {
    const text = await nestResponse.text();
    nestData = JSON.parse(text) as NestSuccess;
  } catch {
    return NextResponse.json(
      fail(makeApiError(502, 'INVALID_UPSTREAM_RESPONSE', 'Auth service returned an invalid response')),
      { status: 502 },
    );
  }

  const bffResponse = NextResponse.json<ApiResponse<VerifyOtpResponse>>(
    ok<VerifyOtpResponse>({ message: nestData.message, user: nestData.user }),
    { status: 200 },
  );

  relayCookies(nestResponse, bffResponse);

  return bffResponse;
}
