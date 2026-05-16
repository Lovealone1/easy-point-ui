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
  '/login',
  '/register',
  '/favicon.ico',
]);

/** Prefix matches that are always public. */
const PUBLIC_PREFIXES: readonly string[] = [
  '/api/auth/',   // All BFF auth routes
  '/_next/',      // Next.js internals
  '/static/',     // Static assets
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function authMiddleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // ── Step 1: Public path → let through immediately ─────────────────────────
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  // ── Step 2: access_token present → let through ────────────────────────────
  if (accessToken) {
    return NextResponse.next();
  }

  // ── Step 3: refresh_token present → attempt silent refresh ────────────────
  if (refreshToken) {
    return handleRefresh(request, refreshToken);
  }

  // ── Step 4: No cookies → redirect to /login ───────────────────────────────
  return redirectToLogin(request);
}

// ---------------------------------------------------------------------------
// Refresh logic
// ---------------------------------------------------------------------------

async function handleRefresh(
  request: NextRequest,
  refreshToken: string,
): Promise<NextResponse> {
  try {
    // Build the absolute URL for the BFF refresh route.
    // `request.nextUrl` already contains the correct origin (host + protocol).
    const refreshUrl = new URL('/api/auth/refresh', request.nextUrl.origin);

    const refreshResponse = await fetch(refreshUrl.toString(), {
      method: 'POST',
      headers: {
        // Forward the refresh_token cookie manually — the middleware fetch
        // does NOT automatically inherit the incoming request cookies.
        Cookie: `refresh_token=${refreshToken}`,
        // Propagate real client IP
        'X-Forwarded-For':
          request.headers.get('x-forwarded-for') ??
          request.headers.get('x-real-ip') ??
          '127.0.0.1',
      },
    });

    if (!refreshResponse.ok) {
      // Refresh failed (expired / revoked token) → go to login
      return redirectToLogin(request);
    }

    // ── Refresh succeeded: copy new Set-Cookie onto the pass-through response ──
    const nextResponse = NextResponse.next();
    relayCookies(refreshResponse, nextResponse);

    return nextResponse;
  } catch {
    // Network error reaching /api/auth/refresh → fail safe: go to login
    return redirectToLogin(request);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL('/login', request.nextUrl.origin);
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
  // Split on commas that precede a cookie name=value pair, avoiding splits
  // inside `expires=Thu, 01 Jan ...` date values.
  return header.split(/,(?=\s*[\w-]+=)/);
}

// ---------------------------------------------------------------------------
// Matcher — Next.js config to apply middleware only to relevant routes.
// This avoids running the middleware on static files and Next.js internals
// that are not caught by the PUBLIC_PREFIXES guard above.
// ---------------------------------------------------------------------------

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
