// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/'];
  const protectedRoutes = ['/dashboard', '/tracking-setup', '/notifications', '/profile', '/tracked-flight'];
  
  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => pathname === route);
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // If it's a public route, allow access regardless of auth status
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // If it's NOT a protected route (like static files, etc.), allow access
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // For protected routes, we'll let the client-side auth handle it
  // This prevents the middleware from blocking access
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - we'll handle API auth separately
     * - _next/static (static files)
     * - _next/image (image optimization files) 
     * - favicon.ico (favicon file)
     * - public folder files (images, SVGs, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|ico)$).*)',
  ],
};