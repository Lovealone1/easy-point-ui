// ─────────────────────────────────────────────────────────────────────────────
// app/api/admin/auth/request-otp/route.ts
//
// BFF Route — step 1 of the administration console sign-in.
//
// Forwards to NestJS /auth/admin/otp, which mints a code under its own
// ADMIN_LOGIN intent: a dashboard code will not open the console.
//
// The API answers identically for an address that is not a global
// administrator and sends nothing, so this route must not try to be clever
// about the response — relaying it as-is is what keeps the console from
// disclosing who holds admin rights.
// ─────────────────────────────────────────────────────────────────────────────
import { type NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/shared/api/types';
import { ok, fail, makeApiError } from '@/shared/api/types';
import { forwardedFor, parseNestError } from '@/shared/api/auth-bff';
import { NEST_AUTH_PREFIX } from '@/shared/api/session-cookies';

const BACKEND_URL = process.env.BACKEND_API_URL ?? 'http://localhost:3001';
const TIMEOUT_MS = 10_000;

interface OtpRequestSuccess {
  message: string;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<OtpRequestSuccess>>> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      fail(makeApiError(400, 'INVALID_JSON', 'Request body must be valid JSON')),
      { status: 400 },
    );
  }

  const email = (payload as Record<string, unknown> | null)?.['email'];

  if (typeof email !== 'string') {
    return NextResponse.json(
      fail(makeApiError(400, 'VALIDATION_ERROR', '`email` is required')),
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let nestResponse: Response;
  try {
    nestResponse = await fetch(`${BACKEND_URL}${NEST_AUTH_PREFIX.admin}/otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': forwardedFor(request),
      },
      // No intent, no userInfo, no invitation token: the console sign-in
      // cannot create an account or accept an invitation.
      body: JSON.stringify({ email }),
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

  let nestBody: { message?: string } = {};
  const text = await nestResponse.text();
  if (text) {
    try {
      nestBody = JSON.parse(text) as { message?: string };
    } catch {
      // Non-JSON 2xx — treat as success
    }
  }

  return NextResponse.json(
    ok<OtpRequestSuccess>({ message: nestBody.message ?? 'OTP code sent' }),
    { status: 200 },
  );
}
