// ─────────────────────────────────────────────────────────────────────────────
// app/api/auth/logout/route.ts
//
// BFF Route — Logout current session.
//
// Flow:
//   Browser → POST /api/auth/logout
//     → NestJS POST /auth/logout  (Authorization: Bearer <access_token>)
//       ← 200 { message }  (NestJS may also clear its own cookies)
//     ← Next.js sets Max-Age=0 on both cookies to force browser deletion
//     ← 200 { data: { message } }
//
// NestJS's logout endpoint is protected by JwtAuthGuard, so we must send
// the access_token as a Bearer token in the Authorization header.
// ─────────────────────────────────────────────────────────────────────────────
import { type NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/shared/api/types';
import { ok, fail, makeApiError } from '@/shared/api/types';

const BACKEND_URL = process.env.BACKEND_API_URL ?? 'http://localhost:3001';
const TIMEOUT_MS = 10_000;

interface LogoutResponse {
  message: string;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<LogoutResponse>>> {
  // ── 1. Read tokens from incoming cookies ───────────────────────────────────
  const accessToken = request.cookies.get('access_token')?.value;

  // We can still attempt to clear cookies even without a valid token.
  // However, NestJS requires a valid Bearer token to revoke the DB session.
  // If no access_token is present we still clear the browser cookies.

  // ── 2. Call NestJS to revoke server-side session ───────────────────────────
  if (accessToken) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const forwardedFor =
        request.headers.get('x-forwarded-for') ??
        request.headers.get('x-real-ip') ??
        '127.0.0.1';

      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'X-Forwarded-For': forwardedFor,
        },
        signal: controller.signal,
      });
      // We intentionally ignore non-2xx responses here: the session may
      // already be revoked (expired token). Either way we clear browser cookies.
    } catch {
      // Network error or timeout — proceed to clear browser cookies regardless
    } finally {
      clearTimeout(timeout);
    }
  }

  // ── 3. Build response that clears browser cookies ─────────────────────────
  const bffResponse = NextResponse.json<ApiResponse<LogoutResponse>>(
    ok<LogoutResponse>({ message: 'Logged out successfully' }),
    { status: 200 },
  );

  // Expire both cookies immediately. We replicate the same attributes NestJS
  // used when setting them (Path, SameSite) so the browser matches correctly.
  // The `Secure` flag is omitted in development (http://localhost).
  const isProduction = process.env.NODE_ENV === 'production';
  const secureFlag = isProduction ? '; Secure' : '';

  bffResponse.headers.append(
    'Set-Cookie',
    `access_token=; Path=/; HttpOnly; SameSite=Lax${secureFlag}; Max-Age=0`,
  );

  bffResponse.headers.append(
    'Set-Cookie',
    `refresh_token=; Path=/; HttpOnly; SameSite=Lax${secureFlag}; Max-Age=0`,
  );

  return bffResponse;
}
