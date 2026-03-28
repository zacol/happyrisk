import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/auth-callback'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for file extension at the end of the path
  const hasFileExtension = /\.\w+$/.test(pathname);

  // Allow static files and Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || hasFileExtension) {
    return NextResponse.next();
  }

  // Check for access_token cookie as auth indicator
  const accessToken = request.cookies.get('access_token')?.value;

  if (!accessToken) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
