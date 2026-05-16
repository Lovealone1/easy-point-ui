/**
 * @file app/api/v1/[...path]/route.ts
 *
 * Dynamic BFF Proxy — Next.js Route Handler
 *
 * Captures all requests to /api/v1/**  from the browser and
 * forwards them to the NestJS backend using `backendFetch`.
 *
 * Flow:
 *   Browser → POST /api/v1/auth/login
 *           → This handler
 *           → backendFetch('auth/login', { method: 'POST', body: {...} })
 *           → NestJS at http://localhost:3001/api/v1/auth/login
 *
 * The access_token cookie is attached server-side by backendFetch,
 * so it is NEVER readable by JavaScript in the browser.
 *
 * Supported methods: GET, POST, PUT, PATCH, DELETE
 */

import { type NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/shared/api/backend-fetch';
import { BackendApiError } from '@/shared/utils/api-error';

type RouteParams = { params: Promise<{ path: string[] }> };


/**
 * Extracts the endpoint from the catch-all path segments and appends
 * any query string from the original request.
 *
 * Example:
 *   path = ['auth', 'login'] + search = '' → 'auth/login'
 *   path = ['products']     + search = '?page=1' → 'products?page=1'
 */
function resolveEndpoint(pathSegments: string[], searchParams: URLSearchParams): string {
  const base = pathSegments.join('/');
  const qs = searchParams.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * Parses the request body safely.
 * Returns a plain object for JSON, a FormData instance for multipart,
 * or undefined for requests without a body (GET, DELETE, etc.).
 */
async function parseBody(
  request: NextRequest,
): Promise<Record<string, unknown> | FormData | undefined> {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    return request.formData();
  }

  if (contentType.includes('application/json')) {
    const text = await request.text();
    return text ? (JSON.parse(text) as Record<string, unknown>) : undefined;
  }

  return undefined;
}

/**
 * Core proxy handler shared by all HTTP methods.
 */
async function proxyRequest(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { path } = await params;
  const endpoint = resolveEndpoint(path, request.nextUrl.searchParams);

  try {
    const body = await parseBody(request);

    const orgId = request.headers.get('x-organization-id');
    const headers: Record<string, string> = {};
    if (orgId) {
      headers['x-organization-id'] = orgId;
    }

    const data = await backendFetch(endpoint, {
      method: request.method,
      headers,
      body,
    });

    return NextResponse.json(data ?? {});
  } catch (error) {
    if (error instanceof BackendApiError) {
      return NextResponse.json(
        { message: error.details, error: error.errorType },
        { status: error.statusCode },
      );
    }

    console.error(`[BFF Proxy] Unhandled error for ${request.method} /${endpoint}:`, error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}


export const GET = (req: NextRequest, ctx: RouteParams) => proxyRequest(req, ctx);
export const POST = (req: NextRequest, ctx: RouteParams) => proxyRequest(req, ctx);
export const PUT = (req: NextRequest, ctx: RouteParams) => proxyRequest(req, ctx);
export const PATCH = (req: NextRequest, ctx: RouteParams) => proxyRequest(req, ctx);
export const DELETE = (req: NextRequest, ctx: RouteParams) => proxyRequest(req, ctx);
