// ─────────────────────────────────────────────────────────────────────────────
// features/auth/services/admin-auth.service.ts
//
// Client-side service for the administration console sign-in.
//
// Every call goes to /api/admin/auth/*, which is what binds it to the console
// cookies. The dashboard equivalent in auth.service.ts talks to /api/auth/*
// and the two never cross.
// ─────────────────────────────────────────────────────────────────────────────
import type { ApiResponse, VerifyOtpResponse } from '@/shared/api/types';
import type { AuthUser } from '@/features/auth/types/auth.types';
import { BFF_AUTH_BASE } from '@/shared/api/session-cookies';
import { adminApiClient } from '@/shared/services/admin-api-client';

async function post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  const res = await fetch(`${BFF_AUTH_BASE.admin}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<ApiResponse<T>>;
}

/**
 * Step 1 — email a console sign-in code.
 *
 * Answers the same way whether or not the address belongs to a global
 * administrator, by design: the console does not disclose who holds admin
 * rights. An ineligible address simply never receives a code and fails at
 * step 2.
 */
export async function requestAdminOtp(email: string): Promise<ApiResponse<{ message: string }>> {
  return post<{ message: string }>('/request-otp', { email });
}

/**
 * Step 2 — verify the code and open a console session.
 *
 * On success the BFF relays the console cookies. Answers 403 when the account
 * is not a global administrator, even if the code was correct.
 */
export async function verifyAdminOtp(
  email: string,
  code: string,
): Promise<ApiResponse<VerifyOtpResponse>> {
  return post<VerifyOtpResponse>('/verify-otp', { email, code });
}

/**
 * Ends the console session only. Any dashboard session in the same browser
 * stays signed in.
 */
export async function adminLogout(): Promise<ApiResponse<{ message: string }>> {
  return post<{ message: string }>('/logout', {});
}

export interface AdminProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  globalRole: AuthUser['globalRole'];
}

/** The signed-in administrator's profile, on the console session. */
export async function getAdminMe(): Promise<AdminProfile> {
  const response = await adminApiClient.get<AdminProfile>('/auth/admin/me');
  return response.data;
}
