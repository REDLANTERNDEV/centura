import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware that protects routes by verifying tokens.
 *
 * Behavior:
 * - If `access_token` cookie exists -> allow.
 * - If no `access_token` and route is protected -> call backend `/api/auth/verify-token`
 *   forwarding the original cookie header so the backend can validate the HttpOnly
 *   `refresh_token`. If backend responds OK, allow; otherwise redirect to /login.
 *
 * Notes:
 * - Set `NEXT_PUBLIC_API_URL` in your Next.js environment to your backend (e.g. http://localhost:5000).
 *   Middleware will fall back to `http://localhost:5000` if the var is not set in development.
 */
export async function proxy(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  const { pathname } = req.nextUrl;

  // If there's an access token, verify it with the backend before trusting it.
  if (token) {
    const backendBase =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      'http://localhost:5000';
    const verifyAccessUrl = new URL(
      '/api/auth/verify-access',
      backendBase
    ).toString();

    try {
      const cookieHeader = req.headers.get('cookie') || '';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const resp = await fetch(verifyAccessUrl, {
        method: 'GET',
        headers: {
          cookie: cookieHeader,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (resp.ok) {
        // Prevent logged-in users visiting auth pages
        if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }

        return NextResponse.next();
      }
    } catch {
      // fallthrough to try refresh-token (below) or redirect
    }
  }

  // No access token: for protected routes try to verify refresh token via backend
  if (pathname.startsWith('/dashboard')) {
    // Build backend verify URL. Use NEXT_PUBLIC_API_URL in env for edge runtime.
    const backendBase =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      'http://localhost:5000';
    const verifyUrl = new URL('/api/auth/verify-token', backendBase).toString();

    try {
      // Forward cookie header so backend can read HttpOnly refresh_token
      const cookieHeader = req.headers.get('cookie') || '';

      // Small timeout to avoid hanging middleware
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const resp = await fetch(verifyUrl, {
        method: 'GET',
        headers: {
          // forward cookies
          cookie: cookieHeader,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (resp.ok) {
        // Backend verified refresh token -> allow access
        return NextResponse.next();
      }
    } catch {
      // If fetch fails (timeout/network) fallthrough to redirect to login
    }

    // Either verify failed or fetch failed -> redirect to login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Non-protected routes: allow
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};
