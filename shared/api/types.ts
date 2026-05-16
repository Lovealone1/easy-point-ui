// ─────────────────────────────────────────────────────────────────────────────
// lib/api/types.ts
// Shared type contracts for the BFF authentication layer.
// ─────────────────────────────────────────────────────────────────────────────
import type { LoginUser } from '@/shared/types/auth.types';

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export interface ApiError {
  status: number;
  code: string;
  message: string;
}

export interface AuthError extends ApiError {
  readonly __brand: 'AuthError';
}

export function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    '__brand' in error &&
    (error as { __brand: unknown }).__brand === 'AuthError'
  );
}

export function makeAuthError(
  status: number,
  code: string,
  message: string,
): AuthError {
  return { status, code, message, __brand: 'AuthError' };
}

export function makeApiError(
  status: number,
  code: string,
  message: string,
): ApiError {
  return { status, code, message };
}

// ---------------------------------------------------------------------------
// Response wrapper
// ---------------------------------------------------------------------------

export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError };

export function ok<T>(data: T): ApiResponse<T> {
  return { data, error: null };
}

export function fail(error: ApiError): ApiResponse<never> {
  return { data: null, error };
}

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export type Intent = 'login' | 'register';

/** Maps to NestJS GenerateOtpDto */
export interface OtpRequestBody {
  email: string;
  intent: Intent;
}

/** Maps to NestJS VerifyOtpDto — `code` is renamed `otp` inside NestJS */
export interface OtpVerifyBody {
  email: string;
  /** The 6-digit code the user received */
  code: string;
  intent: Intent;
}

export interface AuthUser {
  id: string;
  email: string;
}

export type { LoginUser };

export interface VerifyOtpResponse {
  message: string;
  /**
   * Minimal user returned by NestJS after OTP verification.
   * Only `id` and `email` are available at this point.
   * Use `hydrateProfile` in the auth store after fetching /api/v1/users/me.
   */
  user: LoginUser;
}

export interface RefreshResponse {
  message: string;
}
