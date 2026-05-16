// ─────────────────────────────────────────────────────────────────────────────
// shared/services/auth.service.ts
//
// Client-side service for the BFF auth routes.
//
// All methods call the Next.js BFF (/api/auth/*), which in turn
// forwards to NestJS. The browser's HttpOnly cookies are managed
// transparently — this module never touches them directly.
// ─────────────────────────────────────────────────────────────────────────────
import type { ApiResponse, OtpRequestBody, OtpVerifyBody, VerifyOtpResponse } from '@/shared/api/types';
import type { Intent } from '@/shared/api/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  phone?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<ApiResponse<T>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth Service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Step 1 — Request an OTP code.
 *
 * Sends `{ email, intent }` to the BFF which forwards to NestJS.
 * The intent ('LOGIN' | 'REGISTER') determines the backend flow.
 */
export async function requestOtp(
  email: string,
  intent: Intent,
): Promise<ApiResponse<{ message: string }>> {
  const body: OtpRequestBody = { email, intent };
  return post<{ message: string }>('/api/auth/request-otp', body);
}

/**
 * Step 2 — Verify the OTP code.
 *
 * The BFF will relay the Set-Cookie headers from NestJS so the browser
 * receives `access_token` and `refresh_token` as HttpOnly cookies.
 *
 * On success the response body contains the minimal user `{ id, email }`.
 */
export async function verifyOtp(
  email: string,
  code: string,
  intent: Intent,
): Promise<ApiResponse<VerifyOtpResponse>> {
  const body: OtpVerifyBody = { email, code, intent };
  return post<VerifyOtpResponse>('/api/auth/verify-otp', body);
}

/**
 * Silently refreshes the access token using the refresh_token HttpOnly cookie.
 *
 * Called automatically by the Axios interceptor on 401 responses.
 * The BFF uses a mutex to deduplicate concurrent refresh calls.
 */
export async function refreshTokens(): Promise<ApiResponse<{ message: string }>> {
  return post<{ message: string }>('/api/auth/refresh', {});
}

/**
 * Logs out the current user.
 *
 * The BFF forwards the access_token to NestJS to revoke the DB session,
 * then clears both HttpOnly cookies on the browser.
 */
export async function logout(): Promise<ApiResponse<{ message: string }>> {
  return post<{ message: string }>('/api/auth/logout', {});
}
