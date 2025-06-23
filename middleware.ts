import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const refreshTokenCookie = request.cookies.get('refreshToken');

  // Define public paths that don't require authentication
  const publicPaths = [
    '/', // Assuming landing page is public
    '/login',
    '/register',
    '/signup',
    '/forgot-password',
    
    // Add any other public static pages if needed
  ];

  // Allow requests to API routes, Next.js specific paths, and static files
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') || // Next.js internal requests
    pathname.startsWith('/static/') || // If you have a /static folder
    pathname.includes('.') // Generally, asset files like .png, .ico, .css
  ) {
    return NextResponse.next();
  }

  // Check if the current path is one of the defined public paths
  const isPublicPath = publicPaths.some(path => pathname === path || (path !== '/' && pathname.startsWith(path + '/')));


  if (isPublicPath) {
    // If it's a public path, allow access directly
    // If user is authenticated and tries to access login/signup, you could redirect them to a dashboard
    // For now, we allow it.
    return NextResponse.next();
  }

  // For all other paths (assumed protected)
  if (!refreshTokenCookie) {
    // If no refresh token cookie, redirect to login
    // Preserve the originally requested path for redirection after login if desired
    const loginUrl = new URL('/login', request.url);
    // loginUrl.searchParams.set('redirect', pathname); // Optional: add redirect query param
    return NextResponse.redirect(loginUrl);
  }

  // If refresh token cookie exists, proceed to the requested protected path
  return NextResponse.next();
}

// Specify which paths the middleware should run on
// This avoids running middleware on every single asset request unnecessarily if not caught by above checks
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - files in /public folder (e.g., images, manifest.json)
     *
     * We want it to run on pages and API routes that might need protection logic,
     * but the above logic already filters most of these.
     * The matcher provides a more optimized way to define paths.
     *
     * A common setup: match all paths and then exclude specifics within the middleware.
     * For this case, let's apply it broadly and let the internal logic handle exclusions.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 