import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { DEFAULT_LANDING, safeInternalPath } from '@/shared/utils/safe-redirect';

// Routes reachable without a session. Everything else under the matcher
// (including /admin — the edge only authenticates, it never authorizes by
// role; that check lives in AdminGuard, since globalRole isn't decodable
// here without verifying the JWT) requires a session.
const PUBLIC_PATHS = ['/auth', '/terms', '/privacy'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function proxy(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  const isAuthenticated = !!accessToken || !!refreshToken;

  const { pathname, search } = request.nextUrl;

  const isAuthRoute = pathname === '/auth' || pathname === '/auth/otp';
  const hasToken = request.nextUrl.searchParams.has('token');

  if (isAuthRoute && isAuthenticated && !hasToken) {
    const callbackUrl = safeInternalPath(request.nextUrl.searchParams.get('callbackUrl'));
    return NextResponse.redirect(new URL(callbackUrl ?? DEFAULT_LANDING, request.url));
  }

  if (!isPublicPath(pathname) && !isAuthenticated) {
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
