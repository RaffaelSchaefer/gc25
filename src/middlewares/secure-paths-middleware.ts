import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const getLocale = (p: string) =>
  (p.match(/^\/(en|de)(?:\/|$)/)?.[1] ?? "en") as "en" | "de";
const needsAdmin = (p: string) => /^\/(en|de)\/admin(?:\/|$)/.test(p);

async function hasSessionFast(req: NextRequest) {
  // Opaque check: reicht fürs Gate/Redirect
  return (
    Boolean(getSessionCookie(req)) ||
    req.cookies.get("better-auth.session_token")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const locale = getLocale(pathname);
  const nextParam = encodeURIComponent(pathname + search);

  if (!(await hasSessionFast(request))) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?next=${nextParam}`, request.url),
    );
  }

  if (needsAdmin(pathname)) {
    // Admin-Check via interne API (Node runtime)
    const res = await fetch(new URL("/api/auth/is-admin", request.url), {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
    });

    if (res.status === 401) {
      return NextResponse.redirect(
        new URL(`/${locale}/login?next=${nextParam}`, request.url),
      );
    }
    if (!res.ok) {
      // Fallback: behandel wie nicht admin
      return NextResponse.redirect(new URL(`/${locale}/home`, request.url));
    }

    const { isAdmin } = await res.json();
    if (!isAdmin) {
      return NextResponse.redirect(new URL(`/${locale}/home`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:locale(en|de)/(home)/:path*", "/:locale(en|de)/(admin)/:path*"],
};
