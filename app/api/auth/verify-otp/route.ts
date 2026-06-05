// ─────────────────────────────────────────────────────────────────────────────
// app/api/auth/verify-otp/route.ts
//
// BFF Route — Step 2 of the OTP flow.
//
// Flow:
//   Browser → POST /api/auth/verify-otp  { email, code, intent }
//     → NestJS POST /auth/otp/verify    { email, otp, intent }
//       ← Set-Cookie: access_token, refresh_token (HttpOnly)
//     ← Next.js reinjected Set-Cookie to browser
//     ← { data: { message, user } }
// ─────────────────────────────────────────────────────────────────────────────
import { type NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, OtpVerifyBody, VerifyOtpResponse } from '@/shared/api/types';
import { ok, fail, makeApiError } from '@/shared/api/types';

const BACKEND_URL = process.env.BACKEND_API_URL ?? 'http://localhost:3001';
const TIMEOUT_MS = 10_000;
const NODE_ENV = process.env.NODE_ENV;

// NestJS DTO field is `otp`, not `code`
interface NestVerifyBody {
  email: string;
  otp: string;
  intent: string;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<VerifyOtpResponse>>> {
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
    typeof (payload as Record<string, unknown>)['code'] !== 'string' ||
    typeof (payload as Record<string, unknown>)['intent'] !== 'string'
  ) {
    return NextResponse.json(
      fail(makeApiError(400, 'VALIDATION_ERROR', '`email`, `code`, and `intent` are required')),
      { status: 400 },
    );
  }

  const { email, code, intent, userInfo, invitationToken } = payload as OtpVerifyBody & {
    userInfo?: any;
    invitationToken?: string;
  };

  const nestBody: NestVerifyBody & { userInfo?: any; invitationToken?: string } = {
    email,
    otp: code,            // BFF rename: `code` → `otp` (NestJS DTO field name)
    intent: intent.toUpperCase(),
    userInfo,
    invitationToken,
  };

  // ── 2. Forward to NestJS ───────────────────────────────────────────────────
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let nestResponse: Response;
  try {
    const forwardedFor =
      request.headers.get('x-forwarded-for') ??
      request.headers.get('x-real-ip') ??
      '127.0.0.1';

    nestResponse = await fetch(`${BACKEND_URL}/api/v1/auth/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': forwardedFor,
        // Forward User-Agent so NestJS can populate session metadata
        'User-Agent': request.headers.get('user-agent') ?? 'unknown',
      },
      body: JSON.stringify(nestBody),
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

  // ── 3. Handle NestJS errors ────────────────────────────────────────────────
  if (!nestResponse.ok) {
    const error = await parseNestError(nestResponse);
    return NextResponse.json(fail(error), { status: nestResponse.status });
  }

  // ── 4. Parse NestJS success body ───────────────────────────────────────────
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

  // ── 5. Build BFF response and reinject cookies ─────────────────────────────
  const bffResponse = NextResponse.json<ApiResponse<VerifyOtpResponse>>(
    ok<VerifyOtpResponse>({
      message: nestData.message,
      user: nestData.user,
    }),
    { status: 200 },
  );

  relayCookies(nestResponse, bffResponse);

  return bffResponse;
}

// ---------------------------------------------------------------------------
// Cookie relay
// ---------------------------------------------------------------------------

/**
 * Copies `Set-Cookie` headers from the NestJS response to the BFF response
 * so the browser receives them under the Next.js domain.
 *
 * In development (NODE_ENV !== 'production') the `Secure` flag is stripped so
 * cookies work over plain http://localhost.
 */
function relayCookies(from: Response, to: NextResponse): void {
  // `getSetCookie()` returns each `Set-Cookie` header as a separate string,
  // correctly handling multi-value headers.
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

/**
 * Fallback split for runtimes that don't implement `getSetCookie()`.
 * Splits on commas that precede a cookie name (name=value pattern).
 */
function splitSetCookieHeader(header: string | null): string[] {
  if (!header) return [];
  // Split on ", " followed by a token (cookie name). This handles the edge
  // case where `expires` values contain commas (e.g. "Thu, 01 Jan ...").
  return header.split(/,(?=\s*[\w-]+=)/);
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
