import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  // Get tokens from cookies
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  
  // We consider the user authenticated if they have at least a refresh token
  // (the BFF will automatically refresh the access token if needed)
  const isAuthenticated = !!accessToken || !!refreshToken;

  const { pathname } = request.nextUrl;

  // 1. Guest Routes (only accessible if NOT authenticated)
  const isAuthRoute = pathname === '/auth' || pathname === '/auth/otp';

  if (isAuthRoute && isAuthenticated) {
    // If user is already authenticated, redirect them away from auth pages to the dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. Protected Routes (only accessible if authenticated)
  // For now, let's protect /dashboard and anything under it.
  const isProtectedRoute = pathname.startsWith('/dashboard');

  if (isProtectedRoute && !isAuthenticated) {
    // If user is NOT authenticated, redirect them to login
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Continue normally if no guards were triggered
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
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
