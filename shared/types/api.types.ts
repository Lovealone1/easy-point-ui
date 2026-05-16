// ─────────────────────────────────────────────────────────────────────────────
// shared/types/api.types.ts
//
// Consolidated API contract types used across:
//   - shared/services/base-client.service.ts  (Axios client side)
//   - shared/api/backend-fetch.ts             (server-side proxy fetch)
//   - app/api/v1/[...path]/route.ts           (catch-all BFF proxy)
//   - shared/api/types.ts                     (BFF auth route types)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Standard success response shape from the NestJS backend.
 * Every non-paginated endpoint conforms to this contract.
 *
 * @template T - The shape of the `data` payload.
 */
export interface NestApiResponse<T = unknown> {
  data: T;
  message?: string;
  statusCode: number;
}

/**
 * Paginated response shape from NestJS list endpoints.
 *
 * @template T - The item type inside the paginated list.
 */
export interface PaginatedApiResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  message?: string;
  statusCode: number;
}

/**
 * Standard NestJS error shape (used by BackendApiError).
 * `message` can be a string or an array of validation messages (class-validator).
 */
export interface NestApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

/**
 * Options for the backendFetch / serverFetch utilities.
 * Extends the native RequestInit with typed extras.
 */
export interface BackendFetchOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown> | FormData;
  /** Skip the Authorization header even if a token is present in cookies */
  skipAuth?: boolean;
  /** Override the resolved URL (bypasses the /api/v{version} prefix) */
  rawUrl?: string;
}

// ── Legacy aliases ─────────────────────────────────────────────────────────────
// Keep the old name available while callers are migrated.
/** @deprecated Use NestApiResponse<T> */
export type ApiResponse<T = unknown> = NestApiResponse<T>;
/** @deprecated Use NestApiError */
export type ApiError = NestApiError;
