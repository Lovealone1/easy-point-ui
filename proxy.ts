import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;


  const isAuthenticated = !!accessToken || !!refreshToken;

  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname === '/auth' || pathname === '/auth/otp';
  const hasToken = request.nextUrl.searchParams.has('token');

  if (isAuthRoute && isAuthenticated && !hasToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const isProtectedRoute = pathname.startsWith('/dashboard');

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/auth', request.url));
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
