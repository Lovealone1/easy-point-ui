// ─────────────────────────────────────────────────────────────────────────────
// app/api/auth/request-otp/route.ts
//
// BFF Route — Step 1 of the OTP flow.
//
// Currently wired to the development endpoint:
//   POST /api/v1/development/otp   (logs OTP to NestJS console)
//
// To switch to the production endpoint, change NESTJS_OTP_PATH below:
//   const NESTJS_OTP_PATH = '/auth/otp';
// ─────────────────────────────────────────────────────────────────────────────
import { type NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, OtpRequestBody } from '@/shared/api/types';
import { ok, fail, makeApiError } from '@/shared/api/types';

const BACKEND_URL = process.env.BACKEND_API_URL ?? 'http://localhost:3001';
const TIMEOUT_MS = 10_000;

// ── Toggle between dev and production endpoint ────────────────────────────────
// Development:  POST /api/v1/development/otp  (OTP printed to NestJS console)
// Production:   POST /auth/otp                (OTP sent via email)
const NESTJS_OTP_PATH = '/api/v1/development/otp'; // ← swap to '/auth/otp' for prod

interface OtpRequestSuccess {
  message: string;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<OtpRequestSuccess>>> {
  // ── 1. Parse and validate body ─────────────────────────────────────────────
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      fail(makeApiError(400, 'INVALID_JSON', 'Request body must be valid JSON')),
      { status: 400 },
    );
  }

  if (
    typeof payload !== 'object' ||
    payload === null ||
    typeof (payload as Record<string, unknown>)['email'] !== 'string' ||
    typeof (payload as Record<string, unknown>)['intent'] !== 'string'
  ) {
    return NextResponse.json(
      fail(makeApiError(400, 'VALIDATION_ERROR', '`email` and `intent` are required')),
      { status: 400 },
    );
  }

  const { email, intent } = payload as OtpRequestBody;

  // ── 2. Forward to NestJS ───────────────────────────────────────────────────
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let nestResponse: Response;
  try {
    const forwardedFor =
      request.headers.get('x-forwarded-for') ??
      request.headers.get('x-real-ip') ??
      '127.0.0.1';

    nestResponse = await fetch(`${BACKEND_URL}${NESTJS_OTP_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': forwardedFor,
      },
      body: JSON.stringify({ email, intent: intent.toUpperCase() }),
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

  // ── 3. Handle NestJS response ──────────────────────────────────────────────
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
    ok<OtpRequestSuccess>({
      message: nestBody.message ?? 'OTP code sent',
    }),
    { status: 200 },
  );
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

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
