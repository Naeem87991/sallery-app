import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware-client';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/auth/callback'];

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createMiddlewareClient(request, response);

  // Refresh the session — this keeps the cookie up to date on every request.
  // Must be called before any auth checks.
  const { data: { session } } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Allow public routes and Next.js internals through without auth
  const isPublic =
    PUBLIC_ROUTES.some((r) => pathname.startsWith(r)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/sw.js' ||
    pathname === '/offline' ||
    pathname.match(/\.(ico|png|svg|jpg|jpeg|webp|woff2?|ttf)$/);

  if (!session && !isPublic) {
    // Not authenticated — redirect to login, preserving the intended destination
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && pathname === '/login') {
    // Already authenticated — send to dashboard
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  /*
   * Run on every route except static files and Next.js internals.
   * The matcher uses a negative lookahead to skip _next/static, _next/image,
   * and common static asset extensions.
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
