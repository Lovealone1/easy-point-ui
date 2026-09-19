/**
 * @file app/api/admin/v1/[...path]/route.ts
 *
 * Dynamic BFF Proxy for the administration console.
 *
 * Identical in shape to /api/v1/[...path], with one difference that carries
 * the whole design: it attaches the CONSOLE cookie, never the dashboard's.
 *
 * Which session a browser request uses is decided by the URL it was sent to,
 * not by a header on a shared Axios client. That matters because both shells
 * live in one SPA: a mutable default header flips back and forth as the user
 * navigates between them, and something always ends up reading it at the wrong
 * moment. A route cannot flip.
 *
 * Flow:
 *   Browser → GET /api/admin/v1/organizations
 *           → this handler
 *           → backendFetch('organizations', { scope: 'admin' })
 *           → NestJS GET /api/v1/organizations  (Bearer admin_access_token)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/shared/api/backend-fetch';
import { BackendApiError } from '@/shared/utils/api-error';

type RouteParams = { params: Promise<{ path: string[] }> };

function resolveEndpoint(pathSegments: string[], searchParams: URLSearchParams): string {
  const base = pathSegments.join('/');
  const qs = searchParams.toString();
  return qs ? `${base}?${qs}` : base;
}

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

async function proxyRequest(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { path } = await params;
  const endpoint = resolveEndpoint(path, request.nextUrl.searchParams);

  try {
    const body = await parseBody(request);

    // Console pages that act on one organization pass this per request. There
    // is deliberately no cookie fallback: the console is not a tenant, and an
    // implicit org here would be a silent, wrong default.
    const orgId = request.headers.get('x-organization-id');
    const headers: Record<string, string> = {};
    if (orgId) {
      headers['x-organization-id'] = orgId;
    }

    const data = await backendFetch(endpoint, {
      method: request.method,
      headers,
      body,
      scope: 'admin',
    });

    return NextResponse.json(data === undefined ? {} : data);
  } catch (error) {
    if (error instanceof BackendApiError) {
      return NextResponse.json(
        { message: error.details, error: error.errorType },
        { status: error.statusCode },
      );
    }

    console.error(`[Admin BFF Proxy] Unhandled error for ${request.method} /${endpoint}:`, error);
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
