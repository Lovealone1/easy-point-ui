// ─────────────────────────────────────────────────────────────────────────────
// lib/api/client-fetch.ts
// Browser-side HTTP client for Client Components.
// Runs exclusively in the browser — never imports Node.js modules.
// ─────────────────────────────────────────────────────────────────────────────
import type { ApiError } from '@/shared/api/types';

const TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function withTimeout(ms: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller;
}

/** Parses a BFF Route Handler error response into a typed ApiError. */
async function parseBffError(response: Response): Promise<ApiError> {
  try {
    const json = (await response.json()) as { error?: ApiError };
    if (json?.error && typeof json.error === 'object') {
      return json.error;
    }
  } catch {
    // fall through
  }
  return {
    status: response.status,
    code: 'API_ERROR',
    message: response.statusText || 'Unknown error',
  };
}

/** Dispatches the global `auth:unauthorized` event for the layout to handle. */
function emitUnauthorized(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }
}

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

/**
 * Browser-side fetch wrapper for calls to the Next.js BFF layer.
 *
 * Behaviour:
 *  - Always uses relative paths (`/api/...`). Never calls NestJS directly.
 *  - Sends `credentials: 'include'` on every request so HttpOnly cookies are
 *    forwarded automatically.
 *  - On a 401 response, silently calls `POST /api/auth/refresh` once.
 *  - If the refresh succeeds, the original request is retried once.
 *  - If the retry also returns 401 (or the refresh itself fails), the function
 *    dispatches a global `auth:unauthorized` CustomEvent and returns null.
 *    The root layout listener is responsible for redirecting to `/login`.
 *  - This function is deliberately decoupled from Next.js router.push() so
 *    it can be used in non-component contexts (e.g. React Query mutationFns).
 *
 * @param path    - Relative BFF path, e.g. `/api/products`
 * @param options - Standard RequestInit, extended with an optional typed body
 * @template T   - Expected success payload shape
 * @returns       - Parsed JSON body of type T, or null if unauthenticated
 */
export async function clientFetch<T>(
  path: string,
  options: RequestInit & { body?: unknown } = {},
): Promise<T | null> {
  const { body, ...restOptions } = options;

  const buildHeaders = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...(restOptions.headers as Record<string, string> | undefined),
  });

  const serializedBody =
    body !== undefined ? JSON.stringify(body) : undefined;

  const doFetch = (): Promise<Response> => {
    const controller = withTimeout(TIMEOUT_MS);
    return fetch(path, {
      ...restOptions,
      headers: buildHeaders(),
      body: serializedBody,
      credentials: 'include',
      signal: controller.signal,
    });
  };

  let response = await doFetch();

  // ── 401: attempt a silent token refresh ──────────────────────────────────
  if (response.status === 401) {
    const refreshed = await attemptRefresh();

    if (!refreshed.ok) {
      emitUnauthorized();
      return null;
    }

    // Retry the original request with the freshly set cookies (browser handles
    // cookie jar update automatically after the refresh response).
    response = await doFetch();

    if (response.status === 401) {
      emitUnauthorized();
      return null;
    }
  }

  // ── Non-2xx: throw typed error ────────────────────────────────────────────
  if (!response.ok) {
    const error = await parseBffError(response);
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : null;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function attemptRefresh(): Promise<Response> {
  const controller = withTimeout(TIMEOUT_MS);
  return fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    signal: controller.signal,
  });
}
