import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Optimistic route protection (renamed from `middleware` in Next.js 16).
 * Real authorization is still enforced server-side via `auth()` in layouts
 * and API routes; this only avoids flashing protected pages to logged-out
 * users and bounces logged-in users away from /login.
 */
const PUBLIC_PATHS = ["/login"];

function hasSessionCookie(request: NextRequest): boolean {
  return (
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token")
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoggedIn = hasSessionCookie(request);
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!isLoggedIn && !isPublic) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all paths except Next internals, auth API, static assets and PWA files
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons|.*\\.png$).*)",
  ],
};
