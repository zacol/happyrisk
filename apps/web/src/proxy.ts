import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

async function attemptRefresh(refreshToken: string): Promise<Response | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: `refresh_token=${refreshToken}`,
      },
    });

    return response.ok ? response : null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  // No refresh_token means the user has never authenticated or was logged out — redirect to login
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Access token is still present (not yet expired) — allow the request through
  const accessToken = request.cookies.get('access_token')?.value;

  if (accessToken) {
    return NextResponse.next();
  }

  // Access token is missing (expired) but refresh token exists — attempt silent token rotation
  const refreshResponse = await attemptRefresh(refreshToken);

  // Refresh failed (token revoked, network error, etc.) — redirect to login
  if (!refreshResponse) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Refresh succeeded — forward the new Set-Cookie headers (access + refresh tokens) to the browser
  const response = NextResponse.next();

  refreshResponse.headers.getSetCookie().forEach((cookie) => {
    response.headers.append('Set-Cookie', cookie);
  });

  return response;
}

// Run middleware on all routes except:
// - _next        → Next.js internals (static files, image optimization, etc.)
// - api          → API routes handled server-side
// - login        → public login page
// - auth-callback → OAuth redirect landing page
// - [^?/]*\.[^?/]+$ → any path ending with a file extension (e.g. robots.txt, favicon.ico)
export const config = {
  matcher: ['/((?!_next|api|login|auth-callback|[^?/]*\\.[^?/]+$).*)'],
};
