// ─────────────────────────────────────────────────────────────────────────────
// shared/utils/api-error.ts
//
// Typed error class thrown by backendFetch / serverFetch when the NestJS
// backend responds with a non-2xx status.
//
// Moved from: server/utils/api-error.ts
// ─────────────────────────────────────────────────────────────────────────────
import type { NestApiError } from '@/shared/types/api.types';

/**
 * Typed error thrown by backendFetch when the backend responds with a non-2xx status.
 *
 * Usage:
 * ```ts
 * try {
 *   await backendFetch('/products', { method: 'POST', body: dto });
 * } catch (err) {
 *   if (err instanceof BackendApiError) {
 *     console.error(err.statusCode, err.message);
 *   }
 * }
 * ```
 */
export class BackendApiError extends Error {
  public readonly statusCode: number;
  public readonly details: string | string[];
  public readonly errorType?: string;

  constructor(statusCode: number, apiError: NestApiError) {
    const message = Array.isArray(apiError.message)
      ? apiError.message.join(', ')
      : apiError.message;

    super(message);
    this.name = 'BackendApiError';
    this.statusCode = statusCode;
    this.details = apiError.message;
    this.errorType = apiError.error;
  }

  /** True for any 4xx status code */
  get isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  /** True for any 5xx status code */
  get isServerError(): boolean {
    return this.statusCode >= 500;
  }

  /** True when the user is unauthenticated (401) */
  get isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  /** True when the user lacks permission (403) */
  get isForbidden(): boolean {
    return this.statusCode === 403;
  }

  /** True when the resource was not found (404) */
  get isNotFound(): boolean {
    return this.statusCode === 404;
  }
}
