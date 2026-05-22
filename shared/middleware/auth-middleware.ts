// ─────────────────────────────────────────────────────────────────────────────
// shared/middleware/auth-middleware.ts
//
// Edge Middleware — Route protection for the Next.js BFF.
//
// Runs on the Edge Runtime. Restrictions:
//   ✗ No node:crypto   ✗ No Node.js built-ins
//   ✓ fetch            ✓ next/server cookies  ✓ native string operations
//
// Logic:
//   1. Is the request for a public path?  → let through
//   2. access_token cookie present?       → let through
//   3. refresh_token cookie present?      → call /api/auth/refresh internally
//        2xx  → copy new Set-Cookie headers and let through
//        4xx  → redirect to /login
//   4. No cookies at all?                 → redirect to /login
// ─────────────────────────────────────────────────────────────────────────────
import { type NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Public paths — these bypass all auth checks
// ---------------------------------------------------------------------------

/** Exact-path matches that are always public. */
const PUBLIC_EXACT: ReadonlySet<string> = new Set([
  '/auth',
  '/login',
  '/register',
  '/favicon.ico',
]);

/** Prefix matches that are always public. */
const PUBLIC_PREFIXES: readonly string[] = [
  '/api/auth/',
  '/_next/',
  '/static/',
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}


export async function authMiddleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (accessToken) {
    return NextResponse.next();
  }

  if (refreshToken) {
    return handleRefresh(request, refreshToken);
  }
  return redirectToLogin(request);
}


async function handleRefresh(
  request: NextRequest,
  refreshToken: string,
): Promise<NextResponse> {
  try {
    const refreshUrl = new URL('/api/auth/refresh', request.nextUrl.origin);

    const refreshResponse = await fetch(refreshUrl.toString(), {
      method: 'POST',
      headers: {
        Cookie: `refresh_token=${refreshToken}`,
        'X-Forwarded-For':
          request.headers.get('x-forwarded-for') ??
          request.headers.get('x-real-ip') ??
          '127.0.0.1',
      },
    });

    if (!refreshResponse.ok) {
      return redirectToLogin(request);
    }

    const nextResponse = NextResponse.next();
    relayCookies(refreshResponse, nextResponse);

    return nextResponse;
  } catch {

    return redirectToLogin(request);
  }
}


function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL('/auth', request.nextUrl.origin);
  // Preserve the intended destination so post-login redirect can restore it
  loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

/**
 * Copies `Set-Cookie` headers from the NestJS/BFF refresh response onto
 * the NextResponse that will be forwarded to the browser.
 *
 * Note: `Secure` stripping happens inside the BFF refresh route handler
 * already, so we copy verbatim here.
 */
function relayCookies(from: Response, to: NextResponse): void {
  const setCookies: string[] =
    from.headers.getSetCookie?.() ?? splitSetCookieHeader(from.headers.get('set-cookie'));

  for (const cookie of setCookies) {
    to.headers.append('Set-Cookie', cookie);
  }
}

function splitSetCookieHeader(header: string | null): string[] {
  if (!header) return [];
  return header.split(/,(?=\s*[\w-]+=)/);
}

export const authMiddlewareConfig = {
  matcher: [
    /*
     * Match all request paths EXCEPT for:
     *   - _next/static  (static files)
     *   - _next/image   (image optimization)
     *   - favicon.ico   (browser default)
     *   - Files with common static extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)',
  ],
};
