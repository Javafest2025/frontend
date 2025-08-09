import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const refreshTokenCookie = request.cookies.get('refreshToken');

  // Define public paths that don't require authentication
  const publicPaths = [
    '/', // Landing page
    '/login',
    '/auth/login',
    '/auth/signup',
    '/auth/register',
    '/register',
    '/signup',
    '/forgot-password',
    '/auth/forgot-password',
    '/callback', // Add callback for social auth
    '/auth/callback',
    '/verify-email', // Email verification page
    '/api/', // API routes
    '/_next/', // Next.js internal routes
    '/static/', // Static files
  ];

  // Allow requests to API routes, Next.js specific paths, and static files
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if the current path is public
  const isPublicPath = publicPaths.some(path =>
    pathname === path || (path !== '/' && pathname.startsWith(path + '/'))
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // For protected paths, check for refresh token cookie
  if (!refreshTokenCookie) {
    console.log("Middleware: No refresh token cookie found, redirecting to login");
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('session', 'expired');
    return NextResponse.redirect(loginUrl);
  }

  console.log("Middleware: Refresh token cookie found, allowing access");
  return NextResponse.next();
}

// Specify which paths the middleware should run on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 