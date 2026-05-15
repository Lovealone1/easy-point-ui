/**
 * Standard API response contract.
 * Every response from the backend is expected to conform to this shape.
 *
 * @template T - The shape of the `data` payload.
 */
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  statusCode: number;
}

/**
 * Paginated API response contract.
 * Used for list endpoints that support pagination.
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
 * Standard API error shape returned by the backend.
 */
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

/**
 * Options for the backendFetch utility.
 * Extends the native RequestInit with typed extras.
 */
export interface BackendFetchOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown> | FormData;
  /** Skip the Authorization header even if a token is present */
  skipAuth?: boolean;
  /** Override the resolved path (bypasses the /api/v{version} prefix) */
  rawUrl?: string;
}
