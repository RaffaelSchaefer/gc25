import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Diese Middleware prüft nur, ob eine Session existiert (für /home Bereiche)

const getLocale = (p: string) =>
  (p.match(/^\/(en|de)(?:\/|$)/)?.[1] ?? "en") as "en" | "de";

async function hasSessionFast(req: NextRequest) {
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
  return NextResponse.next();
}

// Kein eigenes config-Export hier; Routing erfolgt in root middleware.
