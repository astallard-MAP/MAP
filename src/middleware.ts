import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

/**
 * @fileOverview Production Authentication Middleware for MAP261125.
 * UK-EN Protocol: Manages the Demilitarised Zone (DMZ) for public ingress.
 */

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimisation files)
     * - favicon.ico (favicon file)
     * - .png (image files)
     * - .svg (svg files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)',
  ],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('__session');

  // DMZ: Public facing pages accessible without authentication.
  const publicPaths = [
    '/login', 
    '/signup', 
    '/forgot-password', 
    '/privacy-policy',
    '/api/cron/summarise-news' // Explicit exclusion for Cloud Scheduler
  ];

  // Forensic check for public ingress (including hardcoded asset bypasses).
  const isPublicPath = 
    publicPaths.some(path => pathname.startsWith(path)) || 
    pathname.match(/\.(png|jpg|jpeg|svg|ico|gif|webp)$/i);

  if (sessionCookie) {
    // If authenticated and accessing a public entry point, redirect to production dashboard.
    if (isPublicPath || pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } else {
    // If unauthenticated and attempting to access internal production routes, redirect to login.
    if (!isPublicPath && pathname !== '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Root ingress redirect for unauthenticated visitors.
  if (pathname === '/' && !sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}
