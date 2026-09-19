import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { DEFAULT_LANDING, safeInternalPath } from '@/shared/utils/safe-redirect';
import { SESSION_COOKIES } from '@/shared/api/session-cookies';

// Routes reachable without a session of any kind.
const PUBLIC_PATHS = ['/auth', '/terms', '/privacy'];

// The administration console. Everything under it needs a CONSOLE session —
// a dashboard session grants nothing here — except the console's own sign-in.
const ADMIN_ROOT = '/admin';
const ADMIN_LOGIN = '/admin/login';

function isPublicPath(pathname: string): boolean {
  // The marketing landing page. Checked separately and by exact match: putting
  // '/' in PUBLIC_PATHS would make the startsWith(`${p}/`) test below match
  // every route in the app.
  if (pathname === '/') return true;

  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAdminPath(pathname: string): boolean {
  return pathname === ADMIN_ROOT || pathname.startsWith(`${ADMIN_ROOT}/`);
}

export default function proxy(request: NextRequest) {
  const cookies = request.cookies;

  // Presence only. The edge cannot verify a signature without the JWT secret,
  // and it does not need to: the API rejects any console endpoint not reached
  // on a console session, and this merely avoids loading a shell that is about
  // to be thrown out. Two independent checks, because the two sessions are
  // independent — holding one says nothing about the other.
  const hasTenantSession =
    !!cookies.get(SESSION_COOKIES.tenant.access)?.value ||
    !!cookies.get(SESSION_COOKIES.tenant.refresh)?.value;

  const hasAdminSession =
    !!cookies.get(SESSION_COOKIES.admin.access)?.value ||
    !!cookies.get(SESSION_COOKIES.admin.refresh)?.value;

  const { pathname, search } = request.nextUrl;

  // ── Administration console ────────────────────────────────────────────────
  if (pathname === ADMIN_LOGIN) {
    // Already holding a console session — no reason to ask again.
    if (hasAdminSession) {
      return NextResponse.redirect(new URL(ADMIN_ROOT, request.url));
    }
    return NextResponse.next();
  }

  if (isAdminPath(pathname)) {
    if (!hasAdminSession) {
      const loginUrl = new URL(ADMIN_LOGIN, request.url);
      loginUrl.searchParams.set('callbackUrl', `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── Tenant dashboard ──────────────────────────────────────────────────────
  const isAuthRoute = pathname === '/auth' || pathname === '/auth/otp';
  const hasToken = request.nextUrl.searchParams.has('token');

  if (isAuthRoute && hasTenantSession && !hasToken) {
    const callbackUrl = safeInternalPath(request.nextUrl.searchParams.get('callbackUrl'));
    return NextResponse.redirect(new URL(callbackUrl ?? DEFAULT_LANDING, request.url));
  }

  if (!isPublicPath(pathname) && !hasTenantSession) {
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('callbackUrl', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - global (public assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|global).*)',
  ],
};
